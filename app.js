// Includes
// Bibliotecas
const express = require('express')
const app = require('express')()
const bodyparser = require('body-parser')
var expressLayouts = require('express-ejs-layouts')

// adicionar pasta public estaticamente para o node carregar os arquivos js e css corretamente para o client-side
app.use(express.static(__dirname + '/public'));

// Funcionalidades do sistema
// Pessoal
const func_pessoa     = require('./func_pessoa')

// Financeiro
const func_banco      = require('./func_banco')
const func_conta      = require('./func_conta')

// Investimentos
// Aplicação
const func_aplicacao  = require('./func_aplicacao').func_aplicacao

// Operações
const func_depositar  = require('./func_depositar')
const func_transferir = require('./func_transferir')

// Livro Diário
const func_lancamento = require('./func_lancamento').func_lancamento

// View
app.set('view engine', 'ejs')
app.use(expressLayouts)
app.use(bodyparser.urlencoded({ extended: false }))
app.use(bodyparser.json())

// Rotas
// Menu
app.get('/', function(req, res) {
  res.render('pages/home')
})

// Funcionalidades
func_pessoa(app)

func_banco(app)
func_conta(app)
func_aplicacao(app)

func_depositar(app)
func_transferir(app)

func_lancamento(app)

// main
const porta = 1234;
app.listen(porta, function() {
  console.log('NN Investimentos v0.1\nServidor rodando na porta %s...', porta);
})
