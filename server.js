/**
 * Module dependencies
 */

require('dotenv').config();
const Botmaster = require('botmaster')
const express = require('express');
const https = require('https');
const http = require('http');
const fetch = require('node-fetch')
const port = process.env.PORT || 3002;
//const app = express();

let app = express()
//module.exports = app;

require('./app/config/express.js')(app, express)

let weatherAPI = require('./app/apis/weather.api.js')
let messengerProfileAPI = require('./app/apis/messenger_profile.api.js')
let userMgt = require('./app/controllers/userManagement.controller.js')
let firebase = require('./app/config/firebase.init.js')
let database = firebase.database()
//let firebase = require('firebase')

// quiz management variable
enterTime = false
openedAtLeastOneTime = false
isQuizOnline = false
readyToStart = false
isQuizEnd = false

quizReady = null // will be assigned as ARRAY

let correctUser = []

app.listen(port, () => {
  console.log('Express app started on port ' + port);
});

const messengerSettings = {
  credentials: {
    verifyToken: process.env.vToken,
    pageToken: process.env.pageToken,
    fbAppSecret: process.env.appSecret,
  },
  webhookEndpoint: process.env.hookPlace,
  // botmaster will mount this webhook on https://Your_Domain_Name/messenger/webhook1234
};
const botsSettings = [{
    messenger: messengerSettings
}];
const botmasterSettings = {
    botsSettings,
    app
};

const botmaster = new Botmaster(botmasterSettings);
const messengerBot = new Botmaster.botTypes.MessengerBot(messengerSettings);
botmaster.addBot(messengerBot)

let allIDs = []
let participants = []
let quizNO = 0
let ttq = null

// event listener for participants and new user

database.ref(`/participants`).on('child_added', (childSnapshot, prevChildKey) => {
  console.log('participants added');

    console.log('ALLID: ' + allIDs);
    console.log('P_ID: ' + participants);
})

database.ref(`/users`).on('child_added', (childSnapshot, prevChildKey) => {
  console.log('child_added');
  console.log(childSnapshot.key);
  console.log(prevChildKey);
  if(allIDs.indexOf(childSnapshot.key) < 0)
    allIDs.push(childSnapshot.key)
})

// -------------------------------------------------------------------------

