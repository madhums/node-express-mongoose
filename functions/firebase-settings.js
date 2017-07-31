const admin = require('firebase-admin')
const functions = require('firebase-functions')
const env = functions.config().quizshow

let serviceAccount = require('./credential/serviceAccountKey.json')

const firebaseConfig = {
	credential: admin.credential.cert(serviceAccount),
	apiKey: env.firebase.api_key, // 'AIzaSyAShU7XQD5ji6DDf7PY__EUGb9LwvukrNU',
	authDomain: 'codelab-a8367.firebaseapp.com',
	databaseURL: 'https://codelab-a8367.firebaseio.com/',
	storageBucket: 'codelab-a8367.appspot.com',
	messagingSenderId: 565799047733
}

admin.initializeApp(firebaseConfig)
serviceAccount = null

module.exports = {
  env,
  admin,
  functions
}
