//---- DB Functions ----
//exports.database = database
module.exports = function(axios, db, messengerAPI) {

  let module = {}

  //get all users' fbid
  module.getAllID = () => {
    return new Promise((resolve, reject) => {

      db.ref('userIds').once('value')
      .then(snapshot => {
        console.log(`inside get all id`);

        if(snapshot.val() !== null) {

          let idArray = []
          let obj = snapshot.val()

          for(key in obj)
            idArray.push(obj[key])

          console.log(idArray);
          return resolve(idArray)

        }
        else return resolve([])
      })
      .catch(error => {
        console.log(`get All Id error: ${error}`);
        reject(error)
      })

    })
  }

  // record new user id when user interact with bot for the first time
  module.recordNewUserID = function(userId) {

    let userName = ''
    console.log(`________________________`);

    messengerAPI.callProfileAPI(userId)
    .then(profile => {

      console.log(`profile : ${profile.first_name} // ${JSON.stringify(profile)}`);
      userName = `${profile.first_name} ${profile.last_name}`
      console.log(`username = ${userName}`)

      console.log(`alllllll iddddd : ${module.getAllID()}`)
      return module.getAllID()
    })
    .then(allID => {

      console.log(`allID = ${allID}`)
      if(allID.indexOf(userId) > -1) {

        console.log(`duplciate user id`)
        return ''

      }
      else {

        console.log(`adding  new user`)
        db.ref(`userIds`).push().set(userId)

        return db.ref(`users`).push().set({
          'fbid': userId,
          'firstName': profile.first_name,
          'lastName': profile.last_name,
          'gender': profile.gender,
          'profilePic': profile.profile_pic,
          'timezone': profile.timezone,
          'createdAt': (new Date()).toISOString()
        })

      }

    })
    .then(() => {
      console.log(`new user has been added successfully`);
      return userName
    })
    .catch(error => {
      console.log(`error: ${error}`);
    })

  }





  return module
}