botmaster.on('update', (bot, update) => {

  if(update.message) {
    console.log(update)
    if(update.message.attachments) {
      console.log(update.message.attachments);
    }
    // if new user -> add to DB
    userMgt.checkDupID(update.sender.id)
    .then((isDup)=>{
      console.log('THEDUP: '+isDup);
      if(!isDup) {

        let id = update.sender.id
        userMgt.recordNewUserID(id)
        allIDs.push(id)

        if(enterTime) {
          messengerBot.sendTextMessageTo('กิจกรรมกำลังจะเริ่มในไม่ช้า', id)
          setTimeout(()=>{
            messengerBot.sendDefaultButtonMessageTo(['เข้าร่วม', 'ไม่เข้าร่วม'], id, 'ผู้สนใจสามารถกดเข้าร่วมได้ตามปุ่มด้านล่างนี้เลย')
          }, 500)
        }

      }
      else console.log('already have this id');

    })
    .catch((err)=>{
      console.log('serv check dup error : '+err);
    })


    // if enterTime on -> open for users to particate quiz
    if(enterTime) {

      console.log('nowP: '+ participants);

      if(update.message.text != "เข้าร่วม" && participants.indexOf(update.sender.id) < 0) {
        messengerBot.sendDefaultButtonMessageTo(['เข้าร่วม', 'ไม่เข้าร่วม'], update.sender.id, 'สนใจเล่นกิจกรรมกับเราใช่มั้ย กดเข้าร่วมได้ตามปุ่มด้านล่างนี้เลย');
      }
      else {

        if(update.message.text == "เข้าร่วม") {
          bot.sendTextMessageTo('คุณได้เข้าร่วมแล้ว รออีกสักครู่ กิจกรรมกำลังจะเริ่มขึ้น', update.sender.id);
          if(participants.indexOf(update.sender.id) < 0) {
            participants.push(update.sender.id)
            database.ref(`/participants`).set(participants)
          }
        }
        else if(update.message.text == "ไม่เข้าร่วม" && participants.indexOf(update.sender.id) < 0)
          bot.sendTextMessageTo('ถ้ายังสนใจอยู่ก็ทักมาได้นะ', update.sender.id);

        else if(participants.indexOf(update.sender.id) >= 0){
          bot.sendTextMessageTo('รออีกนิดนะ กิจกรรมยังไม่เริ่ม', update.sender.id);
        }

      }

    }
    else if(isQuizOnline) {

      console.log('quiz on');
      //bot.sendTextMessageTo('it is quiz time!', update.sender.id);
      //if(update.message.text == ttq[quizNO].a) {
      if(participants.indexOf(update.sender.id) >= 0) {

        let replyText = ['ได้คำตอบแล้วจ้า', 'รอฟังเฉลยนะว่าถูกมั้ย', 'ขอบคุณสำหรับคำตอบ มารอลุ้นกันนะ', 'จะถูกมั้ยน้า~', 'ดูมั่นใจมากเลย ต้องตอบถูกเยอะแน่ๆ']
        let dupReplyText = ['คุณส่งคำตอบให้เรามาแล้ว ตอบซ้ำไม่ได้นะ', 'ไม่เอา ไม่ส่งคำตอบซ้ำสิ ได้ครั้งเดียวนะ', 'ส่งคำตอบได้ครั้งเดียวนะ', 'แก้คำตอบไม่ได้นะ รอดูเฉลยดีกว่าว่าจะถูกมั้ย']

        if(correctUser.indexOf(update.sender.id) < 0){
          console.log('user id ', update.sender.id, update.message.text == ttq[quizNO].a)
          correctUser.push(update.sender.id)
          if(update.sender.id == '1475004552541616')
            bot.sendTextMessageTo('F*CK', update.sender.id)
          else bot.sendTextMessageTo(replyText[Math.floor(Math.random() * 5)], update.sender.id)
        }
        else bot.sendTextMessageTo(dupReplyText[Math.floor(Math.random() * 4)], update.sender.id)


      } else {
        bot.sendTextMessageTo('คุณไม่ได้เข้าร่วมกิจกรรม ไว้มาร่วมกับเราได้ในครั้งหน้านะ จุ๊บๆ :D', update.sender.id)
      }

      //}
      //else bot.sendTextMessageTo('wronggg!', update.sender.id);

    }
    /*
      {
      console.log('quiz off');
      //bot.sendTextMessageTo('quiz not available', update.sender.id);
      if(update.message.text == "sendMeTemplate") {

        let att = {
          'type': 'template',
          'payload':{
            'template_type': 'button',
            'text': 'press any button, won\'t you?',
            'buttons': [
              {
                'type': 'postback',
                'title': 'button 1',
                'payload': 'press button 1'
              },
              {
                'type': 'postback',
                'title': 'button 2',
                'payload': 'press button 2'
              }
            ]
          }
        }

        bot.sendAttachmentTo(att, update.sender.id)
        console.log('error: ' + err);

      }
    }
    */

  }
  else if(update.postback){

    console.log(JSON.stringify(update));

    if(update.postback.payload == "userPressedGetStarted") {

      // if new user -> add to DB
      userMgt.checkDupID(update.sender.id)
      .then((isDup)=>{
        console.log('THEDUP: '+isDup);
        if(!isDup) {

          let id = update.sender.id
          userMgt.recordNewUserID(id)
          allIDs.push(id)

          if(enterTime) {
            messengerBot.sendTextMessageTo('กิจกรรมกำลังจะเริ่มในไม่ช้า', id)
            setTimeout(()=>{
              messengerBot.sendDefaultButtonMessageTo(['เข้าร่วม', 'ไม่เข้าร่วม'], id, 'ผู้สนใจสามารถกดเข้าร่วมได้ตามปุ่มด้านล่างนี้เลย');
            }, 500)
          }

        }
        else console.log('already have this id');

      })
      .catch((err)=>{
        console.log('serv check dup error : '+err);
      })

    }

    /*
    if(isQuizOnline) {

      console.log('quiz on');
      //bot.sendTextMessageTo('it is quiz time!', update.sender.id);
      if(update.postback.payload == ttq[quizNO].a) {
        bot.sendTextMessageTo('correct!', update.sender.id);

        if(correctUser.indexOf(update.sender.id) < 0)
          correctUser.push(update.sender.id)
      }
      else bot.sendTextMessageTo('wronggg!', update.sender.id);

    }
    else {
      bot.sendTextMessageTo('Quiz is not available right now, please come back again.', update.sender.id);
    }

    console.log(JSON.stringify(update));
    messengerBot.sendTextMessageTo('your payload is : ' + update.postback.payload, update.sender.id)

    */

  }


  //}


});


