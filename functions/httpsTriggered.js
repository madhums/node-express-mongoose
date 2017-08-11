const firebaseInit = require('./firebase-settings.js')
const messengerAPI = require('./API/messengerProfile.js')
const userManagementAPI = require('./API/userManagement.js')
const param = require('jquery-param')
const axios = require('axios')

const db = firebaseInit.admin.database()

module.exports = function (util, messengerFunctions) {

  let module = {}

  // --------- START HERE
  module.getOverallStatus = function (req, res) {

    let cq = -1
		let fqa = null
		let q = null
		let p = []
		let ucount = 0

		util.getStatus()
		.then(status => {
				cq = status.currentQuiz
				return util.getQuiz()
			})
			.then(snapshot => {
				q = snapshot.val()
				return util.getFireQuizAt()
			})
			.then(snapshot => {
				fqa = snapshot.val()
				return util.getParticipants()
			})
			.then(partSnap => {
				let tp = partSnap.val()
				if (tp) {
					Object.keys(tp).forEach(key => {
						p.push(tp[key])
					})
				}

				return db.ref('/userIds').once('value')
			})
			.then(uidSnap => {
				let uids = uidSnap.val()
				
				if (uids) ucount = Object.keys(uids).length

				res.json({
					currentQuiz: cq,
					quizLength: q ? q.length : 0,
					fireQuizAt: fqa,
					quiz: q,
					userAmount: ucount,
					participantsAmount: p.length,
					participants: p,

				})

			})
			.catch(error => {
        console.log(`there's an error in getQuizStatus: ${error}`)
        res.json({
          error: `error in ${error} `
        })
      })
      
  }

	module.getParticipants = function (req, res) {

		util.getParticipants()
		.then(snapshot => {
			res.json({
				participants: snapshot.val()
			})
		})
		.catch(error => {
			console.log(`there's an error in getParticipants: ${error}`)
			res.end()
		})

	}

	module.showRandomCorrectUsers = function (req, res) {

		let quiz = null
		let participants = null
		let currentQuiz = -1

		util.getStatus()
		.then(status => {
			currentQuiz = status.currentQuiz
			return util.getQuiz()	
		})
		.then(quizSnapshot => {
			quiz = quizSnapshot.val()
			return util.getParticipants()
		})
		.then(participantsSnapshot => {
			participants = participantsSnapshot.val()

			if (!req.query.quizno) res.json({ error: 'please specify quiz no.' })
			else if (!quiz) res.json({ error: 'quiz not ready' })
			else if (!participants) res.json({ error: 'participants not found' })
			else if (req.query.quizno < 0 || req.query.quizno > quiz.length - 1)
				res.json({ error: 'incorrect quiz no.' })
			else {

				let targetQuizNo = parseInt(req.query.quizno)

				let answerAmount = 0
				let answerRate = quiz[targetQuizNo].choices.reduce((obj, choiceValue) => {
					obj[choiceValue] = 0
					return obj
				}, {})

				console.log('answerRate = ' + JSON.stringify(answerRate))
				console.log('quiz = ' + JSON.stringify(quiz))
				console.log('participant = ' + JSON.stringify(participants))

				if (targetQuizNo > -1 || targetQuizNo < quiz.length) {
					let correctUsers = Object.keys(participants).map(key => {
						if (participants[key].answerPack[targetQuizNo].ans.length > 0) {
							answerAmount++
							answerRate[participants[key].answerPack[targetQuizNo].ans]++
							console.log(
								'>>> in map : answerRate = ' + JSON.stringify(answerRate)
							)
						}

						if (participants[key].answerPack[targetQuizNo].correct == true) {
							return {
								id: key,
								firstName: participants[key].firstName,
								lastName: participants[key].lastName,
								profilePic: participants[key].profilePic,
								answerTime: participants[key].answerPack[targetQuizNo].at
							}
						}
					})

					correctUsers = correctUsers.filter(n => {
						return n != undefined
					})

					for (let key in answerRate) {
						answerRate[key] = Math.round(answerRate[key] / answerAmount * 100)
					}

					console.log(
						'>>> AFTER % : answerRate = ' + JSON.stringify(answerRate)
					)
					let range = correctUsers.length
					let sortCorrectUsers = []

					if (range <= 25) {
						if (range > 1)
							sortCorrectUsers = correctUsers.sort((a, b) => {
								return a.answerTime - b.answerTime
							})
						else sortCorrectUsers = correctUsers

						console.log(`sortCorrectUsers : ${sortCorrectUsers}`)

						res.json({
							error: null,
							answerRate: answerRate,
							correctUsers: sortCorrectUsers
						})
					} else {
						let array = correctUsers
						for (let i = array.length - 1; i > 0; i--) {
							let j = Math.floor(Math.random() * (i + 1))
							let temp = array[i]
							array[i] = array[j]
							array[j] = temp
						}

						res.json({
							error: null,
							answerRate: answerRate,
							correctUsers: array
						})
					}
				} else
					res.json({
						error: 'quiz no. incorrect',
						text: `you requested quiz number ${targetQuizNo}
               but current quiz number is ${currentQuiz} and quiz length is ${quiz.length}`
					})
			}
		})
		.catch(error => {
			res.json({
				error: error,
				'text': 'there should be error, but i dont\' know what it is. system don\'t tell me'
			})
		})

	}

	module.getTopUsers = function (req, res) {

		let fq = null
		let participants = null

		util.getFireQuizAt()
		.then(snapshot => {
			fq = snapshot.val()
			return util.getParticipants()
		})
		.then(snapshot => {
			if (!fq) res.json({ error: 'no quiz sent OR no sent time collected' })
			else {
				participants = snapshot.val()
				let candidate = Object.keys(participants).map(key => {
					let timeUsedBeforeAnswer = participants[key].answerPack.reduce((collector, ansDetail, idx) => {
						console.log('firequiz time : ' + fq[idx])
						return ansDetail.ans
							? collector + (ansDetail.at - fq[idx])
							: collector
					}, 0)

					return {
						id: key,
						firstName: participants[key].firstName,
						lastName: participants[key].lastName,
						profilePic: participants[key].profilePic,
						point: participants[key].point,
						totalTimeUsed: timeUsedBeforeAnswer
					}
				})

				let topUsers = candidate.sort((a, b) => {
					if (b.point - a.point == 0) return a.totalTimeUsed - b.totalTimeUsed
					else return b.point - a.point
				})

				if (topUsers.length > 15) {
					topUsers = topUsers.splice(0, 15)
				}

				res.json({
					error: null,
					topUsers: topUsers
				})
			}
		})
		.catch(error => {
			console.log(`there's an error in getTopUsers: ${error}`)
			res.end()
		})

	}

	module.sendRequest = function (req, res) {

		db.ref('canEnter').set(true)

		userManagementAPI
		.getAllID()
		.then(allID => {

			let sendRequestBatch = []

			allID.forEach(id => {

				let inviteMessage = {

					recipient: { id: id },
					message: {
						text: 'แชทชิงโชค กำลังจะเริ่มในไม่ช้า ต้องการเข้าร่วมเล่นด้วยหรือไม่?',
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
						
				}

				sendRequestBatch.push({
					method: 'POST',
					relative_url: 'me/messages?include_headers=false',
					body: param(inviteMessage)
				})

				// sendQuickReplies(id, inviteMessage)
			})

			messengerFunctions.sendBatchMessage(sendRequestBatch)

			res.json({
				error: null,
				text: 'everything is fine... I guess ?'
			})

		})
		.catch(error => {
			res.json({
				error: error,
				text: 'shit happens'
			})
		})

	}

	module.addQuiz = function (req, res) {

		if (req.method == 'POST') {
			db.ref('quiz').set(req.body.quiz)
		}

		res.json({
			error: null
		})

	}

	module.sendResult = function (req, res) {

		db.ref('canAnswer').set(false)
		db.ref('canEnter').set(false)
		db.ref('playing').set(false)

		let participants = null

		util.getParticipants()
		.then(participantsSnapshot => {

			participants = participantsSnapshot.val()

			let sendResultRequests = []
			Object.keys(participants).forEach(id => {

				let bodyData = {
					recipient: {
						id: id
					},
					message: {
						text: `กิจกรรมจบแล้ว ยินดีด้วย คุณได้คะแนนรวม ${participants[id].point} คะแนน สำหรับคูปองนั้นทางเราจะคำนวณและแจกให้ผู้เข้าร่วมกิจกรรมที่ทำตามเงื่อนไขนะ`
					}
				}

				sendResultRequests.push({
					method: 'POST',
					relative_url: 'me/messages?include_headers=false',
					body: param(bodyData)
				})
					
			})

			messengerFunctions.sendBatchMessage(sendResultRequests)

			res.json({
				error: null
			})
		})
		.catch(error => {
			console.log(`there's an error in sendResult: ${error}`)
			res.end()
		})

	}

	module.restart = function (req, res) {

		db.ref('currentQuiz').set(-1)
		db.ref('canEnter').set(false)
		db.ref('canAnswer').set(false)
		db.ref('playing').set(false)
		db.ref('participants').set(null)
		db.ref('fireQuizAt').set(null)

		res.json({
			error: null
		})

	}

	/*
  module.sendEndMessage = function (req, res) {

    let participants = null

    util.getStatus()
    .then(status => {
      if (status.canAnswer) db.ref('canAnswer').set(false)
      if (status.canEnter) db.ref('canEnter').set(false)
      if (status.playing) db.ref('playing').set(false)

      return util.getParticipants()
    })
    .then(participantsSnapshot => {

			participants = participantsSnapshot.val()

      Object.keys(participants).forEach(id => {
				messengerFunctions.sendTextMessage(
					id,
					'บ๊ายบาย ไว้มาร่วมสนุกกับพวกเราได้ใหม่วันจันทร์หน้านะ :)'
				)
			})

			res.json({
        'error': null,
        'message': 'send ending message success'
			})
		})
		.catch(error => {
			console.log(`there's an error in sendResult: ${error}`)
			res.end()
		})

  }
	*/

	module.readLog = function (req, res) {

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

	}

	module.sendCoupon = function (req, res) {

		if (req.query['approveCommand'] != 'IAgreeToGiveTheseCouponToPlayersWhoMetRequirement')
			res.json({ error: 'you don\'t have permission' })
		else if (!req.query['dateOfEvent'])
			res.json({ error: 'invalid parameters' })
		else {

			let participants = null
			let usersData = null

			// let allPlayers = []
			let whoGetPlayCoupon = []
			let topUsers = []

			let bestScore = 0
			let date = req.query['dateOfEvent']

			db.ref(`couponSchedule/${date}`).once('value')
			.then(csSnap => {

				let couponSchedule = csSnap.val()
				if (!couponSchedule || couponSchedule == null) throw 'event time error, check couponSchedule'

				return db.ref('participants').once('value')
			})
			.then(partSnap => {
				
				participants = partSnap.val()

				let allPlayers = Object.keys(participants).map(key => {

					if (participants[key].point > bestScore) bestScore = participants[key].point

					let answerAmount = participants[key].answerPack.reduce((collector, ansDetail) => {
						return ansDetail.ans ? collector + 1 : collector
					}, 0)

					// console.log(`answer count = ${answerAmount}`)

					return {
						id: key,
						point: participants[key].point,
						answerCount: answerAmount,
						played_reward_coupon: (answerAmount >= 3) ? true : false
					}

				})

				whoGetPlayCoupon = allPlayers.filter(user => {
					return user.played_reward_coupon
				})

				topUsers = allPlayers.filter(user => {
					return user.point == bestScore
				})

				/*
				res.json({
					error: null,
					allPlayersCount: allPlayers.length,
					whoGetPlayCouponCount: whoGetPlayCoupon.length,
					topUsersCount: topUsers.length,
					underline: '___________________________________',
					allPlayers: allPlayers,
					whoGetPlayCoupon: whoGetPlayCoupon,
					topUsers: topUsers
				})
				*/
				return db.ref('users/').once('value')

			})
			.then(userSnap => {
				
				usersData = userSnap.val()

				let played_reward_keys = whoGetPlayCoupon.map(player => {
					return player.id
				})

				let top_reward_keys = topUsers.map(player => {
					return player.id
				})

				let result = {}

				Object.keys(usersData).map(key => {

					if (played_reward_keys.indexOf(usersData[key].fbid) > -1) {

						usersData[key].coupon = usersData[key].coupon + 1
						usersData[key].couponHistory = {
							[date]: {
								playReward: true
							}
						}

						result[usersData[key].fbid] = {
							key: key,
							id: usersData[key].fbid,
							coupon: usersData[key].coupon
						}

					}


					if (top_reward_keys.indexOf(usersData[key].fbid) > -1) {

						usersData[key].coupon = usersData[key].coupon + 1
						
						if (usersData[key].couponHistory && usersData[key].couponHistory[date]) {
							usersData[key].couponHistory[date].bonusReward = true
						}
						else {

							usersData[key].couponHistory = {
							[date]: {
								bonusReward: true
							}
						}

						}
						

						result[usersData[key].fbid] = {
							key: key,
							id: usersData[key].fbid,
							coupon: usersData[key].coupon,
							bonus: true
						}

					}

				})

				if (req.query['mode'] == 9) {

					res.json({
						error: null,
						normal_count: played_reward_keys.length,
						bonus_count: top_reward_keys.length,
						result_count: Object.keys(result).length,
						// normal: played_reward_keys,
						// bonus: top_reward_keys,
						users_count: Object.keys(usersData).length,
						usersData: usersData
					})

				}
				else {

					db.ref(`couponSchedule/${date}`).set(false)
					.then(() => {
						console.log(`recorded coupon distribution on ${date}`)
						return db.ref('users').set(usersData)
					})
					.then(() => {
						res.json({
							error: null,
							message: 'Coupon Sent!!'
						})
					})

				}				
				

			})
			.catch(error => {
				console.log(`error : ${error}`)
				res.json({
					error: error
				})
			})

		}

	}

	module.updateCouponBalanceToUsers = function (req, res) {

		let date = req.query['dateOfEvent']
		if (!date) res.json({ error: 'invalid parameters' })
		else {

			let participants = null
			let usersData = null
			let sendResultRequests = []

			util.getParticipants()
			.then(partSnap => {
				participants = partSnap.val()
				return db.ref('users').once('value')
			})
			.then(uSnap => {

				usersData = uSnap.val()

				let participantKeys = Object.keys(participants)
				let partWhoGetCoupon = Object.keys(usersData).map(key => {
					
					let user = usersData[key]
					if (user.coupon > 0) {

						return {
							id: user.fbid,
							totalCoupon: user.coupon,
							bonus: (user.couponHistory && user.couponHistory[date] && user.couponHistory[date].bonusReward)
						}

					}
					else return null
					
				})

				// remove null
				partWhoGetCoupon = partWhoGetCoupon.filter(user => {
					return user != undefined
				})
				
				// filter to get only user who played the last game
				partWhoGetCoupon = partWhoGetCoupon.filter(user => {
					return participantKeys.indexOf(user.id) > -1
				})

				// only send to user who get coupon
				partWhoGetCoupon.forEach(user => {

					let bodyData = {
						recipient: {
							id: user.id
						},
						message: {
							text: `ระบบได้อัพเดตคูปองให้คุณแล้ว ปัจจุบันคุณมีคูปองรวม ${user.totalCoupon} คูปอง`
						}
					}

					if (user.bonus) bodyData.message.text += ' ขอแสดงความยินดีด้วย เพราะคุณเป็นหนึ่งในผู้เล่นที่มีคะแนนสูงสุดประจำสัปดาห์นี้ :D'

					sendResultRequests.push({
						method: 'POST',
						relative_url: 'me/messages?include_headers=false',
						body: param(bodyData)
					})
						
				})

				messengerFunctions.sendBatchMessage(sendResultRequests)
				

				res.json({
					error: null,
					// result: partWhoGetCoupon,
					// textToBeSent: testA
					message: 'message is on the way!'
				})

			})
			.catch(error => {

				console.error(`there's an error in update Coupon: ${error}`)

				res.json({
					error: error
				})

			})


		}

	}

	// ----------------------------------- WEB API

	module.addNewUserFromWeb = function  (req, res, messenger_env) {

		let uid = req.body.userID // || req.query['xuid']
		let firebaseAuth = req.body.firebaseKey

		if (!uid || !firebaseAuth ) res.json({ error: 'no userID or Firebase Auth key' })
		else {

			console.log(`in else ${uid}`)
			axios.get(`https://graph.facebook.com/v2.10/${uid}/ids_for_pages`, {
				params: {
					page: '1849513501943443', // DS page ID
					appsecret_proof: messenger_env.proof,
					access_token: messenger_env.access_token,
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

	}


	module.answerFromWeb = function (req, res) {

		let PSID = req.body.PSID
    let answer = req.body.answer
		let normalizedAnswer = answer.trim().toLowerCase() // for string answer

    if (!PSID || ! answer) res.json({ error: 'no PSID, answer data found' })
    else {

		let participantInfo = null
		let status = null

    db.ref(`participants/${PSID}`).once('value')
    .then(partSnap => {
      participantInfo = partSnap.val()

			if (participantInfo == null) throw `error getting info of participant id : ${PSID}`
				else return util.getStatus()
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
				let isCorrect = false
				
				if (!quiz.stringAnswer && !quiz.choices) throw { code: 2, message: 'what the f with this quiz, it has no choices and not support string answer' }
					// if (quiz.choices.indexOf(answer) == -1 ) throw { code: 2, message: 'answer not in choices scope ?!' }
					// else if (answer == quiz.a) isCorrect = true
				else if (quiz.choices && answer == quiz.a) isCorrect = true
				else if (quiz.stringAnswer && quiz.a.indexOf(normalizedAnswer) > -1) isCorrect = true
					
        if (isCorrect) {
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

	}



  // --------- END HERE

  return module

}
