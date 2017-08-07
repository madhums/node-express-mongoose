const firebaseInit = require('./firebase-settings.js')
const functions = firebaseInit.functions
const admin = firebaseInit.admin
const env = firebaseInit.env

const cors = require('cors')({
	origin: ['http://localhost:3000', 'https://codelab-a8367.firebaseapp.com', 'https://chatchingchoke.club']
})

const db = admin.database()
const FB = require('fbgraph')
const param = require('jquery-param')
const axios = require('axios')

FB.setAccessToken(env.messenger.page_token)

const messengerAPI = require('./API/messengerProfile.js')// (axios, env.messenger)
const userManagementAPI = require('./API/userManagement.js')

let util = {
	'getFireQuizAt': _getFireQuizAt,
	'getParticipants': _getParticipants,
	'getQuiz': _getQuiz,
	'getStatus': _getStatus
}

let messengerFunctions = {
	'sendTextMessage': sendTextMessage,
	'sendCascadeMessage': sendCascadeMessage,
	'sendQuickReplies': sendQuickReplies,
	'sendBatchMessage': sendBatchMessage
}

const httpsFunctions = require('./httpsTriggered.js')(
	util,
	messengerFunctions
)

console.log('STARTING SERVICE')

// ----------------------- Cloud Functions ------------------------

function _getParticipants () {
	return db.ref('participants').once('value')
}

function _getQuiz () {
	return db.ref('quiz').once('value')
}

function _getFireQuizAt () {
	return db.ref('fireQuizAt').once('value')
}

function _getAdmin () {
	return db.ref('admin').once('value')
}

function _getStatus () {
	return new Promise((resolve, reject) => {
		let canEnter = false
		let playing = false
		let canAnswer = false
		let currentQuiz = -1

		db
			.ref('canEnter')
			.once('value')
			.then(ce => {
				canEnter = ce.val()
				return db.ref('canAnswer').once('value')
			})
			.then(ca => {
				canAnswer = ca.val()
				return db.ref('playing').once('value')
			})
			.then(pl => {
				playing = pl.val()
				return db.ref('currentQuiz').once('value')
			})
			.then(cq => {
				currentQuiz = cq.val()
				let status = {
					canEnter: canEnter,
					canAnswer: canAnswer,
					playing: playing,
					currentQuiz: currentQuiz
				}

				return resolve(status)
			})
			.catch(error => {
				return reject(error)
			})
	})
}


// ------------------------------------------------

function sendBatchMessage (reqPack) {

	// REQUEST FORMAT (reqPack must be array of data like this)
	//
	// let bodyData = {
	// 	recipient: {
	// 		id: user.fbid
	// 	},
	// 	message: {
	// 		text: `สวัสดี ${user.firstName} ทดสอบอีกที`
	// 	}
	// }

	// requests.push({
	// 	method: 'POST',
	// 	relative_url: 'me/messages?include_headers=false',
	// 	body: param(bodyData)
	// })

	// batch allow 50 commands per request
	let batchLimit = 50
	for (let i = 0; i < reqPack.length; i += batchLimit) {

		FB.batch(reqPack.slice(i, i + batchLimit), (error, res) => {

			if (error) {
				console.log(`\n batch [${i}] error : ${JSON.stringify(error)} \n`)
			}
			else {

				console.log(`batch [${i}] / no error : `)
				let time = new Date()
				let date = time.getFullYear() + '-' + (time.getMonth() + 1) + '-' + time.getDate()
				let epochTime = time.getTime()

				res.forEach(response => {
					db.ref(`batchLogs/${date}/${epochTime}`).push().set(response['body'])
					console.log(response['body'])
				})
					
			}

		})

	}
}

