//let express = require('express')
let ejs = require('ejs');
//let express =
let quizControl = require('../controllers/quizControl.controller.js')
let quizResult = require('../controllers/quizResult.controller.js')
let quizInput = require('../controllers/quizInput.controller.js')
let quizAPIs = require('../controllers/quizAPIs.controller.js')
let index = require('../controllers/index.cotnroller.js')

let bodyParser = require("body-parser");
let urlencodedParser = bodyParser.urlencoded({
 extended: true
});
let jsonParser = bodyParser.json();

module.exports = function(app, express) {

  app.set('views', './app/views');
  app.set('view engine', 'ejs');

  let allowedHeader = ["http://localhost:3000", "https://dsmbot.herokuapp.com", "https://messengerchatbot-f6775.firebaseapp.com"]
  app.use(function(req, res, next) {

    var origin = req.get('origin');
    //console.log(req.session);
    if (origin) {
     if (allowedHeader.indexOf(origin) > -1){
      res.header("Access-Control-Allow-Origin", "*");
     }
     else{
     return res.status(403).end();
     }
    }

    if ('OPTIONS' == req.method) {
     return res.status(200).end();
    }

    next();

  })

  app.use(express.static('public'))



  app.get("/", quizControl.getControlInterface)
  app.get("/info", index.getIndexPage)
  app.get("/policy", index.getPolicyPage)
  app.get("/result/", quizResult.getResult)
  app.get("/addquiz", quizInput.addQuiz)


  app.get("/getAllStatus", quizControl.getAllStatus)
  app.get("/justStartTheQuiz", quizControl.startQuiz)
  app.get("/activateQ", quizControl.activateQ)
  app.get("/endQuizNow", quizControl.endQuizNow)
  app.get("/changeReadyToStart", quizControl.changeReadyToStart)
  app.get("/changeEnterStatus", quizControl.changeEnterStatus)
  app.get("/controlRoom", quizControl.getControlInterface)

  // API for front-end
  app.get("/getCorrectUsers", quizAPIs.getCorrectUsersInfo)
  app.get("/getAllUsersInfo", quizAPIs.getAllUsersInfo)
  app.get("/getAllParticipantsInfo", quizAPIs.getAllParticipantsInfo)
  app.get("/getAllQuestions", quizAPIs.getAllQuestions)
  app.get("/getParticipantsScore", quizAPIs.getParticipantsScore)

  app.post("/processQuizForm", jsonParser, urlencodedParser, quizInput.processForm)

  app.get("/*", (req, res) => { res.render("404") } )

}
