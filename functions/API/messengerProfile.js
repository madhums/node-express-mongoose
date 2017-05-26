//const axios = require('axios')
let facebookSecret = require("../credential/facebookKey.json")

module.exports = function(axios) {

  let module = {}

  module.callProfileAPI = function(userId) {

    return axios(`https://graph.facebook.com/v2.6/${userId}?fields=first_name,last_name,profile_pic,timezone,gender&access_token=${facebookSecret.pageToken}`)
    .then(res => {
      if(res.status == 200)
        return res.data // first_name, last_name, gender, profile_pic, timezone
      else throw new Error(`status code: ${res.status}`)
    })
    .catch(error => {
      //console.log(`call profile api : ${error}`);
      throw `call profile api error : ${error}`
    })

  }

  return module

}
