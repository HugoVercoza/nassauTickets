
import {
  formatarData,
  formatarHora,
  horaPrimeiraChamada,
  horaSegundaChamada,
  horaInicioAtendimento,
} from '../utils/relatorios';
import '../styles/relatorios.css';

function textoEstado(estado) {
  if (estado === 'NAO_COMPARECEU') return 'NÃO COMPARECEU';
  return estado ? estado.replaceAll('_', ' ') : '-';
}

export default function TabelaAuditoria({ atendimentos }) {
  // Ordena da senha mais nova para a mais antiga
  const ordenados = [...atendimentos].sort(
    (a, b) => new Date(b.dataCriacao) - new Date(a.dataCriacao)
  );

  if (ordenados.length === 0) {
    return <p className="historico-vazio">Nenhum atendimento encontrado.</p>;
  }

  return (
    <div className="historico-tabela-scroll">
      <table className="historico-tabela">
        <thead>
          <tr>
            <th>Senha</th>
            <th>Tipo</th>
            <th>Data</th>
            <th>Emissão</th>
            <th>1ª chamada</th>
            <th>2ª chamada</th>
            <th>Início</th>
            <th>Finalização</th>
            <th>Guichê</th>
            <th>Resultado</th>
          </tr>
        </thead>
        <tbody>
          {ordenados.map((senha) => (
            <tr key={senha.id}>
              <td><strong>{senha.numero}</strong></td>
              <td>{senha.tipo}</td>
              <td>{formatarData(senha.dataCriacao)}</td>
              <td>{formatarHora(senha.dataCriacao)}</td>
              <td>{formatarHora(horaPrimeiraChamada(senha))}</td>
              <td>{formatarHora(horaSegundaChamada(senha))}</td>
              <td>{formatarHora(horaInicioAtendimento(senha))}</td>
              <td>{formatarHora(senha.dataFinalizacao)}</td>
              <td>{senha.guiche || '-'}</td>
              <td>
                <span className={`etiqueta etiqueta-${senha.estado}`}>
                  {textoEstado(senha.estado)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="auditoria-legenda">
        "-" = horário ainda não aconteceu ou não foi registrado pelo Guichê.
      </p>
    </div>
  );
}
