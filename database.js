const { Pool } = require('pg');


// Em produção, NUNCA use credenciais hardcoded.
// Se a variável de ambiente não existir, usamos uma string vazia para forçar o erro ou configuração manual segura.
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error('❌ ERRO: DATABASE_URL não definida. Crie o arquivo .env (local) ou configure na Vercel.');
}

const pool = new Pool({
    connectionString,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 10000 // Espera 10 segundos antes de dar erro de timeout
});

if (process.env.DATABASE_URL) {
    // Mascara a senha para não vazar no log, mas mostra que tentou conectar
    const maskedUrl = process.env.DATABASE_URL.replace(/:([^:@]+)@/, ':****@');
    console.log(`🔌 Tentando conectar ao Neon: ${maskedUrl}`);
} else {
    console.log('💻 Conectado ao banco de dados local.');
}


const initDb = async () => {
    try {
        await pool.query(`CREATE TABLE IF NOT EXISTS teams (
            id SERIAL PRIMARY KEY,
            team_name TEXT NOT NULL,
            members JSONB NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);
        console.log('Banco de dados PostgreSQL conectado e tabela TEAMS verificada.');
    } catch (err) {
        console.error('Erro ao conectar ao banco de dados:', err);
    }
};

// A verificação da tabela em cada inicialização pode causar timeouts na Vercel.
// É melhor garantir que a tabela exista executando o SQL manualmente uma vez.
// initDb();

module.exports = pool;
