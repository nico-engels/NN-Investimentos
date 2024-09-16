-- Script de conversão da base do Poup para a base do NN-Investimentos
-- Tabelas não utilizadas
DROP TABLE anides;
DROP TABLE usuario;
DROP TABLE aplicacao_classe;
DROP TABLE conta_modalidade;
DROP TABLE ind_finan;
DROP TABLE menu;
DROP TABLE lancamento_tipo;

-- Banco
ALTER TABLE banco RENAME TO banco_velho;
CREATE TABLE banco
(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo VARCHAR(10) NOT NULL,
  nome VARCHAR(255) NOT NULL,
  cnpj VARCHAR(18) NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
);

INSERT INTO banco
  (codigo, nome, cnpj, created_at, updated_at)
SELECT codigo
     , nome
     , cnpj
     , datetime('now')
     , datetime('now')
  FROM banco_velho
 ORDER BY anid;

DROP TABLE banco_velho;

-- Pessoa
ALTER TABLE pessoa RENAME TO pessoa_velha;
CREATE TABLE pessoa 
(
  id INTEGER PRIMARY KEY AUTOINCREMENT, 
  nome VARCHAR(255) NOT NULL, 
  apelido VARCHAR(7) NOT NULL, 
  created_at DATETIME NOT NULL, 
  updated_at DATETIME NOT NULL
);

INSERT INTO pessoa
  (nome, apelido, created_at, updated_at)
SELECT nome
     , apelido
     , datetime('now')
     , datetime('now')
  FROM pessoa_velha
 ORDER BY anid;

DROP TABLE pessoa_velha;

-- Conta
ALTER TABLE conta RENAME TO conta_velha;
CREATE TABLE conta 
(
  id INTEGER PRIMARY KEY AUTOINCREMENT, 
  alias VARCHAR(15) NOT NULL, 
  id_pessoa INTEGER REFERENCES pessoa (id) ON DELETE NO ACTION ON UPDATE NO ACTION, 
  id_banco INTEGER REFERENCES banco (id) ON DELETE NO ACTION ON UPDATE NO ACTION,
  agencia VARCHAR(10), 
  numero VARCHAR(20), 
  modalidade INTEGER NOT NULL, 
  inicio DATETIME NOT NULL, 
  fim DATETIME, 
  apl_padrao INTEGER NOT NULL, 
  exibir_tr_rend INTEGER,
  created_at DATETIME NOT NULL, 
  updated_at DATETIME NOT NULL 
);

INSERT INTO conta
  (alias, id_pessoa, id_banco, agencia, numero,
   modalidade, inicio, fim, apl_padrao, exibir_tr_rend,
   created_at, updated_at)
SELECT alias
     , pessoa
     , banco
     , agencia
     , numero
     , modalidade
     , inicio || ' 00:00:00'
     , case when fim is not null then fim || ' 00:00:00' end
     , apl_padrao
     , exibir_tr_rend
     , datetime('now')
     , datetime('now')
  FROM conta_velha
 ORDER BY anid;

DROP TABLE conta_velha;  

-- Aplicacao
ALTER TABLE aplicacao RENAME TO aplicacao_velha;
CREATE TABLE aplicacao 
(
  id INTEGER PRIMARY KEY AUTOINCREMENT, 
  classe INTEGER, 
  alias VARCHAR(15), 
  inicio DATETIME NOT NULL, 
  fim DATETIME, 
  dia_ref INTEGER, 
  created_at DATETIME NOT NULL, 
  updated_at DATETIME NOT NULL, 
  id_conta INTEGER REFERENCES conta (id) ON DELETE NO ACTION ON UPDATE NO ACTION
);

INSERT INTO aplicacao
  (classe, alias, inicio, fim, dia_ref,
   created_at, updated_at, id_conta)
SELECT classe
     , alias
     , inicio || ' 00:00:00'
     , case when fim is not null then fim || ' 00:00:00' end
     , dia_ref
     , datetime('now')
     , datetime('now')
     , conta
  from aplicacao_velha
 order by anid;

DROP TABLE aplicacao_velha; 

-- lançamento agrupado
ALTER TABLE lancamento_agrup RENAME TO lancamento_agrup_velho;

CREATE TABLE lancamento_agrup
(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
);

INSERT INTO lancamento_agrup
  (created_at, updated_at)
SELECT datetime('now')
     , datetime('now')
  FROM lancamento_agrup_velho
 ORDER BY anid;

DROP TABLE lancamento_agrup_velho;

-- lançamento
ALTER TABLE lancamento RENAME TO lancamento_velho;
CREATE TABLE lancamento
(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  data DATETIME,
  tipo INTEGER NOT NULL,
  entrada DECIMAL(10,2) NOT NULL,
  saida DECIMAL(10,2) NOT NULL,
  origem VARCHAR(25),
  id_aplicacao INTEGER REFERENCES aplicacao (id) ON DELETE NO ACTION ON UPDATE NO ACTION,
  id_grupo INTEGER REFERENCES lancamento_agrup (id) ON DELETE NO ACTION ON UPDATE NO ACTION,
  comentario VARCHAR(255),
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
);

INSERT INTO lancamento
  (data, tipo, entrada, saida, origem,
   id_aplicacao, id_grupo, comentario, created_at, updated_at)
SELECT data || ' 00:00:00'
     , tipo
     , entrada
     , saida
     , origem
     , aplicacao
     , agrupamento
     , comentario
     , datetime('now')
     , datetime('now')
 FROM lancamento_velho
ORDER BY anid;

DROP TABLE lancamento_velho;