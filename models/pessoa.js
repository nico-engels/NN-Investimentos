// Includes
const bd = require('./bd')

const tb_pessoa = bd.banco_dados.define('pessoa', {
  nome:    { type: bd.seq.STRING(255), allowNull: false },
  apelido: { type: bd.seq.STRING(7), allowNull: false }
}, { underscored: true, freezeTableName: true })

// Cria a estrutura no bd
//tb_pessoa.sync({force: true})

// Exports
module.exports = tb_pessoa
