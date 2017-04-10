//let express = require('express')
let quizResult = require('../controllers/quizResult.controller.js')

module.exports = function(app) {

  app.get("/result", function(req, res){
    quizResult.getResult
  })

}
