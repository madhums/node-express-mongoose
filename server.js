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

/*
let firebaseConfig = {
  apiKey: process.env.firebaseAPIKey,
  authDomain: "messengerchatbot-f6775.firebaseapp.com",
  databaseURL: "https://messengerchatbot-f6775.firebaseio.com",
  storageBucket: "messengerchatbot-f6775.appspot.com",
  messagingSenderId: "524406259822"
}

firebase.initializeApp(firebaseConfig)
let database = firebase.database()
*/

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

let onMemStatus = []
console.log('abcdefg');

console.log('weather reporting!');
weatherAPI.aaa()

userMgt.testLog()
userMgt.testCBLog((a) => {
  console.log(a);
})

userMgt.getAllSubscribedID((err, ids) => {
  if(err) console.log(err);
  else {
    ids.forEach((id) => {
      onMemStatus[id] = { 'subscription': true }
    })
    console.log('onMem size: ' + Object.keys(onMemStatus).length);
  }
})


let _users = database.ref('users')
_users.on('child_changed', (childSnapshot, prevChildKey) => {

  console.log('child changed!');
  let newSubscription = childSnapshot.val().subscribed

  if(onMemStatus[childSnapshot.key]) {

    console.log('found onemem index');

    if(!onMemStatus[childSnapshot.key].subscription) {
      console.log('onmem index has bool');
      onMemStatus[childSnapshot.key].subscription = newSubscription
    }
    else {
      console.log('onemem index has no bool');
      onMemStatus[childSnapshot.key] = { 'subscription': newSubscription }
    }

  } else {
    console.log('no onmem index found');
    onMemStatus[childSnapshot.key] = { 'subscription': newSubscription }
  }

  console.log('onmem @ id = ' + onMemStatus[childSnapshot.key].subscription);
  console.log('onmem size = ' + Object.keys(onMemStatus).length);

})


botmaster.on('update', (bot, update) => {
  console.log('enter update event');
  console.log('onmem users: ' + Object.keys(onMemStatus).length);

  let user = onMemStatus[update.sender.id]

  if(!user || user == null) {
    onMemStatus[update.sender.id] = { 'subscription': false }
    user = onMemStatus[update.sender.id]
  }

  //---------------- check subscription status -------------------
  if(!user.subscription) {
    console.log('no sub info recorded');

    let a = Promise.resolve(userMgt.checkIfSubscribed(update.sender.id))
    a.then(function(isSub){
      if(!isSub) {
        //bot.sendTextMessageTo('', update.sender.id)
        onMemStatus[update.sender.id] = { 'subscription': false }

        bot.sendTextMessageTo('คุณยังไม่ได้ subscribe บอท', update.sender.id)
        let answer = ['ต้องการ Subscribe', 'ไม่ต้องการ Subscribe']
        setTimeout( () => {
          bot.sendDefaultButtonMessageTo(answer, update.sender.id, 'Subscribe บอทของเราเพื่อใช้งานฟีเจอร์เพิ่มเติม')
        }, 100)

      }
      else {
        onMemStatus[update.sender.id] = { 'subscription': true }
        messengerProfileAPI.getUserInfo(update.sender.id, (err, info) => {
          bot.sendTextMessageTo(`สวัสดีคุณ ${info.first_name}`, update.sender.id)
        })
      }

    })
    .catch(function(err){
      console.log('error promise checking subscription ' + err);
    })

  } else console.log('sub status of ' + update.sender.id + ' is ' + user.subscription);

  //------------------- end checking ---------------

  if (update.message.text == 'ต้องการ Subscribe' || update.message.text == 'ไม่ต้องการ Subscribe') {

    if(update.message.text == 'ต้องการ Subscribe') {
      // change subsribe to true
      if(!userMgt.checkDupID(update.sender.id)) {
        userMgt.recordNewUserID(update.sender.id)
        onMemStatus[update.sender.id].subscription = true
      } else {
        userMgt.setSubscription(update.sender.id, true)
        onMemStatus[update.sender.id].subscription = true
      }

      console.log(`status: ${onMemStatus[update.sender.id].subscription}`);
      bot.reply(update, 'จัดไป ;)');

    } else {
      bot.reply(update, 'สนใจก็บอกมานะ');
    }

  }




  //---------------------------------------------

  if (update.message.text === 'ดี' ||
     update.message.text === 'หวัดดี' ||
     update.message.text === 'นี่' ||
     update.message.text.indexOf('สวัสดี') > -1 )
  {

    if(onMemStatus[update.sender.id].subscription){

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

    } else console.log('not sub hahahaha you won\'t get these kitties~');



  // console.log('b4 send att');
  // console.log('meow: ' + meow);
  // let att = {
  //   'type': 'image',
  //   'payload':{
  //     'url': meow
  //   }
  // }
  // bot.sendAttachmentTo(att, update.sender.id)
   //messengerBot.sendTextMessageTo(`สวัสดี ${info.first_name}`, '1432315113461939');

 } else if (update.message.text.indexOf('เนอะ') > -1) {
   console.log('neor!');
    bot.reply(update, 'เนอะ');

 }  else if (update.message.text.indexOf('อุณหภูมิเท่าไร') > -1 ||
          update.message.text.indexOf('สภาพอากาศ') > -1) {
    console.log('weather reporting!');
    weatherAPI.getReport(function(err, result){
      if(err) console.log(err);
      else bot.sendTextMessageTo(result, update.sender.id);
    })

  } else if (update.message.text === '777778547') {

    let uid = update.sender.id
    // checkDupID(uid, function(err, isDup){
    //   if(!isDup) recordNewUserID(uid)
    //   else console.log('dup id found');
    // })

  } else if (update.message.text === 'aaa1414s1') {

    //readDB()
    userMgt.getAllID(function(err, list){
      if(err) console.log(err);
      else if(list) {
        console.log(list);
        list.map((a)=>{
          bot.sendTextMessageTo('text', a);
        })
      }
    })

  } else if(user.subscription && !(update.message.text == 'ต้องการ Subscribe' || update.message.text == 'ไม่ต้องการ Subscribe')) {
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
