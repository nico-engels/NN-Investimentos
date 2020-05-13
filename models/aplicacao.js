// Includes
const bd       = require('./bd')
const tb_conta = require('./conta')

const tb_aplicacao = bd.banco_dados.define('aplicacao', {
  classe:  { type: bd.seq.INTEGER },
  nome:    { type: bd.seq.STRING(15) },
  inicio:  { type: bd.seq.DATE, allowNull: false },
  fim:     { type: bd.seq.DATE },
  dia_ref: { type: bd.seq.INTEGER }
}, { underscored: true, freezeTableName: true })

tb_aplicacao.belongsTo(tb_conta, {
  foreignKey: 'id_conta',
  onDelete: 'NO ACTION',
  onUpdate: 'NO ACTION'
})

// Cria a estrutura no bd
//tb_aplicacao.sync({force: true})

// Exports
module.exports = tb_aplicacao
