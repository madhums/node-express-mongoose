//---- DB Functions ----
//exports.database = database
module.exports = function(axios, db, messengerAPI) {

  let module = {}

  //get all users' fbid
  module.getAllID = () => {

    return new Promise((resolve, reject) => {

      db.ref('userIds').once('value')
      .then(snapshot => {
        if(snapshot.val() !== null) {
          let idArray = []
          let obj = snapshot.val()

          for(key in obj)
            idArray.push(obj[key])

          return resolve(idArray)
        }
        else return resolve([])
      })
      .catch(error => {
        //console.log(`get All Id error: ${error}`);
        reject(error)
      })

    })
  }


  // record new user id when user interact with bot for the first time
  module.recordNewUserID = function(userId) {

      let userName = ''
      let fetchedProfile = null

      messengerAPI.callProfileAPI(userId)
      .then(profile => {
        userName = `${profile.first_name} ${profile.last_name}`
        fetchedProfile = profile
        return module.getAllID()
      })
      .then(allID => {

        if(allID.indexOf(userId) > -1) {
          //console.log(`duplciate user id`)
          //return resolve(userName)
        }
        else {

          //console.log(`adding  new user`)
          db.ref(`userIds`).push().set(userId)
          db.ref(`users`).push().set({
            'fbid': userId,
            'firstName': fetchedProfile.first_name,
            'lastName': fetchedProfile.last_name,
            'gender': fetchedProfile.gender,
            'profilePic': fetchedProfile.profile_pic,
            'timezone': fetchedProfile.timezone,
            'createdAt': (new Date()).toISOString()
          })

          //console.log(`new user has been added successfully`);
          //return resolve(userName)
        }

      })
      .catch(error => {
        console.log(`error: ${error}`);
        //return reject(error)
      })

  }





  return module
}
