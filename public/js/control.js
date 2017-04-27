var openedAtLeastOneTime = false

function changeReadyToStartAJAX() {

  $("#prepareButton").attr('disabled', true)

  let request = $.getJSON('https://dsmbot.herokuapp.com/changeReadyToStart?value=true', () => {
    console.log('requested');
  })
  .done((data)=>{

    console.log(data);
    setTimeout(()=>{
      updateStatus()
    }, 700)

  })
  .fail(()=>{
    console.log(error);
  })

}

function changeEnterStatus(param) {
  $("#controlEnterTime").attr('disabled', true)
  console.log('trigger changeEnterStatus : ' + param);
  if(param != '' && (param == 'open' || param == 'close')) {

    let request = $.getJSON('https://dsmbot.herokuapp.com/changeEnterStatus?value='+param, () => {
      console.log('requested');
    })
    .done((data)=>{

      if(param == 'open') openedAtLeastOneTime = true

      console.log(data);
      setTimeout(()=>{
        updateStatus()
      }, 700)

    })
    .fail(()=>{
      console.log(error);
    })

  }

}


function startQuiz() {

  if(openedAtLeastOneTime) {

    $("#controlStartQuiz").attr('disabled', true)
    console.log('trigger startQuiz');

    let request = $.getJSON('https://dsmbot.herokuapp.com/justStartTheQuiz', () => {
      console.log('requested');
    })
    .done((data)=>{

      console.log(data);
      setTimeout(()=>{
        updateStatus()
      }, 700)

    })
    .fail(()=>{
      console.log(error);
    })

  }
  else alert('คุณยังไม่ได้เปิดรับผู้ร่วมกิจกรรมเลยสักครั้ง')

}

function qActivate(number) {

}

function updateStatus() {

  let request = $.getJSON('https://dsmbot.herokuapp.com/getAllStatus', () => {
    console.log('requested');
  })
  .done((data)=>{

    console.log(data);

    // ready
    if(data.readyToStart) {
      $("#ready").html("RUNNING")
      $("#ready").css('color', '#00ff00')
      $("#controlEnterTime").attr('disabled', false)
      $("#prepareButton").remove()
    }
    else {
      $("#ready").html("")
      $("#ready").css('color', 'red')
      $("#controlEnterTime").attr('disabled', true)
    }

    //enter status
    if(data.enterTime) {

      $("#enterStatus").html("OPEN")
      $("#enterStatus").css('color', '#00ff00')

      $("#controlEnterTime").attr('onclick', 'changeEnterStatus(\'close\')')
      $("#controlEnterTime").html('Close Enter Session')

      $("#controlStartQuiz").attr('disabled', true)

    }
    else {

      $("#enterStatus").html("CLOSE")
      $("#enterStatus").css('color', 'red')

      if(data.readyToStart) $("#controlEnterTime").attr('onclick', 'changeEnterStatus(\'open\')')
      $("#controlEnterTime").html('Open Enter Session')

      //console.log('oplonw : ' + openedAtLeastOneTime);
      if(openedAtLeastOneTime)
        $("#controlStartQuiz").attr('disabled', false)

    }

    //isQuizOnline
    if(data.isQuizOnline) {
      $("#quizOnlineStatus").html("ONLINE")
      $("#quizOnlineStatus").css('color', '#00ff00')

      $("#controlStartQuiz").attr('disabled', true)
    }
    else {
      $("#quizOnlineStatus").html("OFFLINE")
      $("#quizOnlineStatus").css('color', 'red')
    }

    //quizReadyStatus
    if(data.quizReady) {

      $("#quizReadyStatus").empty()
      $("#quizReadyStatus").append("<br><br>")
      data.quizReady.forEach((quiz, index)=>{
        let elem = ""

        if(quiz) elem = `${index+1}. <span id=\`q${index+1}Status\` style="color: #00ff00"><strong>false</strong></span><br>`
        else elem = `${index+1}. <span id=\`q${index+1}Status\` style="color: #ff0000"><strong>false</strong></span><br>`

        $("#quizReadyStatus").append(elem)

      })
    }

  })
  .fail((error)=>{
    console.log(error);
  })

}
