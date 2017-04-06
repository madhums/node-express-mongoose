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
const app = express();

let weatherAPI = require('./app/apis/weather.api.js')
let messengerProfileAPI = require('./app/apis/messenger_profile.api.js')
let userMgt = require('./app/controllers/userManagement.controller.js')
let database = userMgt.database
//let firebase = require('firebase')
let isQuizOnline = false

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

let participatedIDs = []
let quizNO = 0
let ttq = null

botmaster.on('update', (bot, update) => {

  //if(!userMgt.checkDupID(update.sender.id)) {

    //console.log(`should not dup ${isDup}`);
    console.log('ssss');
    //userMgt.recordNewUserID(update.sender.id)
/*
    if(userMgt.checkDupID(update.sender.id)) {
      participatedIDs.push(update.sender.id)
      console.log('enter secret area');
      let buttons = []
      ttq[quizNO].choices.forEach((choice) => {
        buttons.push(choice)
      })
      messengerBot.sendDefaultButtonMessageTo(buttons, update.sender.id, ttq[quizNO].q);
    } else { console.log('too early'); }
*/
  //} else {

    console.log('already have this id');

    if(isQuizOnline) {

      console.log('quiz on');
      //bot.sendTextMessageTo('it is quiz time!', update.sender.id);
      if(update.message.text == ttq[quizNO].a) {
        bot.sendTextMessageTo('correct!', update.sender.id);

      }
      else bot.sendTextMessageTo('wronggg!', update.sender.id);
    }
    else {
      console.log('quiz off');
      bot.sendTextMessageTo('quiz not available', update.sender.id);
    }

  //}

/*
    if (update.message.text === 'ดี' ||
       update.message.text === 'หวัดดี' ||
       update.message.text === 'นี่' ||
       update.message.text.indexOf('สวัสดี') > -1 )
    {

        fetch('http://random.cat/meow')
        .then( (res) => { return res.json() })
        .then(function(json){

          let att = {
            'type': 'image',
            'payload':{
              'url': json.file
            }
          }

          bot.sendAttachmentTo(att, update.sender.id)

        }).catch(function(err){
          console.log('fetch error');
          console.log(err)
        })

   }

   // weather report
   else if (update.message.text.indexOf('อุณหภูมิเท่าไร') > -1 ||
           update.message.text.indexOf('สภาพอากาศ') > -1 ||
           update.message.text.indexOf('ร้อน') > -1) {
     console.log('weather reporting!');
     weatherAPI.getReport(function(err, result){
       if(err) console.log(err);
       else bot.sendTextMessageTo(result, update.sender.id);
     })

   }

   else {
    const messages = ['บอทยังไม่เข้าใจข้อความของคุณ',
                      'เรากำลังพัฒนาบอทให้มีความสามารถสูงขึ้น เพื่อเข้าใจคำพูดของคุณ']
    bot.sendTextCascadeTo(messages, update.sender.id)
   }
*/


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
  console.log('enter shooting : ' + currentQuiz);
  quizNO = currentQuiz

  let buttons = []
  quiz[currentQuiz].choices.forEach((choice) => {
    buttons.push(choice)
  })

  ids.map((id)=>{
    messengerBot.sendDefaultButtonMessageTo(buttons, id, quiz[currentQuiz].q);
  })

  if(currentQuiz < totalQuiz) {
    console.log('current : ' + currentQuiz + ' , total: ' + totalQuiz);
    let nextQuiz = currentQuiz + 1
    setTimeout( function() {
      console.log('in settimeout');
      shootTheQuestion(quiz, ids, nextQuiz, totalQuiz)
    }, 30000)
  }
  else {
    setTimeout( function() {
      console.log('end quiz');
      isQuizOnline = false
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
        participatedIDs = list
        console.log('parti : ' + participatedIDs);
        startQuizTime(quiz, participatedIDs)
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
