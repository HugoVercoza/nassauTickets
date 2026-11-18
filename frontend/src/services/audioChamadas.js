// Áudio das chamadas: os eventos vêm do backend; a reprodução ocorre no navegador da TV.
let contextoAudio;
let timeoutFala;
let desbloqueado = false;

export function audioDisponivel() {
  return typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
}

export async function habilitarAudio() {
  if (!audioDisponivel()) throw new Error("Este navegador não suporta a leitura de voz.");
  const Contexto = window.AudioContext || window.webkitAudioContext;
  if (Contexto) {
    contextoAudio ||= new Contexto();
    await contextoAudio.resume();
  }
  // Precisa acontecer dentro de um clique/tecla no navegador da TV.
  const teste = new SpeechSynthesisUtterance(" ");
  teste.volume = 0;
  window.speechSynthesis.speak(teste);
  desbloqueado = true;
  return true;
}

export function audioHabilitado() { return desbloqueado; }

function sinal() {
  if (!contextoAudio || contextoAudio.state !== "running") return;
  const agora = contextoAudio.currentTime;
  for (const atraso of [0, 0.23]) {
    const oscilador = contextoAudio.createOscillator();
    const ganho = contextoAudio.createGain();
    oscilador.type = "sine";
    oscilador.frequency.value = 880;
    ganho.gain.setValueAtTime(0.0001, agora + atraso);
    ganho.gain.exponentialRampToValueAtTime(0.15, agora + atraso + 0.03);
    ganho.gain.exponentialRampToValueAtTime(0.0001, agora + atraso + 0.18);
    oscilador.connect(ganho).connect(contextoAudio.destination);
    oscilador.start(agora + atraso);
    oscilador.stop(agora + atraso + 0.19);
  }
}

function numeroPorExtenso(codigo) {
  // Ex.: 261117-SP001 => 2 6 1 1 1 7, S P, 0 0 1.
  return String(codigo || "").replace(/[^a-zA-Z0-9]/g, " ")
    .trim().split(/\s+/).map(parte => parte.split("").join(" ")).join(", ");
}

export function anunciarChamada(senha, repeticao = false, onErro = () => {}) {
  if (!audioDisponivel() || !senha) {
    onErro("Leitura de voz indisponível neste navegador.");
    return () => {};
  }
  clearTimeout(timeoutFala);
  window.speechSynthesis.cancel();
  sinal();
  const tipo = senha.tipo === "SP" ? "Atendimento prioritário" : senha.tipo === "SE" ? "Atendimento especial" : "Atendimento geral";
  const ultima = repeticao || senha.estado === "CHAMADA_NOVAMENTE" || Number(senha.tentativasChamada) > 1;
  const guiche = String(senha.guiche || "01").replace(/^guich[eê]\s*/i, "");
  const frase = `${ultima ? "Última chamada. " : ""}${tipo}. Senha ${numeroPorExtenso(senha.numero)}. Dirija-se ao guichê ${guiche}.`;
  const fala = new SpeechSynthesisUtterance(frase);
  fala.lang = "pt-BR";
  fala.rate = 0.86;
  fala.volume = 1;
  const vozes = window.speechSynthesis.getVoices();
  fala.voice = vozes.find(v => v.lang.toLowerCase() === "pt-br") || vozes.find(v => v.lang.toLowerCase().startsWith("pt")) || null;
  fala.onerror = e => { console.warn("Falha no anúncio:", e.error); onErro(`Áudio: ${e.error}`); };
  timeoutFala = setTimeout(() => window.speechSynthesis.speak(fala), 480);
  return () => { clearTimeout(timeoutFala); window.speechSynthesis.cancel(); };
}

export function pararAudio() {
  clearTimeout(timeoutFala);
  if (audioDisponivel()) window.speechSynthesis.cancel();
}
