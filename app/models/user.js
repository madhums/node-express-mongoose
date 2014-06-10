
/*!
 * Module dependencies
 */

var mongoose = require('mongoose');
var userPlugin = require('mongoose-user');
var Schema = mongoose.Schema;

/**
 * User schema
 */

var UserSchema = new Schema({
  name: { type: String, default: '' },
  email: { type: String, default: '' },
  hashed_password: { type: String, default: '' },
  salt: { type: String, default: '' }
});

/**
 * User plugin
 */

UserSchema.plugin(userPlugin, {});

/**
 * Add your
 * - pre-save hooks
 * - validations
 * - virtuals
 */

/**
 * Methods
 */

UserSchema.method({

});

/**
 * Statics
 */

UserSchema.static({

});

/**
 * Register
 */

mongoose.model('User', UserSchema);
