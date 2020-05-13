const seq = require('sequelize')

// BD
const banco_dados = new seq('nn_inv', 'nninv_nodeusr', '123', {
  host: 'localhost',
  dialect: 'mysql'
})

// Exports
module.exports = {
  seq: seq,
  banco_dados: banco_dados
}
