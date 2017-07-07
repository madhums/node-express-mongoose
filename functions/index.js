const functions = require('firebase-functions');
const admin = require('firebase-admin')
const firebase = require('firebase')
const cors = require('cors')({
  origin: ['http://localhost:3000', 'https://codelab-a8367.firebaseapp.com']
});

//const port = 3002;
const env = functions.config().quizshow
const axios = require('axios')

let serviceAccount = require("./credential/serviceAccountKey.json")

const firebaseConfig = {
  credential: admin.credential.cert(serviceAccount),
  apiKey: env.firebase.api_key,//'AIzaSyAShU7XQD5ji6DDf7PY__EUGb9LwvukrNU',
  authDomain: "codelab-a8367.firebaseapp.com",
  databaseURL: "https://codelab-a8367.firebaseio.com/",
  storageBucket: "codelab-a8367.appspot.com",
  messagingSenderId: 565799047733
}
//firebase.initializeApp(firebaseConfig)
admin.initializeApp(firebaseConfig)
serviceAccount = null
const db = admin.database()

const messengerAPI = require("./API/messengerProfile.js")(axios, env.messenger)
const userManagementAPI = require("./API/userManagement.js")(axios, db, messengerAPI)
/*
playing = false

quizPack = null
currentQuiz = -1 // -1 mean not fired once
fireQuizAt = null

allUsers = {}
participants = {}
canEnter = false
canAnswer = false

timeout = null

let answerTemplate = null
*/

// let answerTemplate = Array(10).fill({
//   ans: '',
//   correct: false,
//   at: 0
// })

/*
db.ref(`playing`).set(playing)
db.ref(`canAnswer`).set(canAnswer)
db.ref(`canEnter`).set(canEnter)

db.ref(`currentQuiz`).set(currentQuiz)
db.ref(`fireQuizAt`).set(fireQuizAt)

db.ref(`participants`).set({})
*/

console.log(`>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>`);
console.log(`>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> STARTING SERVICE, should appear 1 time`);
console.log(`>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>`);

//----------------------- Cloud Functions ------------------------

function _getParticipants() {
  return db.ref(`participants`).once('value')
}

function _getQuiz() {
  return db.ref(`quiz`).once('value')
}

function _getUsers() {
  return db.ref(`users`).once('value')
}

function _getFireQuizAt() {
  return db.ref(`fireQuizAt`).once('value')
}

_getStatus = () => {

  return new Promise((resolve, reject) => {

    let canEnter = false
    let playing = false
    let canAnswer = false
    let currentQuiz = -1

    db.ref(`canEnter`).once('value')
    .then(ce => {
      canEnter = ce.val()
      return db.ref(`canAnswer`).once('value')
    })
    .then(ca => {
      canAnswer = ca.val()
      return db.ref(`playing`).once('value')
    })
    .then(pl => {
      playing = pl.val()
      return db.ref(`currentQuiz`).once('value')
    })
    .then(cq => {

      currentQuiz = cq.val()
      let status = {
        canEnter: canEnter,
        canAnswer: canAnswer,
        playing: playing,
        currentQuiz: currentQuiz
      }

      return resolve(status)

    })
    .catch(error => {
      return reject(status)
    })

  })



}

exports.hookerYOLOitsMeMessengerChatYO = functions.https.onRequest((req, res) => {

  if(req.method == "GET") {

    //console.log('GET Requested');
    if (req.query['hub.mode'] === 'subscribe' &&
        req.query['hub.verify_token'] === env.messenger.verify_token) {
      //console.log("Validating webhook");
      res.status(200).send(req.query['hub.challenge']);
    } else {
      console.error("Failed validation. Make sure the validation tokens match.");
      res.sendStatus(403);
    }
  }
  else if(req.method == "POST") {

    //console.log('POST Requested');
    let data = req.body;
    // Make sure this is a page subscription
    if (data.object === 'page') {

      // Iterate over each entry - there may be multiple if batched
      data.entry.forEach(function(entry) {
        let pageID = entry.id;
        let timeOfEvent = entry.time;

        // Iterate over each messaging event
        entry.messaging.forEach(function(event) {
          if (event.message) {
            receivedMessage(event);
          } else if(event.delivery){
            console.log(`Message delivered to ${event.sender.id}`);
          } else {
            console.log(`Webhook Unknown Event: ${JSON.stringify(event)}`);
          }
        });
      });

      // Assume all went well.
      //
      // You must send back a 200, within 20 seconds, to let us know
      // you've successfully received the callback. Otherwise, the request
      // will time out and we will keep trying to resend.
      res.sendStatus(200);
    }

  }

})

