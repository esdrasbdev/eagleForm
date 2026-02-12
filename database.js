const { Pool } = require('pg');


// Em produção, NUNCA use credenciais hardcoded.
// Se a variável de ambiente não existir, usamos uma string vazia para forçar o erro ou configuração manual segura.
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.warn('⚠️  ATENÇÃO: DATABASE_URL não definida. O banco de dados pode não conectar em produção.');
}

const pool = new Pool({
    connectionString,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false 
});

if (process.env.DATABASE_URL) {
    console.log('🔌 Conectado ao banco de dados na nuvem (Neon Tech).');
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

initDb();

module.exports = pool;
