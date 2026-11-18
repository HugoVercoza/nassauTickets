const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

let bcrypt = null;
try { bcrypt = require("bcryptjs"); } catch { bcrypt = null; }

let db = null;
try { db = require("./config/database"); } catch { db = null; }

let adminRoutes = null;
try { adminRoutes = require("./routes/adminRoutes"); } catch { adminRoutes = null; }

let dentroDoExpedienteServidor = () => true;
try {
({ dentroDoExpedienteServidor } = require("./utils/expediente"));
} catch {
// Ativado automaticamente quando utils/expediente.js estiver presente
}

const app = express();
app.use(cors());
app.use(express.json());

// Persistência em arquivo JSON para contingência e demonstração
const arquivoDados = path.join(__dirname, "dados-runtime.json");
let gravados = { senhas: [], eventos: [], proximoEvento: 0 };

try {
gravados = JSON.parse(fs.readFileSync(arquivoDados, "utf8"));
} catch {
/* primeira execução */
}

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
const partes = Object.fromEntries(
new Intl.DateTimeFormat("en-US", {
timeZone: "America/Recife",
year: "numeric",
month: "2-digit",
day: "2-digit",
})
.formatToParts(agora)
.filter((p) => p.type !== "literal")
.map((p) => [p.type, p.value])
);
return partes.year.slice(-2) + partes.month + partes.day;
}

const PESO_PRIORIDADE = { SP: 1, SE: 2, SG: 3 };
const ESTADOS_ATIVOS = ["CHAMADA", "CHAMADA_NOVAMENTE", "EM_ATENDIMENTO"];

function selecionarProximaSenha() {
return (
senhas
.filter((s) => s.estado === "AGUARDANDO")
.sort((a, b) => {
const diffPeso = (PESO_PRIORIDADE[a.tipo] || 9) - (PESO_PRIORIDADE[b.tipo] || 9);
return diffPeso !== 0 ? diffPeso : a.dataCriacao.localeCompare(b.dataCriacao);
})[0] || null
);
}

app.get("/", (_req, res) => res.json({ mensagem: "Backend NassauTickets funcionando!" }));

app.post(["/login", "/api/login"], async (req, res) => {
const identificador = String(req.body?.login || req.body?.email || "").trim();
const senha = String(req.body?.senha || "");

if (!identificador || !senha) {
return res.status(400).json({
erro: "Login/email e senha são obrigatórios.",
mensagem: "Login/email e senha são obrigatórios.",
message: "Login/email e senha são obrigatórios.",
});
}

// 1. Tenta autenticar no MySQL primeiro
if (db) {
try {
const [rows] = await db.query(
"SELECT id_usu, nome, login, senha_hash, tipo FROM usuarios WHERE login = ? LIMIT 1",
[identificador]
);

if (rows.length > 0) {
const usuario = rows[0];
const hashConfere = bcrypt
? await bcrypt.compare(senha, usuario.senha_hash).catch(() => false)
: false;
const senhaValida = hashConfere || senha === usuario.senha_hash;

if (!senhaValida) {
return res.status(401).json({
erro: "Login ou senha inválidos.",
mensagem: "Email ou senha inválidos.",
message: "Email ou senha inválidos.",
});
}

const token = crypto.randomBytes(24).toString("hex");
const dadosUsuario = {
id_usu: usuario.id_usu,
nome: usuario.nome,
login: usuario.login,
email: usuario.login,
tipo: usuario.tipo,
perfil: String(usuario.tipo || "ATENDENTE").toLowerCase(),
};

return res.json({
...dadosUsuario,
token,
usuario: dadosUsuario,
});
}
} catch {
// Se o MySQL estiver offline na máquina de teste, segue para contingência abaixo
}
}

// 2. Contingência local para demonstração sem MySQL
const contasContingencia = {
"atendente@nassau.test": {
id_usu: 2,
nome: "Atendente AV2",
login: "atendente@nassau.test",
email: "atendente@nassau.test",
tipo: "ATENDENTE",
perfil: "atendente",
senha: process.env.DEMO_PASSWORD || "NassauAV2!",
},
admin: {
id_usu: 1,
nome: "Gestor Padrão",
login: "admin",
email: "admin@nassau.test",
tipo: "GESTOR",
perfil: "gestor",
senha: process.env.ADMIN_PASSWORD || "123456",
},
atendente: {
id_usu: 3,
nome: "Atendente Padrão",
login: "atendente",
email: "atendente@nassau.test",
tipo: "ATENDENTE",
perfil: "atendente",
senha: process.env.ATENDENTE_PASSWORD || "123456",
},
};

const conta = contasContingencia[identificador];
if (conta && senha === conta.senha) {
const token = crypto.randomBytes(24).toString("hex");
const { senha: _ignorar, ...dadosUsuario } = conta;
return res.json({
...dadosUsuario,
token,
usuario: dadosUsuario,
});
}

return res.status(401).json({
erro: "Email ou senha inválidos.",
mensagem: "Email ou senha inválidos.",
message: "Email ou senha inválidos.",
});
});

