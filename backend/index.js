const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const app = express();
app.use(cors());
app.use(express.json());

// Armazenamento em memória para a demonstração. Integrar ao banco antes de produção.
const arquivoDados = path.join(__dirname, "dados-runtime.json");
let gravados = { senhas: [], eventos: [], proximoEvento: 0 };
try { gravados = JSON.parse(fs.readFileSync(arquivoDados, "utf8")); } catch { /* primeira execução */ }
const senhas = Array.isArray(gravados.senhas) ? gravados.senhas : [];
const eventos = Array.isArray(gravados.eventos) ? gravados.eventos : [];
function persistir() {
  fs.writeFileSync(arquivoDados, JSON.stringify({ senhas, eventos, proximoEvento }, null, 2));
}
const clientes = new Set();
let proximoEvento = Number(gravados.proximoEvento || 0);
function transmitir(tipo, senha) {
  const evento = { id: ++proximoEvento, tipo, senha, horario: new Date().toISOString() };
  eventos.push(evento);
  if (eventos.length > 300) eventos.shift();
  persistir();
  const pacote = `id: ${evento.id}\nevent: chamada\ndata: ${JSON.stringify(evento)}\n\n`;
  for (const resposta of clientes) resposta.write(pacote);
}
function hojeCodigo() {
  const agora = new Date();
  const partes = Object.fromEntries(new Intl.DateTimeFormat("en-US", {timeZone: "America/Recife", year: "numeric", month: "2-digit", day: "2-digit"}).formatToParts(agora).filter(p => p.type !== "literal").map(p => [p.type, p.value]));
  return partes.year.slice(-2) + partes.month + partes.day;
}
app.get("/", (_req, res) => res.json({ mensagem: "Backend NassauTickets funcionando!" }));
app.get("/api/senhas", (_req, res) => res.json({senhas}));
app.get("/api/chamadas", (req, res) => {
  const desde = Number(req.query.desde || 0);
  res.set("Cache-Control", "no-store");
  res.json({ eventos: eventos.filter(e => e.id > desde).slice(-300) });
});
app.get("/api/chamadas/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();
  res.write(": conectado\n\n");
  const desde = Number(req.query.desde || req.get("Last-Event-ID") || 0);
  for (const evento of eventos.filter(e => e.id > desde)) {
    res.write(`id: ${evento.id}\nevent: chamada\ndata: ${JSON.stringify(evento)}\n\n`);
  }
  clientes.add(res);
  const keepalive = setInterval(() => res.write(": ping\n\n"), 20000);
  req.on("close", () => { clearInterval(keepalive); clientes.delete(res); });
});
app.post("/api/senhas", (req, res) => {
  const { tipo } = req.body || {};
  if (!["SP", "SG", "SE"].includes(tipo)) return res.status(400).json({ erro: "Tipo inválido" });
  const prefixo = `${hojeCodigo()}-${tipo}`;
  const sequencia = senhas.filter(s => s.numero.startsWith(prefixo)).length + 1;
  if (sequencia > 999) return res.status(409).json({ erro: "Limite diário atingido" });
  const numero = `${prefixo}${String(sequencia).padStart(3,"0")}`;
  const senha = { id: numero, numero, tipo, estado: "AGUARDANDO", guiche: null, dataCriacao: new Date().toISOString(), dataChamada: null, tentativasChamada: 0 };
  senhas.push(senha);
  persistir();
  res.status(201).json({senha});
});
app.post("/api/guiche/proxima", (req, res) => {
  const guiche = String(req.body?.guiche || "Guichê 01").slice(0, 40);
  const atual = senhas.find(s => s.guiche === guiche && ["CHAMADA", "CHAMADA_NOVAMENTE", "EM_ATENDIMENTO"].includes(s.estado));
  if (atual) return res.status(409).json({erro: "Finalize a senha atual antes de chamar outra."});
  const proxima = senhas.filter(s => s.estado === "AGUARDANDO").sort((a,b)=>a.dataCriacao.localeCompare(b.dataCriacao))[0];
  if (!proxima) return res.status(404).json({erro: "Não há senhas aguardando atendimento."});
  Object.assign(proxima,{estado:"CHAMADA",guiche,dataChamada:new Date().toISOString(),tentativasChamada:1});
  transmitir("CHAMADA",{...proxima});
  res.json({senha:proxima});
});
app.post("/api/guiche/:id/novamente", (req,res) => {
  const senha = senhas.find(s => s.id === req.params.id);
  if (!senha) return res.status(404).json({erro:"Senha não encontrada"});
  if (!["CHAMADA", "CHAMADA_NOVAMENTE"].includes(senha.estado)) return res.status(409).json({erro:"Senha não está em chamada"});
  Object.assign(senha,{estado:"CHAMADA_NOVAMENTE",dataChamada:new Date().toISOString(),tentativasChamada:senha.tentativasChamada+1});
  transmitir("CHAMADA_NOVAMENTE",{...senha});
  res.json({senha});
});
app.patch("/api/guiche/:id/estado",(req,res)=>{
  const senha=senhas.find(s=>s.id===req.params.id);
  if (!senha) return res.status(404).json({erro:"Senha não encontrada"});
  const estado=req.body?.estado;
  if (estado === "EM_ATENDIMENTO" && !["CHAMADA","CHAMADA_NOVAMENTE"].includes(senha.estado)) return res.status(409).json({erro:"Transição inválida"});
  if (["ATENDIDA","NAO_COMPARECEU"].includes(estado) && !["EM_ATENDIMENTO","CHAMADA_NOVAMENTE"].includes(senha.estado)) return res.status(409).json({erro:"Transição inválida"});
  if (!["EM_ATENDIMENTO","ATENDIDA","NAO_COMPARECEU"].includes(estado)) return res.status(400).json({erro:"Estado inválido"});
  senha.estado=estado;
  if (estado === "EM_ATENDIMENTO") senha.dataInicioAtendimento=new Date().toISOString();
  if (["ATENDIDA","NAO_COMPARECEU"].includes(estado)) senha.dataFinalizacao=new Date().toISOString();
  persistir();
  res.json({senha});
});
const PORT = Number(process.env.PORT || 3000);
app.listen(PORT,()=>console.log(`Servidor rodando na porta ${PORT}`));