exports.setCanEnter = functions.https.onRequest((req, res) => {
  cors(req, res, () => {

    if(req.query.status.toLowerCase() === 'open')
      db.ref(`canEnter`).set(true)
    else if(req.query.status.toLowerCase() === 'close')
      db.ref(`canEnter`).set(false)

    //res.send(`set canEnter to ${req.query.status}`)
    res.json({
      error: null,
      status: 'ok'
    })

  })

})

exports.setCanAnswer = functions.https.onRequest((req, res) => {
  cors(req, res, () => {

    if(req.query.status.toLowerCase() === 'open')
      db.ref(`canAnswer`).set(true)
    else if(req.query.status.toLowerCase() === 'close')
      db.ref(`canAnswer`).set(false)

    //res.send(`set canAnswer to ${req.query.status}`)
    res.json({
      error: null,
      status: 'ok'
    })

  })
})

exports.getQuizStatus = functions.https.onRequest((req, res) => {
  cors(req, res, () => {

    let cq = -1
    let fqa = null
    let q = null

    db.ref(`currentQuiz`).once('value')
    .then(snapshot => {
      cq = snapshot.val()

      return db.ref(`quiz`).once('value')
    })
    .then(snapshot => {
      q = snapshot.val()

      return db.ref(`fireQuizAt`).once('value')
    })
    .then(snapshot => {
      fqa = snapshot.val()

      res.json({
        currentQuiz: cq,
        quizLength: (q) ? q.length : 0,
        fireQuizAt: fqa,
        quiz: q
      })

    })
    .catch(error => {
      console.log(`there's an error in getQuizStatus: ${error}`)
    })

  })
})

exports.getParticipants = functions.https.onRequest((req, res) => {
  cors(req, res, () => {

    _getParticipants()
    .then(snapshot => {
      res.json({
        participants: snapshot.val()
      })
    })
    .catch(error => {
      console.log(`there's an error in getParticipants: ${error}`)
      res.end()
    })

  })
})

exports.showRandomCorrectUsers = functions.https.onRequest((req, res) => {
  cors(req, res, () => {

    let quiz = null
    let part = null

    _getQuiz()
    .then(quizSnapshot => {
      quiz = quizSnapshot.val()
      return _getParticipants()
    })
    .then(participantsSnapshot => {

      part = participantsSnapshot.val()

      if(!req.query.quizno) res.json({ 'error': 'please specify quiz no.'})
      else if(!quiz) res.json({ 'error': 'quiz not ready'})
      else if(!part) res.json({ 'error': 'participants not found'})
      else if(req.query.quizno < 0 || req.query.quizno > quiz.length - 1) res.json({ 'error': 'incorrect quiz no.'})
      else {

        let targetQuizNo = parseInt(req.query.quizno)

        let answerAmount = 0
        let answerRate = quiz[targetQuizNo].choices.reduce((obj, choiceValue) => {
          obj[choiceValue] = 0
          return obj
        }, {})

        console.log('answerRate = ' + JSON.stringify(answerRate))
        console.log('quiz = ' + JSON.stringify(quiz))
        console.log('participant = ' + JSON.stringify(part))

        if(targetQuizNo > -1 || targetQuizNo < quiz.length) {

          let correctUsers = Object.keys(part).map(key => {

            if(part[key].answerPack[targetQuizNo].ans.length > 0) {
              answerAmount++
              answerRate[part[key].answerPack[targetQuizNo].ans]++
              console.log('>>> in map : answerRate = ' + JSON.stringify(answerRate))
            }

            if(part[key].answerPack[targetQuizNo].correct == true) {
              return {
                id : key,
                firstName: participants[key].firstName,
                lastName: participants[key].lastName,
                profilePic: participants[key].profilePic,
                answerTime: participants[key].answerPack[targetQuizNo].at
              }
            }

          })

          correctUsers = correctUsers.filter(n => { return n != undefined })

          for(key in answerRate) {
            answerRate[key] = Math.round(answerRate[key] / answerAmount * 100)
          }

          console.log('>>> AFTER % : answerRate = ' + JSON.stringify(answerRate))
          let range = correctUsers.length
          let sortCorrectUsers = []

          if(range <= 25 ) {

            if(range > 1)
              sortCorrectUsers = correctUsers.sort((a, b) => { return a.answerTime - b.answerTime })
            else
              sortCorrectUsers = correctUsers

            console.log(`sortCorrectUsers : ${sortCorrectUsers}`)

            res.json({
              error: null,
              answerRate: answerRate,
              correctUsers: sortCorrectUsers
            })

          }
          else {

            let array = correctUsers
            for (let i = array.length - 1; i > 0; i--) {

              let j = Math.floor(Math.random() * (i + 1));
              let temp = array[i];
              array[i] = array[j];
              array[j] = temp;

            }

            res.json({
              error: null,
              answerRate: answerRate,
              correctUsers: array
            })

          }

        }
        else res.json({
          error: `quiz no. incorrect`,
          text: `you requested quiz number ${targetQuizNo}
                but current quiz number is ${currentQuiz} and quiz length is ${quiz.length}`
        })


      }




    })
    .catch(error => {

    })




  })
})

