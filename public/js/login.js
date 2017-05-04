/**
 * Created by knyamagoudar on 4/26/17.
 */

$('.message a').click(function(){
  $('form').animate({height: "toggle", opacity: "toggle"}, "slow");
});

$('#login').click(function(){



  var data = {
    name:$('#name').val(),
    password:$('#password').val()
  };

  $.ajax({
    type: "POST",
    url:  "/authenticate",
    data: data,
    success: function(data){
      if(data.status === 'success' ){
        document.location.href = "/home";
      }
    }
  });

})