exports.answerFromWeb = functions.https.onRequest((req, res) => {
  cors(req, res, () => {

    let PSID = req.body.PSID
    let answer = req.body.answer

    if (!PSID || ! answer) res.json({ error: 'no PSID, answer data found' })
    else {

		let participantInfo = null
		let status = null

    db.ref(`participants/${PSID}`).once('value')
    .then(partSnap => {
      participantInfo = partSnap.val()

			if (participantInfo == null) throw `error getting info of participant id : ${PSID}`
				else return _getStatus()
      })
      .then(fStatus => {
		
				status = fStatus
		
        if (!status.playing) throw { code: 1, message: 'quiz not started' }
        else if (!status.canAnswer) throw { code: 1, message: 'quiz timeout' }
        else if (participantInfo.answerPack[status.currentQuiz].ans.length > 0) throw { code: 2, message: 'already answered' }
        else return db.ref(`quiz/${status.currentQuiz}`).once('value') // status.playing && status.canAnswer

      })
      .then(quizSnap => {
        
        let quiz = quizSnap.val()
        
        if (quiz.choices.indexOf(answer) == -1 ) throw { code: 2, message: 'answer not in choices scope ?!' }
        else if (answer == quiz.a) {
          participantInfo.answerPack[status.currentQuiz].correct = true
					participantInfo.point++
        }

				participantInfo.answerPack[status.currentQuiz].at = (new Date()).getTime()
				participantInfo.answerPack[status.currentQuiz].ans = answer
				
        db.ref(`participants/${PSID}/`).set(participantInfo)
        .then(() => {

          console.log(`update participant [${PSID}] answer for quiz no [${status.currentQuiz}] success`)
          
          res.json({
            error: null,
            message: 'update success'
          })
          
        })

      })
      .catch(error => {

				console.log(`Error found in [answerFromWeb]: ${error}`)
				
				if (error.code) res.json({ error: error.code, message: error.message })
				else res.json({ error: 3, message: error })
		
      })

    }
    
    
  })
})

exports.addCoupon = functions.https.onRequest((req, res) => {
	
	db.ref('users').once('value')
	.then(us => {
		let users = us.val()
		
		for (let key in users) {
			users[key].coupon = 0
		}

		return db.ref('users').set(users)

	})
	.then(() => {
		res.send('success')
	})
	.catch(error => {
		console.log(`error testChecker: ${error}`)
		res.send('failed')
	})

})

exports.addNewUserFromWeb = functions.https.onRequest((req, res) => {
	cors(req, res, ()  => {

		let uid = req.body.userID // || req.query['xuid']
		let firebaseAuth = req.body.firebaseKey
		

		if (!uid || !firebaseAuth ) res.json({ error: 'no userID or Firebase Auth key' })
		else {

			console.log(`in else ${uid}`)
			axios.get(`https://graph.facebook.com/v2.10/${uid}/ids_for_pages`, {
				params: {
					page: '1849513501943443', // DS page ID
					appsecret_proof: env.messenger.proof,
					access_token: env.messenger.access_token,
					include_headers: false
				}
			})
			.then(response => {

				if (response.status == 200) {

					if (response.data.data.length < 1) throw { error: 'This user need to chat on page first', error_code: 5555 }

					let data = response.data.data[0]
					console.log(`data.id : ${data.id}`)
					userManagementAPI.recordNewUserID_FBlogin(uid, data.id, firebaseAuth)
					.then(userData => {
						
						res.json({
							error: null,
							PSID: userData.PSID,
							firstName: userData.firstName,
							lastName: userData.lastName,
							coupon: userData.coupon
						})

					})

				}
				else res.json({
					error: `response with status code ${response.status}`,
					error_code: `HTTP status code ${response.status}`
				})				

			})
			.catch(err => {

				if (err.error_code == 5555) {

					res.json({
						error: err.error,
						error_code: err.error_code
					})

				}
				else res.json({
					error: err.response.data.error.message,
					error_code: err.response.data.error.code
				})

			})

		}
		

	})
})

exports.readLog = functions.https.onRequest((req, res) => {
	cors(req, res, () => {
		
		let date = req.query['date']

		if (!date) res.json({ error: 'please specify date param' })
		else {

			db.ref(`/batchLogs/${date}`).once('value')
			.then(batchSnapshot => {

				let bat = {}
				let rB = batchSnapshot.val()
				Object.keys(rB).forEach(date => {
					bat = Object.assign(bat, rB[date])
				})
					
				let error = {
					detail : [],
					count : 0
				}

				let success = {
					detail : [],
					count : 0
				}

				let logCount = Object.keys(bat).length

				Object.keys(bat).forEach(key => {

					let tempLog = JSON.parse(bat[key])

					if (tempLog.error) {
						error.detail.push(tempLog)
						error.count++
					}
					else if (tempLog.recipient_id) {
						success.detail.push(tempLog)
						success.count++
					}

				})

				res.json({
					total: logCount,
					success: success,
					error: error
				})

			})
			.catch(error => {
				console.error(error)
			})

		}


	})
})


