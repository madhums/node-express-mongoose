/**
 * Module dependencies
 */

require('dotenv').config();
const Botmaster = require('botmaster')
//const express = require('express');
const https = require('https');
const http = require('http');
const fetch = require('node-fetch')
const port = process.env.PORT || 3002;
const app = express();

let express = require('./express.js')

let weatherAPI = require('./app/apis/weather.api.js')
let messengerProfileAPI = require('./app/apis/messenger_profile.api.js')
let userMgt = require('./app/controllers/userManagement.controller.js')
let database = userMgt.database
//let firebase = require('firebase')
let enterTime = false
let isQuizOnline = false
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

botmaster.on('update', (bot, update) => {

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
        }, 100)
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

    if(update.message.text == "เข้าร่วม") {
      bot.sendTextMessageTo('คุณได้เข้าร่วมแล้ว รออีกสักครู่ กิจกรรมกำลังจะเริ่มขึ้น', update.sender.id);
      if(participants.indexOf(update.sender.id) < 0) {
        participants.push(update.sender.id)
        database.ref(`/participants`).set(participants)
      }
    }
    else if(update.message.text == "ไม่เข้าร่วม")
      bot.sendTextMessageTo('ไม่เป็นไรนะ ไว้มาร่วมเล่นกันใหม่ครั้งหน้าได้', update.sender.id);

    else if(participants.indexOf(update.sender.id) >= 0){
      bot.sendTextMessageTo('รออีกนิดนะ กิจกรรมยังไม่เริ่ม', update.sender.id);
    }

  }

  if(isQuizOnline) {

    console.log('quiz on');
    //bot.sendTextMessageTo('it is quiz time!', update.sender.id);
    if(update.message.text == ttq[quizNO].a) {
      bot.sendTextMessageTo('correct!', update.sender.id);

      if(correctUser.indexOf(update.sender.id) < 0)
        correctUser.push(update.sender.id)
    }
    else bot.sendTextMessageTo('wronggg!', update.sender.id);

  }
  else if(!enterTime){
    console.log('quiz off');
    bot.sendTextMessageTo('quiz not available', update.sender.id);
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
  shootTheQuestion(quiz, ids, 0, quizLength)
  console.log('end start quiz');

}

function shootTheQuestion(quiz, ids, currentQuiz, totalQuiz) {
  //bot.sendTextMessageTo(quiz[currentQuiz].q, update.sender.id);
  correctUser = []
  console.log('enter shooting : ' + currentQuiz);
  quizNO = currentQuiz

  let buttons = []
  quiz[currentQuiz].choices.forEach((choice) => {
    buttons.push(choice)
  })

  ids.map((id)=>{
    messengerBot.sendDefaultButtonMessageTo(buttons, id, quiz[currentQuiz].q)
  })

  if(currentQuiz < totalQuiz) {

    console.log('current : ' + currentQuiz + ' , total: ' + totalQuiz);
    let nextQuiz = currentQuiz + 1
    setTimeout( function() {
      console.log('in settimeout');
      database.ref(`/quiz/${currentQuiz}/correctUsers`).set(correctUser)
      shootTheQuestion(quiz, ids, nextQuiz, totalQuiz)
    }, 30000)

  }
  else {

    setTimeout( function() {
      console.log('end quiz');
      isQuizOnline = false
      database.ref(`/quiz/${currentQuiz}/correctUsers`).set(correctUser)

      ids.map((id)=>{
        messengerBot.sendTextMessageTo('กิจกรรมจบแล้ว ขอบคุณทุกท่านที่มาร่วมเล่นกับเรา :D', id)
      })

    }, 30000)

  }

}

//console.log(quiz.length);

console.log('after quiz request');

let weatherReporter = nodeSchedule.scheduleJob('0 0 5,11,17,23 * * *', function(){
  userMgt.getAllID(function(err, list){
    if(err) console.log(err);
    else if(list) {
      console.log(list);

      list.map((a) => {
        weatherAPI.getReport(function(err, result){
          if(err) console.log(err);
          else messengerBot.sendTextMessageTo(result, a);
        })
      })

    }
  })
})

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
let quizPromise = Promise.resolve(prepareQuiz())


//let quiz = nodeSchedule.scheduleJob('0 30 9 * * *', function(){
  quizPromise.then((quiz) => {
    ttq = quiz
    userMgt.getAllID(function(err, list){
      if(err) console.log(err);
      else if(list) {
        allIDs = list
        enterTime = true

        console.log('parti : ' + allIDs);

        allIDs.map((id)=>{
          messengerBot.sendTextMessageTo('กิจกรรมกำลังจะเริ่มในไม่ช้า', id)
          setTimeout(()=>{
            messengerBot.sendDefaultButtonMessageTo(['เข้าร่วม', 'ไม่เข้าร่วม'], id, 'ผู้สนใจสามารถกดเข้าร่วมได้ตามปุ่มด้านล่างนี้เลย');
          }, 100)
        })

        console.log('CLOCK STARTED');

        setTimeout(()=>{
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

        }, 20000) //300000

      }
    })
  })
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