exports.getTopUsers = functions.https.onRequest((req, res) => {
  cors(req, res, () => {

    let fq = null
    let part = null

    _getFireQuizAt()
    .then(snapshot => {
      fq = snapshot.val()
      return _getParticipants()
    })
    .then(snapshot => {

      if(!fq) res.json({error: 'no quiz sent OR no sent time collected'})
      else {

        part = snapshot.val()
        let candidate = Object.keys(part).map(key => {

          let timeUsedBeforeAnswer = part[key].answerPack.reduce((collector, ansDetail, idx) => {
            console.log('firequiz time : ' + fq[idx])
            return (ansDetail.ans) ? (collector + (ansDetail.at - fq[idx]) ) : collector
          }, 0)

          return {
            id : key,
            firstName: part[key].firstName,
            lastName: part[key].lastName,
            profilePic: part[key].profilePic,
            point: part[key].point,
            totalTimeUsed: timeUsedBeforeAnswer
          }

        })

        let topUsers = candidate.sort((a, b) => {
          if(b.point - a.point == 0) return a.totalTimeUsed - b.totalTimeUsed
          else return b.point - a.point
        })

        if(topUsers.length > 10) {
          topUsers = topUsers.splice(0, 10)
        }

        res.json({
          error: null,
          topUsers: topUsers
        })

      }

    })
    .catch(error => {
      console.log(`there's an error in getTopUsers: ${error}`)
      res.end()
    })


  })
})

exports.sendRequest = functions.https.onRequest((req, res) => {
  cors(req, res, () => {

    db.ref(`canEnter`).set(true)
    userManagementAPI.getAllID()
    .then(allID => {
      allID.forEach((id)=>{

        let inviteMessage = {
              "text": 'แชทชิงโชค กำลังจะเริ่มในไม่ช้า ต้องการเข้าร่วมเล่นด้วยหรือไม่?',
              "quick_replies": [
                {
                  "content_type":"text",
                  "title": 'เข้าร่วม',
                  "payload": 'เข้าร่วม'
                },
                {
                  "content_type":"text",
                  "title": 'ไม่เข้าร่วม',
                  "payload": 'ไม่เข้าร่วม'
                }
              ]
            }

        sendQuickReplies(id, inviteMessage)

      })
      res.send(`sent`)
    })
    .catch(error => {
      res.send(`sendRequest : ${error}`)
    })

  })
})