// ------------------------------

exports.hookerYOLOitsMeMessengerChatYO = functions.https.onRequest( (req, res) => {

	if (req.method == 'GET') {

		// console.log('GET Requested')
		if (
			req.query['hub.mode'] === 'subscribe' &&
			req.query['hub.verify_token'] === env.messenger.verify_token
		) {
			// console.log("Validating webhook")
			res.status(200).send(req.query['hub.challenge'])

		} else {
			console.error('Failed validation. Make sure the validation tokens match.')
			res.sendStatus(403)
		}

	} else if (req.method == 'POST') {

		let data = req.body

		// Make sure this is a page subscription
		if (data.object === 'page') {

			// Iterate over each entry - there may be multiple if batched
			data.entry.forEach(function (entry) {
				let pageID = entry.id
				let timeOfEvent = entry.time
				// console.log(`page id [${pageID}] , TOE ${timeOfEvent}`)

				// Iterate over each messaging event
				entry.messaging.forEach(function (event) {
					if (event.message) {
						receivedMessage(event)
					// } else if (event.delivery) {
					//	console.log(`Message delivered to ${event.sender.id}`)
					} else {
						console.log(`Webhook Unknown Event: ${JSON.stringify(event)}`)
					}
				})

			})

			// Assume all went well.
			//
			// You must send back a 200, within 20 seconds, to let us know
			// you've successfully received the callback. Otherwise, the request
			// will time out and we will keep trying to resend.
			res.sendStatus(200)
		}
		
	}
})

exports.getQuizStatus = functions.https.onRequest((req, res) => {
	cors(req, res, () => {
		httpsFunctions.getOverallStatus(req, res)
	})
})

exports.getParticipants = functions.https.onRequest((req, res) => {
	cors(req, res, () => {
		httpsFunctions.getParticipants(req, res)
	})
})

exports.showRandomCorrectUsers = functions.https.onRequest((req, res) => {
	cors(req, res, () => {
		httpsFunctions.showRandomCorrectUsers(req, res)
	})
})

exports.getTopUsers = functions.https.onRequest((req, res) => {
	cors(req, res, () => {
		httpsFunctions.getTopUsers(req, res)
	})
})


exports.sendRequest = functions.https.onRequest((req, res) => {
	cors(req, res, () => {
		httpsFunctions.sendRequest(req, res)
	})
})

