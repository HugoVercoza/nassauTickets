import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import * as service from '../services/atendimentoService';
import { anunciar, prepararAudio, textoChamada } from '../services/audioService';
import '../styles/guiche.css';

const ativos = ['CHAMADA', 'CHAMADA_NOVAMENTE', 'EM_ATENDIMENTO'];

export default function Guiche() {
  const [senhas, setSenhas] = useState([]);
  const [guiche, setGuiche] = useState('Guichê 01');
  const [rede, setRede] = useState({ tipo: 'loading', mensagem: 'Carregando fila...' });
  const [audio, setAudio] = useState('');
  const [falhaAudio, setFalhaAudio] = useState(null);
  const [falando, setFalando] = useState(false);
  const trava = useRef(false);
  const repetir = useRef(null);

  const atual = senhas.find((s) => s.guiche === guiche && ativos.includes(s.estado));

  async function tocar(senha) {
    setFalando(true);
    setFalhaAudio(null);
    setAudio(textoChamada(senha));
    try {
      await anunciar(senha);
    } catch (e) {
      setAudio(e.message);
      setFalhaAudio(senha);
    } finally {
      setFalando(false);
    }
  }

  async function executar(operacao, mensagem, som = false) {
    if (trava.current) return;
    trava.current = true;
    repetir.current = () => executar(operacao, mensagem, som);
    setRede({ tipo: 'loading', mensagem: 'Aguarde, comunicando com a API...' });
    let resultado;
    try {
      resultado = await operacao();
      // Uma mutação confirmada não é refeita se apenas o GET seguinte falhar.
      if (som && resultado) void tocar(resultado);
      repetir.current = () => executar(service.listarSenhas, 'Fila atualizada.');
      const lista = await service.listarSenhas();
      setSenhas(lista);
      setRede({ tipo: 'sucesso', mensagem });
    } catch (e) {
      setRede({ tipo: 'erro', mensagem: e.message });
    } finally {
      trava.current = false;
    }
  }

  useEffect(() => {
    executar(service.listarSenhas, 'Fila carregada com sucesso.');
  }, []);

  const bloqueado = rede.tipo === 'loading' || rede.tipo === 'erro' || falando;

  function mudar(acao, mensagem, som = false) {
    void prepararAudio().catch(() => {});
    executar(() => service.alterarEstado(atual.id, acao, guiche), mensagem, som);
  }

  return (
    <div className="guiche-container">
      <h1>Terminal do Atendente</h1>

      <label>
        Guichê de atendimento{' '}
        <select value={guiche} disabled={bloqueado} onChange={(e) => setGuiche(e.target.value)}>
          {Array.from({ length: 10 }, (_, i) => `Guichê ${String(i + 1).padStart(2, '0')}`).map((g) => (
            <option key={g}>{g}</option>
          ))}
        </select>
      </label>

      <div className={`rede-guiche ${rede.tipo}`} role={rede.tipo === 'erro' ? 'alert' : 'status'}>
        <strong>{rede.tipo === 'loading' ? 'Carregando' : rede.tipo === 'erro' ? 'Erro' : 'Sucesso'}: </strong>
        {rede.mensagem}
        {rede.tipo === 'erro' && <button onClick={() => repetir.current?.()}>Tentar novamente</button>}
      </div>

      <div className="botoes-atendimento">
        <button
          disabled={rede.tipo === 'loading' || falando}
          onClick={() => executar(service.listarSenhas, 'Fila atualizada.')}
        >
          Atualizar fila
        </button>
        <button
          disabled={falando}
          onClick={() => tocar({ tipo: 'SG', numero: 'SG001', guiche, tentativasChamada: 1 })}
        >
          Testar áudio
        </button>
        <Link to="/painel">Abrir painel</Link>
      </div>

      {audio && <p role="status">Áudio: {audio}</p>}
      {falhaAudio && (
        <button disabled={falando} onClick={() => tocar(falhaAudio)}>
          Reproduzir áudio novamente
        </button>
      )}

      <section className="senha-atual" aria-busy={rede.tipo === 'loading'}>
        <h2>Senha atual</h2>
        {atual ? (
          <>
            <div className="senha-destaque">{atual.numero}</div>
            <p>
              Tipo: {atual.tipo} · Estado: {atual.estado}
            </p>
            <p>
              {atual.guiche} · Chamadas: {atual.tentativasChamada}
            </p>
            {atual.tentativasChamada >= 2 && <strong>Última chamada</strong>}
            <div className="botoes-atendimento">
              {['CHAMADA', 'CHAMADA_NOVAMENTE'].includes(atual.estado) && (
                <button disabled={bloqueado} onClick={() => mudar('iniciar', 'Atendimento iniciado.')}>
                  Iniciar atendimento
                </button>
              )}
              {atual.estado === 'CHAMADA' && (
                <button disabled={bloqueado} onClick={() => mudar('repetir', 'Última chamada registrada.', true)}>
                  Chamar Novamente
                </button>
              )}
              {atual.estado === 'CHAMADA_NOVAMENTE' && (
                <button disabled={bloqueado} onClick={() => mudar('ausente', 'Não comparecimento registrado.')}>
                  Marcar não compareceu
                </button>
              )}
              {atual.estado === 'EM_ATENDIMENTO' && (
                <button disabled={bloqueado} onClick={() => mudar('finalizar', 'Atendimento finalizado.')}>
                  Finalizar atendimento
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            <p>Nenhuma senha em atendimento neste guichê.</p>
            <button
              disabled={bloqueado}
              onClick={() => {
                void prepararAudio().catch(() => {});
                executar(() => service.chamarProxima(guiche), 'Senha chamada com sucesso.', true);
              }}
            >
              Chamar próxima senha
            </button>
          </>
        )}
      </section>

      <section className="fila">
        <h2>Fila de espera</h2>
        <p>Alternância SP → SE/SG. Entre não prioritárias, SE tem preferência sobre SG.</p>
        <div className="lista-fila">
          {senhas
            .filter((s) => s.estado === 'AGUARDANDO')
            .map((s) => (
              <div className="item-fila" key={s.id}>
                <strong>{s.numero}</strong>
                <span>Tipo: {s.tipo}</span>
                <span>{s.estado}</span>
              </div>
            ))}
        </div>
        {!senhas.some((s) => s.estado === 'AGUARDANDO') && <p>Nenhuma senha carregada na fila.</p>}
      </section>
    </div>
  );
}