const express = require('express')
const app = express()

let messengerProfileAPI = require('./app/apis/messenger_profile.api.js')
let userMgt = require('./app/controllers/userManagement.controller.js')
let database = userMgt.database

module.exports = function() {

  app.get("/test", function(req, res){
    res.send('sss')
  })

}
