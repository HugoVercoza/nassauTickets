import { useState } from 'react';
import ModalDashboard from '../components/ModalDashboard';
import TabelaAuditoria from '../components/TabelaAuditoria';
import Relatorios from '../components/Relatorios';
import {
  carregarAtendimentos,
  dataLocal,
  formatarData,
  formatarHora,
} from '../utils/relatorios';
import '../styles/historico.css';
import '../styles/relatorios.css';

function formatarEstado(estado) {
  if (!estado) return '-';

  if (estado === 'NAO_COMPARECEU') {
    return 'NÃO COMPARECEU';
  }

  return estado.replaceAll('_', ' ');
}

export default function Historico() {
  const [modalAberto, setModalAberto] = useState(false);
  const [atendimentos, setAtendimentos] = useState(carregarAtendimentos);

  // Qual aba está aberta: 'historico', 'auditoria' ou 'relatorios'
  const [aba, setAba] = useState('historico');

  const [busca, setBusca] = useState('');
  const [tipo, setTipo] = useState('');
  const [estado, setEstado] = useState('');
  const [dataInicial, setDataInicial] = useState('');
  const [dataFinal, setDataFinal] = useState('');

  const atendimentosFiltrados = atendimentos.filter((item) => {
    const textoBusca = `${item.numero || ''} ${item.guiche || ''}`.toLowerCase();
    const dataEmissao = dataLocal(item.dataCriacao); // "AAAA-MM-DD"

    const buscaOk = !busca || textoBusca.includes(busca.toLowerCase());
    const tipoOk = !tipo || item.tipo === tipo;
    const estadoOk = !estado || item.estado === estado;
    // Intervalo de datas: a emissão precisa estar ENTRE a data inicial e a final
    const dataInicialOk = !dataInicial || dataEmissao >= dataInicial;
    const dataFinalOk = !dataFinal || dataEmissao <= dataFinal;

    return buscaOk && tipoOk && estadoOk && dataInicialOk && dataFinalOk;
  });

  function limparFiltros() {
    setBusca('');
    setTipo('');
    setEstado('');
    setDataInicial('');
    setDataFinal('');
  }

  // Lê o localStorage de novo (pega senhas chamadas depois que a tela abriu)
  function atualizarDados() {
    setAtendimentos(carregarAtendimentos());
  }

  return (
    <div className="historico-container">
      <div className="historico-cabecalho">
        <div>
          <h1 className="historico-titulo">Histórico de Atendimentos</h1>
          <p className="historico-descricao">
            Consulte as senhas, a auditoria e os relatórios do sistema.
          </p>
        </div>

        <div className="historico-acoes">
          <button className="btn-limpar-filtros" type="button" onClick={atualizarDados}>
            🔄 Atualizar dados
          </button>
          <button
            className="btn-abrir-dashboard"
            type="button"
            onClick={() => setModalAberto(true)}
          >
            Visualizar Dashboard
          </button>
        </div>
      </div>

      <div className="abas">
        <button
          type="button"
          className={aba === 'historico' ? 'aba ativa' : 'aba'}
          onClick={() => setAba('historico')}
        >
          📋 Histórico
        </button>
        <button
          type="button"
          className={aba === 'auditoria' ? 'aba ativa' : 'aba'}
          onClick={() => setAba('auditoria')}
        >
          🔍 Auditoria
        </button>
        <button
          type="button"
          className={aba === 'relatorios' ? 'aba ativa' : 'aba'}
          onClick={() => setAba('relatorios')}
        >
          📈 Relatórios
        </button>
      </div>

      {/* Os filtros servem para as abas Histórico e Auditoria.
          A aba Relatórios tem o próprio filtro (dia ou mês). */}
      {aba !== 'relatorios' && (
        <div className="historico-filtros">
          <input
            type="text"
            placeholder="Buscar por senha ou guichê"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />

          <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="">Todos os tipos</option>
            <option value="SG">Geral (SG)</option>
            <option value="SP">Preferencial (SP)</option>
            <option value="SE">Exame (SE)</option>
          </select>

          <select value={estado} onChange={(e) => setEstado(e.target.value)}>
            <option value="">Todos os estados</option>
            <option value="EMITIDA">Emitida</option>
            <option value="AGUARDANDO">Aguardando</option>
            <option value="CHAMADA">Chamada</option>
            <option value="CHAMADA_NOVAMENTE">Chamada novamente</option>
            <option value="EM_ATENDIMENTO">Em atendimento</option>
            <option value="ATENDIDA">Atendida</option>
            <option value="NAO_COMPARECEU">Não compareceu</option>
          </select>

          <input
            type="date"
            value={dataInicial}
            onChange={(e) => setDataInicial(e.target.value)}
            title="Data inicial"
          />

          <input
            type="date"
            value={dataFinal}
            onChange={(e) => setDataFinal(e.target.value)}
            title="Data final"
          />

          <button
            className="btn-limpar-filtros"
            type="button"
            onClick={limparFiltros}
          >
            Limpar filtros
          </button>
        </div>
      )}

      <div className="historico-tabela-container">
        {aba !== 'relatorios' && (
          <div className="historico-contagem">
            {atendimentosFiltrados.length} atendimento(s) encontrado(s)
          </div>
        )}

        {aba === 'historico' &&
          (atendimentosFiltrados.length === 0 ? (
            <p className="historico-vazio">Nenhum atendimento encontrado.</p>
          ) : (
            <div className="historico-tabela-scroll">
              <table className="historico-tabela">
                <thead>
                  <tr>
                    <th>Senha</th>
                    <th>Tipo</th>
                    <th>Estado</th>
                    <th>Guichê</th>
                    <th>Data</th>
                    <th>Emissão</th>
                    <th>Chamada</th>
                    <th>Finalização</th>
                  </tr>
                </thead>

                <tbody>
                  {atendimentosFiltrados.map((item) => (
                    <tr key={item.id}>
                      <td><strong>{item.numero || '-'}</strong></td>
                      <td>{item.tipo || '-'}</td>
                      <td>{formatarEstado(item.estado)}</td>
                      <td>{item.guiche || '-'}</td>
                      <td>{formatarData(item.dataCriacao)}</td>
                      <td>{formatarHora(item.dataCriacao)}</td>
                      <td>{formatarHora(item.dataChamada)}</td>
                      <td>{formatarHora(item.dataFinalizacao)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

        {aba === 'auditoria' && (
          <TabelaAuditoria atendimentos={atendimentosFiltrados} />
        )}

        {aba === 'relatorios' && <Relatorios atendimentos={atendimentos} />}
      </div>

      {modalAberto && (
        <ModalDashboard onClose={() => setModalAberto(false)} />
      )}
    </div>
  );
}
