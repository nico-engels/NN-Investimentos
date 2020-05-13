// Constantes
const classes = [
  { id:  1, desc: 'Saldo' },
  { id:  2, desc: 'Mesversário Poupança' },
  { id:  3, desc: 'LCI' },
  { id:  4, desc: 'LCA' },
  { id:  5, desc: 'CDB' },
  { id:  6, desc: 'RDB' },
  { id:  7, desc: 'Câmbio' },
  { id:  8, desc: 'FII' },
  { id:  9, desc: 'Ação' },
  { id: 10, desc: 'Fundo' },
  { id: 11, desc: 'Mesversário FGTS' },
]

// Constantes
const dias_ref = [
  { id:  1, desc: '01' }, { id:  2, desc: '02' }, { id:  3, desc: '03' }, { id:  4, desc: '04' },
  { id:  5, desc: '05' }, { id:  6, desc: '06' }, { id:  7, desc: '07' }, { id:  8, desc: '08' },
  { id:  9, desc: '09' }, { id: 10, desc: '10' }, { id: 11, desc: '11' }, { id: 12, desc: '12' },
  { id: 13, desc: '13' }, { id: 14, desc: '14' }, { id: 15, desc: '15' }, { id: 16, desc: '16' },
  { id: 17, desc: '17' }, { id: 18, desc: '18' }, { id: 19, desc: '19' }, { id: 20, desc: '20' },
  { id: 21, desc: '21' }, { id: 22, desc: '22' }, { id: 23, desc: '23' }, { id: 24, desc: '24' },
  { id: 25, desc: '25' }, { id: 26, desc: '26' }, { id: 27, desc: '27' }, { id: 28, desc: '28' }
]

