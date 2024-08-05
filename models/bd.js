const seq = require('sequelize')

// BD
const banco_dados = new seq('nn_inv', 'root', '', {
  storage: 'sequelize.sqlite',
  dialect: 'sqlite'
})

// Exports
module.exports = {
  seq: seq,
  banco_dados: banco_dados
}
