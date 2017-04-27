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
  if(value == 'true')
    readyToStart = true

  console.log('quizcontrol: ' + readyToStart);
  res.json({'status': 'done'})
}

exports.changeEnterStatus = function(req, res) {

  let value = req.query.value

  if(value == 'open')
    enterTime = true
  else if(value == 'close')
    enterTime = false

  console.log('entertime: ' + enterTime);
  res.json({'status': 'done'})
}

exports.getAllStatus = function(req, res) {
  res.json({
    'enterTime' : enterTime,
    'isQuizOnline': isQuizOnline,
    'quizReady': quizReady,
    'readyToStart': readyToStart
  })
}
