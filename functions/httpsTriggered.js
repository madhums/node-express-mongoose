const firebaseInit = require('./firebase-settings.js')
const messengerAPI = require('./API/messengerProfile.js')
const userManagementAPI = require('./API/userManagement.js')
const param = require('jquery-param')

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
						text: `กิจกรรมจบแล้ว ยินดีด้วย คุณได้คะแนนรวม ${participants[id].point} คะแนน`
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


  // --------- END HERE

  return module

}
