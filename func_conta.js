const func_conta = function(app) {

  // Includes
  const util = require('./util')

  // Constantes
  const modalidades = [
    { id: 1, desc: 'Conta Corrente' },
    { id: 2, desc: 'Corretora' },
    { id: 3, desc: 'Moeda' },
    { id: 4, desc: 'Poupança' }
  ]

  // Models
  const tb_conta  = require('./models/conta')
  const tb_pessoa = require('./models/pessoa')
  const tb_banco  = require('./models/banco')
  const aplicacao_classes = require('./func_aplicacao').aplicacao_classes

  // Rotas
  app.get('/contas/cadastrar', function(req, res) {
    const f1 = tb_pessoa.findAll({ order: [['apelido', 'ASC']]})
    const f2 = tb_banco.findAll({ order: [['codigo', 'ASC']]})

    Promise.all([f1, f2]).then(function (dados) {
      res.render('pages/conta_cadastro', {
        pessoas: dados[0],
        bancos : dados[1],
        modalidades: modalidades,
        aplicacao_classes: aplicacao_classes,
      })
    })
  })

  app.post('/contas/cadastrar', function(req, res) {
    var nova = {
      id_pessoa:  req.body.id_pessoa,
      id_banco:   req.body.id_banco,
      alias:      req.body.alias,
      agencia:    req.body.agencia,
      numero:     req.body.numero,
      inicio:     req.body.inicio,
      modalidade: req.body.modalidade,
      apl_padrao: req.body.apl_padrao,
    }
    if (req.body.fim)
      nova.fim = req.body.fim

    tb_conta.create(nova)
    res.redirect('/contas/listar')
  })

  app.get('/contas/editar/:id', function(req, res) {
    tb_conta.findByPk(req.params.id).then(function (dado) {
      if (!dado)
        res.redirect('/contas/listar')
      else
      {
        // Buscas no bd
        const f1 = tb_pessoa.findAll({ order: [['apelido', 'ASC']]}).then(function(pessoas) {
          pessoas.forEach(function(p) {
            if (dado.id_pessoa == p.id)
              p.sel = 'selected'
          })

          return pessoas
        })
        const f2 = tb_banco.findAll({ order: [['codigo', 'ASC']]}).then(function(bancos) {
          bancos.forEach(function(b) {
            if (dado.id_banco == b.id)
              b.sel = 'selected'
          })

          return bancos
        })

        // Formatação das datas
        dado.inicio_fmt = dado.inicio.toISOString().substr(0, 10)
        if (dado.fim)
          dado.fim_fmt = dado.fim.toISOString().substr(0, 10)

        // modalidade selecionado
        var modalidades_fmt = new Array()
        modalidades.forEach(function(m) {
          if (dado.modalidade == m.id)
            modalidades_fmt.push({ id: m.id, desc: m.desc, sel: 'selected' })
          else
            modalidades_fmt.push({ id: m.id, desc: m.desc })
        })

        // aplicação padrão selecionada
        var aplicacao_classes_fmt = new Array()
        aplicacao_classes.forEach(function(m) {
          if (dado.apl_padrao == m.id)
            aplicacao_classes_fmt.push({ id: m.id, desc: m.desc, sel: 'selected' })
          else
            aplicacao_classes_fmt.push({ id: m.id, desc: m.desc })
        })

        // Por fim renderiza
        Promise.all([f1, f2]).then(function (dados_lookup) {
          res.render('pages/conta_editar', {
            conta : dado,
            pessoas : dados_lookup[0],
            bancos : dados_lookup[1],
            modalidades : modalidades_fmt,
            aplicacao_classes: aplicacao_classes_fmt,
          })
        })
      }
    })
  })

  app.post('/contas/editar/:id', function(req, res) {
    var atualizado = {
      id_pessoa:  req.body.id_pessoa,
      id_banco:   req.body.id_banco,
      alias:      req.body.alias,
      agencia:    req.body.agencia,
      numero:     req.body.numero,
      inicio:     req.body.inicio,
      modalidade: req.body.modalidade,
      apl_padrao: req.body.apl_padrao,
    }
    if (req.body.fim || req.body.fim == '')
      atualizado.fim = null

    tb_conta.update(atualizado, { where: { id: req.params.id }}).then(() => res.redirect('/contas/listar'))
  })

  app.get('/contas/listar', function(req, res) {
    tb_conta.findAll({
      order: [['id_pessoa', 'ASC'], ['alias', 'ASC']],
      include: [tb_pessoa, tb_banco]
    }).then(function (dados) {

      // Formata as datas e modalidades
      dados.forEach(function (dado) {
        dado.inicio_fmt = util.strISODateBR(dado.inicio)

        if (dado.fim)
          dado.fim_fmt = util.strISODateBR(dado.fim)

        dado.modalidade_fmt = modalidades[dado.modalidade - 1].desc

        if (dado.banco)
          dado.banco_fmt = dado.banco.nome
      })

      n_paginas = {
        por_pagina: dados.length,
        total: dados.length,
      }

      // Por fim renderiza
      res.render('pages/conta_listar', { contas: dados, n_paginas: n_paginas })
    })
  })

  app.get('/contas/apagar/:id', function(req, res) {
    tb_conta.findByPk(req.params.id, { include: [tb_pessoa, tb_banco] }).then(function (dado) {
      if (!dado)
        res.redirect('/contas/listar')
      else
      {
        // Formatação das datas
        dado.inicio_fmt = dado.inicio.toISOString().substr(0, 10)
        if (dado.fim)
          dado.fim_fmt = dado.fim.toISOString().substr(0, 10)

        // Modalidade e aplicação padrão
        modalidade_fmt = modalidades[dado.modalidade - 1].desc
        aplicacao_classes_fmt = aplicacao_classes[dado.apl_padrao - 1].desc

        // Por fim renderiza
        res.render('pages/conta_apagar', { conta: dado, modalidade_fmt: modalidade_fmt })
      }
    })
  })

  app.post('/contas/apagar/:id', function(req, res) {
    tb_conta.destroy({ where: { id: req.params.id }}).then(() => res.redirect('/contas/listar'))
  })

}

// Exports
module.exports = func_conta
