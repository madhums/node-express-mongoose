let express = require('express')
let app = express()

let messengerProfileAPI = require('./app/apis/messenger_profile.api.js')
let userMgt = require('./app/controllers/userManagement.controller.js')
let database = userMgt.database

app.get("/test", function(req, res){
  res.send('sss')
})

//module.exports = app
