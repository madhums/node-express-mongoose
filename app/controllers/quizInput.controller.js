let firebase = require('../config/firebase.init.js')
let database = firebase.database()


exports.addQuiz = function(req, res) {
  res.render("addquiz")
}
