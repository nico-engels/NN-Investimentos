// Includes
const bd                  = require('./bd')
const tb_aplicacao        = require('./aplicacao')
const tb_grupo_lancamento = require('./grupo_lancamento')

const tb_lancamento = bd.banco_dados.define('lancamento', {
  data:       { type: bd.seq.DATE },
  tipo:       { type: bd.seq.INTEGER, allowNull: false },
  entrada:    { type: bd.seq.DECIMAL(10, 2), allowNull: false },
  saida:      { type: bd.seq.DECIMAL(10, 2), allowNull: false },
  origem:     { type: bd.seq.STRING(25) },
  comentario: { type: bd.seq.STRING(255) },
}, { underscored: true, freezeTableName: true })

tb_lancamento.belongsTo(tb_aplicacao, {
  foreignKey: 'id_aplicacao',
  onDelete: 'NO ACTION',
  onUpdate: 'NO ACTION'
})

tb_lancamento.belongsTo(tb_grupo_lancamento, {
  foreignKey: 'id_grupo',
  onDelete: 'NO ACTION',
  onUpdate: 'NO ACTION'
})

// Cria a estrutura no bd
//tb_lancamento.sync({force: true})

// Exports
module.exports = tb_lancamento
