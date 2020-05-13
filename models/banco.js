// Includes
const bd = require('./bd')

const tb_banco = bd.banco_dados.define('banco', {
  codigo: { type: bd.seq.STRING(10), allowNull: false },
  nome:   { type: bd.seq.STRING(255), allowNull: false },
  cnpj:   { type: bd.seq.STRING(18), allowNull: false }
}, { underscored: true, freezeTableName: true })

// Cria a estrutura no bd
//banco.sync({force: true})

// Exports
module.exports = tb_banco
