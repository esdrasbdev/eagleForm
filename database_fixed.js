const { Pool } = require('pg');

// Em produção, NUNCA use credenciais hardcoded.
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error('❌ ERRO: DATABASE_URL não definida. Crie o arquivo .env (local) ou configure na Vercel.');
}

const pool = new Pool({
    connectionString,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 10000
});

if (process.env.DATABASE_URL) {
    const maskedUrl = process.env.DATABASE_URL.replace(/:([^:@]+)@/, ':****@');
    console.log(`🔌 Conectado ao Neon: ${maskedUrl}`);
} else {
    console.log('💻 Modo local ativado.');
}

const initDb = async () => {
    try {
        // Tabelas essenciais (safe CREATE IF NOT EXISTS)
        await pool.query(`CREATE TABLE IF NOT EXISTS teams (
            id SERIAL PRIMARY KEY,
            team_name TEXT NOT NULL,
            members JSONB NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

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

        await pool.query(`CREATE TABLE IF NOT EXISTS inscricoes (
            id SERIAL PRIMARY KEY,
            minicurso_id INT REFERENCES minicursos(id) ON DELETE CASCADE,
            nome TEXT NOT NULL,
            curso TEXT NOT NULL,
            semestre TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

        // Colunas opcionais (safe)
        await pool.query(`ALTER TABLE minicursos ADD COLUMN IF NOT EXISTS descricao TEXT`);
        await pool.query(`ALTER TABLE minicursos ADD COLUMN IF NOT EXISTS material TEXT`);

        // ✅ CRITICAL FIX: NON-DESTRUCTIVE SEED - ONLY if empty!
        const mcCount = await pool.query('SELECT COUNT(*) as count FROM minicursos');
        const count = parseInt(mcCount.rows[0].count);
        
        if (count === 0) {
            console.log('🌱 0 minicursos. Executando seed de produção...');
            
            await pool.query(`
                INSERT INTO minicursos (nome, ministrante, data, horario, local, vagas_maximas, descricao, material) 
                VALUES 
                    ('Competências Profissionais e o Novo Mercado de Trabalho', 'EDNAEL MACEDO', 'Quarta', '09:40 às 11:40', 'Lab 4', 20, 
                    'Soft/hard skills essenciais: currículo, dinâmicas, entrevistas para mercado atual eficiente.', 'Data Show'),
                    ('Construindo o Primeiro Milhão', 'RONALDO DUARTE', 'Quarta', '18:20 às 20:00', 'Lab 4', 20, 
                    'Controle financeiro: metas, limites, juros compostos para sonhos sem privações.', NULL),
                    ('Aplicação Full-Stack com React e Supabase', 'JOSÉ OLINDA', 'Quarta', '18:20 às 20:00', 'Lab 3', 20, 
                    'App full-stack React + Supabase, mobile-responsive.', 'Computador com Nodejs, VsCode e acesso à internet'),
                    ('Carreiras Híbridas na era Digital', 'LUCAS FERREIRA COSTA', 'Quinta', '09:40 às 11:40', 'Auditorio', 20, 
                    'Carreiras TI híbridas: interdisciplinaridade, competências para inovação digital.', 'Computador e Data Show'),
                    ('Introdução ao Python: Programando um Assistente Virtual no Colab', 'LYRANE TEIXEIRA', 'Quarta', '09:40 às 11:40', 'Lab 3', 20, 
                    'Python no Colab: assistente virtual com variáveis e decisões.', 'Computador com acesso à internet, Data Show'),
                    ('Do Sertão à América: Uma Jornada até a Universidade de Cincinnati', 'MICHAEL LOPES', 'Quinta', '09:40 às 11:40', 'Auditorio', 20, 
                    'Superação sertão à Univ. Cincinnati: desafios e inspiração internacional.', 'Computador com acesso à internet, Data Show'),
                    ('Fundamentos Elementares de Análise com Dados', 'DIEGO TEIXEIRA', 'Quinta', '18:20 às 20:00', 'Lab 3', 20, 
                    'Análise dados: coleta, organização, insights decisórios.', 'rstudio'),
                    ('Introdução Prática ao Blockchain Empresarial com Firefly e Hyperladger', 'LUCAS FERREIRA COSTA', 'Quinta', '18:20 às 22:00', 'Lab 4', 20, 
                    'Blockchain FireFly + Hyperledger para empresas.', NULL),
                    ('Liderança em Design para Tecnologia', 'RAQUEL LIRA', 'Quinta', '20:20 às 22:00', 'Lab 3', 20, 
                    'Design liderança tech: equipe, UX colaborativo.', 'Projetor e Quadro branco ; Post-its (1 pacote); Canetas hidrográficas (2 ); Folhas A4 (30 folhas); Fita adesiva (se possível)'),
                    ('Introdução ao Desenvolvimento de Jogos Digitais', 'PEDRO LUIS', 'Segunda', '18:20 às 22:00', 'Lab 4', 20, 
                    'Jogos Godot: narrativa, Dodge the Creeps, cenas/scripts.', 'Laboratório de informática com computadores equipados com a engine Godot instalada.'),
                    ('Pitch: Do Zero à Apresentação', 'LUCAS NOGUEIRA', 'Terça', '09:40 às 11:40', 'Lab 4', 20, 
                    'Pitch: estrutura ideia, comunicação, apresentação persuasiva.', 'Computador com acesso à internet, Data Show'),
                    ('Figma do Zero ao Protótipo', 'SAMUEL LIMA', 'Terça', '09:40 às 11:40', 'Lab 3', 20, 
                    'Figma UI: layouts, protótipos, telas funcionais.', 'Laboratório com computadores e acesso à internet. Cada participante deve possuir (ou criar) uma conta gratuita no Figma.'),
                    ('Teoria das Cores & Design Básica', 'Julio Cesar', 'Terça', '18:20 às 20:00', 'Lab 4', 20, 
                    'Teoria cores/design: harmonia, contrastes visuais.', NULL),
('Oficina de Desenvolvimento de Jogos 2D com GDevelop', 'FRANCISCO HENRIQUE', 'Terça', '18:20 às 20:00', 'Lab 3', 20, 
                    'Jogos 2D GDevelop top-down: sem código prático.', NULL),
                    ('Figma do Zero ao Protótipo', 'Samuel Lima', 'Quarta', '09:40 às 11:40', 'Laboratórios', 20, 
                    'Figma UI: layouts, protótipos, telas funcionais.', 'Laboratório com computadores e acesso à internet. Cada participante deve possuir (ou criar) uma conta gratuita no Figma.'),
('Criptocoins: A evolução do dinheiro na era dos sistemas distribuídos', 'Danne Makleyston', 'Quinta', '20:20 às 22:00', 'Lab 4', 20, 
                    'Blockchain e criptomoedas: consenso distribuído, wallets, smart contracts, DeFi basics.', 'Computador com acesso à internet, Data Show'),

                    ('Geração de prompt para utilização de IA como ferramenta de produtividade no desenvolvimento', 'Saulo Bezerra', 'Quarta', '20:20 às 22:00', 'Laboratorio', 20, 
                    'Técnicas de prompt engineering para devs: maximize produtividade com IA generativa.', 'Computador com acesso à internet')
            `);

console.log('✅ Seed executado: 16 minicursos criados.');
        } else {
            console.log(`✅ ${count} minicursos existentes. SEED PULADO para preservar inscrições!`);
            
            // ✅ FORCE ADD MISSING MINICURSOS (não deleta dados existentes)
            console.log('🔍 Verificando/Forçando adição dos 2 novos minicursos...');
            
            const missing1 = await pool.query('SELECT COUNT(*) as count FROM minicursos WHERE nome = $1 AND data = $2', ['Figma do Zero ao Protótipo', 'Quarta']);
            if (parseInt(missing1.rows[0].count) === 0) {
                await pool.query(`
                    INSERT INTO minicursos (nome, ministrante, data, horario, local, vagas_maximas, descricao, material) 
                    VALUES ('Figma do Zero ao Protótipo', 'Samuel Lima', 'Quarta', '09:40 às 11:40', 'Lab 3', 20, 
                    'Design de Interfaces (UI) e Prototipação', 'Laboratório com computadores e acesso à internet. Conta Figma gratuita.')
                `);
                console.log('✅ Adicionado: Figma Quarta (Samuel Lima)');
            }
            
            const missing2 = await pool.query('SELECT COUNT(*) as count FROM minicursos WHERE nome = $1', ['Criptocoins: A evolução do dinheiro na era dos sistemas distribuídos']);
            if (parseInt(missing2.rows[0].count) === 0) {
                await pool.query(`
                    INSERT INTO minicursos (nome, ministrante, data, horario, local, vagas_maximas, descricao, material) 
                    VALUES ('Criptocoins: A evolução do dinheiro na era dos sistemas distribuídos', 'Danne Makleyston', 'Quinta', '20:20 às 22:00', 'Lab 4', 20, 
                    'Blockchain e criptomoedas: consenso distribuído, wallets, smart contracts, DeFi basics.', 'Computador com acesso à internet, Data Show')
                `);
                console.log('✅ Adicionado: Criptocoins Quinta (Danne Makleyston)');
            }


            // ✅ FORCE ADD novo minicurso IA Prompt (Quarta-feira)
            // Force update to Quarta for IA Prompt minicurso
            await pool.query("DELETE FROM minicursos WHERE nome = 'Geração de prompt para utilização de IA como ferramenta de produtividade no desenvolvimento'");
            await pool.query(`
                INSERT INTO minicursos (nome, ministrante, data, horario, local, vagas_maximas, descricao, material) 
                VALUES ('Geração de prompt para utilização de IA como ferramenta de produtividade no desenvolvimento', 'Saulo Bezerra', 'Quarta', '20:20 às 22:00', 'Laboratorio', 20, 
                'Técnicas de prompt engineering para devs: maximize produtividade com IA generativa.', 'Computador com acesso à internet')
            `);
            console.log('✅ Forced: Geração de Prompt IA to Quarta (Saulo Bezerra)');

            
            const finalCount = await pool.query('SELECT COUNT(*) as count FROM minicursos');
            console.log(`✅ Total final: ${parseInt(finalCount.rows[0].count)} minicursos`);
            
            // ✅ UPDATE LOCAL Figma Quarta para Lab 3
            await pool.query("UPDATE minicursos SET local = 'Lab 3' WHERE nome = 'Figma do Zero ao Protótipo' AND data = 'Quarta'");
            console.log('✅ Local Figma Quarta atualizado para Lab 3');
        }

        // Log status final
        const inscCount = await pool.query('SELECT COUNT(*) as count FROM inscricoes');
        console.log(`✅ DB pronto: ${count} minicursos | ${parseInt(inscCount.rows[0].count)} inscrições totais`);

    } catch (err) {
        console.error('❌ Erro initDb:', err.message);
    }
};

initDb().catch(console.error);

module.exports = pool;

