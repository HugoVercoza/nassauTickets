import { useEffect, useState } from 'react';
import {
  listarUsuarios,
  cadastrarUsuario,
  listarGuiches,
  cadastrarGuiche,
  alterarEstadoGuiche,
  encerrarExpediente,
} from '../services/adminService';
import { verificarDentroDoExpediente } from '../utils/expediente';
import '../styles/adm.css';

export default function Adm() {
  const [usuarios, setUsuarios] = useState([]);
  const [guiches, setGuiches] = useState([]);

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  // Campos do formulário de Usuário
  const [nome, setNome] = useState('');
  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const [tipo, setTipo] = useState('ATENDENTE');

  // Campo do formulário de Guichê
  const [numeroGuiche, setNumeroGuiche] = useState('');

  const dentroDoExpediente = verificarDentroDoExpediente();

  async function carregarDados() {
    setCarregando(true);
    setErro('');
    try {
      const [resUsuarios, resGuiches] = await Promise.all([
        listarUsuarios(),
        listarGuiches(),
      ]);
      setUsuarios(Array.isArray(resUsuarios) ? resUsuarios : resUsuarios.usuarios || []);
      setGuiches(Array.isArray(resGuiches) ? resGuiches : resGuiches.guiches || []);
    } catch (err) {
      setErro(err.message || 'Falha ao carregar dados administrativos.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  async function handleCadastrarUsuario(e) {
    e.preventDefault();
    setErro('');
    setSucesso('');

    if (!nome.trim() || !login.trim() || !senha.trim()) {
      setErro('Preencha nome, login e senha para cadastrar o usuário.');
      return;
    }

    try {
      await cadastrarUsuario({ nome: nome.trim(), login: login.trim(), senha, tipo });
      setNome('');
      setLogin('');
      setSenha('');
      setTipo('ATENDENTE');
      setSucesso('Usuário cadastrado com sucesso!');
      carregarDados();
    } catch (err) {
      setErro(err.message);
    }
  }

  async function handleCadastrarGuiche(e) {
    e.preventDefault();
    setErro('');
    setSucesso('');

    const numero = Number(numeroGuiche);
    if (!numero || numero < 1) {
      setErro('Informe um número de guichê válido (maior que 0).');
      return;
    }

    try {
      await cadastrarGuiche(numero);
      setNumeroGuiche('');
      setSucesso(`Guichê ${String(numero).padStart(2, '0')} cadastrado com sucesso!`);
      carregarDados();
    } catch (err) {
      setErro(err.message);
    }
  }

  async function handleAlternarGuiche(guiche) {
    setErro('');
    setSucesso('');
    const novoEstado = guiche.estado_gui === 'ABERTO' ? 'FECHADO' : 'ABERTO';

    try {
      await alterarEstadoGuiche(guiche.id_gui, novoEstado);
      setSucesso(
        `Guichê ${String(guiche.numero_guiche).padStart(2, '0')} alterado para ${novoEstado}.`
      );
      carregarDados();
    } catch (err) {
      setErro(err.message);
    }
  }

  async function handleEncerrarExpediente() {
    const confirmar = window.confirm(
      'Deseja encerrar o expediente agora? As senhas que permaneceram aguardando na fila serão descartadas (atendimentos em andamento serão mantidos).'
    );
    if (!confirmar) return;

    setErro('');
    setSucesso('');
    try {
      const resultado = await encerrarExpediente();
      const qtdDescartadas = resultado.descartadas ?? 0;
      const qtdEmAtendimento = resultado.emAtendimento ?? 0;

      setSucesso(
        `Expediente encerrado! ${qtdDescartadas} senha(s) aguardando na fila foram descartadas.` +
          (qtdEmAtendimento > 0
            ? ` Atenção: ${qtdEmAtendimento} atendimento(s) em andamento devem ser finalizados.`
            : '')
      );
    } catch (err) {
      setErro(err.message);
    }
  }

  return (
    <div className="adm-container">
      <header className="adm-header">
        <div>
          <h1>Painel do Gestor</h1>
          <p>Cadastro de atendentes, controle de guichês e encerramento de expediente (07h às 17h).</p>
        </div>

        <button
          type="button"
          className="btn-encerrar-expediente"
          onClick={handleEncerrarExpediente}
        >
          Encerrar Expediente e Descartar Fila
        </button>
      </header>

      {!dentroDoExpediente && (
        <div className="adm-alerta-expediente">
          <strong>Fora do horário de expediente (07h00 às 17h00):</strong> Novas senhas não podem ser emitidas. Atendimentos iniciados devem ser concluídos e a fila remanescente descartada.
        </div>
      )}

      {sucesso && <div className="adm-msg-sucesso">{sucesso}</div>}

      {erro && (
        <div className="adm-msg-erro">
          <span>{erro}</span>
          <button type="button" className="btn-tentar-novamente" onClick={carregarDados}>
            Tentar novamente
          </button>
        </div>
      )}

      {carregando ? (
        <div className="adm-loading">Carregando dados administrativos...</div>
      ) : (
        <div className="adm-grid">
          <section className="adm-card">
            <h2>Cadastrar Atendente / Gestor</h2>
            <form onSubmit={handleCadastrarUsuario} className="adm-form">
              <input
                type="text"
                placeholder="Nome completo *"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                maxLength={100}
                required
              />
              <input
                type="text"
                placeholder="Login de acesso *"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                maxLength={30}
                required
              />
              <input
                type="password"
                placeholder="Senha *"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
              />
              <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
                <option value="ATENDENTE">Perfil: Atendente</option>
                <option value="GESTOR">Perfil: Gestor</option>
              </select>
              <button type="submit" className="btn-primario">
                Cadastrar Usuário
              </button>
            </form>

            <h3>Usuários Cadastrados ({usuarios.length})</h3>
            {usuarios.length === 0 ? (
              <p className="adm-vazio">Nenhum usuário cadastrado no banco de dados.</p>
            ) : (
              <ul className="adm-lista">
                {usuarios.map((u) => (
                  <li key={u.id_usu || u.login}>
                    <div>
                      <strong>{u.nome}</strong>
                      <span className="adm-subtexto"> — @{u.login}</span>
                    </div>
                    <span className={`badge-perfil ${u.tipo === 'GESTOR' ? 'gestor' : ''}`}>
                      {u.tipo}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="adm-card">
            <h2>Gerenciar Guichês</h2>
            <form onSubmit={handleCadastrarGuiche} className="adm-form">
              <input
                type="number"
                min="1"
                placeholder="Número do guichê (ex: 1, 2, 3) *"
                value={numeroGuiche}
                onChange={(e) => setNumeroGuiche(e.target.value)}
                required
              />
              <button type="submit" className="btn-primario">
                Adicionar Guichê
              </button>
            </form>

            <h3>Guichês Registrados ({guiches.length})</h3>
            {guiches.length === 0 ? (
              <p className="adm-vazio">Nenhum guichê cadastrado.</p>
            ) : (
              <ul className="adm-lista">
                {guiches.map((g) => (
                  <li key={g.id_gui || g.numero_guiche}>
                    <strong>Guichê {String(g.numero_guiche).padStart(2, '0')}</strong>
                    <div className="adm-acoes-item">
                      <span
                        className={`badge-guiche ${
                          g.estado_gui === 'ABERTO' ? 'aberto' : 'fechado'
                        }`}
                      >
                        {g.estado_gui}
                      </span>
                      <button
                        type="button"
                        className="btn-alternar"
                        onClick={() => handleAlternarGuiche(g)}
                      >
                        {g.estado_gui === 'ABERTO' ? 'Fechar' : 'Abrir'}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}