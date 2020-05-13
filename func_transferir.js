const func_transferir = function(app) {

  // Models
  const bd                  = require('./models/bd')
  const tb_grupo_lancamento = require('./models/grupo_lancamento')
  const tb_lancamento       = require('./models/lancamento')
  const tb_aplicacao        = require('./models/aplicacao')
  const tb_conta            = require('./models/conta')
  const tb_pessoa           = require('./models/pessoa')

  const lancamento_tipos  = require('./func_lancamento').lancamento_tipos
  const aplicacao_classes = require('./func_aplicacao').aplicacao_classes

  const util = require('./util')
  const ptbr_nfmt = new Intl.NumberFormat('pt-BR', { style: 'decimal', minimumFractionDigits: 2 })

  app.get('/transferir/cadastrar', function(req, res) {
    res.redirect('/transferir/cadastrar/' + new Date().toISOString().substr(0, 10))
  })

  app.get('/transferir/cadastrar/:n_data_ref', function(req, res) {

    const data_ref = new Date(req.params.n_data_ref)

    tb_aplicacao.findAll({
      attributes: ['id', 'nome', 'classe', 'dia_ref'],
      where: {
        inicio: { [bd.seq.Op.lte]: data_ref },
        [bd.seq.Op.or]: [
          { fim: null },
          { fim: { [bd.seq.Op.gte]: data_ref }}
        ],
        where: bd.seq.where(
          bd.seq.col('contum.apl_padrao'),
          bd.seq.col('aplicacao.classe'),
        ),
      },
      order: [
        [{ model: tb_conta }, 'id_pessoa', 'ASC'],
        ['classe', 'ASC'],
        ['id_conta', 'ASC'],
        ['dia_ref', 'ASC'],
      ],
      include: [{
        model: tb_conta,
        required: true,
        attributes: ['alias', 'apl_padrao'],
        include: [{
          model: tb_pessoa,
          required: true,
          attributes: ['apelido'],
        }]
      }]
    }).then(function (dados) {

      prms_saldo_apl = []
      for (let i = 0; i < dados.length; i++) {
        // Formata a aplicação
        dados[i].nome_fmt = aplicacao_classes[dados[i].classe - 1].desc
        if (dados[i].nome)
          dados[i].nome_fmt += ' ' + dados[i].nome
        if (aplicacao_classes[dados[i].classe - 1].desc == 'Mesversário Poupança')
          dados[i].nome_fmt += ' ' + dados[i].dia_ref
        dados[i].nome_fmt += ' - ' + dados[i].contum.alias + ' (' + dados[i].contum.pessoa.apelido + ')'

        // Cálculo de saldo
        prms_saldo_apl.push(
          Promise.all(
            [tb_lancamento.sum('entrada', { where: { id_aplicacao: dados[i].id, data: { [bd.seq.Op.lte]: data_ref } }}),
             tb_lancamento.sum('saida',   { where: { id_aplicacao: dados[i].id, data: { [bd.seq.Op.lte]: data_ref } }})]
          ).then(function (prms) {
            dados[i].saldo_fmt = ptbr_nfmt.format(prms[0] - prms[1])
          })
        )
      }

      Promise.all(prms_saldo_apl).then(() => {
        res.render('pages/transferir_cadastrar', {
          data_ref:   req.params.n_data_ref,
          aplicacoes: dados,
        })
      })
    })
  })

  app.post('/transferir/cadastrar', function(req, res) {

    tb_grupo_lancamento.create({}).then((dado) => {

      // De
      const transf_id = lancamento_tipos.find((tipo) => tipo.desc == 'Transferência').id
      let lctos = []
      let total_transf = 0.0

      if (Array.isArray(req.body.ids_aplicacao_de))
      {
        for (let i = 0; i < req.body.ids_aplicacao_de.length; i++) {
          let valor = parseFloat(req.body.valores_aplicacao_de[i].replace(',', '.'))
          total_transf += valor
          lctos.push({
            id_aplicacao: req.body.ids_aplicacao_de[i],
            data:         req.body.data,
            tipo:         transf_id,
            entrada:      0.0,
            saida:        valor.toFixed(2),
            funcao:       'transferir',
            id_grupo:     dado.id,
          })
        }
      }
      else
      {
        let valor = parseFloat(req.body.valores_aplicacao_de.replace(',', '.'))
        total_transf += valor
        lctos.push({
          id_aplicacao: req.body.ids_aplicacao_de,
          data:         req.body.data,
          tipo:         transf_id,
          entrada:      0.0,
          saida:        valor.toFixed(2),
          funcao:       'transferir',
          id_grupo:     dado.id,
        })
      }

      // Para
      lctos.push({
        id_aplicacao: req.body.id_aplicacao_para,
        data:         req.body.data,
        tipo:         transf_id,
        entrada:      total_transf.toFixed(2),
        saida:        0.0,
        funcao:       'transferir',
        id_grupo:     dado.id,
      })

      lctos.forEach((l) => {
        tb_lancamento.create(l)
      })
      res.redirect('/transferir/listar')
    })

  })

  app.get('/transferir/listar', function(req, res) {

    tb_lancamento.findAll({
      attributes: ['data', 'id_grupo', 'entrada', 'saida'],
      where: {
        tipo: [ lancamento_tipos.find((tipo) => tipo.desc == 'Transferência').id ],
        id_grupo: { [bd.seq.Op.ne]: null },
      },
      order: [['data', 'DESC'], ['id_grupo', 'DESC'], ['saida', 'DESC'], ['entrada', 'DESC']],
      include: [{
        model: tb_aplicacao,
        required: true,
        include: [{
          model: tb_conta,
          required: true,
          include: [{
            model: tb_pessoa,
            required: true
          }]
        }]
      }]
    }).then(function (dados) {

      pr_count_lcto = tb_lancamento.count({
        where: { tipo: [ lancamento_tipos.find((tipo) => tipo.desc == 'Transferência').id ],
                 id_grupo: { [bd.seq.Op.ne]: null }, },
      })

      // Formatações
      dados.forEach(function(dado) {
        // Formata a aplicação
        dado.aplicacao_fmt = aplicacao_classes[dado.aplicacao.classe - 1].desc
        if (dado.aplicacao.nome)
          dado.aplicacao_fmt += ' ' + dado.aplicacao.nome
        if (aplicacao_classes[dado.aplicacao.classe - 1].desc == 'Mesversário Poupança')
            dado.aplicacao_fmt += ' ' + dado.aplicacao.dia_ref
        dado.aplicacao_fmt += ' - '+ dado.aplicacao.contum.alias + ' (' + dado.aplicacao.contum.pessoa.apelido + ') '

        // Data, valores
        dado.data_fmt = util.strISODateBR(dado.data)
        dado.entrada_fmt = ptbr_nfmt.format(dado.entrada)
        dado.saida_fmt = ptbr_nfmt.format(dado.saida)
      })

      // Agrupar os lançamentos pelo grupo
      let groupBy = function(xs, key) {
        return xs.reduce(function(rv, x) {
          (rv[x[key]] = rv[x[key]] || []).push(x)
          return rv
        }, {})
      }

      let transf = groupBy(dados, 'id_grupo')
      let grupos_lcto = Object.keys(transf)

      grupos_lcto.sort((l, r) => {
        if (transf[l][0].data < transf[r][0].data)
          return 1
        else if (transf[l][0].data > transf[r][0].data)
          return -1
        return 0
      })

      // Somatório
      grupos_lcto.forEach((grp) => {
        let soma = 0.0
        transf[grp].forEach((dado) => {
          soma += Number(dado.saida)
        })
        transf[grp][0].total_transf_fmt = ptbr_nfmt.format(soma)
      })

      Promise.all([pr_count_lcto]).then(function (prms) {

        n_paginas = {
          total:      prms[0],
        }

        res.render('pages/transferir_listar', {
          transferencias: transf,
          grupos_lcto:    grupos_lcto,
          n_paginas:      n_paginas,
        })
      })
    })

  })

}

// Exports
module.exports = func_transferir
