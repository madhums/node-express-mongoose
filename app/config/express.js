//let express = require('express')
let ejs = require('ejs');
let quizResult = require('../controllers/quizResult.controller.js')
let quizInput = require('../controllers/quizInput.controller.js')
let bodyParser = require("body-parser");
let urlencodedParser = bodyParser.urlencoded({
 extended: true
});
let jsonParser = bodyParser.json();

app.use(express.static('public'))

module.exports = function(app) {

  app.set('views', './app/views');
  app.set('view engine', 'ejs');

  app.get("/result", quizResult.getResult)
  app.get("/addquiz", jsonParser, urlencodedParser, quizInput.addQuiz)

  app.get("/*", (req, res) => { res.render("404") } )

}
