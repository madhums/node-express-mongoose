/**
 * Created by knyamagoudar on 5/6/17.
 */

$( document ).ready(function() {


  $('#addPatient').click(function(e){

    $.get( "/addPatient", function( data ) {
      $( "#mainContainer" ).html( data );
      alert( "Load was performed." );
    });
  })

  $('#dashboard').click(function(e){

    $.get( "/dashboard", function( data ) {
      $( "#mainContainer" ).html( data );
      alert( "Load was performed." );
    });
  })

});
