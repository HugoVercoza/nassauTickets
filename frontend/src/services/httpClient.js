const origemPadrao = `${window.location.protocol}//${window.location.hostname}:3000`;
const urlConfigurada = (import.meta.env.VITE_API_URL || origemPadrao).replace(/\/$/, '');
const baseURL = urlConfigurada.endsWith('/api') ? urlConfigurada : `${urlConfigurada}/api`;

export async function request(caminho, { method = 'GET', body } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  const rota = caminho.startsWith('/') ? caminho : `/${caminho}`;

  try {
    const resposta = await fetch(`${baseURL}${rota}`, {
      method,
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });

    const texto = await resposta.text();
    let dados = {};
    try {
      dados = texto ? JSON.parse(texto) : {};
    } catch {
      dados = {};
    }

    if (!resposta.ok) {
      throw new Error(dados.erro || dados.mensagem || dados.message || `Erro HTTP ${resposta.status}`);
    }

    return dados;
  } catch (erro) {
    if (erro.name === 'AbortError') throw new Error('A API demourou para responder. Tente novamente.');
    if (erro instanceof TypeError) throw new Error('Falha de conexão. Verifique se o backend está ligado.');
    throw erro;
  } finally {
    clearTimeout(timeout);
  }
}