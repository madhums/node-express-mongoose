
/**
 * Module dependencies.
 */

var mongoose = require('mongoose')
var passportOptions = {
  failureFlash: 'Invalid email or password.',
  failureRedirect: '/login'
}

// controllers
var home = require('home')

/**
 * Expose
 */

module.exports = function (app, passport) {

  app.get('/', home.index)

}
