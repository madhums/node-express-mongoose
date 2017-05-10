let https = require('https');

exports.getUserInfo = function(uid, cb) {

  let apiPath = "https://graph.facebook.com/v2.6/" + uid
                + "?fields=first_name,last_name,profile_pic,timezone,gender&access_token="
                + process.env.pageToken

  https.get(apiPath, function (response) {

    var buffer = "";
    response.on("data", function (chunk) {
        buffer += chunk;
    });

    response.on("end", function (err) {
      if(err) return cb('get user info err: ' + err, null)
      if(buffer) {
        return cb(null, JSON.parse(buffer))
      }

    })

  })

}
