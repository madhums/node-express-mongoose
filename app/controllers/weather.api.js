require('dotenv').config();
let http = require('http');

exports.aaa = function() {
  console.log('pppp');
}

exports.getReport = function(cb) {

  let weatherURL = "http://api.openweathermap.org/data/2.5/weather?q=Bangkok,th&appid=" + process.env.weatherOpenAPIKey
  http.get(weatherURL, function (response) {

      var buffer = "";
      response.on("data", function (chunk) {
          buffer += chunk;
      });

      response.on("end", function (err) {
        console.log('is there error : ' + err);
        if(err) return cb('request weather error: ' + err, null)
        if(buffer) {

          let responseJSON = JSON.parse(buffer)

          let city = (responseJSON.name == "Bangkok") ? "กรุงเทพ" : responseJSON.name
          let temp = Math.ceil(parseInt(responseJSON.main.temp) - 273.15)
          let weather = ""
          if(responseJSON.weather[0].description == "few clouds") weather = "มีเมฆเล็กน้อย"
          else if(responseJSON.weather[0].description == "scattered clouds") weather = "มีเมฆกระจายทั่ว"
          else if(responseJSON.weather[0].description == "clear sky") weather = "ฟ้าโปร่ง ไม่มีเมฆ"
          else weather = responseJSON.weather[0].description

          let weatherReport = "อากาศใน" + city + " " + weather + " อุณหภูมิอยู่ที่ " + temp + " องศา"
          return cb(null, weatherReport)
        }
      })
  })

}
