<<<<<<< HEAD
import React, { useState, useEffect } from 'react';
import '../styles/painel.css';
import { listarSenhas } from '../services/atendimentoService';
=======
import { useCallback, useEffect, useRef, useState } from "react";
import { acompanharChamadas, listarEventosChamada, listarSenhas, lerSenhasLocais } from "../services/api";
import { anunciarChamada, habilitarAudio, pararAudio } from "../services/audioChamadas";
import "../styles/painel.css";
>>>>>>> origin/dev

const CHAMADAS = new Set(["CHAMADA","CHAMADA_NOVAMENTE","EM_ATENDIMENTO","ATENDIDA","NAO_COMPARECEU"]);
function ultimas(senhas) {
  return senhas.filter(s=>CHAMADAS.has(s.estado) && s.dataChamada).sort((a,b)=>new Date(b.dataChamada)-new Date(a.dataChamada)).slice(0,5);
}
export default function Painel() {
<<<<<<< HEAD
  const [senhaAtual, setSenhaAtual] = useState(null);
  const [ultimasSenhas, setUltimasSenhas] = useState([]);
  const [erroRede, setErroRede] = useState('');
  const [animando, setAnimando] = useState(false);

  const tocarBip = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine'
      osc.frequency.setValueAtTime(659.25, audioCtx.currentTime); // Tom E5
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.onended = () => { void audioCtx.close(); };
      osc.stop(audioCtx.currentTime + 0.35);
    } catch (e) {
      console.warn("Áudio não reproduzido devido a restrições do navegador:", e);
    }
  };

  const lerSenhasDoLocalStorage = async () => {
    try {
      const todas = await listarSenhas();
      setErroRede('');

      const chamadas = todas
        .filter((s) => ['CHAMADA', 'CHAMADA_NOVAMENTE', 'EM_ATENDIMENTO', 'ATENDIDA'].includes(s.estado))
        .sort((a, b) => new Date(b.dataChamada || 0) - new Date(a.dataChamada || 0));

      if (chamadas.length > 0) {
        const maisRecente = chamadas[0];

        setSenhaAtual((anterior) => {
          if (!anterior || anterior.numero !== maisRecente.numero || anterior.estado !== maisRecente.estado) {
            tocarBip();
            setAnimando(true);
            setTimeout(() => setAnimando(false), 2200);
          }
          return maisRecente;
        });

        setUltimasSenhas(chamadas.slice(1, 6));
      } else { setSenhaAtual(null); setUltimasSenhas([]); }
    } catch (erro) {
      setErroRede(erro.message);
    }
  };

=======
  const [chamadas,setChamadas] = useState(()=>ultimas(lerSenhasLocais()));
  const [origem,setOrigem] = useState("local");
  const [animando,setAnimando] = useState(false);
  const [somLiberado,setSomLiberado] = useState(false);
  const [erroSom,setErroSom] = useState("");
  const idEvento = useRef(0);
  const cancelarAudio = useRef(null);
  const receberEvento = useCallback(evento => {
    if (!evento || evento.id <= idEvento.current) return;
    idEvento.current = evento.id;
    if (!["CHAMADA","CHAMADA_NOVAMENTE"].includes(evento.tipo)) return;
    setChamadas(anteriores=>[evento.senha,...anteriores.filter(s=>s.id!==evento.senha.id)].slice(0,5));
    setOrigem("api"); setAnimando(true);
    cancelarAudio.current?.();
    // O backend determina QUANDO anunciar; a TV reproduz nos seus próprios alto-falantes.
    cancelarAudio.current = anunciarChamada(evento.senha, evento.tipo === "CHAMADA_NOVAMENTE", setErroSom);
  },[]);
