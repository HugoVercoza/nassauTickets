require('dotenv').config();
const { criarApp } = require('./app');
const PORT = process.env.PORT || 3000;
criarApp().listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
