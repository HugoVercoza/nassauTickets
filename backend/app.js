const express = require('express');
const cors = require('cors');
const fs = require('node:fs');
const path = require('node:path');
const ativos = ['CHAMADA', 'CHAMADA_NOVAMENTE', 'EM_ATENDIMENTO'];
function criarApp(arquivo = path.join(__dirname, 'data', 'senhas.json')) {
  const app = express();
  app.use(cors()); app.use(express.json());
  let lista = fs.existsSync(arquivo) ? JSON.parse(fs.readFileSync(arquivo, 'utf8')) : [];
  function salvar(nova) {
    fs.mkdirSync(path.dirname(arquivo), { recursive: true });
    fs.writeFileSync(arquivo + '.tmp', JSON.stringify(nova, null, 2));
    fs.renameSync(arquivo + '.tmp', arquivo);
    lista = nova;
  }
  // Acesso demonstrativo para a AV2; não constitui autenticação de produção.
  app.post('/api/login', (req, res) => {
    if (req.body.email !== (process.env.DEMO_EMAIL || 'atendente@nassau.test') || req.body.senha !== (process.env.DEMO_PASSWORD || 'NassauAV2!')) {
      return res.status(401).json({ mensagem: 'Email ou senha inválidos.' });
    }
    res.json({ nome: 'Atendente AV2', email: req.body.email, perfil: 'atendente' });
  });
  app.get('/', (req, res) => res.json({ mensagem: 'Backend NassauTickets funcionando!' }));
  app.get('/api/senhas', (req, res) => res.json(lista));
  app.post('/api/senhas', (req, res) => {
    const { tipo } = req.body;
    if (!['SP', 'SE', 'SG'].includes(tipo)) return res.status(400).json({ mensagem: 'Tipo de senha inválido.' });
    const agora = new Date();
    const partes = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Recife', year: '2-digit', month: '2-digit', day: '2-digit' }).formatToParts(agora);
    const p = Object.fromEntries(partes.map(x => [x.type, x.value]));
    const dia = p.year + p.month + p.day;
    const n = Math.max(0, ...lista.filter(s => s.id.startsWith(dia + '-') && s.tipo === tipo).map(s => Number(s.numero.slice(2)))) + 1;
    if (n > 999) return res.status(409).json({ mensagem: 'Limite diário deste tipo de senha atingido.' });
    const numero = tipo + String(n).padStart(3, '0');
    const senha = { id: dia + '-' + numero, numero, tipo, estado: 'AGUARDANDO', guiche: null, dataCriacao: agora.toISOString(), dataChamada: null, dataFinalizacao: null, tentativasChamada: 0 };
    salvar([...lista, senha]); res.status(201).json(senha);
  });
  app.post('/api/atendimento/proxima', (req, res) => {
    const { guiche } = req.body;
    if (!/^Guichê \d{2}$/.test(guiche || '')) return res.status(400).json({ mensagem: 'Guichê inválido.' });
    const atual = lista.find(s => s.guiche === guiche && ativos.includes(s.estado));
    // Retorna a reserva existente: repetir uma solicitação não consome outra senha.
    if (atual) return res.json(atual);
    const fila = lista.filter(s => s.estado === 'AGUARDANDO').sort((a,b) => new Date(a.dataCriacao) - new Date(b.dataCriacao));
    const ultima = lista.filter(s => s.dataChamada).sort((a,b) => (b.ordemChamada || 0) - (a.ordemChamada || 0))[0];
    const sp = fila.find(s => s.tipo === 'SP');
    const comum = fila.find(s => s.tipo === 'SE') || fila.find(s => s.tipo === 'SG');
    const proxima = ultima?.tipo === 'SP' ? (comum || sp) : (sp || comum);
    if (!proxima) return res.status(409).json({ mensagem: 'Não há senhas aguardando atendimento.' });
    const nova = { ...proxima, ordemChamada: Math.max(0, ...lista.map(s => s.ordemChamada || 0)) + 1, guiche, estado: 'CHAMADA', dataChamada: new Date().toISOString(), tentativasChamada: 1 };
    salvar(lista.map(s => s.id === nova.id ? nova : s)); res.json(nova);
  });
  app.patch('/api/senhas/:id', (req, res) => {
    const s = lista.find(s => s.id === req.params.id);
    if (!s) return res.status(404).json({ mensagem: 'Senha não encontrada.' });
    const { acao, guiche } = req.body;
    if (s.guiche !== guiche) return res.status(409).json({ mensagem: 'Esta senha pertence a outro guichê.' });
    const destino = { repetir: 'CHAMADA_NOVAMENTE', iniciar: 'EM_ATENDIMENTO', finalizar: 'ATENDIDA', ausente: 'NAO_COMPARECEU' }[acao];
    if (!destino) return res.status(400).json({ mensagem: 'Ação inválida.' });
    if (s.estado === destino) return res.json(s);
    const permitido = acao === 'repetir' ? s.estado === 'CHAMADA' : acao === 'iniciar' ? ['CHAMADA', 'CHAMADA_NOVAMENTE'].includes(s.estado) : acao === 'finalizar' ? s.estado === 'EM_ATENDIMENTO' : s.estado === 'CHAMADA_NOVAMENTE';
    if (!permitido) return res.status(409).json({ mensagem: 'Transição de estado não permitida. Atualize o terminal.' });
    const nova = { ...s, estado: destino };
    if (acao === 'repetir') { nova.tentativasChamada = 2; nova.dataChamada = new Date().toISOString(); }
    if (['finalizar', 'ausente'].includes(acao)) nova.dataFinalizacao = new Date().toISOString();
    salvar(lista.map(s => s.id === nova.id ? nova : s)); res.json(nova);
  });
  app.use((erro, req, res, next) => { console.error(erro.message); res.status(erro.status === 400 ? 400 : 500).json({ mensagem: 'Não foi possível processar a solicitação.' }); });
  return app;
}
module.exports = { criarApp };
