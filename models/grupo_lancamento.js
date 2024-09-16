// Includes
const bd = require('./bd')

const tb_grupo_lancamento = bd.banco_dados.define('lancamento_agrup', {
}, { underscored: true, freezeTableName: true })

// Cria a estrutura no bd
//tb_grupo_lancamento.sync({force: true})

// Exports
module.exports = tb_grupo_lancamento
