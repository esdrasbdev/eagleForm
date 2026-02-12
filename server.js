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
app.use(helmet({
    contentSecurityPolicy: false, // Permite carregar scripts/estilos de CDNs externos (AOS, Google Fonts, etc.)
}));
app.use(cors());   // Configura CORS (Cross-Origin Resource Sharing)

// Rate Limiting: Limita requisições para evitar abuso/DDoS
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // Limite de 100 requisições por IP
    message: 'Muitas requisições criadas a partir deste IP, por favor tente novamente mais tarde.'
});

// Aplica o limitador APENAS nas rotas de API para não bloquear scripts/css/imagens
app.use('/api', limiter);

// Middlewares
app.use(bodyParser.json());

// Middleware de Autenticação - agora mais simples, aplicado apenas onde necessário
const authMiddleware = (req, res, next) => {
    // Remove espaços em branco acidentais das variáveis de ambiente e garante que sejam strings
    const envUser = (process.env.ADMIN_USER || '').trim();
    const envPass = (process.env.ADMIN_PASS || '').trim();

    const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
    const decoded = Buffer.from(b64auth, 'base64').toString();
    
    // Separa login e senha corretamente (mesmo se a senha tiver ':')
    const separatorIndex = decoded.indexOf(':');
    const login = separatorIndex > -1 ? decoded.substring(0, separatorIndex) : '';
    const password = separatorIndex > -1 ? decoded.substring(separatorIndex + 1) : '';

    if (login && password && login === envUser && password === envPass) {
        // Previne o cache da página de admin mesmo após o login
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        return next();
    }

    // Logs detalhados para debug na Vercel (mostra o tamanho para não vazar a senha real)
    console.warn(`⚠️ Falha de autenticação.`);
    console.warn(`   Recebido: User="${login}", TamanhoSenha=${password.length}`);
    console.warn(`   Esperado: User="${envUser}", TamanhoSenha=${envPass.length}`);

    res.set('WWW-Authenticate', 'Basic realm="401"');
    return res.status(401).send('Autenticação necessária para acessar esta área.');
};

