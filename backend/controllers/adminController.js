const bcrypt = require("bcryptjs");
const db = require("../config/database");

async function listarUsuarios(_req, res) {
  try {
    const [rows] = await db.query(
      "SELECT id_usu, nome, login, tipo FROM usuarios ORDER BY id_usu DESC"
    );
    return res.json({ usuarios: rows });
  } catch (erro) {
    return res.status(500).json({ erro: "Erro ao listar usuários: " + erro.message });
  }
}

async function cadastrarUsuario(req, res) {
  const { nome, login, senha, tipo } = req.body || {};

  if (!nome || !login || !senha) {
    return res.status(400).json({ erro: "Nome, login e senha são obrigatórios." });
  }

  const perfilValido = ["ATENDENTE", "GESTOR"].includes(tipo) ? tipo : "ATENDENTE";

  try {
    const senha_hash = await bcrypt.hash(String(senha), 10);
    const [result] = await db.query(
      "INSERT INTO usuarios (nome, login, senha_hash, tipo) VALUES (?, ?, ?, ?)",
      [nome.trim(), login.trim(), senha_hash, perfilValido]
    );

    return res.status(201).json({
      usuario: {
        id_usu: result.insertId,
        nome: nome.trim(),
        login: login.trim(),
        tipo: perfilValido,
      },
    });
  } catch (erro) {
    if (erro.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ erro: "Este login já está cadastrado." });
    }
    return res.status(500).json({ erro: "Erro ao cadastrar usuário: " + erro.message });
  }
}

async function listarGuiches(_req, res) {
  try {
    const [rows] = await db.query(
      "SELECT id_gui, numero_guiche, estado_gui FROM guiches ORDER BY numero_guiche ASC"
    );
    return res.json({ guiches: rows });
  } catch (erro) {
    return res.status(500).json({ erro: "Erro ao listar guichês: " + erro.message });
  }
}

async function cadastrarGuiche(req, res) {
  const numero = Number(req.body?.numero_guiche);

  if (!numero || numero < 1) {
    return res.status(400).json({ erro: "Número do guichê inválido." });
  }

  const estado = ["ABERTO", "FECHADO"].includes(req.body?.estado_gui)
    ? req.body.estado_gui
    : "ABERTO";

  try {
    const [result] = await db.query(
      "INSERT INTO guiches (numero_guiche, estado_gui) VALUES (?, ?)",
      [numero, estado]
    );

    return res.status(201).json({
      guiche: {
        id_gui: result.insertId,
        numero_guiche: numero,
        estado_gui: estado,
      },
    });
  } catch (erro) {
    return res.status(500).json({ erro: "Erro ao cadastrar guichê: " + erro.message });
  }
}

async function alterarEstadoGuiche(req, res) {
  const { estado_gui } = req.body || {};

  if (!["ABERTO", "FECHADO"].includes(estado_gui)) {
    return res.status(400).json({ erro: "Estado inválido. Use ABERTO ou FECHADO." });
  }

  try {
    const [result] = await db.query(
      "UPDATE guiches SET estado_gui = ? WHERE id_gui = ?",
      [estado_gui, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ erro: "Guichê não encontrado." });
    }

    return res.json({ mensagem: "Estado atualizado com sucesso.", estado_gui });
  } catch (erro) {
    return res.status(500).json({ erro: "Erro ao atualizar guichê: " + erro.message });
  }
}

async function encerrarExpediente(req, res) {
  try {
    let descartadasMemoria = 0;
    let emAtendimentoMemoria = 0;

    // 1. Atualiza o runtime em memória (dados-runtime.json)
    if (req.runtimeSenhas && Array.isArray(req.runtimeSenhas.senhas)) {
      req.runtimeSenhas.senhas.forEach((s) => {
        if (["EMITIDA", "AGUARDANDO"].includes(s.estado)) {
          s.estado = "NAO_COMPARECEU";
          s.dataFinalizacao = new Date().toISOString();
          descartadasMemoria++;
        } else if (s.estado === "EM_ATENDIMENTO") {
          emAtendimentoMemoria++;
        }
      });
      if (typeof req.runtimeSenhas.persistir === "function") {
        req.runtimeSenhas.persistir();
      }
    }

    // 2. Sincroniza com o MySQL se estiver ativo (com fallback se estiver offline)
    let descartadasBanco = 0;
    let emAtendimentoBanco = null;

    try {
      const [updateResult] = await db.query(
        "UPDATE senhas SET estado = 'NÃO_COMPARECEU', data_finalizacao = NOW() WHERE estado IN ('EMITIDA', 'AGUARDANDO')"
      );
      const [emAtendRows] = await db.query(
        "SELECT COUNT(*) AS total FROM senhas WHERE estado = 'EM_ATENDIMENTO'"
      );
      descartadasBanco = updateResult.affectedRows || 0;
      emAtendimentoBanco = emAtendRows[0]?.total ?? 0;
    } catch {
      // Banco indisponível: mantém o resultado processado em memória
    }

    return res.json({
      mensagem: "Expediente encerrado e senhas aguardando descartadas.",
      descartadas: Math.max(descartadasBanco, descartadasMemoria),
      emAtendimento: emAtendimentoBanco !== null ? emAtendimentoBanco : emAtendimentoMemoria,
    });
  } catch (erro) {
    return res.status(500).json({ erro: "Erro ao encerrar expediente: " + erro.message });
  }
}

module.exports = {
  listarUsuarios,
  cadastrarUsuario,
  listarGuiches,
  cadastrarGuiche,
  alterarEstadoGuiche,
  encerrarExpediente,
};