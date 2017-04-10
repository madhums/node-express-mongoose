//let express = require('express')
let quizResult = require('../controller/quizResult.controller.js')

module.exports = function(app) {

  app.get("/result", function(req, res){
    quizResult.getResult
  })

}
