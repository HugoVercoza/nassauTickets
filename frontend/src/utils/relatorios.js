// =============================================================
// Funções auxiliares da parte de Relatórios, Auditoria e Dashboard
// Aqui ficam só "calculadoras": recebem dados e devolvem um valor.
// Nenhuma delas altera o localStorage.
// =============================================================

// Lê todas as senhas salvas no navegador (chave "senhas").
// Se der qualquer erro, devolve uma lista vazia para a tela não quebrar.
export function carregarAtendimentos() {
  try {
    const dados = JSON.parse(localStorage.getItem('senhas') || '[]');
    return Array.isArray(dados) ? dados : [];
  } catch {
    return [];
  }
}

// Transforma uma data ISO em "AAAA-MM-DD" no horário local (Brasil).
// Usamos isso para comparar com o valor dos campos <input type="date">.
export function dataLocal(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

// "2026-09-17T07:30:00Z" -> "17/09/2026"
export function formatarData(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('pt-BR');
}

// "2026-09-17T07:30:00Z" -> "04:30"
export function formatarHora(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Diferença entre duas datas em minutos (ou null se faltar alguma)
export function minutosEntre(inicio, fim) {
  if (!inicio || !fim) return null;
  return (new Date(fim) - new Date(inicio)) / 60000;
}

// Média de uma lista de números, ignorando os null.
// Exemplo: media([10, null, 20]) -> 15
export function media(lista) {
  const validos = lista.filter((n) => n !== null);
  if (validos.length === 0) return null;
  const soma = validos.reduce((total, n) => total + n, 0);
  return Math.round(soma / validos.length);
}

// 15 -> "15 min" | null -> "-"
export function formatarMinutos(valor) {
  return valor === null ? '-' : `${valor} min`;
}

// ---------- Horários da auditoria ----------
// O Guichê hoje guarda só "dataChamada" (o horário da chamada MAIS RECENTE).
// Por isso:
//  - se existir um campo próprio (ex.: dataPrimeiraChamada), usamos ele;
//  - se não existir, deduzimos pelo número de tentativas;
//  - se não der para saber, devolvemos null e a tabela mostra "-".

export function horaPrimeiraChamada(senha) {
  if (senha.dataPrimeiraChamada) return senha.dataPrimeiraChamada;
  if (senha.tentativasChamada === 1) return senha.dataChamada;
  return null;
}

export function horaSegundaChamada(senha) {
  if (senha.dataSegundaChamada) return senha.dataSegundaChamada;
  if (senha.tentativasChamada >= 2) return senha.dataChamada;
  return null;
}

export function horaInicioAtendimento(senha) {
  return senha.dataInicioAtendimento || null;
}

// Tempo de espera = da emissão até a 1ª chamada
export function tempoEspera(senha) {
  const chamada = senha.dataPrimeiraChamada || senha.dataChamada;
  return minutosEntre(senha.dataCriacao, chamada);
}

// Tempo de atendimento = do início (ou da chamada) até a finalização.
// Só conta senhas ATENDIDAS.
export function tempoAtendimento(senha) {
  if (senha.estado !== 'ATENDIDA') return null;
  const inicio = senha.dataInicioAtendimento || senha.dataChamada;
  return minutosEntre(inicio, senha.dataFinalizacao);
}
