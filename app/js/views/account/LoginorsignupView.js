define([
        'text!templates/account/loginorsignupTemplate.html',
        'i18n!nls/login'
  
], function (loginorsignupTemplate, login) {

    var LoginorsignupView = Parse.View.extend({
        el: $("#page"),

        initialize: function () {
            _.bindAll(this, 'render');
        },

        template: _.template(loginorsignupTemplate),

        render: function () {
           
            this.$el.html(this.template());
            $("#signUpBtn").html(login.SignUpButton);
            $("#loginBtnContent").html(login.LoginButton);
            return this;
        }
    });
    return LoginorsignupView;
});
