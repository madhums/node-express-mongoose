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

// let answerTemplate = Array(10).fill({
//   ans: '',
//   correct: false,
//   at: 0
// })

db.ref(`playing`).set(playing)
db.ref(`canAnswer`).set(canAnswer)
db.ref(`canEnter`).set(canEnter)

db.ref(`currentQuiz`).set(currentQuiz)
db.ref(`fireQuizAt`).set(fireQuizAt)

db.ref(`participants`).set({})

console.log(`>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>`);
console.log(`>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> STARTING SERVICE, should appear 1 time`);
console.log(`>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>`);

//----------------------- Cloud Functions ------------------------

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
    var data = req.body;
    // Make sure this is a page subscription
    if (data.object === 'page') {

      // Iterate over each entry - there may be multiple if batched
      data.entry.forEach(function(entry) {
        var pageID = entry.id;
        var timeOfEvent = entry.time;

        // Iterate over each messaging event
        entry.messaging.forEach(function(event) {
          if (event.message) {
            receivedMessage(event);
          } else {
            console.log("Webhook received unknown event: ")//, event);
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

    res.json({
      currentQuiz: currentQuiz,
      quizLength: (quizPack) ? quizPack.length : 0,
      fireQuizAt: fireQuizAt,
      quiz: quizPack
    })

  })
})

exports.getParticipants = functions.https.onRequest((req, res) => {
  cors(req, res, () => {

    res.json({
      participants: participants
    })

  })
})

exports.getinramusers = functions.https.onRequest((req, res) => {
  cors(req, res, () => {

    res.json({
      allUsers: allUsers
    })

  })
})

exports.showRandomCorrectUsers = functions.https.onRequest((req, res) => {
  cors(req, res, () => {

    if(!req.query.quizno) res.json({ 'error': 'please specify quiz no.'})
    else if(!quizPack) res.json({ 'error': 'quiz not ready'})
    else if(req.query.quizno < 0 || req.query.quizno > quizPack.length - 1) res.json({ 'error': 'incorrect quiz no.'})
    else {

      let targetQuizNo = parseInt(req.query.quizno)

      let answerAmount = 0
      let answerRate = quizPack[targetQuizNo].choices.reduce((obj, choiceValue) => {
        obj[choiceValue] = 0
        return obj
      }, {})

      console.log('answerRate = ' + JSON.stringify(answerRate))

      if(targetQuizNo > -1 || targetQuizNo < quizPack.length) {

        let correctUsers = Object.keys(participants).map(key => {

          if(participants[key].answerPack[targetQuizNo].ans.length > 0) {
            answerAmount++
            answerRate[participants[key].answerPack[targetQuizNo].ans]++
            console.log('>>> in map : answerRate = ' + JSON.stringify(answerRate))
          }

          if(participants[key].answerPack[targetQuizNo].correct) {
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
              but current quiz number is ${currentQuiz} and quiz length is ${quizPack.length}`
      })


    }


  })
})

exports.getTopUsers = functions.https.onRequest((req, res) => {
  cors(req, res, () => {

    if(!fireQuizAt) res.json({error: 'no quiz sent OR no sent time collected'})
    else {

      let candidate = Object.keys(participants).map(key => {

        let timeUsedBeforeAnswer = participants[key].answerPack.reduce((collector, ansDetail, idx) => {
          console.log('firequiz time : ' + fireQuizAt[idx])
          return (ansDetail.ans) ? (collector + (ansDetail.at - fireQuizAt[idx]) ) : collector
        }, 0)

        return {
          id : key,
          firstName: participants[key].firstName,
          lastName: participants[key].lastName,
          profilePic: participants[key].profilePic,
          point: participants[key].point,
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

    if(!playing) db.ref(`playing`).set(true)

    if(!quizPack) res.json({ 'error': 'quiz not ready, try again later'})
    else if(!participants)  res.json({ 'error': 'quiz not ready, try again later'})
    else {

      let oldc = currentQuiz
      if(req.query.next == 'true' && (currentQuiz < quizPack.length) ) {
        db.ref(`currentQuiz`).set(currentQuiz+1)
        console.log(`update currentQuiz to ${oldc+1} // is it : ${currentQuiz}`);
      }

      if(currentQuiz > quizPack.length - 1 || currentQuiz < 0 )
        res.json({
          'error': `quiz no. out of bound`,
          'currentQuiz': currentQuiz,
          'suggestion': 'if this is the first question don\'t forget to use ?next=true param'
        })
      else {

        clearTimeout(timeout)
        db.ref(`canAnswer`).set(true)

        let answerTime = (req.query.timer) ? parseInt(req.query.timer)+5 : 65
        let quickReplyChoices = []

        quickReplyChoices = quizPack[currentQuiz].choices.map(choice => {
          return {
            "content_type":"text",
            "title": choice,
            "payload": choice
          }
        })

        let quizMessage = {
              "text": quizPack[currentQuiz].q,
              "quick_replies": quickReplyChoices
            }

        if(!fireQuizAt) fireQuizAt = Array(quizPack.length).fill(0)
        fireQuizAt[currentQuiz] = (new Date()).getTime()
        db.ref(`fireQuizAt`).set(fireQuizAt)

        Object.keys(participants).forEach(id => {
          sendQuickReplies(id, quizMessage)
        })

        timeout = setTimeout(()=>{
          db.ref(`canAnswer`).set(false)
        }, answerTime*1000) //convert to millisecs

        //res.send(`sent quiz NO. ${currentQuiz} : ${quizPack[currentQuiz].q}`)
        res.json({
          'error': null,
          'qno': currentQuiz,
          'q': quizPack[currentQuiz].q,
          'choices': quizPack[currentQuiz].choices
        })

      }

    }

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

    Object.keys(participants).forEach(id => {
      sendTextMessage(id, `กิจกรรมจบแล้ว ยินดีด้วย คุณได้คะแนนรวม ${participants[id].point} คะแนน`)
    })

    res.json({
      'error': null
    })

  })
})

exports.restart = functions.https.onRequest((req, res) => {
  cors(req, res, () => {

    clearTimeout(timeout)

    quizPack = null

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

  textArray.forEach((m) => {
    setTimeout(()=>{
      sendTextMessage(id, m)
    }, 1000)
  })

}

function addNewUser(newUserId) {

  userManagementAPI.recordNewUserID(newUserId)
  messengerAPI.sendTypingOn(newUserId)
  messengerAPI.callProfileAPI(newUserId)
  .then(profile => {

    if(playing || canEnter) {

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

      sendQuickReplies(newUserId, inviteMessage)

    }
    else {

      let texts = [
        `สวัสดี คุณ ${profile.first_name} ${profile.last_name}`,
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
  if(playing && messageQRPayload && participants[senderID] && currentQuiz > -1) {

    if(!canAnswer) sendTextMessage(senderID, `หมดเวลาตอบข้อนี้แล้วจ้า`)
    else {

      participants[senderID].answerPack[currentQuiz].ans = messageQRPayload
      participants[senderID].answerPack[currentQuiz].at = (new Date()).getTime()

      if(messageQRPayload == quizPack[currentQuiz].a) {
        //sendTextMessage(senderID, `correct`)
        participants[senderID].answerPack[currentQuiz].correct = true
        participants[senderID].point++

      }

      //else sendTextMessage(senderID, `wrong, answer is ${quizPack[currentQuiz].a}`)
      sendTextMessage(senderID, `ได้คำตอบแล้วจ้า~`)
      db.ref(`participants`).set(participants)

    }

  }
  // ------- USER ENTER
  else if(messageQRPayload == 'เข้าร่วม' && !participants[senderID] && canEnter) {

    console.log(`in the khaoruam // id : ${senderID}`)

    participants[senderID] = {
      point: 0,
      answerPack: answerTemplate,
      firstName: allUsers[senderID].firstName,
      lastName: allUsers[senderID].lastName,
      profilePic: allUsers[senderID].profilePic
    }

    console.log(`new parti: ${JSON.stringify(participants[senderID])}`)
    db.ref(`participants`).set(participants)

    if(playing && canAnswer) {

      let quizMessage = {
            "text": quizPack[currentQuiz].q,
            "quick_replies": quizPack[currentQuiz].choices.map(choice => {
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

  }
  else if(messageQRPayload == 'ไม่เข้าร่วม' && !participants[senderID]) {
    sendTextMessage(senderID, 'ถ้าเปลี่ยนใจก็ทักมาได้นะ')
  }
  // ------- USER MESSAGE NORMALLY
  else if (messageText) {

    // If we receive a text message, check to see if it matches a keyword
    // and send back the example. Otherwise, just echo the text we received.
    if(!participants[senderID]) {
      addNewUser(senderID)
    }
    else {
      if(playing)
        sendTextMessage(senderID, `ตอบซ้ำไม่ได้นะ`)
      else if(canEnter)
        sendTextMessage(senderID, `รอสักครู่นะ กิจกรรมยังไม่เริ่ม`)
    }

  } else if (messageAttachments) {
    console.log(JSON.stringify(message))
    console.log(`Message with attachment received`)
    //sendTextMessage(senderID, "Message with attachment received");
  }
}

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


db.ref(`canEnter`).on('value', snapshot => {
  canEnter = snapshot.val()
})

db.ref(`canAnswer`).on('value', snapshot => {
  canAnswer = snapshot.val()
})

db.ref(`playing`).on('value', snapshot => {
  playing = snapshot.val()
})


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



//---------------- Fire Quiz --------------------
db.ref(`currentQuiz`).on('value', (currentQuizSnapshot) => {
  currentQuiz = currentQuizSnapshot.val()
  //fireQuiz =
})

db.ref(`fireQuizAt`).on('value', (fireQuizAtSnapshot) => {
  fireQuizAt = fireQuizAtSnapshot.val()
  //fireQuiz =
})

//------------- update question (quiz) --------------

db.ref(`quiz`).on('child_changed', (childSnapshot) => {
  if(quizPack) {
    quizPack[childSnapshot.key] = childSnapshot.val()
    console.log(`quiz updated`)
  }
})

// -------------- user data --------------

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

//------------- update participants -------------------

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

db.ref(`participants`).on('child_removed', (oldChildSnapshot) => {
  participants = {}
  console.log(`participants reset`)
})
