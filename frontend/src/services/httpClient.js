const baseURL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
export async function request(caminho, { method = 'GET', body } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const resposta = await fetch(baseURL + caminho, {
      method, signal: controller.signal, headers: { 'Content-Type': 'application/json' },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    const dados = await resposta.json();
    if (!resposta.ok) throw new Error(dados.mensagem || `Erro HTTP ${resposta.status}`);
    return dados;
  } catch (erro) {
    if (erro.name === 'AbortError') throw new Error('A API demorou para responder. Tente novamente.');
    if (erro instanceof TypeError) throw new Error('Falha de conexão. Verifique se o backend está ligado.');
    throw erro;
  } finally { clearTimeout(timeout); }
}
