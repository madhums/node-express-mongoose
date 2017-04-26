function changeReadyToStartAJAX() {

  let request = $.getJSON('https://dsmbot.herokuapp.com/changeReadyToStart?value=true', () => {
    console.log('requested');
  })
  .done((data)=>{

    console.log(data);
    setTimeout(()=>{
      updateStatus()
    }, 1000)

    setTimeout(()=>{
      updateStatus()
    }, 2000)

  })
  .fail(()=>{
    console.log(error);
  })

}


function updateStatus() {

  let request = $.getJSON('https://dsmbot.herokuapp.com/getAllStatus', () => {
    console.log('requested');
  })
  .done((data)=>{

    console.log(data);

    // ready
    if(data.readyToStart) {
      $("#ready").html("YES")
      $("#ready").css('color', '#00ff00')
    }
    else {
      $("#ready").html("NO")
      $("#ready").css('color', 'red')
    }

    //enter status
    if(data.enterTime) {
      $("#enterStatus").html("OPEN")
      $("#enterStatus").css('color', '#00ff00')
    }
    else {
      $("#enterStatus").html("CLOSE")
      $("#enterStatus").css('color', 'red')
    }

    //isQuizOnline
    if(data.isQuizOnline) {
      $("#quizOnlineStatus").html("ONLINE")
      $("#quizOnlineStatus").css('color', '#00ff00')
    }
    else {
      $("#quizOnlineStatus").html("OFFLINE")
      $("#quizOnlineStatus").css('color', 'red')
    }

    //quizReadyStatus
    if(quizReady) {
      quizReady.forEach((quiz)=>{
        let elem = ""

        if(quiz) elem = `<span id=\`q${index+1}Status\` style="color: #00ff00"><strong>false</strong></span>`
        else elem = `<span id=\`q${index+1}Status\` style="color: #ff0000"><strong>false</strong></span>`

        $("#quizReadyStatus").append(elem)

      })
    }

  })
  .fail((error)=>{
    console.log(error);
  })

}