exports.sendQuiz = functions.https.onRequest((req, res) => {
	cors(req, res, () => {
		let status = null
		let participants = null
		let quiz = null
		let fireQuizAt = null

		_getStatus()
			.then(fetchedStatus => {
				status = fetchedStatus
				return _getFireQuizAt()
			})
			.then(fqaSnapshot => {
				fireQuizAt = fqaSnapshot.val()
				return _getParticipants()
			})
			.then(participantsSnapshot => {
				participants = participantsSnapshot.val()
				return _getQuiz()
			})
			.then(quizSnapshot => {
				quiz = quizSnapshot.val()

				if (!status.playing) db.ref('playing').set(true)

				if (!quiz)
					res.json({
						error: 'quiz not ready, try again later',
						quiz: quizSnapshot.val()
					})
				else if (!participants)
					res.json({ error: 'no participants, try again later' })
				else {
					let oldc = status.currentQuiz
					if (req.query.next == 'true' && status.currentQuiz < quiz.length) {
						db.ref('currentQuiz').set(status.currentQuiz + 1)
						status.currentQuiz += 1
						console.log(
							`update currentQuiz to ${oldc + 1} // is it : ${status.currentQuiz}`
						)
					}

					if (status.currentQuiz > quiz.length - 1 || status.currentQuiz < 0)
						res.json({
							error: 'quiz no. out of bound',
							currentQuiz: status.currentQuiz,
							suggestion:
								"if this is the first question don't forget to use ?next=true param"
						})
					else {
						
						let answerTime = req.query.timer
							? parseInt(req.query.timer) + 10
							: 70
						let quickReplyChoices = []

						db.ref('answerWindow').set(answerTime)

						quickReplyChoices = quiz[status.currentQuiz].choices.map(choice => {
							return {
								content_type: 'text',
								title: choice,
								payload: choice
							}
						})

						// ---------- start preparing batch request

						let sendQuizBatch = []

						Object.keys(participants).forEach(id => {

							let quizBodyData = {
								recipient: {
								id: id
								},
								message: {
									text: quiz[status.currentQuiz].q,
									quick_replies: quickReplyChoices
								}
							}

							sendQuizBatch.push({
								method: 'POST',
								relative_url: 'me/messages?include_headers=false',
								body: param(quizBodyData)
							})

						})

						if (!fireQuizAt) fireQuizAt = Array(quiz.length).fill(0)

						if (fireQuizAt[status.currentQuiz] == 0) {

							fireQuizAt[status.currentQuiz] = new Date().getTime()

							db.ref('fireQuizAt').set(fireQuizAt)
							.then(() => {
								return db.ref('canAnswer').set(true)
							})
							.then(() => {

								console.log('sync SENDING')
								sendBatchMessage(sendQuizBatch)

								res.json({
									error: null,
									qno: status.currentQuiz,
									q: quiz[status.currentQuiz].q,
									choices: quiz[status.currentQuiz].choices
								})

							})

						}
						else {
							
							db.ref('canAnswer').set(true)
							.then(() => {

								console.log('sync SENDING / not set new FQA')
								sendBatchMessage(sendQuizBatch)

								res.json({
									error: null,
									qno: status.currentQuiz,
									q: quiz[status.currentQuiz].q,
									choices: quiz[status.currentQuiz].choices
								})

							})

						}

					}
				}
			})
			.catch(error => {
				console.log(`there's an error in sendQuiz: ${error}`)
				res.end()
			})
	})
})

exports.addQuiz = functions.https.onRequest((req, res) => {
	cors(req, res, () => {
		httpsFunctions.addQuiz(req, res)
	})
})

exports.sendResult = functions.https.onRequest((req, res) => {
	cors(req, res, () => {
		httpsFunctions.sendResult(req, res)
	})
})

exports.restart = functions.https.onRequest((req, res) => {
	cors(req, res, () => {
		httpsFunctions.restart(req, res)
	})
})

// //////////////////////////////////////////////////////////////////// f(x)

function sendQuickReplies (recipientId, quickReplies) {
	let messageData = {
		recipient: {
			id: recipientId
		},
		message: quickReplies
	}
	callSendAPI(messageData)
}

function sendTextMessage (recipientId, messageText) {
	let messageData = {
		recipient: {
			id: recipientId
		},
		message: {
			text: messageText // ,
			// metadata: "DEVELOPER_DEFINED_METADATA"
		}
	}

	callSendAPI(messageData)
}

function callSendAPI (messageData) {
	// console.log(`message data : ${JSON.stringify(messageData)}`)
	axios({
		method: 'POST',
		url: 'https://graph.facebook.com/v2.6/me/messages',
		params: {
			access_token: env.messenger.page_token
		},
		data: messageData
	})
		.then(res => {
			if (res.status == 200) {
				let body = res.data
				let recipientId = body.recipient_id
				let messageId = body.message_id

				if (messageId) {
					console.log(
						'Successfully sent message with id %s to recipient %s',
						messageId,
						recipientId
					)
				} else {
					console.log(
						'Successfully called Send API for recipient %s',
						recipientId
					)
				}
			} else {
				console.log(`Failed calling Send API ${res.status} / ${res.statusText} / ${res.data.error}`)
			}
		})
		.catch(error => {
			console.log('send API : ')
			console.log(`${error}`)
		})
}

