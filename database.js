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
            descricao TEXT,
            material TEXT,
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

        // Add descricao/material columns if not exists (safe for existing data)
        await pool.query(`ALTER TABLE minicursos ADD COLUMN IF NOT EXISTS descricao TEXT`);
        await pool.query(`ALTER TABLE minicursos ADD COLUMN IF NOT EXISTS material TEXT`);
        
        // Clear existing minicursos and seed 14 real events from user data + full descriptions
        await pool.query('DELETE FROM minicursos');
        
        await pool.query(`
            INSERT INTO minicursos (nome, ministrante, data, horario, local, vagas_maximas, descricao, material) 
            VALUES 
                ('Competências Profissionais e o Novo Mercado de Trabalho', 'EDNAEL MACEDO', 'Quarta', '09:40 às 11:40', 'Lab 4', 20, 
'Soft/hard skills essenciais: currículo, dinâmicas, entrevistas para mercado atual eficiente.',
                 'Data Show'),
                ('Construindo o Primeiro Milhão', 'RONALDO DUARTE', 'Quarta', '18:20 às 20:00', 'Lab 4', 20, 
'Controle financeiro: metas, limites, juros compostos para sonhos sem privações.',
                 NULL),
                ('Aplicação Full-Stack com React e Supabase', 'JOSÉ OLINDA', 'Quarta', '18:20 às 20:00', 'Lab 3', 20, 
'App full-stack React + Supabase, mobile-responsive.',
                 'Computador com Nodejs, VsCode e acesso à internet'),
                ('Carreiras Híbridas na era Digital', 'LUCAS FERREIRA COSTA', 'Quinta', '09:40 às 11:40', 'Auditorio', 20, 
'Carreiras TI híbridas: interdisciplinaridade, competências para inovação digital.',
                 'Computador e Data Show'),
                ('Introdução ao Python: Programando um Assistente Virtual no Colab', 'LYRANE TEIXEIRA', 'Quarta', '09:40 às 11:40', 'Lab 3', 20, 
'Python no Colab: assistente virtual com variáveis e decisões.',
                 'Computador com acesso à internet, Data Show'),
                ('Do Sertão à América: Uma Jornada até a Universidade de Cincinnati', 'MICHAEL LOPES', 'Quinta', '09:40 às 11:40', 'Auditorio', 20, 
'Superação sertão à Univ. Cincinnati: desafios e inspiração internacional.',
                 'Computador com acesso à internet, Data Show'),
                ('Fundamentos Elementares de Análise com Dados', 'DIEGO TEIXEIRA', 'Quinta', '18:20 às 20:00', 'Lab 3', 20, 
'Análise dados: coleta, organização, insights decisórios.',
                 'rstudio'),
                ('Introdução Prática ao Blockchain Empresarial com Firefly e Hyperladger', 'LUCAS FERREIRA COSTA', 'Quinta', '18:20 às 22:00', 'Lab 4', 20, 
'Blockchain FireFly + Hyperledger para empresas.',
                 NULL),
                ('Liderança em Design para Tecnologia', 'RAQUEL LIRA', 'Quinta', '20:20 às 22:00', 'Lab 3', 20, 
'Design liderança tech: equipe, UX colaborativo.',
                 'Projetor e Quadro branco ; Post-its (1 pacote); Canetas hidrográficas (2 ); Folhas A4 (30 folhas); Fita adesiva (se possível)'),
                ('Introdução ao Desenvolvimento de Jogos Digitais', 'PEDRO LUIS', 'Segunda', '18:20 às 22:00', 'Lab 4', 20, 
'Jogos Godot: narrativa, Dodge the Creeps, cenas/scripts.',
                 'Laboratório de informática com computadores equipados com a engine Godot instalada.'),
                ('Pitch: Do Zero à Apresentação', 'LUCAS NOGUEIRA', 'Terça', '09:40 às 11:40', 'Lab 4', 20, 
'Pitch: estrutura ideia, comunicação, apresentação persuasiva.',
                 'Computador com acesso à internet, Data Show'),
                ('Figma do Zero ao Protótipo', 'SAMUEL LIMA', 'Terça', '09:40 às 11:40', 'Lab 3', 20, 
'Figma UI: layouts, protótipos, telas funcionais.',
                 'Laboratório com computadores e acesso à internet. Cada participante deve possuir (ou criar) uma conta gratuita no Figma.'),
                ('Teoria das Cores & Design Básica', 'Julio Cesar', 'Terça', '18:20 às 20:00', 'Lab 4', 20, 
'Teoria cores/design: harmonia, contrastes visuais.',
                 NULL),
                ('Oficina de Desenvolvimento de Jogos 2D com GDevelop', 'FRANCISCO HENRIQUE', 'Terça', '18:20 às 20:00', 'Lab 3', 20, 
'Jogos 2D GDevelop top-down: sem código prático.',
                 NULL)
        `);

        console.log('✅ DB inicializado: teams + minicursos(14 real seeded + user specs) + inscricoes');
    } catch (err) {
        console.error('❌ Erro initDb:', err.message);
    }
};

initDb().catch(console.error);

module.exports = pool;

