import { API_BASE_URL } from './api';

function getHeaders() {
  const sessao = JSON.parse(localStorage.getItem('sessao') || 'null');
  const token = sessao?.token || localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function tratarResposta(resposta) {
  if (resposta.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('sessao');
    throw new Error('401: Sessão expirada ou inválida. Faça login novamente.');
  }
  if (resposta.status === 403) {
    throw new Error('403: Acesso negado. Apenas usuários com perfil GESTOR podem realizar esta ação.');
  }
  const dados = await resposta.json().catch(() => ({}));
  if (!resposta.ok) {
    throw new Error(dados.erro || dados.message || `Erro HTTP ${resposta.status}`);
  }
  return dados;
}

export async function listarUsuarios() {
  const resposta = await fetch(`${API_BASE_URL}/api/usuarios`, {
    headers: getHeaders(),
  });
  return tratarResposta(resposta);
}

export async function cadastrarUsuario({ nome, login, senha, tipo }) {
  const resposta = await fetch(`${API_BASE_URL}/api/usuarios`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ nome, login, senha, tipo }),
  });
  return tratarResposta(resposta);
}

export async function listarGuiches() {
  const resposta = await fetch(`${API_BASE_URL}/api/guiches`, {
    headers: getHeaders(),
  });
  return tratarResposta(resposta);
}

export async function cadastrarGuiche(numero_guiche) {
  const resposta = await fetch(`${API_BASE_URL}/api/guiches`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ numero_guiche: Number(numero_guiche), estado_gui: 'ABERTO' }),
  });
  return tratarResposta(resposta);
}

export async function alterarEstadoGuiche(id_gui, estado_gui) {
  const resposta = await fetch(`${API_BASE_URL}/api/guiches/${id_gui}/estado`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ estado_gui }),
  });
  return tratarResposta(resposta);
}


export async function encerrarExpediente() {
  const resposta = await fetch(`${API_BASE_URL}/api/senhas/encerrar-expediente`, {
    method: 'PATCH',
    headers: getHeaders(),
  });
  return tratarResposta(resposta);
}