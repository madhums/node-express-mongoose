exports.test = function (cors, req, res, db) {
	cors(req, res, () => {
		let foo = 5

    db.ref('userIds').once('value')
    .then(snapshot => {
      let amount = Object.keys(snapshot.val()).length
      console.log(`users amount = ${amount} `)
      console.log(`users amount + 5 = ${amount + foo} `)
      
      res.json({
        'amount': amount,
        'foo': foo
      })
      
    })
    .catch(error => {

      console.log(`error : ${error} `)
      res.json({
        'error': error
      })

    })

		
	})
}
