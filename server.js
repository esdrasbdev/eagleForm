require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const db = require('./database');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const nodemailer = require('nodemailer');

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

// Middlewares
app.use(bodyParser.json());

// Middleware de Autenticação - agora mais simples, aplicado apenas onde necessário
const authMiddleware = (req, res, next) => {
    const auth = { login: process.env.ADMIN_USER, password: process.env.ADMIN_PASS };
    const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
    const [login, password] = Buffer.from(b64auth, 'base64').toString().split(':');

    if (login && password && login === auth.login && password === auth.password) {
        // Previne o cache da página de admin mesmo após o login
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        return next();
    }

    res.set('WWW-Authenticate', 'Basic realm="401"');
    return res.status(401).send('Autenticação necessária para acessar esta área.');
};

// Rota para salvar inscrição
app.post('/api/register', async (req, res) => {
    const { teamName, members } = req.body;

    if (!teamName || !members || members.length !== 5) {
        return res.status(400).json({ error: 'É necessário um nome de time e exatamente 5 integrantes.' });
    }

    // Salva o array de membros como JSON no banco
    const sql = `INSERT INTO teams (team_name, members) VALUES ($1, $2) RETURNING id`;
    const params = [teamName, JSON.stringify(members)];

    try {
        const result = await db.query(sql, params);
        
        // --- Lógica de Envio de E-mail ---
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            const transporter = nodemailer.createTransport({
                service: 'gmail', // Ou outro serviço SMTP
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });

            // Formata a lista de membros para o e-mail
            const membersListHtml = members.map((m, i) => 
                `<li><strong>Integrante ${i+1}:</strong> ${m.name} (Mat: ${m.matricula}) - ${m.email} - Tel: ${m.phone || 'N/A'}</li>`
            ).join('');

            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: process.env.EMAIL_TO || process.env.EMAIL_USER, // Envia para o email configurado ou para si mesmo
                subject: `🦅 Nova Inscrição: Time ${teamName}`,
                html: `
                    <h2>Nova equipe inscrita no Eagle Event!</h2>
                    <p><strong>Nome da Equipe:</strong> ${teamName}</p>
                    <h3>Integrantes:</h3>
                    <ul>${membersListHtml}</ul>
                    <p>Verifique o painel administrativo para mais detalhes.</p>
                `
            };

            // Envia o e-mail sem travar a resposta da API se falhar
            transporter.sendMail(mailOptions).catch(err => console.error("Erro ao enviar email:", err));
        }

        res.json({ message: 'Time inscrito com sucesso!', id: result.rows[0].id });
    } catch (err) {
        console.error(err); // Loga o erro no servidor, mas não envia para o cliente
        return res.status(500).json({ error: 'Erro interno ao processar inscrição do time.' });
    }
});

// Rota para listar participantes (Área Admin)
app.get('/api/participants', authMiddleware, async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM teams ORDER BY created_at DESC");
        res.json({ data: result.rows });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Erro ao buscar times.' });
    }
});

// Rota protegida para a página de admin.
// IMPORTANTE: Esta rota intercepta a chamada para /admin.html ANTES do express.static.
app.get('/admin.html', authMiddleware, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Servir arquivos estáticos da pasta 'public' (index.html, style.css, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// Iniciar servidor
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Servidor rodando em http://localhost:${PORT}`);
    });
}

module.exports = app;
