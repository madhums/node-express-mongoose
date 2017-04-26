function changeReadyToStartAJAX() {
  let request = $.getJSON('https://dsmbot.herokuapp.com/changeReadyToStart?value=true', () {
    console.log('requested');
  })
  .done((data)=>{
    console.log(data);
    $("#ready").innerHTML = "YES"
  })
  .fail(()=>{
    console.log(error);
  })

}
