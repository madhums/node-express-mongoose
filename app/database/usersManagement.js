let https = require('https');
let firebase = require('firebase')
let messengerProfileAPI = require('./app/apis/messenger_profile.api.js')

let firebaseConfig = {
  apiKey: process.env.firebaseAPIKey,
  authDomain: "messengerchatbot-f6775.firebaseapp.com",
  databaseURL: "https://messengerchatbot-f6775.firebaseio.com",
  storageBucket: "messengerchatbot-f6775.appspot.com",
  messagingSenderId: "524406259822"
}

firebase.initializeApp(firebaseConfig)
let database = firebase.database()

module.exports  = {
  database: database
}

//---- DB Functions ----

exports.recordNewUserID = function(userId) {

  messengerProfileAPI.getUserInfo(userId, function(err, info){

    if(err) console.log(err);
    else if(info){

      database.ref(`/users/${userId}`).set({
        firstName: info.first_name,
        lastName: info.last_name,
        gender: info.gender,
        timezone: info.timezone,
        createdAt: (new Date()).toISOString(),
        subscribed: true
      })
      .then(function(){
        console.log('added');
      })
      .catch(function(error){
        console.log('failed');
      })

    }

  })

}


exports.setSubscription = function(userId, value) {

  database.ref(`/users/${userId}`).set({
    subscribed: value
  })
  .then(function(){
    console.log('set subscription to ' + value);
  })
  .catch(function(error){
    console.log('failed');
  })

}


exports.checkDupID = function(uid) {

  let dup = database.ref('users').orderByKey().equalTo(uid).once('value')
  .then(function(snapshot){
    // console.log(snapshot.val())
    // console.log(snapshot.exists())
    console.log('check dup');
    return snapshot.exists() //true means dup
  })
  .catch(function(error){
    console.log('check dup error');
    return true
  })

}

exports.testLog = function() {
  console.log('___________');
}

exports.testCBLog = function(cb) {
  cb('123456')
}

exports.getAllID = function(cb) {

  let dup = database.ref('users').once('value')
  .then(function(snapshot){
    let theArray = Object.keys(snapshot.val())
    console.log(theArray);
    return cb(null, theArray)

  })
  .catch(function(error){
    console.log('get all id error');
    return cb(`error getAllID ${error}`, null)
  })

}

exports.getAllSubscribedID = function(cb) {
  console.log('get all sub ids');
  let dup = database.ref('users').once('value')
  .then(function(snapshot){
    let theArray = []
    Object.keys(snapshot.val()).forEach( (key) => {
      if(snapshot.val()[key].subscribed) theArray.push(key)
    })
    //console.log(theArray);
    return cb(null, theArray)

  })
  .catch(function(error){
    console.log('get all sub is error : ' + error);
    return cb(`error getAllSubscribedID ${error}`, null)
  })

}

//async function checkIfSubscribed(uid) {
exports.checkIfSubscribed = async function(uid) {

  console.log('\nbefore ======================');

  try {

    let result = false
    let snap = await database.ref('users').orderByKey().equalTo(uid).once('value')
    Object.keys(snap.val()).forEach( (key) => {
      result = snap.val()[key].subscribed
    })
    console.log('try check if sub b4 return');
    return result

  } catch(error) {
    console.log('in this');
    console.log(error);
  }

}
