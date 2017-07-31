const functions = require('firebase-functions')
const messengerENV = functions.config().quizshow.messenger
const axios = require('axios')

const callProfileAPI = function (userId) {
	return axios(
		`https://graph.facebook.com/v2.6/${userId}?fields=first_name,last_name,profile_pic,timezone,gender&access_token=${messengerENV.page_token}`
	)
	.then(res => {
		if (res.status == 200)
			return res.data // first_name, last_name, gender, profile_pic, timezone
		else throw new Error(`status code: ${res.status}`)
	})
	.catch(error => {
		// console.log(`call profile api : ${error}`);
		throw `call profile api error : ${error}`
	})
}

// --------

const sendTypingOn = function (userId) {

	let typeOn = {
		recipient: {
			id: userId
		},
		sender_action: 'typing_on'
	}

	axios({
		method: 'POST',
		url: 'https://graph.facebook.com/v2.6/me/messages',
		params: {
			access_token: messengerENV.page_token
		},
		data: typeOn
	})
	.then(res => {
		if (res.status == 200) console.log('successfully send typing')
		else throw `${res.status}`
	})
	.catch(error => {
		console.log(`send typing on failed : ${error}`)
  })
  
}

module.exports = {
	sendTypingOn,
	callProfileAPI
}
