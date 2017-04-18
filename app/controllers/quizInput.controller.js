let firebase = require('../config/firebase.init.js')
let database = firebase.database()


exports.addQuiz = function(req, res) {
  res.render("addquiz")
}

exports.processForm = function(req, res) {

  let tempNum = 0
  let q = []
  let choices = []
  let length = req.body.numbers

  for(let i = 1; i <= length; i ++) {

    choices = []
    for(let j = 1; j <= 3; j++) {
      choices.push(req.body[`q${i}c${j}`])
    }

    q.push({
      'a': req.body[`q${i}ans`],
      'q': req.body[`q${i}`],
      'choices': choices
    })

  }

  console.log(q)
  console.log(`\n\n\n${JSON.stringify(q)}`)
  res.send(':)')

}
