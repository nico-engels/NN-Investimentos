const func_pessoa = function(app) {

  // Models
  const tb_pessoa = require('./models/pessoa')

  // Rotas
  app.get('/pessoas/cadastrar', function(req, res) {
    res.render('pages/pessoa_cadastro')
  })

  app.post('/pessoas/cadastrar', function(req, res) {
    tb_pessoa.create({
      nome:    req.body.nome,
      apelido: req.body.apelido
    }).then(function() {
      res.redirect('/pessoas/listar')
    })
  })

  app.get('/pessoas/editar/:id', function(req, res) {
    tb_pessoa.findByPk(req.params.id).then((dado)  => {
      if (dado)
        res.render('pages/pessoa_editar', { pessoa : dado })
      else
        res.redirect('/pessoas/listar')
    })
  })

  app.post('/pessoas/editar/:id', function(req, res) {
    tb_pessoa.update({
      nome:    req.body.nome,
      apelido: req.body.apelido
    }, { where: { id: req.params.id }}).then(function() {
      res.redirect('/pessoas/listar')
    })
  })

  app.get('/pessoas/listar', function(req, res) {
    tb_pessoa.findAll({ order: [['nome', 'ASC']]}).then(function (dados) {

      n_paginas = {
        por_pagina: dados.length,
        total: dados.length,
      }

      res.render('pages/pessoa_listar', { pessoas: dados, n_paginas: n_paginas })
    })
  })

  app.get('/pessoas/apagar/:id', function(req, res) {
    tb_pessoa.findByPk(req.params.id).then((dado)  => {
      if (dado)
        res.render('pages/pessoa_apagar', { pessoa : dado })
      else
        res.redirect('/pessoas/listar')
    })
  })

  app.post('/pessoas/apagar/:id', function(req, res) {
    tb_pessoa.destroy({ where: { id: req.params.id }}).then(() => res.redirect('/pessoas/listar'))
  })
}

// Exports
module.exports = func_pessoa
