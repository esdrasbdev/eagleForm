require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = 3000;

// Middleware de Autenticação Básica
const authMiddleware = (req, res, next) => {
    // Verifica se a rota é protegida
    if (req.path === '/admin.html' || req.path === '/api/participants') {
        const auth = { login: 'admin', password: 'eagle123' }; // Defina sua senha aqui
        const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
        const [login, password] = Buffer.from(b64auth, 'base64').toString().split(':');

        if (login && password && login === auth.login && password === auth.password) {
            return next();
        }

        res.set('WWW-Authenticate', 'Basic realm="401"');
        return res.status(401).send('Autenticação necessária para acessar esta área.');
    }
    next();
};

// Middlewares
app.use(bodyParser.json());
app.use(authMiddleware); // Aplica a proteção antes de servir os arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Rota para salvar inscrição
app.post('/api/register', async (req, res) => {
    const { name, matricula, turma, phone, email } = req.body;

    if (!name || !email) {
        return res.status(400).json({ error: 'Nome e E-mail são obrigatórios.' });
    }

    // Sintaxe PostgreSQL: usa $1, $2... e RETURNING id para obter o ID gerado
    const sql = `INSERT INTO participants (name, matricula, turma, phone, email) VALUES ($1, $2, $3, $4, $5) RETURNING id`;
    const params = [name, matricula, turma, phone, email];

    try {
        const result = await db.query(sql, params);
        res.json({ message: 'Inscrição realizada com sucesso!', id: result.rows[0].id });
    } catch (err) {
        // Código de erro 23505 é violação de unicidade no Postgres
        if (err.code === '23505') {
            return res.status(400).json({ error: 'Este e-mail já está cadastrado.' });
        }
        return res.status(500).json({ error: err.message });
    }
});

// Rota para listar participantes (Área Admin)
app.get('/api/participants', async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM participants ORDER BY created_at DESC");
        res.json({ data: result.rows });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
