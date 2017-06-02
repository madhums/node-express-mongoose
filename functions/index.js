const functions = require('firebase-functions');
const admin = require('firebase-admin')
const firebase = require('firebase')
//const express = require('express')
//const port = 3002;
const env = functions.config().quizshow
const axios = require('axios')

console.log(`env = ${JSON.stringify(env)}`);

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

quizPack = null
currentQuiz = 0
fireQuiz = null

//----------------------- Cloud Functions ------------------------

exports.getQuizStatus = functions.https.onRequest((req, res) => {
  res.json({
    quizLength: quizPack.length,
    quiz: quizPack,
    currentQuiz: currentQuiz
  })
})


exports.hookerYOLOitsMeMessengerChatYO = functions.https.onRequest((req, res) => {

  if(req.method == "GET") {

    //console.log('GET Requested');

    if (req.query['hub.mode'] === 'subscribe' &&
        req.query['hub.verify_token'] === env.messenger.verify_token) {
      //console.log("Validating webhook");
      res.status(200).send(req.query['hub.challenge']);
    } else {
      //console.error("Failed validation. Make sure the validation tokens match.");
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

        //console.log(`entry : ${JSON.stringify(entry)}`);

        // Iterate over each messaging event
        entry.messaging.forEach(function(event) {
          if (event.message) {
            receivedMessage(event);
          } else {
            console.log("Webhook received unknown event: ", event);
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
  let messageAttachments = message.attachments;

  if (messageText) {

    // If we receive a text message, check to see if it matches a keyword
    // and send back the example. Otherwise, just echo the text we received.
    switch (messageText.toLowerCase()) {

      case 'hello':
      case 'hi':
      case 'hey':
      case 'yo':
        greeting(senderID)
        break;

      case 'wanna see nh':
        reportMeNicehashStat()
        break;

      case 'all id':
        userManagementAPI.getAllID()
        break;

      default:
        addNewUser(senderID)
    }
  } else if (messageAttachments) {
    sendTextMessage(senderID, "Message with attachment received");
  }
}

function addNewUser(newUserId) {

  userManagementAPI.recordNewUserID(newUserId)
  messengerAPI.sendTypingOn(newUserId)
  messengerAPI.callProfileAPI(newUserId)
  .then(profile => {

    let texts = [
      `สวัสดี คุณ ${profile.first_name} ${profile.last_name}`,
      `ขณะนี้ไม่มีกิจกรรมใดดำเนินอยู่ ถ้ามีกิจกรรมเมื่อไร ทางเราจะติดต่อกลับไปนะ`
    ]
    sendCascadeMessage(newUserId, texts)

  })
  .catch(error => {
    console.log(`error : ${error}`);
  })


}

exports.sendRequest = functions.https.onRequest((req, res) => {

  userManagementAPI.getAllID()
  .then(allID => {
    allID.forEach((id)=>{
      sendTextMessage(id, 'YOLO')
    })
    res.send(`sent`)
  })
  .catch(error => {
    res.send(`sendRequest : ${error}`)
  })

})

exports.sendQuiz = functions.https.onRequest((req, res) => {

  let qno = currentQuiz

  if(req.query.next)
    qno = currentQuiz + 1

  let quickReplyChoices = []

  quickReplyChoices = quizPack[qno].choices.map(choice => {
    return {
      "content_type":"text",
      "title": choice,
      "payload": choice
    }
  })

  let quizMessage = {
      "text": quizPack[qno].q,
      "quick_replies": quickReplyChoices
    }

  userManagementAPI.getAllID()
  .then(allID => {
    allID.forEach((id)=>{
      sendQuizMessage(id, quizMessage)
    })
    res.send(`sent`)
  })
  .catch(error => {
    res.send(`sendRequest : ${error}`)
  })

})

function sendQuizMessage(recipientId, quizMessage) {

  let messageData = {
    recipient: {
      id: recipientId
    },
    message: quizMessage
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
  console.log(`env.messenger.page_token = ${env.messenger.page_token}`);
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
    }, 500)
  })

}

function reportMeNicehashStat() {

  axios('https://api.nicehash.com/api?method=stats.provider&addr=35onBA7oCbf32AhowFP8zaJLFy7qK4FMRy')
  .then(res => {

    let data = res.data
    let siaSpeed = 0

    let balance = data.result.stats.reduce((sum, value) => {

      if(value.algo == 27)
        siaSpeed = parseFloat(value.accepted_speed)

      return sum + parseFloat(value.balance)
    }, 0.0)

    let texts =[
      `Current Speed: ${parseInt(siaSpeed*1000)/1000} GH/s`,
      `Unpaid Balance: ${balance}`
    ]

    sendCascadeMessage('1432315113461939', texts)
  })
  .catch(error => {
    console.log(`report nh balance error : ${error}`);
  })

}


function greeting(userId) {

  messengerAPI.callProfileAPI(userId)
  .then(profile => {

    // profile.first_name
    // profile.last_name
    // profile.gender
    // profile.profile_pic
    // profile.timezone
    sendTextMessage(userId, `Hello ${profile.first_name}`)

  })
  .catch(error => {
    console.log(`greeting error : ${error}`)
  })

}


// let nodeSchedule = require('node-schedule');
// let rerunner = nodeSchedule.scheduleJob('*/5 * * * * *', function(){
//   console.log('running');
// });

//----------------- initialize --------------

//---------- get currentQuiz from DB ---------
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

//------------------- firebase event handler ------------------


//----------------- Load Quiz ------------------
db.ref(`quizLoaded`).on('value', (snapshot) => {

  console.log(`Loading quiz...`)

  if(snapshot.val()) {

    db.ref(`quiz`).once('value')
    .then(snapshot => {
      quizPack = snapshot.val()
      console.log(`Quiz loaded!`)
    })
    .catch(error => {
      console.log(`load quiz error: ${error}`)
    })

    db.ref(`quizLoaded`).off('value')

  }

})

//---------------- Fire Quiz --------------------
db.ref(`currentQuiz`).on('value', (currentQuizSnapshot) => {
  fireQuiz = currentQuizSnapshot.val()
})

//------------- update question (quiz) --------------

db.ref(`quiz`).on('child_changed', (childSnapshot) => {
  if(quizPack) {
    quizPack[childSnapshot.key] = childSnapshot.val()
    console.log(`quiz updated`)
  }
})
