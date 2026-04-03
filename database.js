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
        // Tabela teams (existente)
        await pool.query(`CREATE TABLE IF NOT EXISTS teams (
            id SERIAL PRIMARY KEY,
            team_name TEXT NOT NULL,
            members JSONB NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

        // Nova tabela minicursos
        await pool.query(`CREATE TABLE IF NOT EXISTS minicursos (
            id SERIAL PRIMARY KEY,
            nome TEXT NOT NULL,
            ministrante TEXT NOT NULL,
            data TEXT NOT NULL,
            horario TEXT NOT NULL,
            local TEXT,
            vagas_maximas INT DEFAULT 20,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

        // Nova tabela inscricoes
        await pool.query(`CREATE TABLE IF NOT EXISTS inscricoes (
            id SERIAL PRIMARY KEY,
            minicurso_id INT REFERENCES minicursos(id) ON DELETE CASCADE,
            nome TEXT NOT NULL,
            curso TEXT NOT NULL,
            semestre TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

        // Clear existing minicursos and seed 15+ real events from user data
        await pool.query('DELETE FROM minicursos');
        
        await pool.query(`
            INSERT INTO minicursos (nome, ministrante, data, horario, local, vagas_maximas) 
            VALUES 
                ('Carreiras Híbridas na era Digital', 'LUCAS FERREIRA COSTA', 'Quinta', '09:40 às 11:40', 'Auditório ou Mini Auditório', 20),
                ('Utilização de Blockchain', 'LUCAS FERREIRA COSTA', 'Quinta', '18:20 às 22:00', 'Laboratórios', 20),
                ('Introdução ao Desenvolvimento de Jogos Digitais', 'PEDRO LUIS', 'Segunda', '18:20 às 20:00 / 20:20 às 22:00', 'Laboratórios', 20),
                ('Competências Profissionais e o Novo Mercado de Trabalho', 'EDNAEL MACEDO', 'Quarta', '09:40 às 11:40', 'Laboratórios / Auditório ou Mini Auditório', 20),
                ('Aplicação Full-Stack com React e Supabase', 'JOSÉ OLINDA', 'Quarta', '18:20 às 20:00 / 20:20 às 22:00', 'Laboratórios', 20),
                ('Pitch: do Zero à Apresentação', 'LUCAS NOGUEIRA', 'Terça', '09:40 às 11:40', 'Auditório ou Mini Auditório / Laboratórios', 20),
                ('Introdução ao python: programando um assistente virtual no Colab', 'LYRANE TEIXEIRA', 'Quinta', '09:40 às 11:40', 'Laboratórios', 20),
                ('Do Sertão à América: uma jornada até a Universidade de Cincinnati', 'MICHAEL LOPES', 'Quinta', '09:40 às 11:40', 'Auditório ou Mini Auditório', 20),
                ('Fundamentos Elementares de Análise com Dados', 'DIEGO TEIXEIRA', 'Quinta', '18:20 às 20:00', 'Laboratórios', 20),
                ('Construindo o primeiro milhão', 'RONALDO DUARTE', 'Quarta', '18:20 às 20:00', 'Laboratórios', 20),
                ('Figma do Zero ao Protótipo', 'SAMUEL LIMA', 'Terça', '09:40 às 11:40', 'Laboratórios', 20),
                ('Liderança em Design para Tecnologia. Subtítulo: Como liderar pessoas, projetos e soluções em Sistemas de Informação', 'RAQUEL LIRA', 'Quinta', '20:20 às 22:00', 'Laboratórios', 20),
                ('Oficina de Desenvolvimento de Jogos 2D com GDevelop', 'FRANCISCO HENRIQUE', 'Terça', '18:20 às 20:00', 'Laboratórios', 20),
                ('TEORIA DAS CORES & DESIGN BÁSICA', 'Julio Cesar', 'Terça', '18:20 às 20:00', 'Laboratórios', 20)
        `);

        console.log('✅ DB inicializado: teams + minicursos(14 real seeded) + inscricoes');
    } catch (err) {
        console.error('❌ Erro initDb:', err.message);
    }
};

initDb().catch(console.error);

module.exports = pool;
