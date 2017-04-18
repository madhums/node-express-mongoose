let firebase = require('../config/firebase.init.js')
let database = firebase.database()


exports.addQuiz = function(req, res) {
  res.render("addquiz")
}

exports.processForm = function(req, res) {
  res.send(`quiz numbers: ${req.body.numbers}`)
}
