//let express = require('express')
let ejs = require('ejs');
let quizResult = require('../controllers/quizResult.controller.js')

module.exports = function(app) {

  app.set('views', './app/views');
  app.set('view engine', 'ejs');

  app.get("/result", quizResult.getResult)


}
