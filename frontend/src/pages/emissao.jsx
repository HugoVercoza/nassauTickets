import Botao from '../components/botao';
import '../styles/emissao.css';
import { useState } from 'react';
import { emitirSenha, listarSenhas } from '../services/atendimentoService';
import { verificarDentroDoExpediente } from '../utils/expediente';

export default function Emissao() {
  const [atendimento, setAtendimento] = useState('');
  const [Senha, setSenha] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  const dentroDoExpediente = verificarDentroDoExpediente();

  function AtendimentoGeral() {
    setAtendimento('Atendimento Geral');
  }

  function AtendimentoPrioritario() {
    setAtendimento('Atendimento Prioritário');
  }

  function AtendimentoExame() {
    setAtendimento('Atendimento Exame');
  }

  async function EmitirSenha() {
    if (enviando) return;

    if (!verificarDentroDoExpediente()) {
      setErro('Atendimento encerrado. Horário de emissão de senhas: 07h00 às 17h00.');
      return;
    }

    let tipo = '';
    if (atendimento === 'Atendimento Geral') {
      tipo = 'SG';
    } else if (atendimento === 'Atendimento Prioritário') {
      tipo = 'SP';
    } else if (atendimento === 'Atendimento Exame') {
      tipo = 'SE';
    } else {
      alert('Selecione o tipo de atendimento antes de emitir a senha');
      return;
    }

    setEnviando(true);
    setErro('');
    try {
      const senha = await emitirSenha(tipo);
      setSenha(senha.numero);
      window.dispatchEvent(new Event('nassauTickets:senhasAtualizadas'));
      void listarSenhas().catch(() => {});
    } catch (e) {
      setErro(e.message);
    } finally {
      setEnviando(false);
    }
  }

  function Reiniciar() {
    setAtendimento('');
    setSenha('');
    setErro('');
  }

  return (
    <div className="container">
      {!dentroDoExpediente && (
        <div className="emissao-alerta-expediente" role="alert">
          Atendimento encerrado. Horário de emissão: 07h00 às 17h00.
        </div>
      )}

      <div>
        <h1>Escolha o tipo de atendimento:</h1>
        <Botao
          className={atendimento === 'Atendimento Geral' ? 'botaoSelecionado' : 'botao'}
          texto="Atendimento Geral"
          disabled={!dentroDoExpediente}
          onClick={AtendimentoGeral}
        />
        <Botao
          className={atendimento === 'Atendimento Prioritário' ? 'botaoSelecionado' : 'botao'}
          texto="Atendimento Prioritário"
          disabled={!dentroDoExpediente}
          onClick={AtendimentoPrioritario}
        />
        <Botao
          className={atendimento === 'Atendimento Exame' ? 'botaoSelecionado' : 'botao'}
          texto="Atendimento Exame"
          disabled={!dentroDoExpediente}
          onClick={AtendimentoExame}
        />
      </div>

      <div>
        <h2>Emitir Senha</h2>
        {enviando && <p role="status">Emitindo senha...</p>}
        {erro && <p role="alert">{erro}</p>}
        <Botao
          className="botao"
          texto="Emitir Senha"
          disabled={enviando || !dentroDoExpediente}
          onClick={EmitirSenha}
        />
        <h2 className="senha">{Senha && `Senha Emitida: ${Senha}`}</h2>
        <Botao className="botao" texto="Reiniciar" onClick={Reiniciar} />
      </div>
    </div>
  );
}