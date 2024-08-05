// Banco de Dados nn_inv
// Script para criação 
// Criar database -- rodar na linha de comando

// Includes
const bd         = require('../models/bd')
const aplicacao  = require('../models/aplicacao')
const banco      = require('../models/banco')
const conta      = require('../models/conta')
const pessoa     = require('../models/pessoa')
const lancamento = require('../models/lancamento')
const operacao   = require('../models/operacao')

// Criação tabelas
console.log('Banco de Dados nn_inv - Criação e Inserção dos Dados\n' +
            '> Criar estrutura:\n')
// Comentar descomentar para criar estrutura
//bd.banco_dados.sync({ force: true })
//return

// Inserção dos dados
// Primeiro limpa tudo
console.log('> Inserir dados:\n')
const where_todos = { where: { id: { [bd.seq.Op.gt]: 0 }}}
var p = lancamento.destroy(where_todos).then(() =>
  aplicacao.destroy(where_todos).then(() =>
    conta.destroy(where_todos).then(() =>
      Promise.all([banco.destroy(where_todos), pessoa.destroy(where_todos)]).then(() =>
        console.log('Apagou OK!')
      )
    )
  )
)

// Bancos
const banco_bb  =   { nome: 'Banco do Brasil',         codigo: '001', cnpj: '00.000.000/0001-91' }
const banco_cef =   { nome: 'Caixa Econômica Federal', codigo: '104', cnpj: '00.360.305/0001-04' }
const banco_inter = { nome: 'Banco Inter',             codigo: '077', cnpj: '00.416.968/0001-01' }
const banco_prb   = { nome: 'Paraná Banco',            codigo: '254', cnpj: '14.388.334/0001-99' }
const banco_modal = { nome: 'Modal+',                  codigo: '746', cnpj: '05.389.174/0001-01' }
const banco_clear = { nome: 'Clear',                   codigo: '102', cnpj: '02.332.886/0001-04' }
const banco_dayc  = { nome: 'Banco Daycoval',          codigo: '707', cnpj: '62.232.889/0001-90' }
const banco_itau  = { nome: 'Banco Itaú',              codigo: '341', cnpj: '60.701.190/0001-04' }
const banco_nub   = { nome: 'NuBank',                  codigo: '260', cnpj: '18.236.120/0001-58' }
const banco_abc   = { nome: 'Banco ABC Brasil',        codigo: '246', cnpj: '28.195.667/0001-06' }

Promise.all([p]).then(() => {
  var ps = []

  ps.push(banco.create(banco_bb   ).then((b) => banco_bb.id    = b.id))
  ps.push(banco.create(banco_cef  ).then((b) => banco_cef.id   = b.id))
  ps.push(banco.create(banco_inter).then((b) => banco_inter.id = b.id))
  ps.push(banco.create(banco_prb  ).then((b) => banco_prb.id   = b.id))
  ps.push(banco.create(banco_modal).then((b) => banco_modal.id = b.id))
  ps.push(banco.create(banco_clear).then((b) => banco_clear.id = b.id))
  ps.push(banco.create(banco_dayc ).then((b) => banco_dayc.id  = b.id))
  ps.push(banco.create(banco_itau ).then((b) => banco_itau.id  = b.id))
  ps.push(banco.create(banco_nub  ).then((b) => banco_nub.id   = b.id))
  ps.push(banco.create(banco_abc  ).then((b) => banco_abc.id   = b.id))

  Promise.all(ps).then(() => {
    console.log('Criado os bancos padrões!')    
  })
})