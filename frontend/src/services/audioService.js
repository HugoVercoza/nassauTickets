let contexto;
export async function prepararAudio() {
  const Audio = window.AudioContext || window.webkitAudioContext;
  if (!Audio || !window.speechSynthesis) throw new Error('Este navegador não oferece áudio e voz. Use Chrome ou Edge.');
  contexto ||= new Audio();
  await contexto.resume();
  if (contexto.state !== 'running') throw new Error('Áudio bloqueado. Clique em Testar áudio para habilitar.');
}
export function textoChamada(senha) {
  const tipo = { SP: 'Atendimento prioritário', SE: 'Retirada de exames', SG: 'Atendimento geral' }[senha.tipo] || senha.tipo;
  return `${senha.tentativasChamada >= 2 ? 'Última chamada. ' : ''}${tipo}. Senha ${senha.numero.slice(0, 2).split('').join(' ')} ${Number(senha.numero.slice(2))}. ${senha.guiche}.`;
}
export async function anunciar(senha) {
  await prepararAudio();
  window.speechSynthesis.cancel();
  await new Promise(resolve => {
    const oscilador = contexto.createOscillator();
    const ganho = contexto.createGain();
    const inicio = contexto.currentTime;
    oscilador.connect(ganho); ganho.connect(contexto.destination);
    oscilador.frequency.setValueAtTime(660, inicio);
    oscilador.frequency.setValueAtTime(880, inicio + 0.2);
    ganho.gain.setValueAtTime(0.12, inicio);
    ganho.gain.exponentialRampToValueAtTime(0.001, inicio + 0.45);
    oscilador.onended = () => { oscilador.disconnect(); ganho.disconnect(); resolve(); };
    oscilador.start(); oscilador.stop(inicio + 0.5);
  });
  return new Promise((resolve, reject) => {
    const fala = new SpeechSynthesisUtterance(textoChamada(senha));
    fala.lang = 'pt-BR'; fala.rate = 0.9;
    const voz = window.speechSynthesis.getVoices().find(v => v.lang === 'pt-BR');
    if (voz) fala.voice = voz;
    const timer = setTimeout(() => { window.speechSynthesis.cancel(); reject(new Error('A voz não respondeu. Verifique as vozes em português do sistema.')); }, 20000);
    fala.onend = () => { clearTimeout(timer); resolve(); };
    fala.onerror = () => { clearTimeout(timer); reject(new Error('Não foi possível reproduzir a voz. Verifique o áudio do navegador.')); };
    window.speechSynthesis.speak(fala);
  });
}