console.log('started');


let nodeSchedule = require('node-schedule');
let rerunner = nodeSchedule.scheduleJob('*/5 * * * *', function(){
  console.log('running');
});

//heroku server timezone is gmt+0.00
/*
let quiz = nodeSchedule.scheduleJob('1 30 9 * * *', function(){
  userMgt.getAllSubscribedID(function(err, list){
    if(err) console.log(err);
    else if(list) {
      console.log(list);

      list.map((a)=>{

        let quiz = database.ref('quiz').once('value')
        .then(function(snapshot){
          let quizObject = snapshot.val()
          console.log(quizObject);

        })

      })
    }
  })
})
*/

async function prepareQuiz() {

  try {
    let a = await database.ref('quiz').once('value')
    return a.val()
  }
  catch(error) {
    console.log('get quiz error');
    console.log(error);
  }

}


function startQuizTime(quiz, ids) {

  isQuizOnline = true
  console.log('start quiz length ' + quiz.length);
  let quizLength = quiz.length - 1
  ttq = quiz
  console.log('ttq' + ttq.length);

  let checkFirstQuiz = setInterval(()=>{

    console.log(`wait for first quiz .. status : ${quizReady[0]}`);

    if(quizReady[0]) {

      clearInterval(checkFirstQuiz)

      shootTheQuestion(quiz, ids, 0, quizLength)
      console.log('end start quiz');

    }

  }, 2000)

}

function shootTheQuestion(quiz, ids, currentQuiz, totalQuiz) {
  //bot.sendTextMessageTo(quiz[currentQuiz].q, update.sender.id);
  correctUser = []
  console.log('enter shooting : ' + currentQuiz);
  quizNO = currentQuiz

  let buttons = []
  quiz[currentQuiz].choices.forEach((choice) => {
    /*
    buttons.push({
      'type': 'postback',
      'title': choice,
      'payload': choice
    })
    */
    buttons.push(choice)
  })

  /*
  let buttonTemplate = {
    'type': 'template',
    'payload':{
      'template_type': 'button',
      'text': quiz[currentQuiz].q,
      'buttons': buttons
    }
  }
  */

  ids.map((id)=>{
    //messengerBot.sendAttachmentTo(buttonTemplate, id)
    messengerBot.sendDefaultButtonMessageTo(buttons, id, quiz[currentQuiz].q)
  })

  if(currentQuiz < totalQuiz) {

    console.log('current : ' + currentQuiz + ' , total: ' + totalQuiz);
    let nextQuiz = currentQuiz + 1

    //setTimeout( function() {
    let quizInterval = setInterval(()=>{

      console.log(`wait for ${nextQuiz} quiz .. status : ${quizReady[nextQuiz]}`);
      if(quizReady[nextQuiz]) {

        clearInterval(quizInterval)
        database.ref(`/quiz/${currentQuiz}/correctUsers`).set(correctUser)
        shootTheQuestion(quiz, ids, nextQuiz, totalQuiz)

      }

    }, 3000)
    //}, 30000)

  }
  else {

    let checkEnding = setInterval(()=>{

      //setTimeout( function() {
      console.log(`waiting for ending command : ${isQuizEnd}`);
      if(isQuizEnd) {

        clearInterval(checkEnding)
        isQuizOnline = false
        //isQuizEnd = true
        readyToStart = false
        database.ref(`/quiz/${currentQuiz}/correctUsers`).set(correctUser)

        ids.map((id)=>{

          messengerBot.sendTextMessageTo('กิจกรรมจบแล้ว ขอบคุณทุกท่านที่มาร่วมเล่นกับเรา :D', id)
          setTimeout(()=>{
            messengerBot.sendTextMessageTo('คุณสามารดูผลคะแนนได้ที่ https://dsmbot.herokuapp.com/result', id)
          },3000)

        })

      }
      //}, 30000)

    }, 5000)

  }

}