app.get("/api/senhas", (_req, res) => res.json(senhas));

app.get("/api/chamadas", (req, res) => {
const desde = Number(req.query.desde || 0);
res.set("Cache-Control", "no-store");
res.json({ eventos: eventos.filter((e) => e.id > desde).slice(-300) });
});

app.get("/api/chamadas/stream", (req, res) => {
res.setHeader("Content-Type", "text/event-stream");
res.setHeader("Cache-Control", "no-cache, no-transform");
res.setHeader("Connection", "keep-alive");
res.flushHeaders();
res.write(": conectado\n\n");
const desde = Number(req.query.desde || req.get("Last-Event-ID") || 0);
for (const evento of eventos.filter((e) => e.id > desde)) {
res.write(`id: ${evento.id}\nevent: chamada\ndata: ${JSON.stringify(evento)}\n\n`);
}
clientes.add(res);
const keepalive = setInterval(() => res.write(": ping\n\n"), 20000);
req.on("close", () => {
clearInterval(keepalive);
clientes.delete(res);
});
});

app.post("/api/senhas", (req, res) => {
if (!dentroDoExpedienteServidor()) {
return res.status(403).json({
erro: "Fora do horário de expediente (07h às 17h).",
mensagem: "Fora do horário de expediente (07h às 17h).",
});
}

const { tipo } = req.body || {};
if (!["SP", "SG", "SE"].includes(tipo)) {
return res.status(400).json({ erro: "Tipo inválido", mensagem: "Tipo de senha inválido." });
}

const dia = hojeCodigo();
const prefixoDia = `${dia}-${tipo}`;
const sequencia = senhas.filter((s) => String(s.id).startsWith(prefixoDia)).length + 1;
if (sequencia > 999) {
return res.status(409).json({ erro: "Limite diário atingido", mensagem: "Limite diário deste tipo de senha atingido." });
}

const numero = `${tipo}${String(sequencia).padStart(3, "0")}`;
const id = `${dia}-${numero}`;
const senha = {
id,
numero,
tipo,
estado: "AGUARDANDO",
guiche: null,
dataCriacao: new Date().toISOString(),
dataChamada: null,
dataFinalizacao: null,
tentativasChamada: 0,
};

senhas.push(senha);
persistir();
return res.status(201).json({ ...senha, senha });
});

// Chamar próxima senha (compatível com /api/guiche/proxima e /api/atendimento/proxima)
app.post(["/api/guiche/proxima", "/api/atendimento/proxima"], (req, res) => {
const guiche = String(req.body?.guiche || "Guichê 01").slice(0, 40);
const atual = senhas.find((s) => s.guiche === guiche && ESTADOS_ATIVOS.includes(s.estado));

if (atual) {
if (req.path === "/api/atendimento/proxima") {
return res.json({ ...atual, senha: atual });
}
return res.status(409).json({
erro: "Finalize a senha atual antes de chamar outra.",
mensagem: "Finalize a senha atual antes de chamar outra.",
});
}

const proxima = selecionarProximaSenha();
if (!proxima) {
const status = req.path === "/api/atendimento/proxima" ? 409 : 404;
return res.status(status).json({
erro: "Não há senhas aguardando atendimento.",
mensagem: "Não há senhas aguardando atendimento.",
});
}

Object.assign(proxima, {
estado: "CHAMADA",
guiche,
dataChamada: new Date().toISOString(),
tentativasChamada: 1,
});

transmitir("CHAMADA", { ...proxima });
return res.json({ ...proxima, senha: proxima });
});

