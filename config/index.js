/**
 * Module dependencies.
 */

const path = require('path');
const development = require('./env/development');
const test = require('./env/test');
const production = require('./env/production');
const defaults = {
  root: path.normalize(__dirname + '/..')
};

/**
 * Expose
 */

module.exports = {
  development: Object.assign({}, development, defaults),
  test: Object.assign({}, test, defaults),
  production: Object.assign({}, production, defaults)
}[process.env.NODE_ENV || 'development'];
