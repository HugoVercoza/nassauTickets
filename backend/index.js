const conexao = require('./config/database');
const bcrypt = require('bcryptjs');
const express = require('express');
const app = express();
app.use(express.json());
const cors = require('cors');
app.use(cors());

app.get('/', (req, res) => {
    res.json({
        mensagem: 'Backend NassauTickets funcionando!'
    });
});
app.post('/login', async (req, res) => {
    try {
        const { login, senha } = req.body;

        const [usuarios] = await conexao.query(
            'SELECT * FROM usuarios WHERE login = ?',
            [login]
        );

        if (usuarios.length === 0) {
            return res.status(401).json({
                message: 'Usuário ou senha incorretos'
            });
        }

        const usuario = usuarios[0];

        const senhaCorreta = await bcrypt.compare(
            senha,
            usuario.senha_hash
        );

        if (!senhaCorreta) {
            return res.status(401).json({
                message: 'Usuário ou senha incorretos'
            });
        }

        res.json({
            message: 'Login realizado!',
            usuario: {
                id: usuario.id_usu,
                nome: usuario.nome,
                login: usuario.login,
                tipo: usuario.tipo
            }
        });

    } catch (erro) {
        console.error(erro);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});
const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
