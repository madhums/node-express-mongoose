const admin = require('firebase-admin')
const functions = require('firebase-functions')
const env = functions.config().quizshow

let serviceAccount = require('./credential/serviceAccountKey.json')

const firebaseConfig = {
	credential: admin.credential.cert(serviceAccount),
	apiKey: env.firebase.api_key,
	authDomain: 'codelab-a8367.firebaseapp.com',
	databaseURL: 'https://codelab-a8367.firebaseio.com/',
	storageBucket: 'gs://codelab-a8367.appspot.com',
	messagingSenderId: 565799047733
}

admin.initializeApp(firebaseConfig)
serviceAccount = null

module.exports = {
  env,
  admin,
  functions
}
