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
                 'O minicurso abordará as competências de soft skills e hard skills, destacando sua importância no mercado de trabalho atual. Serão trabalhados aspectos técnicos e comportamentais, como elaboração de currículo, estratégias para dinâmicas de grupo e orientações para entrevistas, preparando os participantes para uma atuação profissional mais eficiente e assertiva.', 
                 'Data Show'),
                ('Construindo o Primeiro Milhão', 'RONALDO DUARTE', 'Quarta', '18:20 às 20:00', 'Lab 4', 20, 
                 'Vamos aprender a controlar o nosso dinheiro, estabelecendo metas e limites, mas sem deixar de realizar sonhos com a ajuda da mágica dos juros compostos.', 
                 NULL),
                ('Aplicação Full-Stack com React e Supabase', 'JOSÉ OLINDA', 'Quarta', '18:20 às 20:00', 'Lab 3', 20, 
                 'O minicurso apresentará como desenvolver uma aplicação full-stack completa, integrando o backend com Supabase e o frontend em React, incluindo práticas para adaptação e funcionamento em dispositivos móveis.', 
                 'Computador com Nodejs, VsCode e acesso à internet'),
                ('Carreiras Híbridas na era Digital', 'LUCAS FERREIRA COSTA', 'Quinta', '09:40 às 11:40', 'Auditorio', 20, 
                 'A palestra abordará o conceito de carreiras híbridas na área de TI, destacando a importância da interdisciplinaridade no mercado atual. Serão discutidas as principais competências técnicas e comportamentais exigidas, além de como integrar diferentes áreas do conhecimento para se tornar um profissional mais completo, inovador e preparado para os desafios da era digital.', 
                 'Computador e Data Show'),
                ('Introdução ao Python: Programando um Assistente Virtual no Colab', 'LYRANE TEIXEIRA', 'Quarta', '09:40 às 11:40', 'Lab 3', 20, 
                 'O minicurso apresentará uma introdução à linguagem Python por meio da criação de um assistente virtual no Google Colab. Os participantes aprenderão conceitos básicos de programação, como variáveis, estruturas de decisão e interação com o usuário, aplicando esses conhecimentos em um projeto prático e acessível.', 
                 'Computador com acesso à internet, Data Show'),
                ('Do Sertão à América: Uma Jornada até a Universidade de Cincinnati', 'MICHAEL LOPES', 'Quinta', '09:40 às 11:40', 'Auditorio', 20, 
                 'A palestra contará a trajetória de superação e conquistas, desde o sertão até a chegada à Universidade de Cincinnati, destacando desafios, oportunidades e aprendizados ao longo do caminho. Serão abordados temas como acesso à educação, internacionalização, desenvolvimento pessoal e acadêmico, além de inspirações para quem deseja trilhar caminhos semelhantes.', 
                 'Computador com acesso à internet, Data Show'),
                ('Fundamentos Elementares de Análise com Dados', 'DIEGO TEIXEIRA', 'Quinta', '18:20 às 20:00', 'Lab 3', 20, 
                 'O minicurso apresentará os fundamentos básicos da análise de dados, abordando conceitos essenciais como coleta, organização e interpretação de informações. Os participantes terão uma introdução prática às principais técnicas e ferramentas utilizadas para transformar dados em insights relevantes para a tomada de decisões.', 
                 'rstudio'),
                ('Introdução Prática ao Blockchain Empresarial com Firefly e Hyperladger', 'LUCAS FERREIRA COSTA', 'Quinta', '18:20 às 22:00', 'Lab 4', 20, 
                 'O minicurso apresentará, de forma prática, os conceitos básicos de blockchain aplicado ao ambiente empresarial, utilizando ferramentas como FireFly e Hyperledger. Os participantes terão uma visão introdutória de como essas tecnologias funcionam e como podem ser usadas no desenvolvimento de soluções reais.', 
                 NULL),
                ('Liderança em Design para Tecnologia', 'RAQUEL LIRA', 'Quinta', '20:20 às 22:00', 'Lab 3', 20, 
                 'O minicurso aborda, de forma prática e interativa, a relação entre design, liderança e inovação na área de tecnologia. Serão explorados temas como trabalho em equipe, tomada de decisão, experiência do usuário e gestão de projetos, destacando como o pensamento de design pode contribuir para liderar equipes e desenvolver soluções mais colaborativas, éticas e eficientes.', 
                 'Projetor e Quadro branco ; Post-its (1 pacote); Canetas hidrográficas (2 ); Folhas A4 (30 folhas); Fita adesiva (se possível)'),
                ('Introdução ao Desenvolvimento de Jogos Digitais', 'PEDRO LUIS', 'Segunda', '18:20 às 22:00', 'Lab 4', 20, 
                 'Este minicurso oferece uma introdução ao desenvolvimento de jogos digitais, unindo fundamentos de narrativa com prática na engine Godot. Os participantes aprenderão como histórias e mecânicas se conectam para criar experiências interativas e, em seguida, desenvolverão um jogo simples com base no tutorial Dodge the Creeps, explorando conceitos essenciais como cenas, scripts e lógica de gameplay.', 
                 'Laboratório de informática com computadores equipados com a engine Godot instalada.'),
                ('Pitch: Do Zero à Apresentação', 'LUCAS NOGUEIRA', 'Terça', '09:40 às 11:40', 'Lab 4', 20, 
                 'O minicurso guiará os participantes na construção de um pitch do zero, abordando desde a estruturação da ideia até a apresentação final. Serão trabalhados elementos como clareza na comunicação, organização das informações e técnicas de apresentação para transmitir propostas de forma objetiva, persuasiva e profissional.', 
                 'Computador com acesso à internet, Data Show'),
                ('Figma do Zero ao Protótipo', 'SAMUEL LIMA', 'Terça', '09:40 às 11:40', 'Lab 3', 20, 
                 'O minicurso introduz o uso do Figma no design de interfaces, abordando conceitos básicos de UI, criação de layouts e prototipação interativa. Na prática, os participantes desenvolverão telas de uma aplicação, adquirindo habilidades para criar interfaces simples, funcionais e alinhadas ao desenvolvimento de sistemas.', 
                 'Laboratório com computadores e acesso à internet. Cada participante deve possuir (ou criar) uma conta gratuita no Figma.'),
                ('Teoria das Cores & Design Básica', 'Julio Cesar', 'Terça', '18:20 às 20:00', 'Lab 4', 20, 
                 'O minicurso abordará os fundamentos da teoria das cores e princípios básicos de design, explorando como cores, contrastes e combinações influenciam a comunicação visual. Os participantes aprenderão a aplicar esses conceitos na criação de peças mais harmônicas, atrativas e funcionais.', 
                 NULL),
                ('Oficina de Desenvolvimento de Jogos 2D com GDevelop', 'FRANCISCO HENRIQUE', 'Terça', '18:20 às 20:00', 'Lab 3', 20, 
                 'O mini curso introduz os fundamentos do desenvolvimento de jogos digitais por meio da criação prática de um jogo 2D no estilo top-down, utilizando a engine GDevelop. De forma acessível, os participantes aprenderão conceitos essenciais de criação de jogos sem a necessidade de programação tradicional.', 
                 NULL)
        `);

        console.log('✅ DB inicializado: teams + minicursos(14 real seeded + user specs) + inscricoes');
    } catch (err) {
        console.error('❌ Erro initDb:', err.message);
    }
};

initDb().catch(console.error);

module.exports = pool;

