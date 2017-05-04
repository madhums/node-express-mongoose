let firebase = require('../config/firebase.init.js')
let database = firebase.database()

exports.getAllUsersInfo = function(req, res) {

  let usersInfo = []
  database.ref('/users').once('value')
  .then((snapshot) => {

    let users = snapshot.val()
    for(let key in users) {
      usersInfo.push({
        'id': key,
        'name': users[key].firstName + ' ' + users[key].lastName,
        'gender': users[key].gender,
        'profilePic': users[key].profilePic
      })
    }

    res.json({
      'error': null,
      'usersInfo': usersInfo
    })

  })
  .catch((error)=>{

    console.log(`there's an error [getAllUsersInfo] : ${error}`);
    res.json({
      'error': error,
      'usersInfo': usersInfo
    })

  })

}


exports.getAllParticipantsInfo = function(req, res) {

  let participantsInfo = []
  database.ref('/participants').once('value')
  .then((snapshot) => {

    participantsInfo = snapshot.val()
    return database.ref('/users').once('value')

  })
  .then((snapshot) => {

    let users = snapshot.val()
    let tempParticipantsInfo = participantsInfo
    participantsInfo = []

    tempParticipantsInfo.forEach((key)=> {
      participantsInfo.push({
        'id': key,
        'name': users[key].firstName + ' ' + users[key].lastName,
        'gender': users[key].gender,
        'profilePic': users[key].profilePic
      })
    })

    res.json({
      'error': null,
      'usersInfo': participantsInfo
    })

  })
  .catch((error)=>{

    console.log(`there's an error [getAllParticipantsInfo] : ${error}`);
    res.json({
      'error': error,
      'participantsInfo': participantsInfo
    })

  })

}


exports.getAllQuestions = function(req, res) {

  let questions = []
  let quizLength = 0

  database.ref('/quiz').once('value')
  .then((snapshot) => {

    let quizSnapshot = snapshot.val()
    quizLength = quizSnapshot.length

    quizSnapshot.forEach((quiz)=>{

      let choices = quiz.choices
      let correctedUsers = quiz.correctUsers

      questions.push({
        'question': quiz.q,
        'answer': quiz.a,
        'choices': choices,
        'correctedUsers': correctedUsers
      })

    })

    return database.ref('/users').once('value')

  })
  .then((usersChunkSnapshot)=>{

    let usersChunk = usersChunkSnapshot.val()

    questions.forEach((quiz)=>{

      let correctedUsersInfo = []

      if(quiz.correctedUsers) {

        quiz.correctedUsers.forEach((user)=>{
          correctedUsersInfo.push({
            'id': user,
            'name': usersChunk[user].firstName + ' ' + usersChunk[user].lastName,
            'gender': usersChunk[user].gender,
            'profilePic': usersChunk[user].profilePic
          })
        })

      }

      quiz.correctedUsers = correctedUsersInfo
      //console.log(quiz.correctedUsers);
    })

    res.json({
      'error': null,
      'questions': questions
    })

  })
  .catch((error)=>{
    console.log(`there's an error [getAllQuestions] : ` + error);
    res.json({
      'error': error,
      'questions': questions
    })
  })

}


exports.getCorrectUsersInfo = function(req, res) {

  if(req.query.quizNO) {

    let quizNO = req.query.quizNO
    let correctUsersInfo = []
    database.ref(`/quiz/${quizNO}/correctUsers`).once('value')
    .then((snapshot) => {

      correctUsersInfo = snapshot.val()
      return database.ref('/users').once('value')

    })
    .then((snapshot) => {

      let users = snapshot.val()
      let tempCorrectUsersInfo = correctUsersInfo
      correctUsersInfo = []

      tempCorrectUsersInfo.forEach((key)=> {
        correctUsersInfo.push({
          'id': key,
          'name': users[key].firstName + ' ' + users[key].lastName,
          'gender': users[key].gender,
          'profilePic': users[key].profilePic
        })
      })

      res.json({
        'error': null,
        'usersInfo': correctUsersInfo
      })

    })
    .catch((error)=>{

      console.log(`there's an error [getAllParticipantsInfo] : ${error}`);
      res.json({
        'error': error,
        'participantsInfo': participantsInfo
      })

    })

  }
  else {
    res.json({
      'error': 'quiz no ',
      'participantsInfo': participantsInfo
    })
  }

}


exports.getParticipantsScore = function(req, res) {

  let result = new Object()
  let quizLength = 0

  database.ref('/participants').once('value')
  .then((snapshot)=>{

    let UIDs = snapshot.val()
    if(UIDs) {
      for(let i = 0; i < UIDs.length; i++) {
        result[UIDs[i]] = 0
      }
      return database.ref('/quiz').once('value')
    }
    else throw 'no participants'

  })
  .then((quizSnapshot)=>{

    let quiz = quizSnapshot.val()
    let allCorrectUsers = []
    quizLength = quiz.length

    allCorrectUsers = quiz.map((q)=>{
      return q.correctUsers
    })
    console.log('b4 allU foreach');
    allCorrectUsers.forEach((userByOrder)=>{
      if(userByOrder) {
        userByOrder.forEach((uid)=>{
          if(result.hasOwnProperty(uid))
            result[uid]++
        })
      }
    })

    console.log(`end result: ${JSON.stringify(result)}`);
    return database.ref('/users').once('value')
  })
  .then((usersChunkSnapshot)=>{

    let usersChunk = usersChunkSnapshot.val()
    let tempResult = result
    result = []

    for(let key in tempResult) {
      result.push({
        'id': key,
        'name': usersChunk[key].firstName + ' ' + usersChunk[key].lastName,
        'gender': usersChunk[key].gender,
        'profilePic': usersChunk[key].profilePic,
        'point': tempResult[key]
      })
    }

    return result.sort( (a,b)=> { return (a.point < b.point) ? 1 : ( (b.point < a.point) ? -1 : 0 ) })

  })
  .then((result)=>{

    res.json({
      error: null,
      result: result,
      quizLength: quizLength
    })

  })
  .catch((error)=>{

    console.log('error found: ' + error);
    res.json({
      error: error,
      result: result,
      quizLength: quizLength
    })

  })

}