function sendCascadeMessage (id, textArray) {

	textArray.reduce((promiseOrder, message) => {
		return promiseOrder.then(() => {
			// console.log(message)
			sendTextMessage(id, message)
			return new Promise(res => {
				setTimeout(res, 1000)
			})
		})
	}, Promise.resolve())
	.then( () => console.log('send cascade message DONE!'),
		error => {
			console.log(`reduce error : ${error} `)
		}
	)

}


function addNewUser (newUserId) {

	console.log('enter addNewUser')
	let userProfile = null

	userManagementAPI.recordNewUserID(newUserId)
	messengerAPI.sendTypingOn(newUserId)
	console.log('b4 call profile api')
	messengerAPI.callProfileAPI(newUserId)
	.then(profile => {

		userProfile = profile
		return _getStatus()

	})
	.then(status => {

		if (status.playing || status.canEnter) {
			let inviteMessage = {
				text:
					'แชทชิงโชค กำลังจะเริ่มในไม่ช้า ต้องการเข้าร่วมเล่นด้วยหรือไม่?',
				quick_replies: [
					{
						content_type: 'text',
						title: 'เข้าร่วม',
						payload: 'เข้าร่วม'
					},
					{
						content_type: 'text',
						title: 'ไม่เข้าร่วม',
						payload: 'ไม่เข้าร่วม'
					}
				]
			}

			setTimeout(() => {
				sendQuickReplies(newUserId, inviteMessage)
			}, 1000)

		} else {

			let texts = [
				`สวัสดี คุณ ${userProfile.first_name} ${userProfile.last_name}`,
				'ขณะนี้ แชทชิงโชค ยังไม่เริ่ม ถ้าใกล้ถึงช่วงเวลาของกิจกรรมแล้วทางเราจะติดต่อกลับไปนะ'
			]

			sendCascadeMessage(newUserId, texts)
		}

	})
	.catch(error => {
		console.log(`error : ${error}`)
	})

}

