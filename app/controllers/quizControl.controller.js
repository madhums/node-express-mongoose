let firebase = require('../config/firebase.init.js')
let database = firebase.database()

exports.getControlInterface = function(req, res) {
  console.log('quiztime = ' + isQuizOnline);
  console.log('enterTime = ' + enterTime);

  res.render('controlroom', {
    enterTime: enterTime,
    isQuizOnline: isQuizOnline,
    openedAtLeastOneTime: openedAtLeastOneTime,
    isQuizEnd: isQuizEnd
  })
}

exports.changeReadyToStart = function(req, res) {

  readyToStart = true
  console.log('quizcontrol: ' + readyToStart);
  res.json({'status': 'done'})
}

exports.changeEnterStatus = function(req, res) {

  let value = req.query.value

  if(value == 'open') {
    enterTime = true
    openedAtLeastOneTime = true
  }
  else if(value == 'close')
    enterTime = false

  console.log('entertime: ' + enterTime);
  res.json({'status': 'done'})
}

exports.startQuiz = function(req, res) {
  isQuizOnline = true
  res.json({'status': 'done'})
}

exports.activateQ = function(req, res) {

  let target = req.query.qnumber - 1

  if(target >= 0 && target < quizReady.length) {

    console.log('enter activeQ');
    quizReady[target] = true
    res.json({'status': 'done'})

  }

}

exports.endQuizNow = function(req, res) {
  isQuizEnd = true
  res.json({'status': 'done'})
}

exports.getAllStatus = function(req, res) {
  res.json({
    'enterTime' : enterTime,
    'isQuizOnline': isQuizOnline,
    'quizReady': quizReady,
    'readyToStart': readyToStart,
    'openedAtLeastOneTime': openedAtLeastOneTime,
    'isQuizEnd': isQuizEnd
  })
}
