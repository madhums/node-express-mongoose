let express = require('express')

let messengerProfileAPI = require('./app/apis/messenger_profile.api.js')
let userMgt = require('./app/controllers/userManagement.controller.js')
let database = userMgt.database

module.exports = function() {

  let app = express()

  app.get("/test", function(req, res){
    res.send('sss')
  })

}