function receivedMessage (event) {

	let senderID = event.sender.id
	let recipientID = event.recipient.id
	let timeOfMessage = event.timestamp
	let message = event.message

	console.log('Received message for user %d and page %d at %d with message:',
	senderID, recipientID, timeOfMessage)
	// console.log(JSON.stringify(message))

	// let messageId = message.mid
	let messageText = message.text
	let messageQRPayload = message.quick_reply
		? message.quick_reply.payload
		: 'noValue'
	let messageAttachments = message.attachments

	// ------- USER ANSWER
	let status = null
	let participants = null
	// let allUsers = null
	let quiz = null
	let adminAvaiability = false
	let admins = null

	_getAdmin()
		.then(snapshot => {
			admins = snapshot.val()

			if (Object.keys(admins).length > 0) {
				if (admins[senderID])
					adminAvaiability = true
			}
			
			console.log(`admin : ${JSON.stringify(admins)}`)
			return _getStatus()
		})
		.then(fetchedStatus => {
			status = fetchedStatus
			return _getQuiz()
		})
		.then(quizSnapshot => {
			quiz = quizSnapshot.val()
			return _getParticipants()
		})
		.then(participantsSnapshot => {
			participants = participantsSnapshot.val()
			return db.ref('users').once('value')
		})
		.then(fetchedUsers => {
			let users = fetchedUsers.val()
			let allUsers = {}

			for (let key in users) {
				allUsers[users[key].fbid] = {
					fullName: users[key].firstName + ' ' + users[key].lastName,
					firstName: users[key].firstName,
					lastName: users[key].lastName,
					profilePic: users[key].profilePic
				}
			}

			console.log('________________________________')
			console.log(`_______ ${JSON.stringify(status)} ______`)
			console.log('________________________________')
			// ----------------------------------------------------------------------------------------
			console.log('before if')
			if (status.playing && quiz[status.currentQuiz].choices.indexOf(messageQRPayload) > -1  &&
				participants && status.currentQuiz > -1 ) {
				
				if (!status.canAnswer) {
					sendTextMessage(senderID, 'หมดเวลาตอบข้อนี้แล้วจ้า')
				}
				else {

					sendTextMessage(senderID, 'ได้คำตอบแล้วจ้า~')

					if (participants[senderID] && !participants[senderID].answerPack[status.currentQuiz].ans) {

						participants[senderID].answerPack[status.currentQuiz].ans = messageQRPayload
						participants[senderID].answerPack[status.currentQuiz].at = new Date().getTime()

						if (messageQRPayload == quiz[status.currentQuiz].a) {
							participants[senderID].answerPack[status.currentQuiz].correct = true
							participants[senderID].point++
						}

						db.ref(`participants/${senderID}`).set(participants[senderID])

					} else if (participants[senderID].answerPack[status.currentQuiz].ans) {
						sendTextMessage(senderID, 'คุณได้ตอบคำถามข้อนี้ไปแล้วนะ')
					}
				}

			} else if ( messageQRPayload == 'เข้าร่วม' && ((participants && !participants[senderID]) || !participants) && status.canEnter ) {

				// ------- USER ENTER
				// console.log(`in the khaoruam // id : ${senderID}`)

				// console.log(`in the khaoruam // allID : ${JSON.stringify(allUsers)}`)

				// if(!participants[senderID]) {
				let answerTemplate = Array(quiz.length).fill({
					ans: '',
					correct: false,
					at: 0
				})

				let tempParticipant = {
					point: 0,
					answerPack: answerTemplate,
					firstName: allUsers[senderID].firstName,
					lastName: allUsers[senderID].lastName,
					profilePic: allUsers[senderID].profilePic
				}

				console.log(`new parti: ${allUsers[senderID].firstName}`)
				db.ref(`participants/${senderID}`).set(tempParticipant)

				if (status.playing && status.canAnswer) {
					let quizMessage = {
						text: quiz[status.currentQuiz].q,
						quick_replies: quiz[status.currentQuiz].choices.map(choice => {
							return {
								content_type: 'text',
								title: choice,
								payload: choice
							}
						})
					}

					sendQuickReplies(senderID, quizMessage)
				} else {
					// sendTextMessage(senderID, 'โอเค~ รออีกแป๊บนะ กิจกรรมใกล้จะเริ่มแล้ว')
					let texts = [
						'ยินดีต้อนรับเข้าสู่เกม "แชทชิงโชค" โปรดรอคำถามจาก facebook Live',
						`กติกาการแข่งขัน ผู้ที่สะสมคะแนนได้สูงสุดใน 3 อันดับแรกของแต่ละวัน จะได้รับของรางวัลจากทางรายการ
    แต้มจะไม่สามารถสะสมข้ามสัปดาห์ได้ และการตัดสินของกรรมการจะถือเป็นที่สิ้นสุด

    ทีมงานและครอบครัวไม่สามารถร่วมเล่นเกมและรับของรางวัลได้`
					]

					sendCascadeMessage(senderID, texts)
				}
				/*
      }
      else {
        console.log(`Already has this user in participants`)
      }
*/
			} else if (messageQRPayload == 'ไม่เข้าร่วม' && !participants[senderID]) {
				sendTextMessage(senderID, 'ถ้าเปลี่ยนใจก็ทักมาได้นะ')

			} else if (messageText) {
				// ------- USER MESSAGE NORMALLY
				// console.log('IN get message')
				// If we receive a text message, check to see if it matches a keyword
				// and send back the example. Otherwise, just echo the text we received.
				if (adminAvaiability) {

					console.log(`admin check return true : ${adminAvaiability} `)

					if (admins[senderID]) {
						// sendTextMessage(senderID, 'you are an admin')
						let splitted = messageText.split(':: ')

						if (splitted.length <= 1) {
							sendTextMessage(senderID, '## ERROR!! INVALID COMMAND SYNTAX')
						}
						else {

							console.log('to run command')
							
							let command = splitted[0]
							let text = splitted[1]

							if (command == 'ANN_ALL') {

								console.log(`running command [${command}]`)
								let batchRequests = []

								Object.keys(allUsers).forEach(id => {
									
									let bodyData = {
										recipient: {
											id: id
										},
										message: {
											text: text
										}
									}

									batchRequests.push({
										method: 'POST',
										relative_url: 'me/messages?include_headers=false',
										body: param(bodyData)
									})
									// sendTextMessage(id, text)
								})

								sendBatchMessage(batchRequests)
								// tell admin that message was sent
								sendTextMessage(senderID, '## Message sent to ALL USERS')
							}
							else if (command == 'ANN_PART') {

								console.log(`running command [${command}]`)
								let batchRequests = []

								Object.keys(participants).forEach(id => {
									
									let bodyData = {
										recipient: {
											id: id
										},
										message: {
											text: text
										}
									}

									batchRequests.push({
										method: 'POST',
										relative_url: 'me/messages?include_headers=false',
										body: param(bodyData)
									})
									
									// sendTextMessage(id, text)
								})

								sendBatchMessage(batchRequests)
								// tell admin that message was sent
								sendTextMessage(senderID, '## Message sent to ALL PARTICIPANTS')

							}
							else {
								sendTextMessage(senderID, '## ERROR!! COMMAND NOT FOUND')
							}

						}

					}

				}
				else if (!allUsers || !allUsers[senderID] || !participants || !participants[senderID]) {

					console.log('user id not found in DB {OR} not in participants -> adding new user')
					addNewUser(senderID)

				} else if (!status.playing && !status.canEnter) {

					console.log('this user is in our sigth, but game is end or not started yet, tell the user!')
					sendTextMessage(senderID,'ขณะนี้ แชทชิงโชค ยังไม่เริ่ม ถ้าใกล้ถึงช่วงเวลาของกิจกรรมแล้วทางเราจะติดต่อกลับไปนะ')

				} else {
					// else if(!participants)
					if (status.playing) {

						if (!status.canAnswer) {
							sendTextMessage(senderID, 'หมดเวลาตอบข้อนี้แล้วจ้า')
						}
						else if (participants[senderID] && participants[senderID].answerPack[status.currentQuiz].ans) {
							sendTextMessage(senderID, 'คุณได้ตอบคำถามข้อนี้ไปแล้วนะ')
						}
						else {
							sendTextMessage(senderID, 'พิมพ์ตอบจะไม่ได้คะแนนนะ กดตอบเอา')

							let quickReplyChoices = []

							quickReplyChoices = quiz[
								status.currentQuiz
							].choices.map(choice => {
								return {
									content_type: 'text',
									title: choice,
									payload: choice
								}
							})

							let quizMessage = {
								text: quiz[status.currentQuiz].q,
								quick_replies: quickReplyChoices
							}

							setTimeout(() => {
								sendQuickReplies(senderID, quizMessage)
							}, 1000)
						}

					} else if (status.canEnter)
						sendTextMessage(senderID, 'รอสักครู่นะ กิจกรรมยังไม่เริ่ม')
				}
			} else if (messageAttachments) {
				console.log(JSON.stringify(message))
				console.log('Message with attachment received')
				if (
					!allUsers ||
					!allUsers[senderID] ||
					!participants ||
					!participants[senderID]
				) {
					console.log('user id not found in DB {OR} not in participants -> adding new user')
					addNewUser(senderID)
				}

			}

			// ----------------------------------------------------------------------------------------
		})
		.catch(error => {
			console.error(`there's an error in receiving message: ${error}`)
		})
}


// ------------------------ TIMER  -------------------------

// this approach has problem with rapidly fire quiz 
// so, don't do it
exports.answerGap = functions.database.ref('canAnswer').onWrite(event => {
	
	let canAnswer = event.data.val()
	console.log(`canAnswer was changed to : ${canAnswer} `)
	
	if (canAnswer) {

		db.ref('answerWindow').once('value')
		.then(awSnap => {
			
			let gap = awSnap.val()
			console.log(`cuz canAnswer is [${canAnswer}] -> set [${gap}] seconds timer `)

			setTimeout(() => {
				db.ref('canAnswer').set(false)
				console.log('_______________________')
				console.log('NOW YOU CAN\'T ANSWER ME')
			}, gap * 1000)

		})
		.catch(error => {
			console.log(`get answer gap error in answerGap trigerr: ${error} `)
		})
		
	}

})
