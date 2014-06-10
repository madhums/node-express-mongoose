
/**
 * Module dependencies.
 */

var path = require('path');
var extend = require('util')._extend;
var development = require('./env/development');
var test = require('./env/test');
var production = require('./env/production');
var defaults = {
  root: path.normalize(__dirname + '/..')
};

module.exports = {
  development: extend(defaults, development),
  test: extend(defaults, test),
  production: extend(defaults, production)
}[process.env.NODE_ENV || 'development'];
