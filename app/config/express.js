//let express = require('express')
let ejs = require('ejs');
//let express =
let quizControl = require('../controllers/quizControl.controller.js')
let quizResult = require('../controllers/quizResult.controller.js')
let quizInput = require('../controllers/quizInput.controller.js')
let index = require('../controllers/index.cotnroller.js')

let bodyParser = require("body-parser");
let urlencodedParser = bodyParser.urlencoded({
 extended: true
});
let jsonParser = bodyParser.json();

module.exports = function(app, express) {

  app.set('views', './app/views');
  app.set('view engine', 'ejs');
  app.use(express.static('public'))

  app.get("/", index.getIndexPage)
  app.get("/policy", index.getPolicyPage)
  app.get("/result/", quizResult.getResult)
  app.get("/addquiz", quizInput.addQuiz)


  app.get("/getAllStatus", quizControl.getAllStatus)
  app.get("/justStartTheQuiz", quizControl.startQuiz)
  app.get("/changeReadyToStart", quizControl.changeReadyToStart)
  app.get("/changeEnterStatus", quizControl.changeEnterStatus)
  app.get("/controlRoom", quizControl.getControlInterface)

  app.post("/processQuizForm", jsonParser, urlencodedParser, quizInput.processForm)

  app.get("/*", (req, res) => { res.render("404") } )

}
