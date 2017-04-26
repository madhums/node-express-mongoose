let firebase = require('../config/firebase.init.js')
let database = firebase.database()

exports.getControlInterface = function(req, res) {
  console.log('quiztime = ' + isQuizOnline);
  console.log('enterTime = ' + enterTime);

  res.render('controlroom', {
    enterTime: enterTime,
    isQuizOnline: isQuizOnline
  })
}

exports.changeReadyToStart = function(req, res) {
  let value = req.query.value
  console.log(value);
  if(typeof(value) === "boolean")
    readyToStart = true

  console.log('quizcontrol: ' + readyToStart);
  res.json({'status': 'done'})
}
