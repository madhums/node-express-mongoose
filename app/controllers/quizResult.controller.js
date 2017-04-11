let firebase = require('../config/firebase.init.js')
let database = firebase.database()

exports.getResult = function(req, res) {

  let result = new Object()
  database.ref('/participants').once('value')
  .then((snapshot)=>{

    let UIDs = snapshot.val()
    for(let i = 0; i < UIDs.length; i++) {
      result[UIDs[i]] = 0
    }

    return database.ref('/quiz').once('value')

  })
  .then((quizSnapshot)=>{
    let quiz = quizSnapshot.val()
    console.log(quiz);
    res.send(`${quiz}`)

    let allCorrectUsers = []
    allCorrectUsers = quiz.map((q)=>{
      return q.correctUsers
    })

    allCorrectUsers.forEach((userByOrder)=>{
      userByOrder.forEach((uid)=>{
        console.log(JSON.stringify(uid));

        if(result.hasOwnProperty(uid))
          result[uid]++

      })
    })

    console.log(`end result: ${JSON.stringify(result)}`);

  })
  /*
  res.render("result", {
    a: a
  })
  */
}
