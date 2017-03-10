//'use strict';

/*
 * nodejs-express-mongoose
 * Copyright(c) 2015 Madhusudhan Srinivasa <madhums8@gmail.com>
 * MIT Licensed
 */

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

function getWeather(cb) {

  let weatherURL = "http://api.openweathermap.org/data/2.5/weather?q=Bangkok,th&appid=" + process.env.weatherOpenAPIKey
  http.get(weatherURL, function (response) {

      var buffer = "";
      response.on("data", function (chunk) {
          buffer += chunk;
      });

      response.on("end", function (err) {

        if(err) return cb('request weather error: ' + err, null)
        if(buffer) {

          let responseJSON = JSON.parse(buffer)

          let city = (responseJSON.name == "Bangkok") ? "กรุงเทพ" : responseJSON.name
          let temp = Math.ceil(parseInt(responseJSON.main.temp) - 273.15)
          let weather = ""
          if(responseJSON.weather[0].description == "few clouds") weather = "มีเมฆเล็กน้อย"
          else if(responseJSON.weather[0].description == "scattered clouds") weather = "มีเมฆกระจายทั่ว"
          else if(responseJSON.weather[0].description == "clear sky") weather = "ฟ้าโปร่ง ไม่มีเมฆ"
          else weather = responseJSON.weather[0].description

          let weatherReport = "อากาศใน" + city + " " + weather + " อุณหภูมิอยู่ที่ " + temp + " องศา"
          return cb(null, weatherReport)
        }
      })
  })

}


function getUserInfo(uid, cb) {

  let apiPath = "https://graph.facebook.com/v2.6/" + uid
                + "?fields=first_name,last_name,timezone,gender&access_token="
                + process.env.pageToken

  https.get(apiPath, function (response) {

    var buffer = "";
    response.on("data", function (chunk) {
        buffer += chunk;
    });

    response.on("end", function (err) {

      if(err) return cb('get user info err: ' + err, null)
      if(buffer) {
        return cb(null, JSON.parse(buffer))
      }

    })

  })

}


//---- DB Functions ----
let runner = 0;

function recordNewUserID(userId) {

  getUserInfo(userId, function(err, info){

    if(err) console.log(err);
    else if(info){

      database.ref(`/users/${userId}`).set({
        firstName: info.first_name,
        lastName: info.last_name,
        gender: info.gender,
        timezone: info.timezone
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


function checkDupID(uid) {

  let dup = database.ref('users').equalTo(uid).once('value')
  .then(function(snapshot){
    console.log(snapshot.val())
    return snapshot.exists()
  })
  .catch(function(error){
    console.log(`error checkdup ${error}`);
  })

}

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
  webhookEndpoint: process.env.hookPlace, ///webhook92ywrnc7f9Rqm4qoiuthecvasdf42FG
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


  if (update.message.text === 'ดี' ||
     update.message.text === 'หวัดดี' ||
     update.message.text === 'นี่' ||
     update.message.text.indexOf('สวัสดี') > -1 ) {

   bot.reply(update, 'หวัดดี ว่าไง?');

 }  else if (update.message.text.indexOf('เนอะ') > -1) {
    bot.reply(update, 'เนอะ');

 }  else if (update.message.text.indexOf('อุณหภูมิเท่าไร') > -1 ||
          update.message.text.indexOf('สภาพอากาศ') > -1) {

    getWeather(function(err, result){
      if(err) console.log(err);
      else bot.sendTextMessageTo(result, update.sender.id);
    })

  } else if (update.message.text === '777778547') {

    let uid = update.sender.id
    if(!checkDupID(uid))
      recordNewUserID(uid)

  } else if (update.message.text === 'aaa1414s1') {

    readDB()

  } else {
   const messages = ['บอทยังไม่เข้าใจข้อความของคุณ',
                     'ขออภัยในความไม่สะดวก เราจะพยายามพัฒนาบอทให้เข้าใจคำพูดของคุณมากยิ่งขึ้น']
   bot.sendTextCascadeTo(messages, update.sender.id)
  }

});

console.log('started');



let nodeSchedule = require('node-schedule');
let rerunner = nodeSchedule.scheduleJob('*/5 * * * *', function(){
  console.log('running');
  //if(testSubjectID != "" && botIdentifier != null)
    //botIdentifier.sendIsTypingMessageTo(testSubjectID);
    //botIdentifier.sendTextMessageTo("YOLO", testSubjectID)
    //console.log('I can spam this : ' + testSubjectID);

});
