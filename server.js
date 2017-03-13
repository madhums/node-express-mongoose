/**
 * Module dependencies
 */

require('dotenv').config();
const Botmaster = require('botmaster')
const express = require('express');
const https = require('https');
const http = require('http');
const port = process.env.PORT || 3002;
const app = express();

let weatherAPI = require('./app/controllers/weather.controller.js')
let messengerProfileAPI = require('./app/controllers/messenger_profile.controller.js')

let firebase = require('firebase')

let firebaseConfig = {
  apiKey: process.env.firebaseAPIKey,
  authDomain: "messengerchatbot-f6775.firebaseapp.com",
  databaseURL: "https://messengerchatbot-f6775.firebaseio.com",
  storageBucket: "messengerchatbot-f6775.appspot.com",
  messagingSenderId: "524406259822"
}

firebase.initializeApp(firebaseConfig)
let database = firebase.database()

//------ APIs ----------





//---- DB Functions ----
let runner = 0;

function recordNewUserID(userId) {

  messengerProfileAPI.getUserInfo(userId, function(err, info){

    if(err) console.log(err);
    else if(info){

      database.ref(`/users/${userId}`).set({
        firstName: info.first_name,
        lastName: info.last_name,
        gender: info.gender,
        timezone: info.timezone,
        createdAt: (new Date()).toISOString()
      })
      .then(function(){
        console.log('added');
      })
      .catch(function(error){
        console.log('failed');
      })

    }

  })

}


function checkDupID(uid, cb) {

  let dup = database.ref('users').orderByKey().equalTo(uid).once('value')
  .then(function(snapshot){
    // console.log(snapshot.val())
    // console.log(snapshot.exists())
    console.log('check dup');
    return cb(null, snapshot.exists()) //true means dup
  })
  .catch(function(error){
    return cb(`error checkdup ${error}`, null)
  })

}

function getAllID(cb) {

  let dup = database.ref('users').once('value')
  .then(function(snapshot){
    let theArray = Object.keys(snapshot.val())
    console.log(theArray);
    return cb(null, theArray)

  })
  .catch(function(error){
    return cb(`error getAllID ${error}`, null)
  })

}

function getAllSubscribedID(cb) {

  let dup = database.ref('users').once('value')
  .then(function(snapshot){
    let theArray = []
    Object.keys(snapshot.val()).forEach( (key) => {
      if(snapshot.val()[key].subscribed) theArray.push(key)
    })
    console.log(theArray);
    return cb(null, theArray)

  })
  .catch(function(error){
    return cb(`error getAllSubscribedID ${error}`, null)
  })

}

async function checkIfSubscribed(uid) {

  let snap = await database.ref('users').orderByKey().equalTo(uid).once('value')
  return snap

}

/*
function setRunnerNumber() {

  database.ref('users').once('value')
  .then(function(snapshot){
    // no datain snapshot
    if(!snapshot.exists()){
      runner = 0
      console.log('set runner to 0');
    }
    // has some data
    else {
      //console.log('snap length = ' + snapshot.numChildren());
      runner = snapshot.numChildren()
      console.log(`set runner to ${runner}`);
    }
    //console.log(`UID: ${snapshot.val().uid}`);
  })
  .catch(function(error){
    console.log('failed to read DB for setting runner number\n\n');
    console.log(`${error}`);
  })

}
*/

//----- end DB Functions ---


let testSubjectID = ""
let botIdentifier = null

app.listen(port, () =>{
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

  botIdentifier = bot
  testSubjectID = update.sender.id

  database.ref('users').orderByKey().equalTo(uid).once('value')

  if (update.message.text === 'ดี' ||
     update.message.text === 'หวัดดี' ||
     update.message.text === 'นี่' ||
     update.message.text.indexOf('สวัสดี') > -1 ) {

   bot.reply(update, 'หวัดดี ว่าไง?');

 }  else if (update.message.text.indexOf('เนอะ') > -1) {
    bot.reply(update, 'เนอะ');

 }  else if (update.message.text.indexOf('อุณหภูมิเท่าไร') > -1 ||
          update.message.text.indexOf('สภาพอากาศ') > -1) {

    weatherAPI.getReport(function(err, result){
      if(err) console.log(err);
      else bot.sendTextMessageTo(result, update.sender.id);
    })

  } else if (update.message.text === '777778547') {

    let uid = update.sender.id
    checkDupID(uid, function(err, isDup){
      if(!isDup) recordNewUserID(uid)
      else console.log('dup id found');
    })

  } else if (update.message.text === 'aaa1414s1') {

    //readDB()
    getAllID(function(err, list){
      if(err) console.log(err);
      else if(list) {
        console.log(list);
        list.map((a)=>{
          bot.sendTextMessageTo('text', a);
        })
      }
    })

  } else {
   const messages = ['บอทยังไม่เข้าใจข้อความของคุณ',
                     'เรากำลังพัฒนาบอทให้มีความสามารถสูงขึ้น เพื่อเข้าใจคำพูดของคุณ']
   bot.sendTextCascadeTo(messages, update.sender.id)
  }

});

console.log('started');



let nodeSchedule = require('node-schedule');
let rerunner = nodeSchedule.scheduleJob('*/5 * * * *', function(){
  console.log('running');


  //if(testSubjectID != "" && botIdentifier != null)
    //messengerBot.sendIsTypingMessageTo(testSubjectID);
    //messengerBot.sendTextMessageTo("YOLO", testSubjectID)
    //console.log('I can spam this : ' + testSubjectID);

});

//heroku server timezone is gmt+0.00
let weatherReporter = nodeSchedule.scheduleJob('0 0 5,11,17,23 * * *', function(){
  getAllID(function(err, list){
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

messengerProfileAPI.getUserInfo('1432315113461939', function(err, info){
  messengerBot.sendTextMessageTo('bot started!', '1432315113461939');
  messengerBot.sendTextMessageTo(`สวัสดี ${info.first_name}`, '1432315113461939');
})

getAllSubscribedID(function(err, ids){
  if(err) console.log(err);
  else console.log('success');
})

console.log('==================');
console.log(checkIfSubscribed('1432315113461939'))
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
