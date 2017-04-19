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
