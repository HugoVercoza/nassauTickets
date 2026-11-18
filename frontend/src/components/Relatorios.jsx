// Relatórios diário e mensal.
// Para cada prioridade (SP, SG, SE) mostra: quantidade emitida, atendidas,
// não compareceu, tempo médio de espera e tempo médio de atendimento.
import { useState } from 'react';
import {
  dataLocal,
  media,
  formatarMinutos,
  tempoEspera,
  tempoAtendimento,
} from '../utils/relatorios';
import '../styles/relatorios.css';

const PRIORIDADES = [
  { sigla: 'SP', nome: 'Prioritário' },
  { sigla: 'SG', nome: 'Geral' },
  { sigla: 'SE', nome: 'Exame' },
];

// Calcula uma linha do relatório para uma lista de senhas
function calcularLinha(lista) {
  return {
    emitidas: lista.length,
    atendidas: lista.filter((s) => s.estado === 'ATENDIDA').length,
    naoCompareceu: lista.filter((s) => s.estado === 'NAO_COMPARECEU').length,
    esperaMedia: media(lista.map(tempoEspera)),
    atendimentoMedio: media(lista.map(tempoAtendimento)),
  };
}

// Data da senha mais recente (para o relatório já abrir com dados)
function ultimaData(atendimentos) {
  const datas = atendimentos.map((s) => dataLocal(s.dataCriacao)).sort();
  return datas[datas.length - 1] || dataLocal(new Date().toISOString());
}

export default function Relatorios({ atendimentos }) {
  const [periodo, setPeriodo] = useState('diario'); // 'diario' ou 'mensal'
  const [dia, setDia] = useState(() => ultimaData(atendimentos)); // AAAA-MM-DD
  const [mes, setMes] = useState(() => ultimaData(atendimentos).slice(0, 7)); // AAAA-MM

  // 1) Pega só as senhas do período escolhido
  const doPeriodo = atendimentos.filter((s) => {
    const data = dataLocal(s.dataCriacao);
    return periodo === 'diario' ? data === dia : data.slice(0, 7) === mes;
  });

  // 2) Monta uma linha por prioridade + a linha de total
  const linhas = PRIORIDADES.map((p) => ({
    ...p,
    ...calcularLinha(doPeriodo.filter((s) => s.tipo === p.sigla)),
  }));
  const total = calcularLinha(doPeriodo);

  return (
    <div className="relatorios">
      <div className="relatorios-filtros">
        <button
          type="button"
          className={periodo === 'diario' ? 'aba ativa' : 'aba'}
          onClick={() => setPeriodo('diario')}
        >
          Diário
        </button>
        <button
          type="button"
          className={periodo === 'mensal' ? 'aba ativa' : 'aba'}
          onClick={() => setPeriodo('mensal')}
        >
          Mensal
        </button>

        {periodo === 'diario' ? (
          <input type="date" value={dia} onChange={(e) => setDia(e.target.value)} />
        ) : (
          <input type="month" value={mes} onChange={(e) => setMes(e.target.value)} />
        )}
      </div>

      <h2 className="relatorios-titulo">
        Relatório {periodo === 'diario' ? 'diário' : 'mensal'} —{' '}
        {periodo === 'diario'
          ? dia.split('-').reverse().join('/')
          : mes.split('-').reverse().join('/')}
      </h2>

      {doPeriodo.length === 0 ? (
        <p className="historico-vazio">Nenhuma senha emitida neste período.</p>
      ) : (
        <div className="historico-tabela-scroll">
          <table className="historico-tabela">
            <thead>
              <tr>
                <th>Prioridade</th>
                <th>Emitidas</th>
                <th>Atendidas</th>
                <th>Não compareceu</th>
                <th>Espera média</th>
                <th>Atendimento médio</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((l) => (
                <tr key={l.sigla}>
                  <td>{l.nome} ({l.sigla})</td>
                  <td>{l.emitidas}</td>
                  <td>{l.atendidas}</td>
                  <td>{l.naoCompareceu}</td>
                  <td>{formatarMinutos(l.esperaMedia)}</td>
                  <td>{formatarMinutos(l.atendimentoMedio)}</td>
                </tr>
              ))}
              <tr className="linha-total">
                <td>Total</td>
                <td>{total.emitidas}</td>
                <td>{total.atendidas}</td>
                <td>{total.naoCompareceu}</td>
                <td>{formatarMinutos(total.esperaMedia)}</td>
                <td>{formatarMinutos(total.atendimentoMedio)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