const func_aplicacao = function(app) {

  // Includes
  const util = require('./util')

  // Models
  const tb_aplicacao = require('./models/aplicacao')
  const tb_conta     = require('./models/conta')
  const tb_pessoa    = require('./models/pessoa')

  // Rotas
  app.get('/aplicacoes/cadastrar', function(req, res) {
    tb_conta.findAll({
      order: [['id_pessoa', 'ASC'], ['alias', 'ASC']],
      include: [tb_pessoa]
    }).then((dados) =>
       res.render('pages/aplicacao_cadastro', { contas: dados, classes: classes, dias_ref: dias_ref })
    )
  })

  app.post('/aplicacoes/cadastrar', function(req, res) {
    var nova = {
      id_conta: req.body.id_conta,
      classe:   req.body.classe,
      nome:     req.body.nome,
      inicio:   req.body.inicio
    }
    if (req.body.dia_ref)
      nova.dia_ref = req.body.dia_ref

    if (req.body.fim)
      nova.fim = req.body.fim

    tb_aplicacao.create(nova).then(() => res.redirect('/aplicacoes/listar'))
  })

  app.get('/aplicacoes/editar/:id', function(req, res) {
    tb_aplicacao.findByPk(req.params.id).then(function (dado) {
      if (!dado)
        res.redirect('/aplicacoes/listar')
      else
      {
        // Buscas no bd
        const f1 = tb_conta.findAll({
          order: [['id_pessoa', 'ASC'], ['alias', 'ASC']],
          include: [tb_pessoa]
        }).then(function(contas) {
          contas.forEach(function(c) {
            if (dado.id_conta == c.id)
              c.sel = 'selected'
          })

          return contas
        })

        // Classes
        var classes_fmt = new Array()
        classes.forEach(function(c) {
          if (dado.classe == c.id)
            classes_fmt.push({ id: c.id, desc: c.desc, sel: 'selected' })
          else
            classes_fmt.push({ id: c.id, desc: c.desc })
        })

        // Formatação das datas
        dado.inicio_fmt = dado.inicio.toISOString().substr(0, 10)
        if (dado.fim)
          dado.fim_fmt = dado.fim.toISOString().substr(0, 10)

        // Dia ref
        var dias_ref_fmt = new Array()
        dias_ref.forEach(function(d) {
          if (dado.dia_ref == d.id)
            dias_ref_fmt.push({ id: d.id, desc: d.desc, sel: 'selected' })
          else
            dias_ref_fmt.push({ id: d.id, desc: d.desc })
        })

        // Por fim renderiza
        Promise.all([f1]).then(function (dados_lookup) {
          res.render('pages/aplicacao_editar', {
            aplicacao: dado,
            contas: dados_lookup[0],
            classes_fmt: classes_fmt,
            dias_ref_fmt: dias_ref_fmt
          })
        })

      }
    })
  })

  app.post('/aplicacoes/editar/:id', function(req, res) {
    var atualizado = {
      id_conta: req.body.id_conta,
      classe:   req.body.classe,
      nome:     req.body.nome,
      inicio:   req.body.inicio,
      dia_ref:  req.body.dia_ref
    }
    if (req.body.fim || req.body.fim == '')
      atualizado.fim = null

    tb_aplicacao.update(atualizado, { where: { id: req.params.id }}).then(
      () => res.redirect('/aplicacoes/listar')
    )
  })

  app.get('/aplicacoes/listar', function(req, res) {
    res.redirect('/aplicacoes/listar/todos/todos/todos/vigentes/1')
  })

  app.get('/aplicacoes/listar/:n_pessoa/:n_conta/:n_classe/:n_vigente/:n_pagina', function(req, res) {

    // Filtro
    // Pessoa
    const pr_pessoas = tb_pessoa.findAll()
    var filtro_lista_pessoa = {}
    if (req.params.n_pessoa != 'todos')
      filtro_lista_pessoa.id = req.params.n_pessoa

    // Conta
    const pr_contas = tb_conta.findAll({ include: [{ model: tb_pessoa, where: filtro_lista_pessoa }]}).then((dados) => {
      dados.forEach(function (dado) {
        dado.desc_fmt = dado.alias
        if (req.params.n_pessoa == 'todos')
          dado.desc_fmt += ' (' + dado.pessoa.apelido  + ')'
      })
      return dados
    })
    var filtro_lista_consta = {}
    if (req.params.n_conta != 'todos')
      filtro_lista_consta.id = req.params.n_conta

    // Aplicação
    var filtro_lista_aplicacao = {}

    // Classe
    if (req.params.n_classe != 'todos')
      filtro_lista_aplicacao.classe = req.params.n_classe

    // Vigentes
    if (req.params.n_vigente != 'todos')
      filtro_lista_aplicacao.fim = null

    // Listagem de aplicações
    const n_elem_pagina = 20
    tb_aplicacao.findAll({
      limit: n_elem_pagina,
      offset: (req.params.n_pagina - 1) * n_elem_pagina,
      order: [['id_conta', 'ASC'], ['dia_ref', 'ASC'], ['inicio', 'ASC'], ['nome', 'ASC'], ['id', 'ASC']],
      where: filtro_lista_aplicacao,
      include: [{
        model: tb_conta,
        required: true,
        where: filtro_lista_consta,
        include: [{
          model: tb_pessoa,
          required: true,
          where: filtro_lista_pessoa,
        }]
      }]
    }).then(function (dados) {

      // Formata as datas e dias de referência
      dados.forEach(function (dado) {

        dado.conta_fmt = dado.contum.alias
        if (req.params.n_pessoa == 'todos')
          dado.conta_fmt += ' (' + dado.contum.pessoa.apelido + ')'

        dado.inicio_fmt = util.strISODateBR(dado.inicio)
        if (dado.fim)
          dado.fim_fmt = util.strISODateBR(dado.fim)

        dado.classe_fmt = classes[dado.classe - 1].desc

        if (dado.dia_ref)
          dado.dia_ref_fmt = dias_ref[dado.dia_ref - 1].desc
      })

      pr_count_apl = tb_aplicacao.count({
        where: filtro_lista_aplicacao,
        include: [{
          model: tb_conta,
          required: true,
          where: filtro_lista_consta,
          include: [{
            model: tb_pessoa,
            required: true,
            where: filtro_lista_pessoa,
          }]
        }]
      })

      Promise.all([pr_pessoas, pr_contas, pr_count_apl]).then(function (prms) {

        n_paginas = {
          num: Math.ceil(prms[2] / n_elem_pagina),
          atual: req.params.n_pagina,
          por_pagina: dados.length,
          total: prms[2],
        }

        res.render('pages/aplicacao_listar', {
          aplicacoes: dados,
          n_paginas: n_paginas,
          filtro_pessoas_sel: req.params.n_pessoa,
          filtro_pessoas: prms[0],
          filtro_contas_sel: req.params.n_conta,
          filtro_contas: prms[1],
          filtro_classes_sel: req.params.n_classe,
          filtro_classes: classes,
          filtro_vigentes_sel: req.params.n_vigente,
        })
      })
    })
  })

  app.get('/aplicacoes/apagar/:id', function(req, res) {
    tb_aplicacao.findByPk(req.params.id, {
      include: [{
        model: tb_conta,
        include: [tb_pessoa]
      }]
    }).then(function (dado) {
      if (!dado)
        res.redirect('/aplicacoes/listar')
      else
      {
        // Formata as datas e dias de referência
        dado.inicio_fmt = dado.inicio.toISOString().substr(0, 10)
        if (dado.fim)
          dado.fim_fmt = dado.fim.toISOString().substr(0, 10)

        dado.classe_fmt = classes[dado.classe - 1].desc

        dado.dia_ref_fmt = dias_ref[dado.dia_ref - 1].desc

        // Por fim renderiza
        res.render('pages/aplicacao_apagar', { aplicacao: dado })
      }
    })
  })

  app.post('/aplicacoes/apagar/:id', function(req, res) {
    tb_aplicacao.destroy({ where: { id: req.params.id }}).then(() => res.redirect('/aplicacoes/listar'))
  })

}

// Exports
module.exports = {
  func_aplicacao: func_aplicacao,
  aplicacao_classes: classes,
  aplicacao_dias_ref: dias_ref
}
