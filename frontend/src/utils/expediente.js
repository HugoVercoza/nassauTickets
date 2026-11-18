export function verificarDentroDoExpediente() {
  if (import.meta.env.VITE_IGNORAR_EXPEDIENTE === 'true') {
    return true;
  }
  const horaAtual = new Date().getHours();
  return horaAtual >= 7 && horaAtual < 17;
}