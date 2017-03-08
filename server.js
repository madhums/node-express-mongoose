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

//require('./config/express')(app/*, passport*/);
//require('./config/routes')(app/*, passport*/);
/*
connection
  .on('error', console.log)
  .on('disconnected', connect)
  .once('open', listen);
*/
app.listen(port, () =>{
  console.log('Express app started on port ' + port);
});
/*
function connect () {
  var options = { server: { socketOptions: { keepAlive: 1 } } };
  var connection = mongoose.connect(config.db, options).connection;
  return connection;
}
*/



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

  if (update.message.text === 'ดี' ||
     update.message.text === 'หวัดดี' ||
     update.message.text === 'นี่' ||
     update.message.text.indexOf('สวัสดี') > -1 ) {
   bot.reply(update, 'หวัดดี ว่าไง?');

  } else if (update.message.text.indexOf('weather') > -1) {

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
            bot.sendTextMessageTo('sent from ' + responseJSON.name , update.sender.id);
          }

        });

    });

  } else {
   const messages = ['I\'m sorry about this.',
                     'But it seems like I couldn\'t understand your message.',
                     'Could you try reformulating it?']
   bot.sendTextCascadeTo(messages, update.sender.id)
  }

});

console.log('started');