exports.sendQuiz = functions.https.onRequest((req, res) => {

  cors(req, res, () => {

    let status = null
    let participants = null
    let quiz = null
    let fireQuizAt = null

    _getStatus()
    .then(fetchedStatus => {
      status = fetchedStatus
      return _getFireQuizAt()
    })
    .then(fqaSnapshot => {
      fireQuizAt = fqaSnapshot.val()
      return _getParticipants()
    })
    .then(participantsSnapshot => {
      participants = participantsSnapshot.val()
      return _getQuiz()
    })
    .then(quizSnapshot => {

      quiz = quizSnapshot.val()

      if(!status.playing) db.ref(`playing`).set(true)

      if(!quiz) res.json({ 'error': 'quiz not ready, try again later', 'quiz': quizSnapshot.val()})
      else if(!participants)  res.json({ 'error': 'no participants, try again later'})
      else {

        let oldc = status.currentQuiz
        if(req.query.next == 'true' && (status.currentQuiz < quiz.length) ) {
          db.ref(`currentQuiz`).set(status.currentQuiz+1)
          status.currentQuiz += 1
          console.log(`update currentQuiz to ${oldc+1} // is it : ${status.currentQuiz}`);
        }

        if(status.currentQuiz > quiz.length - 1 || status.currentQuiz < 0 )
          res.json({
            'error': `quiz no. out of bound`,
            'currentQuiz': status.currentQuiz,
            'suggestion': 'if this is the first question don\'t forget to use ?next=true param'
          })
        else {

          //clearTimeout(timeout)
          db.ref(`canAnswer`).set(true)

          let answerTime = (req.query.timer) ? parseInt(req.query.timer)+5 : 65
          let quickReplyChoices = []

          db.ref(`answerWindow`).set(answerTime)

          quickReplyChoices = quiz[status.currentQuiz].choices.map(choice => {
            return {
              "content_type":"text",
              "title": choice,
              "payload": choice
            }
          })

          let quizMessage = {
                "text": quiz[status.currentQuiz].q,
                "quick_replies": quickReplyChoices
              }

          if(!fireQuizAt) fireQuizAt = Array(quiz.length).fill(0)

          if(fireQuizAt[status.currentQuiz] == 0) {
            fireQuizAt[status.currentQuiz] = (new Date()).getTime()
            db.ref(`fireQuizAt`).set(fireQuizAt)
          }

          Object.keys(participants).forEach(id => {
            sendQuickReplies(id, quizMessage)
          })

          /*
          timeout = setTimeout(()=>{
            db.ref(`canAnswer`).set(false)
          }, answerTime*1000) //convert to millisecs
          */

          //db.ref(`timeout`).set(timeout)
          //res.send(`sent quiz NO. ${currentQuiz} : ${quizPack[currentQuiz].q}`)
          res.json({
            'error': null,
            'qno': status.currentQuiz,
            'q': quiz[status.currentQuiz].q,
            'choices': quiz[status.currentQuiz].choices
          })

        }

      }

    })
    .catch(error => {
      console.log(`there's an error in sendQuiz: ${error}`)
      res.end()
    })

  })
})

exports.addQuiz = functions.https.onRequest((req, res) => {
  cors(req, res, () => {

    if(req.method == 'POST') {
      db.ref(`quiz`).set(req.body.quiz)
    }

    res.json({
      error: null
    })

  })
})

exports.sendResult = functions.https.onRequest((req, res) => {
  cors(req, res, () => {

    db.ref(`canEnter`).set(false)
    db.ref(`playing`).set(false)

    _getParticipants()
    .then(participantsSnapshot => {

      Object.keys(participantsSnapshot.val()).forEach(id => {
        sendTextMessage(id, `กิจกรรมจบแล้ว ยินดีด้วย คุณได้คะแนนรวม ${participants[id].point} คะแนน`)
      })

      res.json({
        'error': null
      })

    })
    .catch(error => {
      console.log(`there's an error in sendResult: ${error}`)
      res.end()
    })

  })
})

exports.restart = functions.https.onRequest((req, res) => {
  cors(req, res, () => {

    //clearTimeout(timeout)
    //db.ref(`timeout`).set(null)
    db.ref(`currentQuiz`).set(-1)
    db.ref(`canEnter`).set(false)
    db.ref(`canAnswer`).set(false)
    db.ref(`playing`).set(false)
    db.ref(`participants`).set(null)
    db.ref(`fireQuizAt`).set(null)


    res.json({
      'error': null
    })

  })
})

////////////////////////////////////////////////////////////////////// f(x)