>>>>>>> origin/dev
  useEffect(() => {
    let ativo = true;
    let pararStream = () => {};
    let pronto = false;
    async function atualizarSenhas() {
      const r = await listarSenhas();
      if (!ativo) return;
      setOrigem(r.origem);
      if (r.origem === "api") setChamadas(ultimas(r.senhas));
    }
    async function verificarEventos() {
      try {
        const historico = await listarEventosChamada(idEvento.current);
        if (!ativo || !pronto) return;
        for (const evento of historico.eventos || []) receberEvento(evento);
      } catch { /* SSE e próxima consulta tentam novamente */ }
    }
    async function iniciar() {
      try {
        const historico = await listarEventosChamada();
        if (!ativo) return;
        // Eventos anteriores ficam no histórico visual, sem anúncios retroativos.
        idEvento.current = Math.max(0, ...(historico.eventos || []).map(e => e.id));
      } catch { /* backend offline: contingência visual */ }
      await atualizarSenhas();
      if (!ativo) return;
      pronto = true;
      pararStream = acompanharChamadas(receberEvento, () => {}, idEvento.current);
      verificarEventos();
    }
    iniciar();
    const intervalo = setInterval(() => {
      atualizarSenhas();
      if (pronto) verificarEventos();
    }, 2500);
    async function desbloquear() {
      try { await habilitarAudio(); setSomLiberado(true); setErroSom(""); }
      catch (erro) { setErroSom(erro.message); console.warn("Áudio bloqueado pelo navegador:", erro); }
    }
    // Não há botão visível. Uma interação no dispositivo pode ser necessária pelo navegador.
    document.addEventListener("pointerdown", desbloquear);
    document.addEventListener("keydown", desbloquear);
    return () => {
      ativo = false;
      pararStream();
      clearInterval(intervalo);
      cancelarAudio.current?.();
      pararAudio();
      document.removeEventListener("pointerdown", desbloquear);
      document.removeEventListener("keydown", desbloquear);
    };
<<<<<<< HEAD
  }, []);

  return (
    <div className="painel-tv-wrapper">
      {erroRede && <div role="alert">{erroRede} Exibindo última informação recebida. <button onClick={lerSenhasDoLocalStorage}>Tentar novamente</button></div>}
      <section className={`painel-principal ${animando ? 'painel-alerta-ativo' : ''}`}>
        <div className="painel-cabecalho">
          <h1>SISTEMA DE ATENDIMENTO</h1>
          <span className="painel-subtitulo">Aguarde ser chamado pelo painel</span>
        </div>

        {senhaAtual ? (
          <div className="destaque-card">
            <span className="tipo-atendimento-pill">
              {senhaAtual.tipo || senhaAtual.tipoSigla || 'GERAL'}
            </span>
            
            <div className="senha-grande">{senhaAtual.numero}</div>

            <div className="box-guiche">
              <span className="rotulo-guiche">GUICHÊ</span>
              <span className="valor-guiche">{senhaAtual.guiche || '01'}</span>
            </div>

            {senhaAtual.estado === 'CHAMADA_NOVAMENTE' && (
              <div className="aviso-segunda-chamada">2ª CHAMADA</div>
            )}
          </div>
        ) : (
          <div className="painel-sem-chamadas">
            <p>Nenhuma senha chamada até ao momento</p>
            <small>As chamadas efetuadas nos guichés serão exibidas aqui.</small>
          </div>
        )}
      </section>

      <aside className="painel-historico-coluna">
        <h2>ÚLTIMAS CHAMADAS</h2>
        <ul className="lista-ultimas">
          {ultimasSenhas.length > 0 ? (
            ultimasSenhas.map((item, idx) => (
              <li key={item.numero || idx} className="item-historico-tv">
                <div className="dados-senha-historico">
                  <span className="codigo-historico">{item.numero}</span>
                  <span className="tipo-historico">{item.tipo || item.tipoSigla || 'Geral'}</span>
                </div>
                <div className="guiche-historico">
                  Guichê <strong>{item.guiche || '01'}</strong>
                </div>
              </li>
            ))
          ) : (
            <li className="sem-historico">Sem registros anteriores</li>
          )}
        </ul>
      </aside>
    </div>
  );
}
=======
  }, [receberEvento]);
  useEffect(()=>{if(!animando)return;const t=setTimeout(()=>setAnimando(false),2400);return()=>clearTimeout(t)},[animando,chamadas]);
  const atual=chamadas[0]; const anteriores=chamadas.slice(1);
  return <main className="painel-tv-wrapper">
    <section className={`painel-principal ${animando ? "painel-alerta-ativo" : ""}`}>
      <header className="painel-cabecalho"><h1>SISTEMA DE ATENDIMENTO</h1><span className="painel-subtitulo">Acompanhe sua senha e dirija-se ao guichê indicado</span>
      {origem === "local" && <p className="painel-aviso-local">Modo contingência · exibindo últimos dados disponíveis</p>}
      {!somLiberado && <p className="painel-aviso-local" role="status">Clique uma vez em qualquer lugar da TV para habilitar os anúncios sonoros.</p>}
      {erroSom && <p className="painel-aviso-local" role="alert">{erroSom}</p>}</header>
      {atual ? <div className="destaque-card" aria-live="polite"><span className="tipo-atendimento-pill">{atual.tipo || "GERAL"}</span>
      <div className="senha-grande">{atual.numero}</div><div className="box-guiche"><span className="rotulo-guiche">GUICHÊ</span><span className="valor-guiche">{atual.guiche || "A definir"}</span></div>
      {atual.estado === "CHAMADA_NOVAMENTE" && <div className="aviso-segunda-chamada">ÚLTIMA CHAMADA</div>}</div> :
      <div className="painel-sem-chamadas"><p>Nenhuma senha chamada até o momento</p><small>Aguarde sua chamada.</small></div>}
    </section>
    <aside className="painel-historico-coluna"><h2>CHAMADAS ANTERIORES</h2><ul className="lista-ultimas">
      {anteriores.length ? anteriores.map(s=><li key={s.id} className="item-historico-tv"><div className="dados-senha-historico"><span className="codigo-historico">{s.numero}</span><span className="tipo-historico">{s.tipo}</span></div><div className="guiche-historico">{s.guiche || "Guichê não informado"}</div></li>) : <li className="sem-historico">Sem chamadas anteriores</li>}
    </ul><small className="painel-contador">Exibindo {chamadas.length} de até 5 últimas senhas chamadas</small></aside>
  </main>;
}
>>>>>>> origin/dev
