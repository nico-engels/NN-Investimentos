const func_banco = function(app) {

  // Models
  const tb_banco = require('./models/banco')

  // Rotas
  app.get('/bancos/cadastrar', function(req, res) {
    res.render('pages/banco_cadastro')
  })

  app.post('/bancos/cadastrar', function(req, res) {
    tb_banco.create({
      codigo: req.body.cod,
      nome:   req.body.nome,
      cnpj:   req.body.cnpj
    }).then(function() {
      res.redirect('/bancos/listar')
    })
  })

  app.get('/bancos/editar/:id', function(req, res) {
    tb_banco.findByPk(req.params.id).then((dado)  => {
      if (dado)
        res.render('pages/banco_editar', { banco : dado })
      else
        res.redirect('/bancos/listar')
    })
  })

  app.post('/bancos/editar/:id', function(req, res) {
    tb_banco.update({
      nome:   req.body.nome,
      cnpj:   req.body.cnpj
    }, { where: { id: req.params.id }}).then(function() {
      res.redirect('/bancos/listar')
    })
  })

  app.get('/bancos/listar', function(req, res) {
    tb_banco.findAll({ order: [['nome', 'ASC']]}).then(function (dados) {

      n_paginas = {
        por_pagina: dados.length,
        total: dados.length,
      }

      res.render('pages/banco_listar', { bancos: dados, n_paginas: n_paginas })
    })
  })

  app.get('/bancos/apagar/:id', function(req, res) {
    tb_banco.findByPk(req.params.id).then((dado)  => {
      if (dado)
        res.render('pages/banco_apagar', { banco : dado })
      else
        res.redirect('/bancos/listar')
    })
  })

  app.post('/bancos/apagar/:id', function(req, res) {
    tb_banco.destroy({ where: { id: req.params.id }}).then(() => res.redirect('/bancos/listar'))
  })

}

// Exports
module.exports = func_banco
