function changeReadyToStartAJAX() {

  let request = $.getJSON('https://dsmbot.herokuapp.com/changeReadyToStart?value=true', () => {
    console.log('requested');
  })
  .done((data)=>{

    console.log(data);
    setTimeout(()=>{
      updateStatus()
    }, 500)

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
    //$("#ready").html("YES")
    if(data.readyToStart) $("#ready").html("YES")
    else $("#ready").html("NO")

    if(data.enterTime) $("#enterStatus").html("OPEN")
    else $("#enterStatus").html("CLOSE")

    if(data.isQuizOnline) $("#quizOnlineStatus").html("ONLINE")
    else $("#quizOnlineStatus").html("OFFLINE")


  })
  .fail((error)=>{
    console.log(error);
  })

}
