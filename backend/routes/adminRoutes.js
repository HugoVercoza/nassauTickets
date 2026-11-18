const express = require("express");
const router = express.Router();
const {
  listarUsuarios,
  cadastrarUsuario,
  listarGuiches,
  cadastrarGuiche,
  alterarEstadoGuiche,
  encerrarExpediente,
} = require("../controllers/adminController");

router.get("/usuarios", listarUsuarios);
router.post("/usuarios", cadastrarUsuario);

router.get("/guiches", listarGuiches);
router.post("/guiches", cadastrarGuiche);
router.patch("/guiches/:id/estado", alterarEstadoGuiche);

router.patch("/senhas/encerrar-expediente", encerrarExpediente);

module.exports = router;