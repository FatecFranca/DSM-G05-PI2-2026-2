-- =========================================
-- 1. CRIAR O BANCO DE DADOS
-- =========================================

CREATE DATABASE IF NOT EXISTS sonoraware
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE sonoraware;


-- =========================================
-- 2. TABELA: Estabelecimento
-- =========================================

-- "sobre TEXT" value must be tested later because, depending on its size, it will be necessary a validation to set a maximum character limit.
-- It may also be necessary to change the data type to MEDIUMTEXT or LONGTEXT.
CREATE TABLE Estabelecimento (
    id_estabelecimento INT AUTO_INCREMENT,
    nome_user VARCHAR(150) NOT NULL,
    email_login VARCHAR(150) NOT NULL,
    senha VARCHAR(255) NOT NULL,
    nome_estabelecimento VARCHAR(150) NOT NULL,
    tipo_estabelecimento VARCHAR(100) NOT NULL,
    instagram VARCHAR(150),
    site VARCHAR(150),
    -- Bytes da imagem (ate 16 MiB); NULL quando nao houver foto.
    foto_perfil MEDIUMBLOB,

    CONSTRAINT tipo_estabelecimento_check
        CHECK (
            tipo_estabelecimento IN (
                'Bar',
                'Restaurante',
                'Casa de Show',
                'Pub',
                'Boate',
                'Espaço de Eventos',
                'Outro'
            )
        ),

    sobre TEXT,
    estado VARCHAR(100) NOT NULL,
    cidade VARCHAR(100) NOT NULL,
    cep VARCHAR(10),
    rua VARCHAR(150),
    numero VARCHAR(20),
    bairro VARCHAR(100),
    complemento VARCHAR(100),
    nome_contato VARCHAR(150),
    telefone_contato VARCHAR(20),
    email_contato VARCHAR(150),
    funcao VARCHAR(100),
    capacidade INT,
    tipo_ambiente VARCHAR(100),

    CONSTRAINT tipo_ambiente_check
        CHECK (
            tipo_ambiente IN (
                'Fechado',
                'Aberto',
                'Misto'
            )
        ),

    PRIMARY KEY (id_estabelecimento),
    UNIQUE (email_login)
) ENGINE = InnoDB;


CREATE TABLE Estrutura (
    id_estrutura INT AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,

    PRIMARY KEY (id_estrutura),
    UNIQUE (nome)
) ENGINE = InnoDB;


CREATE TABLE Acessibilidade (
    id_acessibilidade INT AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,

    PRIMARY KEY (id_acessibilidade),
    UNIQUE (nome)
) ENGINE = InnoDB;


CREATE TABLE Tipo_Evento (
    id_tipo_evento INT AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,

    PRIMARY KEY (id_tipo_evento),
    UNIQUE (nome)
) ENGINE = InnoDB;