app.post("/api/guiche/:id/novamente", (req, res) => {
const senha = senhas.find((s) => s.id === req.params.id);
if (!senha) return res.status(404).json({ erro: "Senha não encontrada", mensagem: "Senha não encontrada." });
if (!["CHAMADA", "CHAMADA_NOVAMENTE"].includes(senha.estado)) {
return res.status(409).json({ erro: "Senha não está em chamada", mensagem: "Senha não está em chamada." });
}
Object.assign(senha, {
estado: "CHAMADA_NOVAMENTE",
dataChamada: new Date().toISOString(),
tentativasChamada: senha.tentativasChamada + 1,
});
transmitir("CHAMADA_NOVAMENTE", { ...senha });
return res.json({ ...senha, senha });
});

// Atualizar estado via /api/senhas/:id
app.patch("/api/senhas/:id", (req, res) => {
const senha = senhas.find((s) => s.id === req.params.id);
if (!senha) return res.status(404).json({ erro: "Senha não encontrada.", mensagem: "Senha não encontrada." });

const { acao, guiche } = req.body || {};
if (guiche && senha.guiche && senha.guiche !== guiche) {
return res.status(409).json({ erro: "Esta senha pertence a outro guichê.", mensagem: "Esta senha pertence a outro guichê." });
}

const mapaAcao = {
repetir: "CHAMADA_NOVAMENTE",
iniciar: "EM_ATENDIMENTO",
finalizar: "ATENDIDA",
ausente: "NAO_COMPARECEU",
};
const destino = mapaAcao[acao];
if (!destino) return res.status(400).json({ erro: "Ação inválida.", mensagem: "Ação inválida." });
if (senha.estado === destino) return res.json({ ...senha, senha });

const permitido =
acao === "repetir"
? ["CHAMADA", "CHAMADA_NOVAMENTE"].includes(senha.estado)
: acao === "iniciar"
? ["CHAMADA", "CHAMADA_NOVAMENTE"].includes(senha.estado)
: acao === "finalizar"
? senha.estado === "EM_ATENDIMENTO"
: ["CHAMADA", "CHAMADA_NOVAMENTE"].includes(senha.estado);

if (!permitido) {
return res.status(409).json({
erro: "Transição de estado não permitida.",
mensagem: "Transição de estado não permitida. Atualize o terminal.",
});
}

senha.estado = destino;
if (acao === "repetir") {
senha.tentativasChamada = (senha.tentativasChamada || 1) + 1;
senha.dataChamada = new Date().toISOString();
transmitir("CHAMADA_NOVAMENTE", { ...senha });
} else {
if (acao === "iniciar") senha.dataInicioAtendimento = new Date().toISOString();
if (["finalizar", "ausente"].includes(acao)) senha.dataFinalizacao = new Date().toISOString();
persistir();
}

return res.json({ ...senha, senha });
});

// Atualizar estado via /api/guiche/:id/estado
app.patch("/api/guiche/:id/estado", (req, res) => {
const senha = senhas.find((s) => s.id === req.params.id);
if (!senha) return res.status(404).json({ erro: "Senha não encontrada", mensagem: "Senha não encontrada." });
const estado = req.body?.estado;
if (estado === "EM_ATENDIMENTO" && !["CHAMADA", "CHAMADA_NOVAMENTE"].includes(senha.estado)) {
return res.status(409).json({ erro: "Transição inválida", mensagem: "Transição inválida." });
}
if (["ATENDIDA", "NAO_COMPARECEU"].includes(estado) && !["EM_ATENDIMENTO", "CHAMADA_NOVAMENTE"].includes(senha.estado)) {
return res.status(409).json({ erro: "Transição inválida", mensagem: "Transição inválida." });
}
if (!["EM_ATENDIMENTO", "ATENDIDA", "NAO_COMPARECEU"].includes(estado)) {
return res.status(400).json({ erro: "Estado inválido", mensagem: "Estado inválido." });
}
senha.estado = estado;
if (estado === "EM_ATENDIMENTO") senha.dataInicioAtendimento = new Date().toISOString();
if (["ATENDIDA", "NAO_COMPARECEU"].includes(estado)) senha.dataFinalizacao = new Date().toISOString();
persistir();
return res.json({ ...senha, senha });
});

if (adminRoutes) {
app.use(
"/api",
(req, _res, next) => {
req.runtimeSenhas = { senhas, persistir };
next();
},
adminRoutes
);
}

const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));   