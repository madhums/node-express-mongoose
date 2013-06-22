
/**
 * Module dependencies
 */

var express = require('express')
var passport = require('passport')
var env = process.env.NODE_ENV || 'development'
var config = require('./config/config')[env]
var mongoose = require('mongoose')
var fs = require('fs')

require('express-namespace')

mongoose.connect(config.db)

// Bootstrap models
fs.readdirSync(__dirname + '/app/models').forEach(function (file) {
  require(__dirname + '/app/models/' + file)
})

// Bootstrap passport config
require('./config/passport')(passport, config)

var app = express()

// Bootstrap application settings
require('./config/express')(app, config, passport)

// Bootstrap routes
require('./config/routes')(app, passport)

// Start the app by listening on <port>
var port = process.env.PORT || 3000
app.listen(port)
console.log('Express app started on port '+port)

// Expose app
module.exports = app
