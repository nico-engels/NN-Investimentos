// Constantes
const tipos = [
  // Crédito
  { id: 001, desc: 'Depósito' },
  { id: 002, desc: 'Juro' },
  { id: 003, desc: 'Bônus' },
  { id: 004, desc: 'Valorização' },
  { id: 005, desc: 'Aluguel' },
  { id: 006, desc: 'Dividendos' },
  { id: 007, desc: 'JSCP' },
  { id: 008, desc: 'Reajuste TR' },
  { id: 009, desc: 'Venda' },
  // Débito
  { id: 100, desc: 'Saque' },
  { id: 101, desc: 'Desvalorização' },
  { id: 102, desc: 'I.R.' },
  { id: 103, desc: 'Compra Ativo' },
  { id: 104, desc: 'Corretagem' },
  // Ambos
  { id: 200, desc: 'Transferência' },
  { id: 201, desc: 'Aplicação' },
  { id: 202, desc: 'Resgate' },
  { id: 203, desc: 'Resgate Parcial' },
  { id: 204, desc: 'Inventário' },
]

const func_lancamento = function(app) {
  // Includes
  const aplicacao_classes = require('./func_aplicacao').aplicacao_classes
  const util = require('./util')

  const ptbr_nfmt = new Intl.NumberFormat('pt-BR', { style: 'decimal', minimumFractionDigits: 2 })

  // Models
  const bd            = require('./models/bd')
  const tb_lancamento = require('./models/lancamento')
  const tb_aplicacao  = require('./models/aplicacao')
  const tb_conta      = require('./models/conta')
  const tb_pessoa     = require('./models/pessoa')

  // Rotas
  app.get('/lancamentos/cadastrar', function(req, res) {

    tb_aplicacao.findAll({
      include: [{
        model: tb_conta,
        order: [['id_pessoa', 'ASC']],
        include: [tb_pessoa]
      }]
    }).then(function (dados) {

      dados.forEach(function (dado) {
        // Formata a aplicação
        dado.nome_fmt = aplicacao_classes[dado.classe - 1].desc
        if (dado.nome)
          dado.nome_fmt += ' ' + dado.nome
        if (aplicacao_classes[dado.classe - 1].desc == 'Mesversário Poupança')
          dado.nome_fmt += ' ' + dado.dia_ref

        dado.nome_fmt += ' - '+ dado.contum.alias + ' (' + dado.contum.pessoa.apelido + ') '
      })

      res.render('pages/lancamento_cadastro', { aplicacoes: dados, tipos: tipos })
    })
  })

  app.post('/lancamentos/cadastrar', function(req, res) {
    var novo = {
      id_aplicacao: req.body.id_aplicacao,
      data:         req.body.data,
      tipo:         req.body.tipo,
      funcao:       'manual'
    }
    if (req.body.natureza == 'C')
    {
      novo.entrada = parseFloat(req.body.valor.replace(',', '.')).toFixed(2)
      novo.saida = 0.0
    }
    else
    {
      novo.entrada = 0.0
      novo.saida = parseFloat(req.body.valor.replace(',', '.')).toFixed(2)
    }

    tb_lancamento.create(novo).then(() => res.redirect('/lancamentos/listar'))
  })

  app.get('/lancamentos/editar/:id', function(req, res) {
    tb_lancamento.findByPk(req.params.id).then(function (l) {
      if (!l)
        res.redirect('/lancamentos/listar')
      else
      {
        tb_aplicacao.findAll({
          include: [{
            order: [['id_pessoa', 'ASC']],
            model: tb_conta,
            include: [tb_pessoa]
          }]
        }).then(function (dados) {

          dados.forEach(function (dado) {
            // Formata a aplicação
            dado.nome_fmt = aplicacao_classes[dado.classe - 1].desc
            if (dado.nome)
              dado.nome_fmt += ' ' + dado.nome
            dado.nome_fmt += ' - '+ dado.contum.alias + ' (' + dado.contum.pessoa.apelido + ') '

            if (l.id_aplicacao == dado.id)
              dado.sel = 'selected'
          })

          // Formatação dos campos
          // Débito/Crédito e valor
          l.data_fmt = l.data.toISOString().substr(0, 10)
          if (l.entrada > 0)
          {
            l.valor_fmt = ptbr_nfmt.format(l.entrada)
            l.credito_chk = 'checked'
          }
          else
          {
            l.valor_fmt = ptbr_nfmt.format(l.saida)
            l.debito_chk = 'checked'
          }

          // Tipo selecionado
          var tipos_fmt = new Array()
          tipos.forEach(function(t) {
            if (l.tipo == t.id)
              tipos_fmt.push({ id: t.id, desc: t.desc, sel: 'selected' })
            else
              tipos_fmt.push({ id: t.id, desc: t.desc })
          })

          res.render('pages/lancamento_editar', { lancamento: l, aplicacoes: dados, tipos: tipos_fmt })
        })
      }
    })
  })

  app.post('/lancamentos/editar/:id', function(req, res) {
    var atualizado = {
      id_aplicacao: req.body.id_aplicacao,
      data:         req.body.data,
      tipo:         req.body.tipo,
    }
    if (req.body.natureza == 'C')
    {
      atualizado.entrada = parseFloat(req.body.valor.replace(',', '.')).toFixed(2)
      atualizado.saida = 0.0
    }
    else
    {
      atualizado.entrada = 0.0
      atualizado.saida = parseFloat(req.body.valor.replace(',', '.')).toFixed(2)
    }

    tb_lancamento.update(atualizado, { where: { id: req.params.id }}).then(() => res.redirect('/lancamentos/listar'))
  })

  app.get('/lancamentos/listar', function(req, res) {
    res.redirect('/lancamentos/listar/todos/todos/todos/1')
  })

  app.get('/lancamentos/listar/:n_pessoa/:n_conta/:n_aplicacao/:n_pagina', function(req, res) {

    // Filtro
    const pr_pessoas = tb_pessoa.findAll()
    const filtro_lista_pessoa = {}
    if (req.params.n_pessoa != 'todos')
      filtro_lista_pessoa.id = req.params.n_pessoa

    const pr_contas = tb_conta.findAll({ include: [{ model: tb_pessoa, where: filtro_lista_pessoa }]}).then((dados) => {
      dados.forEach(function (dado) {
        dado.desc_fmt = dado.alias
        if (req.params.n_pessoa == 'todos')
          dado.desc_fmt += ' (' + dado.pessoa.apelido  + ')'
      })
      return dados
    })
    const filtro_lista_conta = {}
    if (req.params.n_conta != 'todos')
      filtro_lista_conta.id = req.params.n_conta

    var pr_aplicacao = Promise.resolve([{ id: '', nome_fmt: 'Selecione uma conta' }])
    const filtro_lista_aplicacao = {}
    if (req.params.n_conta != 'todos')
    {
      pr_aplicacao = tb_aplicacao.findAll({ include: [{ model: tb_conta, where: filtro_lista_conta }]}).then((apls) => {
        apls.forEach((apl) => {
          apl.nome_fmt = aplicacao_classes[apl.classe - 1].desc
          if (apl.nome)
            apl.nome_fmt += ' ' + apl.nome
          if (aplicacao_classes[apl.classe - 1].desc == 'Mesversário Poupança')
            apl.nome_fmt += ' ' + apl.dia_ref
        })
        apls.unshift({ id: 'todos', nome_fmt: 'Todas' })
        return apls
      })
      if (req.params.n_aplicacao != 'todos')
        filtro_lista_aplicacao.id = req.params.n_aplicacao
    }

    // Busca os lançamentos
    const n_elem_pagina = 20
    tb_lancamento.findAll({
      limit: n_elem_pagina,
      offset: (req.params.n_pagina - 1) * n_elem_pagina,
      order: [['data', 'DESC'], ['id_aplicacao', 'DESC'], ['id', 'DESC']],
      include: [{
        model: tb_aplicacao,
        required: true,
        where: filtro_lista_aplicacao,
        include: [{
          model: tb_conta,
          required: true,
          where: filtro_lista_conta,
          include: [{
            model: tb_pessoa,
            required: true,
            where: filtro_lista_pessoa
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
        dado.aplicacao_fmt += ' - '+ dado.aplicacao.contum.alias

        if (req.params.n_pessoa == 'todos')
          dado.aplicacao_fmt += ' (' + dado.aplicacao.contum.pessoa.apelido + ') '

        // Data, tipo e valores
        console.log(`aaa ${dado.data.constructor.name}`)
        dado.data_fmt = util.strISODateBR(dado.data)
        dado.tipo_fmt = tipos.find((tipo) => tipo.id == dado.tipo).desc
        dado.entrada_fmt = ptbr_nfmt.format(dado.entrada)
        dado.saida_fmt = ptbr_nfmt.format(dado.saida)
      })

      // Saldo e número de páginas
      if (dados.length > 0)
      {
        var saldo = 0.0
        const filtro_include_agr = [{
          model: tb_aplicacao,
          required: true,
          attributes: [],
          where: filtro_lista_aplicacao,
          include: [{
            model: tb_conta,
            required: true,
            attributes: [],
            where: filtro_lista_conta,
            include: [{
              model: tb_pessoa,
              required: true,
              where: filtro_lista_pessoa,
              attributes: []
            }]
          }]
        }]
        const filtro_sum_lcto = { where: { data: { [bd.seq.Op.lte]: dados[dados.length - 1].data }},
                                  include: filtro_include_agr }
        const f1 = tb_lancamento.sum('entrada', filtro_sum_lcto)
        const f2 = tb_lancamento.sum('saida', filtro_sum_lcto)
        const f3 = tb_lancamento.count({ include: filtro_include_agr })

        Promise.all([f1, f2, f3, pr_pessoas, pr_contas, pr_aplicacao]).then(function (prms) {
          // Tira os que estão na tela e foram incluídos no sum
          saldo = prms[0] - prms[1];
          for (i = 0; i < dados.length; i++)
            if (dados[dados.length - 1].data.getTime() == dados[i].data.getTime())
              saldo += dados[i].saida - dados[i].entrada

          for (i = dados.length - 1; i >= 0; i--) {
            saldo += dados[i].entrada - dados[i].saida
            dados[i].saldo_fmt = ptbr_nfmt.format(saldo)
          }

          n_paginas = {
            num: Math.ceil(prms[2] / n_elem_pagina),
            atual: req.params.n_pagina,
            por_pagina: dados.length,
            total: prms[2],
          }

          res.render('pages/lancamento_listar', {
            lancamentos: dados,
            n_paginas: n_paginas,
            filtro_pessoas_sel: req.params.n_pessoa,
            filtro_pessoas: prms[3],
            filtro_contas_sel: req.params.n_conta,
            filtro_contas: prms[4],
            filtro_aplicacoes_sel: req.params.n_aplicacao,
            filtro_aplicacoes: prms[5],
          })
        })
      }
      else if (req.params.n_pagina != 1)
        res.redirect('/lancamentos/listar/todos/todos/todos/1')
      else
      {
        n_paginas = { num: 1, atual: 1 }
        Promise.all([pr_pessoas, pr_contas, pr_aplicacao]).then(function (prms) {
          res.render('pages/lancamento_listar', {
            lancamentos: dados,
            n_paginas: n_paginas,
            filtro_pessoas: prms[0],
            filtro_pessoas_sel: req.params.n_pessoa,
            filtro_contas_sel: req.params.n_conta,
            filtro_contas: prms[1],
            filtro_aplicacoes_sel: req.params.n_aplicacao,
            filtro_aplicacoes: prms[2],
          })
        })
      }
    })
  })

  app.get('/lancamentos/apagar/:id', function(req, res) {
    tb_lancamento.findByPk(req.params.id, {
      include: [{
        model: tb_aplicacao,
        include: [{
          model: tb_conta,
          include: tb_pessoa
        }]
      }]
    }).then(function (l) {
      if (!l)
        res.redirect('/lancamentos/listar')
      else
      {
        // Formatação dos campos
        // Formata a aplicação
        l.aplicacao_fmt = aplicacao_classes[l.aplicacao.classe - 1].desc
        if (l.aplicacao.nome)
          l.aplicacao_fmt += ' ' + l.aplicacao.nome
        l.aplicacao_fmt += ' - '+ l.aplicacao.contum.alias + ' (' + l.aplicacao.contum.pessoa.apelido + ') '

        // Tipo, Débito/Crédito e valor
        l.tipo_fmt = tipos.find((tipo) => tipo.id == l.tipo).desc
        l.data_fmt = l.data.toISOString().substr(0, 10)
        if (l.entrada > 0)
        {
          l.valor_fmt = ptbr_nfmt.format(l.entrada)
          l.credito_chk = 'checked'
        }
        else
        {
          l.valor_fmt = ptbr_nfmt.format(l.saida)
          l.debito_chk = 'checked'
        }

        res.render('pages/lancamento_apagar', { lancamento: l })
      }
    })
  })

  app.post('/lancamentos/apagar/:id', function(req, res) {
    tb_lancamento.destroy({ where: { id: req.params.id }}).then(() => res.redirect('/lancamentos/listar'))
  })

}

// Exports
module.exports = {
  func_lancamento: func_lancamento,
  lancamento_tipos: tipos
}
