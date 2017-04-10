//let express = require('express')
let quizResult = require('../controllers/quizResult.controller.js')

module.exports = function(app) {

  app.set('views', '../views');
  app.set('view engine', 'ejs');

  app.get("/result", quizResult.getResult)


}