function sendQuickReplies(recipientId, quickReplies) {

  let messageData = {
    recipient: {
      id: recipientId
    },
    message: quickReplies
  }

  callSendAPI(messageData);
}

function sendTextMessage(recipientId, messageText) {

  let messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText//,
      //metadata: "DEVELOPER_DEFINED_METADATA"
    }
  }

  callSendAPI(messageData);
}

function callSendAPI(messageData) {

  //console.log(`message data : ${JSON.stringify(messageData)}`);
  axios({
    method: 'POST',
    url: 'https://graph.facebook.com/v2.6/me/messages',
    params: {
      'access_token': env.messenger.page_token
    },
    data: messageData
  })
  .then(res => {

    if (res.status == 200) {

      let body = res.data
      let recipientId = body.recipient_id;
      let messageId = body.message_id;

      if (messageId) {
        console.log("Successfully sent message with id %s to recipient %s",
          messageId, recipientId);
      } else {
      console.log("Successfully called Send API for recipient %s",
        recipientId);
      }

    }
    else {
      console.error("Failed calling Send API", res.status, res.statusText, res.data.error);
    }

  })
  .catch(error => {
    console.log(`send API : ${error}`)
    //console.log(`axios send message failed`);
  })

}

function sendCascadeMessage(id, textArray) {
/*
  textArray.forEach((m) => {
    setTimeout(()=>{
      sendTextMessage(id, m)
    }, 1000)
  })
*/

  textArray.reduce((promiseOrder, message) => {

      return promiseOrder.then(() => {
        //console.log(message);
        sendTextMessage(id, message)
        return new Promise(res => {
          setTimeout(res, 1000)
        })

      })

  }, Promise.resolve()).then(

      () => console.log('send cascade message DONE!'),
      (error) => {
        console.log(`reduce error : ${error} `)
      }

  )


}

function addNewUser(newUserId) {

  console.log(`enter addNewUser`)

  let userProfile = null

  userManagementAPI.recordNewUserID(newUserId)
  messengerAPI.sendTypingOn(newUserId)
  messengerAPI.callProfileAPI(newUserId)
  .then(profile => {
    userProfile = profile
    return _getStatus()
  })
  .then(status => {

    if(status.playing || status.canEnter) {

      let inviteMessage = {
            "text": 'แชทชิงโชค กำลังจะเริ่มในไม่ช้า ต้องการเข้าร่วมเล่นด้วยหรือไม่?',
            "quick_replies": [
              {
                "content_type":"text",
                "title": 'เข้าร่วม',
                "payload": 'เข้าร่วม'
              },
              {
                "content_type":"text",
                "title": 'ไม่เข้าร่วม',
                "payload": 'ไม่เข้าร่วม'
              }
            ]
          }

      setTimeout(() => {
        sendQuickReplies(newUserId, inviteMessage)
      }, 1000)

    }
    else {

      let texts = [
        `สวัสดี คุณ ${userProfile.first_name} ${userProfile.last_name}`,
        `ขณะนี้ แชทชิงโชค ยังไม่เริ่ม ถ้าใกล้ถึงช่วงเวลาของกิจกรรมแล้วทางเราจะติดต่อกลับไปนะ`
      ]
      sendCascadeMessage(newUserId, texts)

    }

  })
  .catch(error => {
    console.log(`error : ${error}`);
  })


}

