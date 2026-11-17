import { request } from './httpClient';
export async function listarSenhas() {
  const lista = await request('/senhas');
  if (!Array.isArray(lista)) throw new Error('Resposta inválida da API.');
  // Compatibilidade com o histórico e dashboard existentes, sem usá-los como API.
  try { localStorage.setItem('senhas', JSON.stringify(lista)); } catch { /* cache opcional */ }
  return lista;
}
export const emitirSenha = tipo => request('/senhas', { method: 'POST', body: { tipo } });
export const chamarProxima = guiche => request('/atendimento/proxima', { method: 'POST', body: { guiche } });
export const alterarEstado = (id, acao, guiche) => request('/senhas/' + encodeURIComponent(id), { method: 'PATCH', body: { acao, guiche } });
