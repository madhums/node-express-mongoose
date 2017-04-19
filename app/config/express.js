//let express = require('express')
let ejs = require('ejs');
//let express =
let quizControl = require('../controllers/quizControl.controller.js')
let quizResult = require('../controllers/quizResult.controller.js')
let quizInput = require('../controllers/quizInput.controller.js')
let bodyParser = require("body-parser");
let urlencodedParser = bodyParser.urlencoded({
 extended: true
});
let jsonParser = bodyParser.json();

module.exports = function(app, express) {

  app.set('views', './app/views');
  app.set('view engine', 'ejs');
  app.use(express.static('public'))

  app.get("/controlRoom", quizControl.getControlInterface)
  app.get("/result", quizResult.getResult)
  app.get("/addquiz", quizInput.addQuiz)

  app.post("/processQuizForm", jsonParser, urlencodedParser, quizInput.processForm)

  app.get("/*", (req, res) => { res.render("404") } )

}