function receivedMessage(event) {

  let senderID = event.sender.id;
  let recipientID = event.recipient.id;
  let timeOfMessage = event.timestamp;
  let message = event.message;

  //console.log("Received message for user %d and page %d at %d with message:",
    //senderID, recipientID, timeOfMessage);
  //console.log(JSON.stringify(message));

  let messageId = message.mid;
  let messageText = message.text;
  let messageQRPayload = (message.quick_reply) ? message.quick_reply.payload : null
  let messageAttachments = message.attachments;

  // ------- USER ANSWER
  let status = null
  let participants = null
  let allUsers = null
  let quiz = null

  _getStatus()
  .then(fetchedStatus => {
    status = fetchedStatus
    return _getQuiz()
  })
  .then(quizSnapshot => {
    quiz = quizSnapshot.val()
    return _getParticipants()
  })
  .then(participantsSnapshot => {
    participants = participantsSnapshot.val()
    return db.ref(`users`).once('value')//userManagementAPI.getAllID()
  })
  .then(fetchedUsers => {

    users = fetchedUsers.val()
    let allUsers = {}

    for(key in users) {
      allUsers[users[key].fbid] = {
        'fullName': users[key].firstName + ' ' + users[key].lastName,
        'firstName': users[key].firstName,
        'lastName': users[key].lastName,
        'profilePic': users[key].profilePic
      }
    }

    console.log(`________________________________`)
    console.log(`_______ ${JSON.stringify(status)} ______`)
    console.log(`________________________________`)
    //----------------------------------------------------------------------------------------
    console.log(`before if`)
    if(status.playing && messageQRPayload && participants && status.currentQuiz > -1) {
      console.log(`IN 1st if`)
      if(!status.canAnswer) sendTextMessage(senderID, `หมดเวลาตอบข้อนี้แล้วจ้า`)
      else {

        console.log(`IN 1st ELSE`)

        if( participants[senderID] && (!participants[senderID].answerPack[status.currentQuiz].ans)) {

          participants[senderID].answerPack[status.currentQuiz].ans = messageQRPayload
          participants[senderID].answerPack[status.currentQuiz].at = (new Date()).getTime()

          if(messageQRPayload == quiz[status.currentQuiz].a) {
            //sendTextMessage(senderID, `correct`)
            participants[senderID].answerPack[status.currentQuiz].correct = true
            participants[senderID].point++

          }

          //else sendTextMessage(senderID, `wrong, answer is ${quizPack[currentQuiz].a}`)
          sendTextMessage(senderID, `ได้คำตอบแล้วจ้า~`)
          db.ref(`participants/${senderID}`).set(participants[senderID])

        }
        else if(participants[senderID].answerPack[status.currentQuiz].ans) {
          sendTextMessage(senderID, `คุณได้ตอบคำถามข้อนี้ไปแล้วนะ`)
        }


      }

    }
    // ------- USER ENTER
    else if(messageQRPayload == 'เข้าร่วม' && ((participants && !participants[senderID]) || !participants) && status.canEnter) {

      console.log(`in the khaoruam // id : ${senderID}`)

      console.log(`in the khaoruam // allID : ${JSON.stringify(allUsers)}`)

      //if(!participants[senderID]) {
      let answerTemplate = Array(quiz.length).fill({
        ans: '',
        correct: false,
        at: 0
      })

        let tempParticipant = {
          point: 0,
          answerPack: answerTemplate,
          firstName: allUsers[senderID].firstName,
          lastName: allUsers[senderID].lastName,
          profilePic: allUsers[senderID].profilePic
        }

        console.log(`new parti: ${JSON.stringify(tempParticipant)}`)
        db.ref(`participants/${senderID}`).set(tempParticipant)

        if(status.playing && status.canAnswer) {

          let quizMessage = {
                "text": quiz[status.currentQuiz].q,
                "quick_replies": quiz[status.currentQuiz].choices.map(choice => {
                  return {
                    "content_type":"text",
                    "title": choice,
                    "payload": choice
                  }
                })
              }

          sendQuickReplies(senderID, quizMessage)

        }
        else {
          //sendTextMessage(senderID, 'โอเค~ รออีกแป๊บนะ กิจกรรมใกล้จะเริ่มแล้ว')
          let texts = [
            `ยินดีต้อนรับเข้าสู่เกม "แชทชิงโชค" โปรดรอคำถามจาก facebook Live`,
            `กติกาการแข่งขัน ผู้ที่สะสมคะแนนได้สูงสุดใน 3 อันดับแรกของแต่ละวัน จะได้รับของรางวัลจากทางรายการ
    แต้มจะไม่สามารถสะสมข้ามสัปดาห์ได้ และการตัดสินของกรรมการจะถือเป็นที่สิ้นสุด

    ทีมงานและครอบครัวไม่สามารถร่วมเล่นเกมและรับของรางวัลได้`
          ]

          sendCascadeMessage(senderID, texts)

        }
/*
      }
      else {
        console.log(`Already has this user in participants`)
      }
*/

    }
    else if(messageQRPayload == 'ไม่เข้าร่วม' && !participants[senderID]) {
      sendTextMessage(senderID, 'ถ้าเปลี่ยนใจก็ทักมาได้นะ')
    }
    // ------- USER MESSAGE NORMALLY
    else if (messageText) {
      console.log(`IN get message`)
      // If we receive a text message, check to see if it matches a keyword
      // and send back the example. Otherwise, just echo the text we received.
      if(!allUsers || !allUsers[senderID] || !participants || !participants[senderID]) {
        console.log(`user id not found in DB {OR} not in participants -> adding new user`)
        addNewUser(senderID)
      }
      else if(!status.playing && !status.canEnter) {
        console.log(`this user is in our sigth, but game is end or not started yet, tell the user!`)
        sendTextMessage(senderID, `ขณะนี้ แชทชิงโชค ยังไม่เริ่ม ถ้าใกล้ถึงช่วงเวลาของกิจกรรมแล้วทางเราจะติดต่อกลับไปนะ`)
      }
      //else if(!participants)
      else {
        if(status.playing) {

          if(!status.canAnswer) sendTextMessage(senderID, `หมดเวลาตอบข้อนี้แล้วจ้า`)
          else {

            sendTextMessage(senderID, `พิมพ์ตอบจะไม่ได้คะแนนนะ กดตอบเอา ;)`)


            let quickReplyChoices = []

            quickReplyChoices = quiz[status.currentQuiz].choices.map(choice => {
              return {
                "content_type":"text",
                "title": choice,
                "payload": choice
              }
            })

            let quizMessage = {
                  "text": quiz[status.currentQuiz].q,
                  "quick_replies": quickReplyChoices
                }

            setTimeout( () => { sendQuickReplies(senderID, quizMessage) }, 1000)

          }

        }
        else if(status.canEnter)
          sendTextMessage(senderID, `รอสักครู่นะ กิจกรรมยังไม่เริ่ม`)
      }

    } else if (messageAttachments) {
      console.log(JSON.stringify(message))
      console.log(`Message with attachment received`)
      //sendTextMessage(senderID, "Message with attachment received");
    }

    //----------------------------------------------------------------------------------------

  })
  .catch(error => {
    console.log(`there's an error in receiving message: ${error}`)
  })


}


