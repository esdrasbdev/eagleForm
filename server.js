require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const db = require('./database');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = 3000;

// Verifica se as variáveis de admin estão definidas
if (!process.env.ADMIN_USER || !process.env.ADMIN_PASS) {
    console.warn('⚠️  ATENÇÃO: ADMIN_USER ou ADMIN_PASS não definidos. A área administrativa pode estar vulnerável.');
}

// Necessário para Vercel/Heroku/Proxies para que o rate limit funcione corretamente
app.set('trust proxy', 1);

// Configurações de Segurança
app.use(helmet()); // Adiciona headers de segurança HTTP
app.use(cors());   // Configura CORS (Cross-Origin Resource Sharing)

// Rate Limiting: Limita requisições para evitar abuso/DDoS
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // Limite de 100 requisições por IP
    message: 'Muitas requisições criadas a partir deste IP, por favor tente novamente mais tarde.'
});

// Aplica o limitador em todas as rotas
app.use(limiter);

// Middleware de Autenticação Básica
const authMiddleware = (req, res, next) => {
    const requestPath = req.path.toLowerCase();

    // Verifica se a rota é protegida (inclui /admin e ignora maiúsculas/minúsculas)
    if (requestPath === '/admin.html' || requestPath === '/admin' || requestPath === '/api/participants') {
        // Força o navegador a não fazer cache da página de admin
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');

        const auth = { 
             login: process.env.ADMIN_USER, 
            password: process.env.ADMIN_PASS 
        }; 
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
        console.error(err); // Loga o erro no servidor, mas não envia para o cliente
        return res.status(500).json({ error: 'Erro interno ao processar inscrição.' });
    }
});

// Rota para listar participantes (Área Admin)
app.get('/api/participants', async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM participants ORDER BY created_at DESC");
        res.json({ data: result.rows });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Erro ao buscar participantes.' });
    }
});

// Iniciar servidor
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Servidor rodando em http://localhost:${PORT}`);
    });
}

module.exports = app;
