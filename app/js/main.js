define([
  'router',
  'jquery',
  'semantic',
  'jquery_ui',
  'libs/semantic_2.0/components/dropdown.min'
], function(router,$) {
   'use strict';
   
  var initialize = function() {
    console.log("main init");
    

    //Prod
    var appId = 'shB8up4c14Idr6eFH4SBjzqZ1vdYT0Q79LSaPQwT';
    var jsKey = 'PQrHeggtLnjUfFh4KI1IV5vLhZXztUzfdlUnk5X2';

    Parse.initialize(appId, jsKey);
    
    router.initialize();

    $('.ui.dropdown').dropdown();
    var cnDay = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    var today = new Date();
    var dayOfWeek = cnDay[today.getDay()];
    var date = today.toLocaleDateString();
    $('#today').text(dayOfWeek + ', ' + date);
    
    ////The logo direct to the home page
    //$(".brand").on("click", function(){
    //	window.location.href="#";
    //	location.reload();
    //});
    
    $('#signOutBtn').click(function() {
        $('.ui.sidebar').sidebar('hide');
        var currentUser = Parse.User.current();
        //Update registration code state
        var RegistrationCode = Parse.Object.extend("RegistrationCode");
        if (currentUser.get('permission') === GENERAL_USER) {
            var codeQuery = new Parse.Query(RegistrationCode);
            codeQuery.equalTo("loginBy", currentUser);
            codeQuery.first({
                success: function(code) {
                    code.unset("loginBy");
                    code.set("usedToLogin", false);
                    code.save();
                    continueSignOut();
                },
                error: function(error) {
                    console.log('Update failed! Reason: ' + error.message);
                }
            });
        } else {
            continueSignOut()
        }
    });

      var continueSignOut = function() {
          Parse.User.logOut();
          $("#userEmail").text("");
          $("#userPhone").text("");
          $("#userFullName").text("");
          $("#userCreditBalance").text("");
          $("#accountBarFirstName").text("");
          window.location.href='#';
          location.reload();
          $('#account').hide();

          //Hide bottom bar
          $("#bottom-bar-menu").hide();
          $("#bottom-bar-tracking").hide();
          $("#bottom-bar-manager").hide();
          $("#bottom-bar-admin").hide();
      };

      $(".editlink").on("click", function(e){
          e.preventDefault();
          var dataset = $(this).prev(".datainfo");
          var savebtn = $(this).next(".savebtn");
          var theid   = dataset.attr("id");
          var newid   = theid+"-form";
          var currval = dataset.text();
          dataset.empty();
          $('<input type="text" name="'+newid+'" id="'+newid+'" value="'+currval+'" class="hlite">').appendTo(dataset);
          $(this).css("display", "none");
          savebtn.css("display", "block");
      });
      $(".savebtn").on("click", function(e){
          var currentUser = Parse.User.current();
          e.preventDefault();
          var elink   = $(this).prev(".editlink");
          var dataset = elink.prev(".datainfo");
          var newid   = dataset.attr("id");
          var cinput  = "#"+newid+"-form";
          var newval  = $(cinput).val();
          $(this).css("display", "none");
          dataset.html(newval);
          elink.css("display", "block");
          if (newid.indexOf('Email') > -1) {
              currentUser.set( "email", newval );
          } else {
              currentUser.set( "telnum", Number(newval) );
          }
          currentUser.save( null, {
              success: function ( user )
              {
                  //Do nothing
              },
              error: function ( user, error )
              {
                  showMessage("Error", "Save user failed! Reason: " + error.message);
              }
          } );
      });
      $("#smsCheckbox").on("change", function(e){
          var currentUser = Parse.User.current();
          e.preventDefault();
          if ($(this).is(':checked')) {
              currentUser.set( "smsEnabled", true );
          } else {
              currentUser.set( "smsEnabled", false );
          }
          currentUser.save( null, {
              success: function ( user )
              {
                  //Do nothing
              },
              error: function ( user, error )
              {
                  showMessage("Error", "Save user failed! Reason: " + error.message);
              }
          } );
      });

      $('#account').click(function() {
          var currentUser = Parse.User.current();
          if (currentUser.get('smsEnabled') == undefined || currentUser.get('smsEnabled') == true) {
              $("#smsCheckbox").prop('checked', true);
          } else {
              $("#smsCheckbox").prop('checked', false);
          }
         $('.ui.sidebar').sidebar('toggle');
    });
    
    $('.refer').click(function(){
    	this.setSelectionRange(0, this.value.length);
    });
  };

  return {
    initialize: initialize
  };
});
