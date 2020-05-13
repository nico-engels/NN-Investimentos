const func_operacao = function(app) {

  // Models
  const tb_operacao = require('./models/operacao')


  // Rotas
  app.get('/lancamentos/operacoes/cadastrar', function(req, res) {
    res.render('pages/operacao_cadastro')
  })

  app.post('/lancamentos/operacoes/cadastrar', function(req, res) {
    var novo = {
      tipo:         req.body.tipo,
      natureza:         req.body.natureza,
    }

    tb_operacao.create(novo).then(() => res.redirect('/lancamentos/operacoes/listar'))
  })

  app.get('/lancamentos/operacoes/listar', function(req, res) {
    tb_operacao.findAll({
      order: [['createdAt', 'DESC']]
    }).then(function (dados) {

      // Formata a natureza da operação
      dados.forEach(function (dado) {
        if(dado.natureza == 1)
            dado.natureza_fmt = 'Crédito'
        else if(dado.natureza == 2)
            dado.natureza_fmt = 'Débito'
        else
            dado.natureza_fmt = 'Ambos'
      })

      res.render('pages/operacao_listar', { operacoes: dados })
    })
  })

  app.get('/lancamentos/operacoes/editar/:id', function(req, res) {
    tb_operacao.findByPk(req.params.id).then(function (o) {
      if (!o)
        res.redirect('/lancamentos/operacoes/listar')
      else
      {
          res.render('pages/operacao_cadastro', { operacoes: o })
      }
    })
  })

  app.post('/lancamentos/operacoes/editar/:id', function(req, res) {
    var atualizado = {
      tipo:         req.body.tipo,
      natureza:     req.body.natureza
    }
    tb_operacao.update(atualizado, { where: { id: req.params.id }}).then(() => res.redirect('/lancamentos/operacoes/listar'))
  })

  app.get("/lancamentos/operacoes/apagar/:id", (req, res) => {
    res.sendFile(__dirname+"/lancamentos/listar")
  })

  app.post('/lancamentos/operacoes/apagar/:id', function(req, res) {
    tb_operacao.destroy({ where: { id: req.params.id }}).then(
      res.json({msg: "<div class='alert alert-success' role='alert'>A operação foi apagada com sucesso!</div>"})
    )
  })

}

// Exports
module.exports = func_operacao
