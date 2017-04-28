
function changeReadyToStartAJAX() {

  $("#prepareButton").attr('disabled', true)

  let request = $.getJSON('https://dsmbot.herokuapp.com/changeReadyToStart?value=true', () => {
    console.log('requested');
  })
  .done((data)=>{

    console.log(data);
    setTimeout(()=>{
      updateStatus()
    }, 1000)

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

function qActivate(number) {
  console.log(`js number = ${number}`);
  let target = parseInt(number)
  $(`#q${target}Button`).attr('disabled', true)
  $(`#q${target}Button`).html('pressed')
  console.log(`js target = ${target}`);
  let request = $.getJSON('https://dsmbot.herokuapp.com/activateQ?qnumber='+target, () => {
    console.log('requested');
  })
  .done((data)=>{

    console.log(data);
    setTimeout(()=>{
      updateStatus()
    }, 1000)

  })
  .fail((error)=>{
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

      $("#controlEnterTime").attr('disabled', false)
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
      if(data.openedAtLeastOneTime)
        $("#controlStartQuiz").attr('disabled', false)

    }

    //isQuizOnline
    if(data.isQuizOnline) {
      $("#quizOnlineStatus").html("ONLINE")
      $("#quizOnlineStatus").css('color', '#00ff00')

      $("#controlEnterTime").attr('disabled', true)
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

        if(quiz) {
          elem = `${index+1}. <span id="q${index+1}Status" style="color: #00ff00"><strong>ACTIVATED</strong></span> `
          elem += `<button id="q${index+1}Button" onclick="" disabled> activated </button><br><br><br>`
        }
        else {
          elem = `${index+1}. <span id="q${index+1}Status" style="color: #ff0000"><strong>Inactive</strong></span> `

          if(data.isQuizOnline)
            elem += `<button id="q${index+1}Button" onclick="qActivate(${index+1})"> Activate </button><br><br><br>`
          else {
            elem += `<button id="q${index+1}Button" onclick="qActivate(${index+1})" disabled> Activate </button><br><br><br>`
          }
        }

        $("#quizReadyStatus").append(elem)

      })
    }

    if(data.isQuizOnline && data.quizReady[data.quizReady.length - 1]) {
      $("#endingButton").attr('onclick', 'endIt()')
      $("#endingButton").attr('disabled', false)
    }
    else {
      $("#endingButton").attr('onclick', '')
      $("#endingButton").attr('disabled', true)
    }

  })
  .fail((error)=>{
    console.log(error);
  })

}
