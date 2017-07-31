// ---- DB Functions ----
const firebaseInit = require('./../firebase-settings.js')
const messengerAPI = require('./messengerProfile.js')
const db = firebaseInit.admin.database()


// get all users' fbid
const getAllID = function () {

  return new Promise((resolve, reject) => {

    db.ref('userIds').once('value')
    .then(snapshot => {

      if (snapshot.val() !== null) {
        let idArray = []
        let obj = snapshot.val()

        for (let key in obj)
          idArray.push(obj[key])
      
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
const recordNewUserID = function (userId) {

  let userName = ''
  let fetchedProfile = null

  messengerAPI.callProfileAPI(userId)
  .then(profile => {
    userName = `${profile.first_name} ${profile.last_name}`
    fetchedProfile = profile
    console.log(`profile : ${fetchedProfile}`)
    return getAllID()
  })
  .then(allID => {

    if (allID.indexOf(userId) > -1) {
      console.log(`duplciate user id, ${userName} already in DB`)
    }
    else {
      console.log('adding  new user')
      // console.log(`json: ${JSON.stringify(fetchedProfile)}`)

      db.ref('userIds').push().set(userId)
      db.ref('users').push().set({
        'fbid': userId,
        'firstName': fetchedProfile.first_name,
        'lastName': fetchedProfile.last_name,
        // 'gender': fetchedProfile.gender,
        'profilePic': fetchedProfile.profile_pic,
        'timezone': fetchedProfile.timezone,
        'createdAt': (new Date()).toISOString()
      })

    }

  })
  .catch(error => {
    console.log(`error: ${error}`);
    // return reject(error)
  })

}


module.exports = {
  recordNewUserID,
  getAllID
}
