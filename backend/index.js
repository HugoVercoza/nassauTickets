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
const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