CREATE TABLE Estabelecimento_Estrutura (
    id_estabelecimento INT NOT NULL,
    id_estrutura INT NOT NULL,

    PRIMARY KEY (id_estabelecimento, id_estrutura),

    CONSTRAINT fk_estabelecimento_estrutura_estabelecimento
        FOREIGN KEY (id_estabelecimento)
        REFERENCES Estabelecimento(id_estabelecimento)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_estabelecimento_estrutura_estrutura
        FOREIGN KEY (id_estrutura)
        REFERENCES Estrutura(id_estrutura)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE = InnoDB;


CREATE TABLE Estabelecimento_Acessibilidade (
    id_estabelecimento INT NOT NULL,
    id_acessibilidade INT NOT NULL,

    PRIMARY KEY (id_estabelecimento, id_acessibilidade),

    CONSTRAINT fk_estabelecimento_acessibilidade_estabelecimento
        FOREIGN KEY (id_estabelecimento)
        REFERENCES Estabelecimento(id_estabelecimento)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_estabelecimento_acessibilidade_acessibilidade
        FOREIGN KEY (id_acessibilidade)
        REFERENCES Acessibilidade(id_acessibilidade)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE = InnoDB;


CREATE TABLE Estabelecimento_Tipo_Evento (
    id_estabelecimento INT NOT NULL,
    id_tipo_evento INT NOT NULL,

    PRIMARY KEY (id_estabelecimento, id_tipo_evento),

    CONSTRAINT fk_estabelecimento_tipo_evento_estabelecimento
        FOREIGN KEY (id_estabelecimento)
        REFERENCES Estabelecimento(id_estabelecimento)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_estabelecimento_tipo_evento_tipo_evento
        FOREIGN KEY (id_tipo_evento)
        REFERENCES Tipo_Evento(id_tipo_evento)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE = InnoDB;


INSERT INTO Estrutura (nome) VALUES
('Palco'),
('Pista de dança'),
('Sistema de som'),
('Iluminação'),
('Camarim'),
('Bar'),
('Mesas e cadeiras'),
('Estacionamento'),
('Área externa'),
('Banheiros');


INSERT INTO Acessibilidade (nome) VALUES
('Rampa de acesso'),
('Banheiro acessível'),
('Estacionamento acessível'),
('Elevador'),
('Piso tátil'),
('Libras'),
('Audiodescrição'),
('Assentos preferenciais');


INSERT INTO Tipo_Evento (nome) VALUES
('Casamento'),
('Aniversário'),
('Formatura'),
('Festa corporativa'),
('Show'),
('Festival'),
('Palestra'),
('Conferência'),
('Workshop'),
('Exposição'),
('Feira'),
('Evento social');



-- =========================================
-- 3. TABELA: Banda
-- =========================================
-- Campos baseados no formulário "Cadastro de Banda".
-- "confirmar senha" é validado apenas no front e não é armazenado.
-- "sobre" e "repertorio" (TEXT): avaliar limite de caracteres no front
-- e, se necessário, mudar para MEDIUMTEXT.

CREATE TABLE Banda (
    id_banda INT AUTO_INCREMENT,

    -- 1. Dados de acesso
    nome_user VARCHAR(150) NOT NULL,
    email_login VARCHAR(150) NOT NULL,
    senha VARCHAR(255) NOT NULL,

    -- 2. Informações principais
    nome VARCHAR(150) NOT NULL,
    cep VARCHAR(10) NOT NULL,
    cidade VARCHAR(100) NOT NULL,
    estado VARCHAR(100) NOT NULL,

    -- 4. Sobre o grupo / contato para contratação
    numero_artistas INT NOT NULL,
    ano_formacao YEAR NOT NULL,
    nome_contato VARCHAR(150) NOT NULL,
    funcao VARCHAR(100) NOT NULL,
    telefone_contato VARCHAR(20) NOT NULL,
    email_contato VARCHAR(150) NOT NULL,
    sobre TEXT,

    -- 5. Repertório
    repertorio TEXT,

    -- 6. Estrutura / instrumentos disponíveis
    possui_instrumentos BOOLEAN NOT NULL DEFAULT FALSE,

    -- 7. Disponibilidade
    disponibilidade VARCHAR(100) NOT NULL,

    -- 8. Redes sociais
    instagram VARCHAR(150),
    youtube VARCHAR(255),

    -- 9. Imagem da banda
    -- Bytes da imagem (ate 16 MiB); NULL quando nao houver foto.
    foto_perfil MEDIUMBLOB,

    PRIMARY KEY (id_banda),
    UNIQUE (email_login),

    CONSTRAINT banda_numero_artistas_check
        CHECK (numero_artistas > 0),

    CONSTRAINT banda_disponibilidade_check
        CHECK (
            disponibilidade IN (
                'Somente na minha cidade',
                'Minha cidade e região',
                'Todo o estado',
                'Todo o Brasil'
            )
        )
) ENGINE = InnoDB;


-- 3. Estilos musicais (seleção múltipla)

CREATE TABLE Estilo_Musical (
    id_estilo_musical INT AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,

    PRIMARY KEY (id_estilo_musical),
    UNIQUE (nome)
) ENGINE = InnoDB;


CREATE TABLE Banda_Estilo_Musical (
    id_banda INT NOT NULL,
    id_estilo_musical INT NOT NULL,

    PRIMARY KEY (id_banda, id_estilo_musical),

    CONSTRAINT fk_banda_estilo_musical_banda
        FOREIGN KEY (id_banda)
        REFERENCES Banda(id_banda)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_banda_estilo_musical_estilo_musical
        FOREIGN KEY (id_estilo_musical)
        REFERENCES Estilo_Musical(id_estilo_musical)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE = InnoDB;


INSERT INTO Estilo_Musical (nome) VALUES
('Rock'),
('Pop'),
('MPB'),
('Sertanejo'),
('Indie'),
('Pagode'),
('Samba'),
('Eletrônica'),
('Rap'),
('Cover'),
('Outro');



-- =========================================
-- 4. TABELA: Artista
-- =========================================

CREATE TABLE Artista (
    id_artista INT AUTO_INCREMENT,
    nome VARCHAR(150) NOT NULL,
    disponibilidade VARCHAR(255),
    email VARCHAR(150) NOT NULL,
    telefone VARCHAR(20),
    senha VARCHAR(255) NOT NULL,
    genero VARCHAR(50),
    id_publico VARCHAR(100),
    descricao TEXT,
    -- Bytes da imagem (ate 16 MiB); NULL quando nao houver foto.
    foto_perfil MEDIUMBLOB,

    PRIMARY KEY (id_artista),
    UNIQUE (email)
) ENGINE = InnoDB;


-- =========================================
-- 5. TABELA: Instrumento
-- =========================================

CREATE TABLE Instrumento (
    id_instrumento INT AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    familia VARCHAR(100),

    PRIMARY KEY (id_instrumento)
) ENGINE = InnoDB;


-- =========================================
-- 6. TABELA: Solicitação
-- =========================================

CREATE TABLE Solicitacao (
    id_solicitacao INT AUTO_INCREMENT,
    data DATE NOT NULL,
    horario TIME NOT NULL,
    duracao TIME,
    sobre TEXT,

    id_estabelecimento INT NOT NULL,
    id_artista INT NOT NULL,

    PRIMARY KEY (id_solicitacao),

    CONSTRAINT fk_solicitacao_estabelecimento
        FOREIGN KEY (id_estabelecimento)
        REFERENCES Estabelecimento(id_estabelecimento)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_solicitacao_artista
        FOREIGN KEY (id_artista)
        REFERENCES Artista(id_artista)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE = InnoDB;


-- =========================================
-- 7. TABELA: artista_banda
-- =========================================

CREATE TABLE artista_banda (
    id_artista_banda INT AUTO_INCREMENT,
    id_artista INT NOT NULL,
    id_banda INT NOT NULL,
    funcao VARCHAR(100),

    PRIMARY KEY (id_artista_banda),

    CONSTRAINT fk_artista_banda_artista
        FOREIGN KEY (id_artista)
        REFERENCES Artista(id_artista)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_artista_banda_banda
        FOREIGN KEY (id_banda)
        REFERENCES Banda(id_banda)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    UNIQUE (id_artista, id_banda)
) ENGINE = InnoDB;


-- =========================================
-- 8. TABELA: artista_instrumento
-- =========================================

CREATE TABLE artista_instrumento (
    id_artista_instrumento INT AUTO_INCREMENT,
    id_artista INT NOT NULL,
    id_instrumento INT NOT NULL,

    PRIMARY KEY (id_artista_instrumento),

    CONSTRAINT fk_artista_instrumento_artista
        FOREIGN KEY (id_artista)
        REFERENCES Artista(id_artista)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_artista_instrumento_instrumento
        FOREIGN KEY (id_instrumento)
        REFERENCES Instrumento(id_instrumento)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    UNIQUE (id_artista, id_instrumento)
) ENGINE = InnoDB;

-- Active JWT sessions. Removing a session invalidates that token immediately.
-- IDs refer to different account tables, so account type is part of the identity.
CREATE TABLE Sessao (
    id_sessao CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
    id_usuario INT NOT NULL,
    tipo_usuario ENUM('Artista', 'Banda', 'Estabelecimento') NOT NULL,
    expira_em BIGINT NOT NULL,
    INDEX sessao_expiracao (expira_em)
) ENGINE = InnoDB;

CREATE VIEW View_Login AS
SELECT 
    id_estabelecimento AS id_usuario,
    email_login AS email, 
    senha, 
    'Estabelecimento' AS tipo_usuario
FROM Estabelecimento

UNION ALL

SELECT 
    id_banda AS id_usuario,
    email_login AS email, 
    senha, 
    'Banda' AS tipo_usuario
FROM Banda

UNION ALL

SELECT 
    id_artista AS id_usuario,
    email AS email, 
    senha, 
    'Artista' AS tipo_usuario
FROM Artista;

USE sonoraware;

-- =========================================
-- 1. INSERÇÃO DE DADOS: Estabelecimento
-- Tabela principal de contratantes/locais (5 registros)
-- =========================================

INSERT INTO Estabelecimento (
    nome_user, email_login, senha, nome_estabelecimento, tipo_estabelecimento, 
    instagram, site, foto_perfil, sobre, estado, cidade, cep, rua, numero, 
    bairro, complemento, nome_contato, telefone_contato, email_contato, funcao, capacidade, tipo_ambiente
) VALUES 
-- Registro 1: Pub de Rock em Franca/SP (Ambiente Fechado)
(
    'pub_rockhall', 'contato@rockhall.com', 
    '$2b$12$eImiTXuWVxfM37uY4JANjOL.83F.yq/oG.xQ3Q2B9/b6z6l7g5i8a', -- Senha em hash Bcrypt (exemplo)
    'Rock Hall Pub', 'Pub', '@rockhallpub', 'https://rockhall.com.br', 
    NULL, 'Pub aconchegante focado em rock clássico e cervejas artesanais.',
    'SP', 'Franca', '14400-000', 'Rua São Paulo', '1020', 'Centro', 'Próximo à praça central', 
    'Carlos Eduardo', '(16) 99111-2233', 'carlos@rockhall.com', 'Gerente de Eventos', 250, 'Fechado'
),

-- Registro 2: Casa de Show / Jazz Club em Ribeirão Preto/SP (Ambiente Fechado)
(
    'blue_note_club', 'admin@bluenoteclub.com', 
    '$2b$12$eImiTXuWVxfM37uY4JANjOL.83F.yq/oG.xQ3Q2B9/b6z6l7g5i8a', 
    'Blue Note Jazz Club', 'Casa de Show', '@bluenoteclub', 'https://bluenote.com.br', 
    NULL, 'Casa de shows intimista voltada para Jazz, MPB e Bossa Nova.',
    'SP', 'Ribeirão Preto', '14010-000', 'Av. Independência', '500', 'Alto da Boa Vista', 'Bloco B', 
    'Mariana Souza', '(16) 99222-3344', 'mariana@bluenote.com', 'Curadora Musical', 180, 'Fechado'
),

-- Registro 3: Espaço de Eventos em Campinas/SP (Ambiente Aberto)
(
    'arena_sunset', 'contato@arenasunset.com', 
    '$2b$12$eImiTXuWVxfM37uY4JANjOL.83F.yq/oG.xQ3Q2B9/b6z6l7g5i8a', 
    'Arena Sunset Events', 'Espaço de Eventos', '@arenasunset', 'https://arenasunset.com.br', 
    NULL, 'Espaço amplo ao ar livre ideal para festivais e grandes recepções.',
    'SP', 'Campinas', '13010-000', 'Rodovia Campinas-Mogi', 'km 12', 'Zona Rural', NULL, 
    'Roberto Lima', '(19) 99333-4455', 'roberto@arenasunset.com', 'Diretor Operacional', 1500, 'Aberto'
),

-- Registro 4: Bar tradicional no Rio de Janeiro/RJ (Ambiente Misto)
(
    'boteco_do_ze', 'contato@botecodoze.com', 
    '$2b$12$eImiTXuWVxfM37uY4JANjOL.83F.yq/oG.xQ3Q2B9/b6z6l7g5i8a', 
    'Boteco do Zé', 'Bar', '@botecodoze', NULL, 
    NULL, 'Bar tradicional com roda de samba ao vivo e petiscos típicos.',
    'RJ', 'Rio de Janeiro', '20000-000', 'Rua da Lapa', '45', 'Lapa', 'Esquina com a Rua B', 
    'José Silva', '(21) 99444-5566', 'ze@botecodoze.com', 'Proprietário', 120, 'Misto'
),

-- Registro 5: Boate em Belo Horizonte/MG (Ambiente Fechado)
(
    'lounge_groove', 'eventos@groovelounge.com', 
    '$2b$12$eImiTXuWVxfM37uY4JANjOL.83F.yq/oG.xQ3Q2B9/b6z6l7g5i8a', 
    'Groove Club & Lounge', 'Boate', '@groovelounge', 'https://groovelounge.com.br', 
    NULL, 'Boate moderna focada em música eletrônica e pop.',
    'MG', 'Belo Horizonte', '30100-000', 'Av. Savassi', '880', 'Savassi', 'Subsolo', 
    'Fernanda Lima', '(31) 99555-6677', 'fernanda@groovelounge.com', 'Produtora Cultural', 400, 'Fechado'
);


-- =========================================
-- 2. TABELAS PIVÔ DO ESTABELECIMENTO
-- Associação de infraestrutura, acessibilidade e tipos de evento suportados
-- =========================================

-- 2.1 Estabelecimento x Estrutura (5 registros)
-- IDs de Estrutura válidos (1: Palco, 3: Sistema de som, 6: Bar, 8: Estacionamento)
INSERT INTO Estabelecimento_Estrutura (id_estabelecimento, id_estrutura) VALUES
(1, 1), -- Rock Hall -> Possui Palco
(1, 3), -- Rock Hall -> Possui Sistema de som
(2, 1), -- Blue Note -> Possui Palco
(2, 6), -- Blue Note -> Possui Bar
(3, 8); -- Arena Sunset -> Possui Estacionamento

-- 2.2 Estabelecimento x Acessibilidade (5 registros)
-- IDs de Acessibilidade válidos (1: Rampa de acesso, 2: Banheiro acessível, 3: Estacionamento acessível, 4: Elevador, 8: Assentos preferenciais)
INSERT INTO Estabelecimento_Acessibilidade (id_estabelecimento, id_acessibilidade) VALUES
(1, 1), -- Rock Hall -> Rampa de acesso
(1, 2), -- Rock Hall -> Banheiro acessível
(2, 4), -- Blue Note -> Elevador
(3, 3), -- Arena Sunset -> Estacionamento acessível
(4, 8); -- Boteco do Zé -> Assentos preferenciais

-- 2.3 Estabelecimento x Tipo_Evento (5 registros)
-- IDs de Tipo_Evento válidos (1: Casamento, 4: Festa corporativa, 5: Show, 6: Festival)
INSERT INTO Estabelecimento_Tipo_Evento (id_estabelecimento, id_tipo_evento) VALUES
(1, 5), -- Rock Hall -> Recebe Shows
(2, 5), -- Blue Note -> Recebe Shows
(3, 1), -- Arena Sunset -> Recebe Casamentos
(3, 6), -- Arena Sunset -> Recebe Festivais
(5, 4); -- Groove Club -> Recebe Festas corporativas


-- =========================================
-- 3. INSERÇÃO DE DADOS: Banda
-- Grupos musicais cadastrados na plataforma (5 registros)
-- =========================================

INSERT INTO Banda (
    nome_user, email_login, senha, nome, cep, cidade, estado, 
    numero_artistas, ano_formacao, nome_contato, funcao, telefone_contato, 
    email_contato, sobre, repertorio, possui_instrumentos, disponibilidade, 
    instagram, youtube, foto_perfil
) VALUES 
-- Registro 1: Banda de Rock
(
    'banda_valvula', 'contato@valvularock.com', 
    '$2b$12$eImiTXuWVxfM37uY4JANjOL.83F.yq/oG.xQ3Q2B9/b6z6l7g5i8a', 
    'Válvula de Escape', '14400-100', 'Franca', 'SP', 
    4, 2018, 'Lucas Mendes', 'Vocalista / Empresário', '(16) 98888-1111', 
    'contato@valvularock.com', 'Banda de Classic e Pop Rock tocando hits dos anos 80 e 90.', 
    'AC/DC, Queen, Legião Urbana, Paralamas do Sucesso', TRUE, 'Minha cidade e região', 
    '@valvularock', 'https://youtube.com/valvularock', NULL
),

-- Registro 2: Trio Instrumental / MPB
(
    'trio_brasil', 'contato@triobrasil.com', 
    '$2b$12$eImiTXuWVxfM37uY4JANjOL.83F.yq/oG.xQ3Q2B9/b6z6l7g5i8a', 
    'Trio Brasil Seresta', '14020-000', 'Ribeirão Preto', 'SP', 
    3, 2015, 'Beatriz Alves', 'Violonista', '(16) 98888-2222', 
    'beatriz@triobrasil.com', 'Trio instrumental e vocal focado na valorização da MPB e Bossa Nova.', 
    'Tom Jobim, Elis Regina, Cartola, Chico Buarque', FALSE, 'Todo o estado', 
    '@triobrasilseresta', 'https://youtube.com/triobrasil', NULL
),

-- Registro 3: Grupo de Samba e Pagode
(
    'os_resenheiros', 'agenda@resenheiros.com', 
    '$2b$12$eImiTXuWVxfM37uY4JANjOL.83F.yq/oG.xQ3Q2B9/b6z6l7g5i8a', 
    'Os Resenheiros do Samba', '20010-000', 'Rio de Janeiro', 'RJ', 
    6, 2020, 'Thiago Santos', 'Cavaquinista', '(21) 98888-3333', 
    'agenda@resenheiros.com', 'Grupo de samba de raiz e pagode anos 90 animando eventos e bares.', 
    'Exaltasamba, Revelação, Zeca Pagodinho, Fundo de Quintal', TRUE, 'Todo o Brasil', 
    '@resenheirosdosamba', 'https://youtube.com/resenheiros', NULL
),

-- Registro 4: Dupla Sertaneja
(
    'sertanejo_dM', 'contato@diegoematheus.com', 
    '$2b$12$eImiTXuWVxfM37uY4JANjOL.83F.yq/oG.xQ3Q2B9/b6z6l7g5i8a', 
    'Diego & Matheus', '30120-000', 'Belo Horizonte', 'MG', 
    2, 2021, 'Diego Oliveira', 'Cantor Principal', '(31) 98888-4444', 
    'contato@diegoematheus.com', 'Dupla sertaneja universitária e modão com repertório variado.', 
    'Jorge & Mateus, Chitãozinho & Xororó, Gusttavo Lima', TRUE, 'Todo o Brasil', 
    '@diegoematheusoficial', 'https://youtube.com/diegoematheus', NULL
),

-- Registro 5: Duo de Música Eletrônica
(
    'synth_wave_project', 'booking@synthwave.com', 
    '$2b$12$eImiTXuWVxfM37uY4JANjOL.83F.yq/oG.xQ3Q2B9/b6z6l7g5i8a', 
    'Neon Pulse Synth', '13020-000', 'Campinas', 'SP', 
    2, 2022, 'Gabriel Costa', 'Produtor / Tecladista', '(19) 98888-5555', 
    'booking@synthwave.com', 'Duo de música eletrônica ao vivo mesclando synthwave e indie pop.', 
    'Daft Punk, Depeche Mode, Synthwave originals', FALSE, 'Somente na minha cidade', 
    '@neonpulsesynth', 'https://youtube.com/neonpulse', NULL
);


-- 3.1 Banda x Estilo_Musical (5 registros)
-- IDs de Estilo_Musical válidos (1: Rock, 2: Pop, 3: MPB, 4: Sertanejo, 7: Samba)
INSERT INTO Banda_Estilo_Musical (id_banda, id_estilo_musical) VALUES
(1, 1), -- Válvula de Escape -> Rock
(1, 2), -- Válvula de Escape -> Pop
(2, 3), -- Trio Brasil -> MPB
(3, 7), -- Os Resenheiros -> Samba
(4, 4); -- Diego & Matheus -> Sertanejo


-- =========================================
-- 4. INSERÇÃO DE DADOS: Artista
-- Músicos individuais (5 registros)
-- =========================================

INSERT INTO Artista (
    nome, disponibilidade, email, telefone, senha, genero, id_publico, descricao, foto_perfil
) VALUES
-- Músico 1: Vocalista de Rock
(
    'Lucas Mendes', 'Finais de semana e noites de quinta', 'lucas.mendes@email.com', 
    '(16) 97777-1111', '$2b$12$eImiTXuWVxfM37uY4JANjOL.83F.yq/oG.xQ3Q2B9/b6z6l7g5i8a', 
    'Masculino', '@lucasmendes_vox', 'Vocalista com 10 anos de experiência em bandas de rock e pop.', 
    NULL
),

-- Músico 2: Violonista de MPB/Bossa Nova
(
    'Beatriz Alves', 'Segunda a Sábado', 'beatriz.alves@email.com', 
    '(16) 97777-2222', '$2b$12$eImiTXuWVxfM37uY4JANjOL.83F.yq/oG.xQ3Q2B9/b6z6l7g5i8a', 
    'Feminino', '@bia_violao', 'Violonista erudita e popular especializada em Bossa Nova e Jazz.', 
    NULL
),

-- Músico 3: Sambista / Cavaquinista
(
    'Thiago Santos', 'Finais de semana', 'thiago.santos@email.com', 
    '(21) 97777-3333', '$2b$12$eImiTXuWVxfM37uY4JANjOL.83F.yq/oG.xQ3Q2B9/b6z6l7g5i8a', 
    'Masculino', '@thiagocavaquinho', 'Instrumentista apaixonado por samba de raiz e percussão leve.', 
    NULL
),

-- Músico 4: Produtor e Tecladista
(
    'Gabriel Costa', 'Disponibilidade flexível', 'gabriel.costa@email.com', 
    '(19) 97777-4444', '$2b$12$eImiTXuWVxfM37uY4JANjOL.83F.yq/oG.xQ3Q2B9/b6z6l7g5i8a', 
    'Masculino', '@gabriel_synths', 'Produtor musical, tecladista e DJ com foco em live sets eletrônicos.', 
    NULL
),

-- Músico 5: Saxofonista solo
(
    'Camila Rocha', 'Sextas e Sábados à noite', 'camila.rocha@email.com', 
    '(31) 97777-5555', '$2b$12$eImiTXuWVxfM37uY4JANjOL.83F.yq/oG.xQ3Q2B9/b6z6l7g5i8a', 
    'Feminino', '@camilarocha_sax', 'Saxofonista profissional atuante em casamentos, receptivos e jazz bars.', 
    NULL
);


-- =========================================
-- 5. INSERÇÃO DE DADOS: Instrumento
-- Catálogo de instrumentos musicais (5 registros)
-- =========================================

INSERT INTO Instrumento (nome, familia) VALUES
('Guitarra Elétrica', 'Cordas'),
('Violão de Aço/Nylon', 'Cordas'),
('Cavaquinho', 'Cordas'),
('Teclado / Sintetizador', 'Teclas'),
('Saxofone Alto', 'Sopro');


-- =========================================
-- 6. INSERÇÃO DE DADOS: Solicitacao
-- Propostas e agendamentos entre Estabelecimentos e Artistas (5 registros)
-- =========================================

INSERT INTO Solicitacao (data, horario, duracao, sobre, id_estabelecimento, id_artista) VALUES
-- Solicitação 1: Rock Hall contratando Lucas Mendes
('2026-12-15', '21:00:00', '02:30:00', 'Apresentação acústica solo de voz e violão para noite especial de quinta-feira.', 1, 1),

-- Solicitação 2: Blue Note contratando Beatriz Alves
('2026-12-18', '20:00:00', '02:00:00', 'Live set instrumental de Bossa Nova para recepção de clientes.', 2, 2),

-- Solicitação 3: Boteco do Zé contratando Thiago Santos
('2026-12-20', '19:30:00', '03:00:00', 'Roda de samba acústica no espaço externo.', 4, 3),

-- Solicitação 4: Groove Lounge contratando Gabriel Costa
('2026-12-22', '22:00:00', '01:30:00', 'Performance de música eletrônica ao vivo.', 5, 4),

-- Solicitação 5: Arena Sunset contratando Camila Rocha
('2026-12-29', '19:00:00', '02:00:00', 'Saxofone solo para evento corporativo e coquetel de encerramento.', 3, 5);


-- =========================================
-- 7. INSERÇÃO DE DADOS: artista_banda
-- Vínculo de integrantes com suas respetivas bandas (5 registros)
-- =========================================

INSERT INTO artista_banda (id_artista, id_banda, funcao) VALUES
(1, 1, 'Vocalista Principal'),            -- Lucas Mendes na banda Válvula de Escape
(2, 2, 'Violonista e Arranjadora'),       -- Beatriz Alves na banda Trio Brasil
(3, 3, 'Cavaquinista e Vocal de Apoio'),  -- Thiago Santos na banda Os Resenheiros
(4, 5, 'Tecladista e Produtor'),          -- Gabriel Costa no projeto Neon Pulse
(5, 2, 'Saxofonista Convidada');          -- Camila Rocha como convidada no Trio Brasil


-- =========================================
-- 8. INSERÇÃO DE DADOS: artista_instrumento
-- Mapeamento dos instrumentos que cada artista toca (5 registros)
-- =========================================

INSERT INTO artista_instrumento (id_artista, id_instrumento) VALUES
(1, 1), -- Lucas Mendes -> Guitarra Elétrica
(2, 2), -- Beatriz Alves -> Violão
(3, 3), -- Thiago Santos -> Cavaquinho
(4, 4), -- Gabriel Costa -> Teclado / Sintetizador
(5, 5); -- Camila Rocha -> Saxofone Alto


-- =========================================
-- 9. INSERÇÃO DE DADOS: Sessao
-- Registros de sessões JWT ativas para autenticação (5 registros)
-- =========================================

INSERT INTO Sessao (id_sessao, id_usuario, tipo_usuario, expira_em) VALUES
-- Sessão de um Estabelecimento (Rock Hall)
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 1, 'Estabelecimento', 1799999999),

-- Sessão de um Estabelecimento (Blue Note)
('b1ffcd00-8d1c-4ef9-cc7e-7cc0ce491b22', 2, 'Estabelecimento', 1799999999),

-- Sessão de uma Banda (Válvula de Escape)
('c200de11-7e2d-4fa0-dd8f-8dd1df502c33', 1, 'Banda', 1799999999),

-- Sessão de uma Banda (Trio Brasil)
('d311ef22-6f3e-4fb1-ee90-9ee2ef613d44', 2, 'Banda', 1799999999),

-- Sessão de um Artista solo (Lucas Mendes)
('e422ff33-5a4f-4fc2-ff01-0ff3ff724e55', 1, 'Artista', 1799999999);