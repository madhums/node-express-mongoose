let firebase = require('../config/firebase.init.js')
let database = firebase.database()

exports.getResult = function(req, res) {
  let a = 50
  //res.render('')
  res.send(a)
}
