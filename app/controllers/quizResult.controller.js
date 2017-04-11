let firebase = require('../config/firebase.init.js')
let database = firebase.database()

exports.getResult = function(req, res) {

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

    return result.sort( (a,b)=> { return (a.point > b.point) ? 1 : ( (b.point > a.point) ? -1 : 0 ) })

  })
  .then((result)=>{

    res.render("result", {
      error: null,
      result: result,
      quizLength: quizLength
    })

  })
  .catch((error)=>{

    console.log('error found: ' + error);
    res.render("result", {
      error: 'no participants found',
      result: [],
      quizLength: 0
    })

  })

}