//console.log(quiz.length);

console.log('after quiz request');

// let weatherReporter = nodeSchedule.scheduleJob('0 0 5,11,17,23 * * *', function(){
//   userMgt.getAllID(function(err, list){
//     if(err) console.log(err);
//     else if(list) {
//       console.log(list);
//
//       list.map((a) => {
//         weatherAPI.getReport(function(err, result){
//           if(err) console.log(err);
//           else messengerBot.sendTextMessageTo(result, a);
//         })
//       })
//
//     }
//   })
// })

/*
messengerProfileAPI.getUserInfo('1432315113461939', function(err, info){
  messengerBot.sendTextMessageTo('bot started!', '1432315113461939');
  messengerBot.sendTextMessageTo(`สวัสดี ${info.first_name}`, '1432315113461939');
})
*/
/*
userMgt.getAllSubscribedID(function(err, ids){
  if(err) console.log(err);
  else console.log('success');
})
*/

// database.ref("/staging/readyToStart").on('value',(readyToStartSnapshot)=>{
//   if(readyToStartSnapshot.val()) console.log('ready: ' + readyToStartSnapshot.val());
// })

let checkStart = setInterval(()=>{
  console.log('readyToStart : ' + readyToStart);
  if(readyToStart) startQuiz()
}, 7000)


function startQuiz() {

  clearInterval(checkStart)
  let quizPromise = Promise.resolve(prepareQuiz())

  quizPromise.then((quiz) => {

    ttq = quiz
    quizReady = new Array(ttq.length).fill(false)
    console.log(`quizready = ${quizReady}`);

    userMgt.getAllID(function(err, list){
      if(err) console.log(err);
      else if(list) {
        allIDs = list
        //enterTime = true

        let checkEnterTime = setInterval(()=>{

          console.log('enterTime : ' + enterTime);
          console.log('allIDs : ' + allIDs);

          if(enterTime) {
          //------ enterTime = true
            clearInterval(checkEnterTime)

            console.log('parti : ' + allIDs);

            allIDs.map((id)=>{
              messengerBot.sendTextMessageTo('กิจกรรมกำลังจะเริ่มในไม่ช้า', id)
              setTimeout(()=>{
                messengerBot.sendDefaultButtonMessageTo(['เข้าร่วม', 'ไม่เข้าร่วม'], id, 'ผู้สนใจสามารถกดเข้าร่วมได้ตามปุ่มด้านล่างนี้เลย');
              }, 500)
            })

            console.log('CLOCK STARTED');

            let checkStartTheQuiz = setInterval(()=>{

              console.log('now opening for enter');
              //setTimeout(()=>{
              if(isQuizOnline) {

                clearInterval(checkStartTheQuiz)
                console.log('ALLID: ' + allIDs);
                console.log('P_ID: ' + participants);
                enterTime = false

                if(participants.length > 0) startQuizTime(quiz, participants)
                else {

                  allIDs.map((id)=>{
                    messengerBot.sendTextMessageTo('เสียใจ ไม่มีใครเล่นด้วยเลย :(', id)
                  })
                  console.log('no one want to play quiz');

                }

              }
              //}, 30000) //300000

            }, 5000)

          //------end enterTime = true
          }

        }, 2000)



      }
    })


  })

}

//let quiz = nodeSchedule.scheduleJob('0 30 9 * * *', function(){

//})


/*
getAllID(function(err, list){
  if(err) console.log(err);
  else if(list) {
    console.log(list);

    list.map((a)=>{
      messengerBot.sendTextMessageTo('bot started!', a);
    })
  }
})
*/
