import dadosIniciais from "../data/dados.json";

export const API_BASE_URL = (import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:3000`).replace(/\/$/, "");
const STORAGE_KEY = "senhas";
export const EVENTO_SENHAS = "nassauTickets:senhasAtualizadas";

export function lerSenhasLocais() {
  try {
    const salvas = localStorage.getItem(STORAGE_KEY);
    if (salvas !== null) {
      const lista = JSON.parse(salvas);
      if (Array.isArray(lista)) return lista;
    }
  } catch (erro) {
    console.warn("Dados locais inválidos:", erro);
  }
  return Array.isArray(dadosIniciais) ? dadosIniciais : [];
}

export function salvarSenhasLocais(lista) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
  window.dispatchEvent(new Event(EVENTO_SENHAS));
}

async function requisitar(caminho, opcoes = {}) {
  const controlador = new AbortController();
  const timeout = setTimeout(() => controlador.abort(), 4000);
  try {
    const resposta = await fetch(`${API_BASE_URL}${caminho}`, {
      ...opcoes,
      signal: controlador.signal,
      headers: { "Content-Type": "application/json", ...opcoes.headers },
    });
    if (!resposta.ok) throw new Error(`API respondeu com HTTP ${resposta.status}`);
    return await resposta.json();
  } finally {
    clearTimeout(timeout);
  }
}

export async function listarSenhas() {
  try {
    const retorno = await requisitar("/api/senhas");
    const lista = Array.isArray(retorno) ? retorno : retorno.senhas;
    if (!Array.isArray(lista)) throw new Error("Formato de resposta inválido");
    salvarSenhasLocais(lista);
    return { senhas: lista, origem: "api" };
  } catch (erro) {
    return { senhas: lerSenhasLocais(), origem: "local", erro: erro.message };
  }
}

export async function emitirSenha(tipo) {
  // Emissão precisa acontecer no servidor para sincronizar os diferentes dispositivos.
  // Caso falhe, não cria senha fictícia que o Guichê não conseguiria chamar.
  const retorno = await requisitar("/api/senhas", {
    method: "POST", body: JSON.stringify({ tipo }),
  });
  const senha = retorno.senha || retorno;
  if (!senha?.id || !senha?.numero) throw new Error("Resposta de emissão inválida");
  const existentes = lerSenhasLocais().filter((item) => item.id !== senha.id);
  salvarSenhasLocais([...existentes, senha]);
  return { senha, origem: "api" };
}

// Integração real com o Guichê: ações registradas no backend.
export async function solicitarProxima(guiche = "Guichê 01") {
  return requisitar("/api/guiche/proxima", {method:"POST",body:JSON.stringify({guiche})});
}
export async function solicitarNovamente(id) {
  return requisitar(`/api/guiche/${encodeURIComponent(id)}/novamente`,{method:"POST"});
}
export async function atualizarEstado(id,estado) {
  return requisitar(`/api/guiche/${encodeURIComponent(id)}/estado`,{method:"PATCH",body:JSON.stringify({estado})});
}
export async function listarEventosChamada(desde = 0) {
  return requisitar(`/api/chamadas?desde=${encodeURIComponent(desde)}`);
}
export function acompanharChamadas(onChamada, onErro, desde = 0) {
  const conexao = new EventSource(`${API_BASE_URL}/api/chamadas/stream?desde=${encodeURIComponent(desde)}`);
  conexao.addEventListener("chamada", evento => {
    try { onChamada(JSON.parse(evento.data)); } catch (erro) { console.error("Evento de chamada inválido",erro); }
  });
  conexao.onerror = () => onErro?.();
  return () => conexao.close();
}
