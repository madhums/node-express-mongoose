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

//---- DB Functions ----
let runner = 0;

function recordNewUserID(userId) {

  database.ref('/' + userId).set({
    s: 123,
    b: 555
  })
  .then(function(){
    console.log('added');
  })
  .catch(function(error){
    console.log('failed');
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

    let weatherURL = "http://api.openweathermap.org/data/2.5/weather?q=Bangkok,th&appid=" + process.env.weatherOpenAPIKey
    var request = http.get(weatherURL, function (response) {

        var buffer = "";
        response.on("data", function (chunk) {
            buffer += chunk;
        });

        response.on("end", function (err) {

          if(err) console.log('error occured');
          console.log('got reponse (sms)');
          if(buffer) {

            let responseJSON = JSON.parse(buffer)

            let city = (responseJSON.name == "Bangkok") ? "กรุงเทพ" : responseJSON.name
            let temp = Math.ceil(parseInt(responseJSON.main.temp) - 273.15)
            let weather = ""
            if(responseJSON.weather[0].description == "few clouds") weather = "มีเมฆเล็กน้อย"
            else if(responseJSON.weather[0].description == "scattered clouds") weather = "มีเมฆกระจายทั่ว"
            else if(responseJSON.weather[0].description == "clear sky") weather = "ฟ้าโปร่ง ไม่มีเมฆ"
            else weather = responseJSON.weather[0].description

            let weatherResponse = "อากาศใน" + city + " " + weather + " อุณหภูมิอยู่ที่ " + temp + " องศา"
            bot.sendTextMessageTo(weatherResponse, update.sender.id);

          }

        });

    });

  } else if (update.message.text === '777778547') {

    recordNewUserID(update.sender.id)

  } else if (update.message.text === 'aaa1414s1') {

    readDB()

  } else {
   const messages = ['I\'m sorry about this.',
                     'But it seems like I couldn\'t understand your message.',
                     'Could you try reformulating it?']
   bot.sendTextCascadeTo(messages, update.sender.id)
  }

});

console.log('started');



let nodeSchedule = require('node-schedule');
let rerunner = nodeSchedule.scheduleJob('*/30 * * * * *', function(){
  console.log('running');
  //if(testSubjectID != "" && botIdentifier != null)
    //botIdentifier.sendIsTypingMessageTo(testSubjectID);
    //botIdentifier.sendTextMessageTo("YOLO", testSubjectID)
    //console.log('I can spam this : ' + testSubjectID);

});
