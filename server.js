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


botmaster.on('update', (bot, update) => {

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

// idle --(start time)--> broadcast quiz -> wait for answer -> get answer & record -> end
//               ^                 | time out          |
//               |                 v                   |
//               |------ quiz no. increment <-----------
//

async function prepareQuiz() {

  try {

    return await database.ref('quiz').once('value')/*.then(function(snapshot){
      let quizObject = snapshot.val()
      console.log('quiz here');
      console.log(quizObject);
      console.log(quizObject.length);
      for(let i = 0; i < quizObject.length; i++) {
        console.log(quizObject[i].q);
        console.log(`choices: ${quizObject[i][0]}, ${quizObject[i][1]}`);
      }

      return quizObject
    })
    */

  }
  catch(error) {
    console.log('get quiz error');
    console.log(error);
  }


}



//console.log(quiz.length);

console.log('after quiz request');

let weatherReporter = nodeSchedule.scheduleJob('0 0 5,11,17,23 * * *', function(){
  userMgt.getAllID(function(err, list){
    if(err) console.log(err);
    else if(list) {
      console.log(list);

      list.map((a)=>{
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

userMgt.getAllSubscribedID(function(err, ids){
  if(err) console.log(err);
  else console.log('success');
})

let quizPromise = Promise.resolve(prepareQuiz())

quizPromise.then((quiz) => {
  console.log('chekc size');
  console.log(quiz.length);
})



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
