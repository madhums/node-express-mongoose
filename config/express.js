
/*!
 * Module dependencies.
 */

var express = require('express')
var mongoStore = require('connect-mongo')(express)
var helpers = require('view-helpers')
var pkg = require('../package')
var flash = require('connect-flash')
var env = process.env.NODE_ENV || 'development'

/*!
 * Expose
 */

module.exports = function (app, config, passport) {
  // Add basic auth for staging
  if (env === 'staging') {
    app.use(express.basicAuth(function(user, pass){
      return 'username' == user & 'password' == pass
    }))

    app.use(function (req, res, next) {
      if (req.remoteUser && req.user && !req.user._id) {
        delete req.user
      }
      next()
    })
  }

  app.set('showStackError', true)

  // use express favicon
  app.use(express.favicon())

  app.use(express.static(config.root + '/public'))
  app.use(express.logger('dev'))

  // views config
  app.set('views', config.root + '/app/views')
  app.set('view engine', 'jade')

  app.configure(function () {
    // bodyParser should be above methodOverride
    app.use(express.bodyParser())
    app.use(express.methodOverride())

    // cookieParser should be above session
    app.use(express.cookieParser())
    app.use(express.session({
      secret: pkg.name,
      store: new mongoStore({
        url: config.db,
        collection : 'sessions'
      })
    }))

    // Passport session
    app.use(passport.initialize())
    app.use(passport.session())

    // Flash messages
    app.use(flash())

    // expose pkg and node env to views
    app.use(function (req, res, next) {
      res.locals.pkg = pkg
      res.locals.env = env
      next()
    })

    // View helpers
    app.use(helpers(pkg.name))

    // routes should be at the last
    app.use(app.router)

    // custom error handler
    app.use(function (err, req, res, next) {
      if (err.message
        && (~err.message.indexOf('not found')
        || (~err.message.indexOf('Cast to ObjectId failed')))) {
        return next()
      }

      console.error(err.stack)
      res.status(500).render('500')
    })

    app.use(function (req, res, next) {
      res.status(404).render('404', { url: req.originalUrl })
    })
  })

  // development specific stuff
  app.configure('development', function () {
    app.locals.pretty = true;
  })

  // staging specific stuff
  app.configure('staging', function () {
    app.locals.pretty = true;
  })
}
