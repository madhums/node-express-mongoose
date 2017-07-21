
module.exports = function (db, util, messengerAPI, userManagementAPI, messengerFunctions) {

  let module = {}

  // --------- START HERE
  module.getQuizStatus = function (req, res) {

    let cq = -1
		let fqa = null
		let q = null

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

				res.json({
					currentQuiz: cq,
					quizLength: q ? q.length : 0,
					fireQuizAt: fqa,
					quiz: q
				})

			})
			.catch(error => {
        console.log(`there's an error in getQuizStatus: ${error}`)
        res.json({
          error: `error in ${error} `
        })
      })
      
  }


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



  // --------- END HERE

  return module

}
