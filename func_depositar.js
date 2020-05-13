const func_depositar = function(app) {

  // Models
  const bd            = require('./models/bd')
  const tb_lancamento = require('./models/lancamento')
  const tb_aplicacao  = require('./models/aplicacao')
  const tb_conta      = require('./models/conta')
  const tb_pessoa     = require('./models/pessoa')

  const lancamento_tipos   = require('./func_lancamento').lancamento_tipos
  const aplicacao_classes  = require('./func_aplicacao').aplicacao_classes
  const aplicacao_dias_ref = require('./func_aplicacao').aplicacao_dias_ref

  const util = require('./util')
  const ptbr_nfmt = new Intl.NumberFormat('pt-BR', { style: 'decimal', minimumFractionDigits: 2 })

  app.get('/depositar/cadastrar', function(req, res) {
    res.redirect('/depositar/cadastrar/' + new Date().toISOString().substr(0, 10) + '/todos')
  })

  app.get('/depositar/cadastrar/:n_data_ref/:n_pessoa', function(req, res) {

    const data_ref = new Date(req.params.n_data_ref)

    // Combo de pessoas
    const pr_pessoas = tb_pessoa.findAll()

    // Combo de aplicação
    let prms_saldo_apl = []
    let pr_aplicacao = Promise.resolve([{ id: '', nome_fmt: 'Selecione uma pessoa', classe: 1, poup: 0 }])
    if (req.params.n_pessoa != 'todos')
    {
      pr_aplicacao = tb_aplicacao.findAll({
        attributes: ['id', 'classe', 'nome', 'id_conta', 'dia_ref'],
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
            attributes: [],
            where: { id: req.params.n_pessoa },
          }]
        }]
      }).then(function (dados) {

        for (let i = 0; i < dados.length; i++) {
          // Formata a aplicação
          dados[i].nome_fmt = aplicacao_classes[dados[i].classe - 1].desc
          if (dados[i].nome)
            dados[i].nome_fmt += ' ' + dados[i].nome
          dados[i].nome_fmt += ' - ' + dados[i].contum.alias

          // Calculo saldo da aplicação
          prms_saldo_apl.push(
            Promise.all(
              [tb_lancamento.sum('entrada', { where: { id_aplicacao: dados[i].id, data: { [bd.seq.Op.lte]: data_ref } }}),
               tb_lancamento.sum('saida',   { where: { id_aplicacao: dados[i].id, data: { [bd.seq.Op.lte]: data_ref } }})]
            ).then(function (prms) {
              dados[i].saldo_fmt = ptbr_nfmt.format(prms[0] - prms[1])
              dados[i].poup = 0
            })
          )
        }

        return dados
      })
    }

    Promise.all([pr_pessoas, pr_aplicacao]).then(function (prms) {
      Promise.all(prms_saldo_apl).then(function() {

        let apl_dados = prms[1]
        let apl_fmt = []
        let mesversarios_poup = []
        if (apl_dados.length == 0)
          apl_fmt.push({ id: '', nome_fmt: 'Nenhuma aplicação encontrada' })
        else
        {
          // Separação das aplicações separando poupanças
          let ult_poup_id = 0
          apl_dados.forEach((dado) => {
            if (aplicacao_classes[dado.classe - 1].desc == 'Mesversário Poupança')
            {
              if (ult_poup_id != dado.id_conta)
              {
                apl_fmt.push({
                  id:        'p' + dado.id_conta,
                  id_conta:  dado.id_conta,
                  nome_fmt:  dado.nome_fmt,
                  saldo_fmt: '0,00',
                  poup:      1,
                })
                mesversarios_poup.push(dado.id_conta)
                mesversarios_poup[dado.id_conta] = []

                ult_poup_id = dado.id_conta
              }

              mesversarios_poup[dado.id_conta].push({
                id:        dado.id,
                saldo_fmt: dado.saldo_fmt,
                dia_ref:   dado.dia_ref,
              })
            }
            else
            {
              apl_fmt.push({
                id:        dado.id,
                id_conta:  dado.id_conta,
                nome_fmt:  dado.nome_fmt,
                saldo_fmt: dado.saldo_fmt,
                poup:      0,
              })
            }
          })

        }

        res.render('pages/depositar_cadastrar', {
          data_ref:           req.params.n_data_ref,
          aplicacao_dias_ref: aplicacao_dias_ref,
          aplicacoes:         apl_fmt,
          pessoas_sel:        req.params.n_pessoa,
          pessoas:            prms[0],
          mesversarios_poup:  mesversarios_poup,
        })
      })
    })

  })

  app.post('/depositar/cadastrar', function(req, res) {

    // Definir a aplicação
    let id_apl = req.body.id_aplicacao
    let pr_nova_apl = Promise.resolve()

    // Poupança existente
    if (id_apl.substr(0, 1) == 'p')
    {
      let cta_poup = id_apl.substr(1)
      id_apl = req.body['cta' + cta_poup + '_apl_dia_ref']

      // Poupança nova
      if (id_apl == 0)
      {
        pr_nova_apl = tb_aplicacao.create({
          id_conta: cta_poup,
          classe:   aplicacao_classes.find((classe) => classe.desc == 'Mesversário Poupança').id,
          inicio:   req.body.data,
          dia_ref:  req.body.aplicacao_dia_ref
        }).then((novo) => id_apl = novo.id)
      }
    }

    Promise.all([pr_nova_apl]).then(() => {
      // Gera lançamento
      let lcto_novo = {
        id_aplicacao: id_apl,
        data:         req.body.data,
        tipo:         lancamento_tipos.find((tipo) => tipo.desc == 'Depósito').id,
        entrada:      parseFloat(req.body.entrada.replace(',', '.')).toFixed(2),
        saida:        0.0,
        funcao:       'depositar'
      }

      tb_lancamento.create(lcto_novo).then(() => res.redirect('/depositar/listar'))
    })
  })

  app.get('/depositar/editar/:id', function(req, res) {

    tb_lancamento.findByPk(req.params.id, {
      attributes: ['id', 'data', 'entrada'],
      include: [{
        model: tb_aplicacao,
        required: true,
        attributes: ['id', 'classe', 'nome', 'dia_ref'],
        include: [{
          model: tb_conta,
          required: true,
          attributes: ['id', 'alias'],
          include: [{
            model: tb_pessoa,
            required: true,
            attributes: ['nome', 'apelido'],
          }]
        }]
      }]
    }).then((dado)  => {
      if (dado)
      {
        // Formatar dados
        // Dados gerais
        dado.data_ref_fmt = dado.data.toISOString().substr(0, 10)
        dado.pessoa_fmt = dado.aplicacao.contum.pessoa.nome + ' (' + dado.aplicacao.contum.pessoa.apelido + ')'
        dado.poup = aplicacao_classes[dado.aplicacao.classe - 1].desc == 'Mesversário Poupança'

        // Aplicação
        dado.apl_fmt = aplicacao_classes[dado.aplicacao.classe - 1].desc
        if (dado.aplicacao.nome)
          dado.apl_fmt += ' ' + dado.aplicacao.nome
        dado.apl_fmt += ' - ' + dado.aplicacao.contum.alias

        let filtro = {
          where: {
            id: { [bd.seq.Op.ne]: dado.id },
            id_aplicacao: dado.aplicacao.id,
            data: { [bd.seq.Op.lte]: dado.data }
          }
        }

        Promise.all(
          [tb_lancamento.sum('entrada', filtro),
           tb_lancamento.sum('saida',   filtro)]
        ).then(function (prms) {
          let saldo = prms[0] - prms[1]

          dado.entrada_fmt = ptbr_nfmt.format(dado.entrada)
          dado.saldo_fmt = ptbr_nfmt.format(saldo)
          dado.saldo_depois_fmt = ptbr_nfmt.format(saldo + parseFloat(dado.entrada))

          res.render('pages/depositar_editar', { deposito: dado })
        })
      }
      else
        res.redirect('/depositar/listar')
    })

  })

  app.post('/depositar/editar/:id', function(req, res) {

    tb_lancamento.update({
      entrada: parseFloat(req.body.entrada.replace('.', '').replace(',', '.')).toFixed(2)
    }, { where: { id: req.params.id }}).then(function() {
      res.redirect('/depositar/listar')
    })

  })

  app.get('/depositar/listar', function(req, res) {
    res.redirect('/depositar/listar/1')
  })

  app.get('/depositar/listar/:n_pagina', function(req, res) {

    // Busca os lançamentos
    const n_elem_pagina = 20
    tb_lancamento.findAll({
      limit: n_elem_pagina,
      offset: (req.params.n_pagina - 1) * n_elem_pagina,
      where: { tipo: [lancamento_tipos.find((tipo) => tipo.desc == 'Depósito').id,
                      lancamento_tipos.find((tipo) => tipo.desc == 'Inventário').id ]
      },
      order: [['data', 'DESC'], ['id_aplicacao', 'DESC'], ['id', 'DESC']],
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

      // Formata as datas e modalidades
      dados.forEach(function (dado) {
        // Formata a aplicação
        dado.aplicacao_fmt = aplicacao_classes[dado.aplicacao.classe - 1].desc
        if (dado.aplicacao.nome)
          dado.aplicacao_fmt += ' ' + dado.aplicacao.nome
        if (aplicacao_classes[dado.aplicacao.classe - 1].desc == 'Mesversário Poupança')
            dado.aplicacao_fmt += ' ' + dado.aplicacao.dia_ref
        dado.aplicacao_fmt += ' - '+ dado.aplicacao.contum.alias + ' (' + dado.aplicacao.contum.pessoa.apelido + ') '

        // Data, tipo e valores
        dado.data_fmt = util.strISODateBR(dado.data)
        dado.tipo_fmt = lancamento_tipos.find((tipo) => tipo.id == dado.tipo).desc
        dado.entrada_fmt = ptbr_nfmt.format(dado.entrada)
      })

      pr_count_lcto = tb_lancamento.count({
        where: { tipo: lancamento_tipos.find((tipo) => tipo.desc == 'Depósito').id },
      })

      Promise.all([pr_count_lcto]).then((prms) => {

        n_paginas = {
          num: Math.ceil(prms[0] / n_elem_pagina),
          atual: req.params.n_pagina,
          por_pagina: dados.length,
          total: prms[0],
        }

        res.render('pages/depositar_listar', { lancamentos: dados, n_paginas: n_paginas })
      })
    })
  })

  app.get('/depositar/apagar/:id', function(req, res) {
    tb_lancamento.findByPk(req.params.id, {
      attributes: ['id', 'data', 'entrada'],
      include: [{
        model: tb_aplicacao,
        required: true,
        attributes: ['id', 'classe', 'nome', 'dia_ref'],
        include: [{
          model: tb_conta,
          required: true,
          attributes: ['id', 'alias'],
          include: [{
            model: tb_pessoa,
            required: true,
            attributes: ['nome', 'apelido'],
          }]
        }]
      }]
    }).then((dado) => {
      if (dado)
      {
        // Formatar dados
        // Dados gerais
        dado.data_ref_fmt = dado.data.toISOString().substr(0, 10)
        dado.pessoa_fmt = dado.aplicacao.contum.pessoa.nome + ' (' + dado.aplicacao.contum.pessoa.apelido + ')'
        dado.poup = aplicacao_classes[dado.aplicacao.classe - 1].desc == 'Mesversário Poupança'

        // Aplicação
        dado.apl_fmt = aplicacao_classes[dado.aplicacao.classe - 1].desc
        if (dado.aplicacao.nome)
          dado.apl_fmt += ' ' + dado.aplicacao.nome
        dado.apl_fmt += ' - ' + dado.aplicacao.contum.alias

        let filtro = {
          where: {
            id: { [bd.seq.Op.ne]: dado.id },
            id_aplicacao: dado.aplicacao.id,
            data: { [bd.seq.Op.lte]: dado.data }
          }
        }

        Promise.all(
          [tb_lancamento.sum('entrada', filtro),
           tb_lancamento.sum('saida',   filtro)]
        ).then(function (prms) {
          let saldo = prms[0] - prms[1]

          dado.entrada_fmt = ptbr_nfmt.format(dado.entrada)
          dado.saldo_fmt = ptbr_nfmt.format(saldo)
          dado.saldo_depois_fmt = ptbr_nfmt.format(saldo + parseFloat(dado.entrada))

          res.render('pages/depositar_apagar', { deposito: dado })
        })
      }
      else
        res.redirect('/depositar/listar')
    })
  })

  app.post('/depositar/apagar/:id', function(req, res) {
    tb_lancamento.destroy({ where: { id: req.params.id }}).then(() => res.redirect('/depositar/listar'))
  })

}

// Exports
module.exports = func_depositar
