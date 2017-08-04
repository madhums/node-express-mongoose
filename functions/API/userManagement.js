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
        'createdAt': (new Date()).toISOString(),
        'counpon': 0
      })

    }

  })
  .catch(error => {
    console.log(`error: ${error}`);
    // return reject(error)
  })

}

// temporary, should be merge with ^ 

// const recordNewUserID_FBlogin = function (fbloginID, PSID, firebaseAuth) {

const recordNewUserID_FBlogin = function (fbloginID, PSID, firebaseAuth) {

  return new Promise((resolve, reject) => {

    let userName = ''
    let fetchedProfile = null

    messengerAPI.callProfileAPI(PSID)
    .then(profile => {
      userName = `${profile.first_name} ${profile.last_name}`
      fetchedProfile = profile
      console.log(`profile : ${fetchedProfile}`)
      return getAllID()
    })
    .then(allID => {

      if (allID.indexOf(PSID) > -1) {
        console.log(`duplciate user id, ${userName} already in DB, adding fb login id to DB`)
        db.ref('users').orderByChild('fbid').equalTo(PSID).once('value')
        .then(uSnap => {

          let userInfo = uSnap.val()
          let key = Object.keys(userInfo)[0]

          // console.log('user info : ' + JSON.stringify(userInfo[key]) )

          if (!userInfo[key].fb_loginid || userInfo[key].coupon == null) {

            console.log(`users/${key}/ , fb_loginid : ${fbloginID}, key : ${firebaseAuth}`)
            
            let updatePack = {}
            
            if (!userInfo[key].fb_loginid) updatePack.fb_loginid = fbloginID
            if (userInfo[key].coupon == null) updatePack.coupon = 0
            
            updatePack.firebaseAuth = firebaseAuth

            db.ref(`users/${key}/`).update(updatePack)
            .then(() => {
              console.log('update fb_loginid success.')
              // curious about timing, just in case
              return resolve({
                PSID: PSID,
                firstName: userInfo[key].firstName,
                lastName: userInfo[key].lastName,
                coupon: 0
              })
            })

          }
          else { 
            return resolve({
                PSID: PSID,
                firstName: userInfo[key].firstName,
                lastName: userInfo[key].lastName,
                coupon: userInfo[key].coupon
              }) 
          }
          
        })
        .catch(error => {
          console.log(`fb login update error: ${error}`);
        })

      }
      else {
        console.log('adding  new user')
        // console.log(`json: ${JSON.stringify(fetchedProfile)}`)

        db.ref('userIds').push().set(PSID)
        db.ref('users').push().set({
          'fbid': PSID,
          'fb_loginid': fbloginID,
          'firebaseAuth': firebaseAuth,
          'firstName': fetchedProfile.first_name,
          'lastName': fetchedProfile.last_name,
          // 'gender': fetchedProfile.gender,
          'profilePic': fetchedProfile.profile_pic,
          'coupon': 0,
          'timezone': fetchedProfile.timezone,
          'createdAt': (new Date()).toISOString()
        })
        .then(() => {
          console.log('ADD NEW fb_loginid success.')
          return resolve({
                PSID: PSID,
                firstName: fetchedProfile.first_name,
                lastName: fetchedProfile.last_name,
                coupon: 0
              })
        })

      }

    })
    .catch(error => {
      console.log(`fb login add new user error: ${error}`);
      reject(error)
    })

  })

}


module.exports = {
  recordNewUserID,
  getAllID,
  recordNewUserID_FBlogin
}
