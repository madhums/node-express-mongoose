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

  for(let i = 0; i < length; i ++) {

    tempNum = i + 1
    choices = []
    for(let j = 0; j < 3; j++) {
      choices.push(req.body[`q${tempNum}c${j}`])
    }

    q.push({
      'a': req.body[`q${tempNum}ans`],
      'q': req.body[`q${tempNum}`],
      'choices': choices
    })

  }

  console.log(q)
  console.log(`\n\n\n${JSON.stringify(q)}`)
  res.send(':)')

}
