const { Pool } = require('pg');

// Configuração da conexão com PostgreSQL
// Em produção, a variável de ambiente DATABASE_URL será fornecida automaticamente pelo host (Render, Railway, etc)
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:senha@localhost:5432/eagle_event';

const pool = new Pool({
    connectionString,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false // SSL necessário para produção
});

if (process.env.DATABASE_URL) {
    console.log('🔌 Conectado ao banco de dados na nuvem (Neon Tech).');
} else {
    console.log('💻 Conectado ao banco de dados local.');
}

// Inicializa o banco de dados
const initDb = async () => {
    try {
        await pool.query(`CREATE TABLE IF NOT EXISTS participants (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            matricula TEXT,
            turma TEXT,
            phone TEXT,
            email TEXT NOT NULL UNIQUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);
        console.log('Banco de dados PostgreSQL conectado e tabela verificada.');
    } catch (err) {
        console.error('Erro ao conectar ao banco de dados:', err);
    }
};

initDb();

module.exports = pool;
