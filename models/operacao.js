// Includes
const bd           = require('./bd')
const tb_aplicacao = require('./aplicacao')

const tb_operacao = bd.banco_dados.define('operacao', {
  tipo:     { type: bd.seq.STRING(255), allowNull: false },
  natureza: { type: bd.seq.CHAR(1), allowNull: false}
}, { underscored: true, freezeTableName: true })

// Cria a estrutura no bd
//tb_operacao.sync({force: true})

// Exports
module.exports = tb_operacao
