
/*!
 * Module dependencies.
 */
exports.index = function (req, res) {
  res.render('home/index', {
    title: 'Node Express Mongoose Boilerplate'
  });
};


let nodeSchedule = require('node-schedule');
let rerunner = nodeSchedule.scheduleJob('*/10 * * * * *', function(){

 console.log('monthly popular recorded.');

});


//---------------
let fbConfig = require('../../config/secrets/fb_app_config.json')
const Botmaster = require('botmaster')
const botmaster = new Botmaster();

const MessengerBot = Botmaster.botTypes.MessengerBot;

const messengerSettings = {
  credentials: {
    verifyToken: fbConfig.verifyToken,
    pageToken: fbConfig.pageAccessToken,
    fbAppSecret: fbConfig.appSecret,
  },
  webhookEndpoint: '/hookmeatthisplace', // botmaster will mount this webhook on https://Your_Domain_Name/messenger/webhook1234
};

const messengerBot = new MessengerBot(messengerSettings);
