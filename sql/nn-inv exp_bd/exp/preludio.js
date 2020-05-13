// Banco de Dados nn_inv
// Script para criação e inserção dos dados pessoais (Nico e Nana)
// Criar database -- rodar na linha de comando
/*
-- DROP DATABASE nn_inv;
CREATE DATABASE nn_inv
DEFAULT CHARACTER SET latin1
COLLATE latin1_swedish_ci;

CREATE USER 'nninv_nodeusr'@'localhost'
  IDENTIFIED BY '123';

GRANT ALL PRIVILEGES ON nn_inv.* TO 'nninv_nodeusr'@'localhost';
*/

// Includes
const bd               = require('../models/bd')
const aplicacao        = require('../models/aplicacao')
const banco            = require('../models/banco')
const conta            = require('../models/conta')
const pessoa           = require('../models/pessoa')
const grupo_lancamento = require('../models/grupo_lancamento')
const lancamento       = require('../models/lancamento')
const operacao         = require('../models/operacao')

// Criação tabelas
if (process.argv.length >= 3 && process.argv[2] == 'criar_bd')
{
  bd.banco_dados.sync({ force: true })
  return
}

// Inserção dos dados
// Primeiro limpa tudo
console.log('> Inserir dados:\n')
const where_todos = { where: { id: { [bd.seq.Op.gt]: 0 }}}
var p = lancamento.destroy(where_todos).then(() =>
  grupo_lancamento.destroy(where_todos).then(() =>
    aplicacao.destroy(where_todos).then(() =>
      conta.destroy(where_todos).then(() =>
        Promise.all([banco.destroy(where_todos), pessoa.destroy(where_todos)]).then(() =>
          console.log('Apagou OK!')
        )
      )
    )
  )
)