// Rota da página de admin (AGORA PÚBLICA, mas sem dados)
// Removemos o authMiddleware daqui para carregar o HTML com o Modal de Login
app.get(['/admin.html', '/Admin.html', '/admin'], (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Rota para salvar inscrição
app.post('/api/register', async (req, res) => {
    const { teamName, members } = req.body;

    if (!teamName || !members || members.length !== 5) {
        return res.status(400).json({ error: 'É necessário um nome de time e exatamente 5 integrantes.' });
    }

    // 1. Validação de Limites de Caracteres (Backend)
    if (teamName.length > 100) return res.status(400).json({ error: 'Nome do time muito longo (máx 100 caracteres).' });

    for (const member of members) {
        if (!member.name || member.name.length > 100) return res.status(400).json({ error: `Nome inválido para ${member.name || 'um integrante'} (máx 100 caracteres).` });
        if (!member.matricula || member.matricula.length > 20) return res.status(400).json({ error: `Matrícula inválida para ${member.name} (máx 20 caracteres).` });
        if (!member.email || member.email.length > 100) return res.status(400).json({ error: `Email inválido para ${member.name} (máx 100 caracteres).` });
        if (member.phone && member.phone.length > 20) return res.status(400).json({ error: `Telefone inválido para ${member.name} (máx 20 caracteres).` });
    }

    // 2. Validação de Duplicidade no Banco de Dados
    // Verifica se algum email ou matrícula já existe dentro do JSON de qualquer time
    const emails = members.map(m => m.email);
    const matriculas = members.map(m => m.matricula);

    const duplicateCheckSql = `
        SELECT member->>'name' as name, member->>'email' as email, member->>'matricula' as matricula
        FROM teams, jsonb_array_elements(members) as member
        WHERE member->>'email' = ANY($1)
           OR member->>'matricula' = ANY($2)
        LIMIT 1;
    `;

    try {
        const dupResult = await db.query(duplicateCheckSql, [emails, matriculas]);
        if (dupResult.rows.length > 0) {
            const dup = dupResult.rows[0];
            return res.status(400).json({ error: `O participante ${dup.name} já está inscrito (Email: ${dup.email} ou Matrícula: ${dup.matricula}).` });
        }
    } catch (err) {
        console.error('Erro ao verificar duplicidade:', err);
        return res.status(500).json({ error: 'Erro interno ao validar dados.' });
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

            // Formata a lista de membros para o e-mail (Layout em Cards para não cortar no celular)
            const membersListHtml = members.map((m, i) => 
                `<div style="background-color: #f8f9fa; padding: 15px; margin-bottom: 10px; border-radius: 8px; border-left: 5px solid ${i === 0 ? '#007bff' : '#6c757d'};">
                    <p style="margin: 0 0 5px 0; color: ${i === 0 ? '#007bff' : '#555'}; font-weight: bold; text-transform: uppercase; font-size: 12px;">
                        ${i === 0 ? '👑 Líder da Equipe' : `👤 Integrante ${i+1}`}
                    </p>
                    <p style="margin: 0 0 5px 0; font-size: 16px; font-weight: bold; color: #333;">${m.name}</p>
                    <p style="margin: 0; font-size: 14px; color: #555; line-height: 1.5;">
                        📧 <a href="mailto:${m.email}" style="color: #007bff; text-decoration: none;">${m.email}</a><br>
                        🆔 Matrícula: <strong>${m.matricula}</strong><br>
                        📱 Telefone: <strong>${m.phone || 'N/A'}</strong>
                    </p>
                 </div>`
            ).join('');

            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: process.env.EMAIL_TO || process.env.EMAIL_USER, // Envia para o email configurado ou para si mesmo
                subject: `🦅 Nova Inscrição: Time ${teamName}`,
                html: `
                    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h1 style="color: #0a192f; margin: 0;">🦅 Nova Inscrição</h1>
                            <p style="font-size: 18px; color: #666;">Equipe: <strong style="color: #007bff;">${teamName}</strong></p>
                        </div>
                        
                        <div style="background-color: #fff; border-radius: 8px;">
                            ${membersListHtml}
                        </div>

                        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #999;">
                            <p>Este é um e-mail automático do sistema Eagle Event.</p>
                        </div>
                    </div>
                `
            };

            // Envia o e-mail sem travar a resposta da API se falhar
            transporter.sendMail(mailOptions)
                .then(info => console.log(`📧 E-mail de notificação enviado: ${info.response}`))
                .catch(err => console.error("❌ Erro ao enviar email:", err));
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

// Rota utilitária para resetar a contagem de IDs (Use após apagar inscrições)
app.get('/api/reset-sequence', authMiddleware, async (req, res) => {
    try {
        // Ajusta a sequência para o maior ID existente ou reinicia em 1 se vazio
        await db.query(`
            SELECT setval(
                pg_get_serial_sequence('teams', 'id'),
                COALESCE((SELECT MAX(id) FROM teams), 0) + 1,
                false
            )
        `);
        res.json({ message: 'Contagem de IDs ajustada com sucesso! O próximo time será o número correto.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao ajustar sequência.' });
    }
});

// Rota de Diagnóstico: Testar conexão com o Banco
app.get('/api/db-check', async (req, res) => {
    try {
        const result = await db.query('SELECT NOW() as time');
        res.json({ status: 'online', message: 'Conexão com Neon bem-sucedida!', server_time: result.rows[0].time });
    } catch (err) {
        res.status(500).json({ status: 'offline', error: err.message, hint: 'Verifique se a DATABASE_URL está correta no .env ou Vercel.' });
    }
});

// Rota de Diagnóstico: Testar credenciais de E-mail
app.get('/api/email-check', async (req, res) => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        return res.status(500).json({ status: 'offline', error: 'Variáveis de ambiente de e-mail não configuradas.' });
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });

    try {
        await transporter.verify();
        res.json({ status: 'online', message: 'Conexão SMTP com Gmail bem-sucedida! O envio está funcionando.' });
    } catch (error) {
        res.status(500).json({ status: 'error', error: error.message, hint: 'Verifique se a Senha de App está correta.' });
    }
});

// Servir arquivos estáticos da pasta 'public' (index.html, style.css, imagens)
// Colocado no final para garantir que todas as rotas de API acima tenham prioridade
app.use(express.static(path.join(__dirname, 'public')));

// Iniciar servidor
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Servidor rodando em http://localhost:${PORT}`);
        if (process.env.EMAIL_USER) console.log('📧 Sistema de e-mail configurado.');
        else console.warn('⚠️  Sistema de e-mail NÃO configurado.');
    });
}

module.exports = app;