//--------------- LAB
/*
sendCascade(messageArray, sendOptions) {
    const returnedBodies = [];

    let promiseCascade = Promise.resolve();

    for (const messageObject of messageArray) {
      promiseCascade = promiseCascade.then((body) => {
        if (body) {
          returnedBodies.push(body);
        }
        if (messageObject.raw) {
          return this.sendRawMessage(messageObject.raw);
        } else if (messageObject.message) {
          return this.sendMessage(messageObject.message, sendOptions);
        }
        throw new Error('No valid message options specified');
      });
    }

    return promiseCascade

    .then((body) => {
      // add last body and deal with potential callback
      returnedBodies.push(body);
      return returnedBodies;
    });
}
*/

// let nodeSchedule = require('node-schedule');
// let rerunner = nodeSchedule.scheduleJob('*/5 * * * * *', function(){
//   console.log('running');
// });

//----------------- initialize --------------

//---------- get currentQuiz from DB ---------

/*
db.ref(`currentQuiz`).once(`value`)
.then(snapshot => {

  console.log(`Loading currentQuiz`)
  let quiznum = parseInt(snapshot.val())

  if(!isNaN(quiznum)) {
    currentQuiz = quiznum
    console.log(`currentQuiz loaded!`)
  }
  else throw `currentQuiz is not a number : ${quiznum}`
})
.catch(error => {
  console.log(`GET CURRENTQUIZ ERROR: ${error}`);
})
*/

//------------------- firebase event handler ------------------
/*

db.ref(`canEnter`).on('value', snapshot => {
  canEnter = snapshot.val()
})

db.ref(`canAnswer`).on('value', snapshot => {
  canAnswer = snapshot.val()
})

db.ref(`playing`).on('value', snapshot => {
  playing = snapshot.val()
})

*/
/*
db.ref(`quizLoaded`).on('value', (snapshot) => {

  console.log(`Loading quiz...`)

  if(snapshot.val()) {

    db.ref(`quiz`).once('value')
    .then(snapshot => {

      quizPack = snapshot.val()
      console.log(`Quiz loaded!`)
      fireQuizAt = Array(quizPack.length).fill(0)
      answerTemplate = Array(quizPack.length).fill({
        ans: '',
        correct: false,
        at: 0
      })

    })
    .catch(error => {
      console.log(`load quiz error: ${error}`)
    })

    db.ref(`quizLoaded`).off('value')

  }

})
*/


