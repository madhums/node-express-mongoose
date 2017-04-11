let firebase = require('../config/firebase.init.js')
let database = firebase.database()

exports.getResult = function(req, res) {

  let result = null
  database.ref('/participants').once('value')
  .then((snapshot)=>{

    let UIDs = snapshot.val()

    result = UIDs.map((i)=>{
      return { [i]: 0 }
    })
    console.log(result);
    console.log(`${result['1432315113461939']}`);
    return database.ref('/quiz').once('value')

  })
  .then((quizSnapshot)=>{
    let quiz = quizSnapshot.val()
    console.log(quiz);
    res.send(`${quiz}`)
    /*
    quiz.forEach((q)=>{

      q.correctUsers.forEach((user)=>{
        result[]
      })

    })

    */
  })
  /*
  res.render("result", {
    a: a
  })
  */
}
