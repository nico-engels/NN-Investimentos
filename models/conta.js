// Includes
const bd        = require('./bd')
const tb_banco  = require('./banco')
const tb_pessoa = require('./pessoa')

const tb_conta = bd.banco_dados.define('conta', {
  alias:          { type: bd.seq.STRING(15), allowNull: false },
  agencia:        { type: bd.seq.STRING(10) },
  numero:         { type: bd.seq.STRING(20) },
  inicio:         { type: bd.seq.DATE, allowNull: false },
  fim:            { type: bd.seq.DATE },
  modalidade:     { type: bd.seq.INTEGER, allowNull: false },
  apl_padrao:     { type: bd.seq.INTEGER, allowNull: false },
  exibir_tr_rend: { type: bd.seq.INTEGER },
}, { underscored: true, freezeTableName: true })

tb_conta.belongsTo(tb_pessoa, {
  foreignKey: 'id_pessoa',
  onDelete: 'NO ACTION',
  onUpdate: 'NO ACTION'
})
tb_conta.belongsTo(tb_banco, {
  foreignKey: 'id_banco',
  onDelete: 'NO ACTION',
  onUpdate: 'NO ACTION'
})

// Cria a estrutura no bd
//tb_conta.sync({force: true})

// Exports
module.exports = tb_conta
