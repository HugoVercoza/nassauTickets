
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Botao from "../components/botao";

import {
  listarSenhas,
  solicitarProxima,
  solicitarNovamente,
  atualizarEstado
} from "../services/api";

import "../styles/guiche.css";

export default function Guiche() {
  const [senhas, setSenhas] = useState([]);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [origem, setOrigem] = useState("api");

  const guiche = "Guichê 01";

  const recarregar = useCallback(async () => {
    try {
      const resultado = await listarSenhas();

      setSenhas(resultado.senhas || []);
      setOrigem(resultado.origem || "api");

      return resultado;
    } catch (error) {
      setOrigem("local");
      setErro(error.message || "Erro ao carregar as senhas.");
      throw error;
    }
  }, []);

  useEffect(() => {
    let ativo = true;

    async function atualizar() {
      try {
        await recarregar();
        if (ativo) setErro("");
      } catch {
        // O erro já foi registrado por recarregar.
      }
    }

    atualizar();

    const intervalo = setInterval(atualizar, 3000);

    return () => {
      ativo = false;
      clearInterval(intervalo);
    };
  }, [recarregar]);

  const senhaAtual = senhas.find(
    (senha) =>
      senha.guiche === guiche &&
      [
        "CHAMADA",
        "CHAMADA_NOVAMENTE",
        "EM_ATENDIMENTO"
      ].includes(senha.estado)
  );

  const filaEspera = senhas.filter(
    (senha) => senha.estado === "AGUARDANDO"
  );

  async function executar(operacao) {
    if (carregando || origem === "local") return;

    setCarregando(true);
    setErro("");

    try {
      await operacao();
      await recarregar();
    } catch (error) {
      setErro(
        error.message || "Falha na comunicação com o servidor."
      );
    } finally {
      setCarregando(false);
    }
  }

  function chamarProxima() {
    executar(() => solicitarProxima(guiche));
  }

  function chamarNovamente() {
    if (!senhaAtual) return;

    executar(() => solicitarNovamente(senhaAtual.id));
  }

  function iniciarAtendimento() {
    if (!senhaAtual) return;

    executar(() =>
      atualizarEstado(senhaAtual.id, "EM_ATENDIMENTO")
    );
  }

  function finalizarAtendimento() {
    if (!senhaAtual) return;

    executar(() =>
      atualizarEstado(senhaAtual.id, "ATENDIDA")
    );
  }

  function marcarNaoCompareceu() {
    if (!senhaAtual) return;

    executar(() =>
      atualizarEstado(senhaAtual.id, "NAO_COMPARECEU")
    );
  }

  return (
    <div className="guiche-container">
      <h1>Terminal do Atendente</h1>

      {origem === "local" && (
        <p role="alert" style={{ color: "#b91c1c" }}>
          Servidor indisponível. As operações de atendimento
          estão temporariamente bloqueadas.
        </p>
      )}

      {erro && (
        <div role="alert" style={{ color: "#b91c1c" }}>
          <p>{erro}</p>
          <button
            disabled={carregando}
            onClick={() => {
              recarregar().then(
                () => setErro(""),
                () => {}
              );
            }}
          >
            Tentar novamente
          </button>
        </div>
      )}

      <section className="senha-atual">
        <h2>Senha atual</h2>

        {senhaAtual ? (
          <>
            <div className="senha-destaque">
              {senhaAtual.numero}
            </div>

            <p>
              <strong>Tipo:</strong> {senhaAtual.tipo}
            </p>

            <p>
              <strong>Estado:</strong> {senhaAtual.estado}
            </p>

            <p>
              <strong>Guichê:</strong>{" "}
              {senhaAtual.guiche || guiche}
            </p>

            <div className="botoes-atendimento">
              {[
                "CHAMADA",
                "CHAMADA_NOVAMENTE"
              ].includes(senhaAtual.estado) && (
                <button
                  disabled={carregando || origem === "local"}
                  onClick={iniciarAtendimento}
                >
                  Iniciar atendimento
                </button>
              )}

              {[
                "CHAMADA",
                "CHAMADA_NOVAMENTE"
              ].includes(senhaAtual.estado) && (
                <button
                  disabled={carregando || origem === "local"}
                  onClick={chamarNovamente}
                >
                  Chamar novamente
                </button>
              )}

              {senhaAtual.estado === "CHAMADA_NOVAMENTE" && (
                <button
                  disabled={carregando || origem === "local"}
                  onClick={marcarNaoCompareceu}
                >
                  Marcar não compareceu
                </button>
              )}

              {senhaAtual.estado === "EM_ATENDIMENTO" && (
                <button
                  disabled={carregando || origem === "local"}
                  onClick={finalizarAtendimento}
                >
                  Finalizar atendimento
                </button>
              )}

              <Link to="/painel">
                <Botao texto="Painel" />
              </Link>
            </div>
          </>
        ) : (
          <>
            <p>Nenhuma senha em atendimento.</p>

            <button
              disabled={
                carregando ||
                origem === "local" ||
                filaEspera.length === 0
              }
              onClick={chamarProxima}
            >
              {carregando
                ? "Aguarde..."
                : "Chamar próxima senha"}
            </button>
          </>
        )}
      </section>

      <section className="fila">
        <h2>Fila de espera</h2>

        {filaEspera.length === 0 ? (
          <p>Não há senhas aguardando.</p>
        ) : (
          <div className="lista-fila">
            {filaEspera.map((senha) => (
              <div className="item-fila" key={senha.id}>
                <strong>{senha.numero}</strong>

                <span>Tipo: {senha.tipo}</span>

                <span>Estado: {senha.estado}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