//---------------- Fire Quiz --------------------
/*
db.ref(`currentQuiz`).on('value', (currentQuizSnapshot) => {
  currentQuiz = currentQuizSnapshot.val()
  //fireQuiz =
})

db.ref(`fireQuizAt`).on('value', (fireQuizAtSnapshot) => {
  fireQuizAt = fireQuizAtSnapshot.val()
  //fireQuiz =
})
*/
//------------- update question (quiz) --------------
/*
db.ref(`quiz`).on('child_changed', (childSnapshot) => {
  if(quizPack) {
    quizPack[childSnapshot.key] = childSnapshot.val()
    console.log(`quiz updated`)
  }
})

db.ref(`quiz`).on('child_removed', (childSnapshot) => {
  if(quizPack) {
    quizPack[childSnapshot.key] = childSnapshot.val()
    console.log(`quiz updated`)
  }
})
*/
// -------------- user data --------------
/*
db.ref(`users`).once('value')
.then(snapshot => {

  let users = snapshot.val()

  for(key in users) {
    allUsers[users[key].fbid] = {
      'fullName': users[key].firstName + ' ' + users[key].lastName,
      'firstName': users[key].firstName,
      'lastName': users[key].lastName,
      'profilePic': users[key].profilePic
    }
  }

  console.log(`users data loaded!`)

})
.catch(error => {
  console.log(``)
})


db.ref(`users`).on('child_added', (childSnapshot) => {
  allUsers[childSnapshot.val().fbid] = {
    'fullName': childSnapshot.val().firstName + ' ' + childSnapshot.val().lastName,
    'firstName': childSnapshot.val().firstName,
    'lastName': childSnapshot.val().lastName,
    'profilePic': childSnapshot.val().profilePic
  }
  console.log(`users update [${childSnapshot.val().fbid}]`)
})
*/
//------------- update participants -------------------
/*
db.ref(`participants`).on('child_added', (childSnapshot) => {
  // console.log()
  participants[childSnapshot.key] = childSnapshot.val()
  // let tempParticipant = childSnapshot.val()
  // tempParticipant.firstName = allUsers[childSnapshot.key].firstName
  // tempParticipant.lastName = allUsers[childSnapshot.key].lastName
  // tempParticipant.profilePic = allUsers[childSnapshot.key].profilePic
  // db.ref(`participants/${childSnapshot.key}`).set(tempParticipant)
  console.log(`participants updated`)

})

db.ref(`participants`).on('child_changed', (childSnapshot) => {
  participants[childSnapshot.key] = childSnapshot.val()
  console.log(`participants updated`)
})
*/

setInterval( () => {

  //console.log(`in interval checker`)

  let status = null

  _getStatus()
  .then(fStatus => {
    status = fStatus
    return _getFireQuizAt()
  })
  .then(fqa => {

    let fqaReal = fqa.val()

    if(status.playing && fqaReal) {

      if(fqaReal[status.currentQuiz] && fqaReal[status.currentQuiz] != 0) {

        db.ref(`answerWindow`).once('value')
        .then(awSnap => {

          let gap = awSnap.val()
          if((new Date).getTime() - fqaReal[status.currentQuiz] > gap*1000 && status.canAnswer) {
            db.ref(`canAnswer`).set(false)
            console.log(` ======================= NOW YOU CANT ANSWER`)
            console.log(`fired at : ${fqaReal[status.currentQuiz]}`)
            console.log(`now is : ${(new Date).getTime()}`);
            console.log(`diff: ${(new Date).getTime() - fqaReal[status.currentQuiz]} , gap is : ${gap}`)
          }
          //else console.log(` ======================= value not reset`)

        })

      }

    }

  })
  .catch(error => {
    console.log(`An Error in SET INTERVAL : ${error}`)
  })

}, 10000);
