define([
  'models/dish/DishCollection',
  'models/order/OrderModel',
  'models/order/PaymentModel',
  'views/home/DishCollectionView',
  'views/confirm/ConfirmView',
  'views/confirm/TextView',
  'text!templates/home/statsTemplate.html',
  'text!templates/order/orderTemplate.html',
  'stripe',
  'libs/semantic/checkbox.min',
  'libs/semantic/form.min'
], function (DishCollection, OrderModel, PaymentModel, DishCollectionView, ConfirmView, TextView, statsTemplate, orderTemplate, Stripe) {
    Stripe.setPublishableKey('pk_live_YzLQL6HfUiVf8XAxGxWv5AkH');
    var OrderView = Parse.View.extend({

        id: "order",

        tagName: "div",

        attributes: {
            class: 'column'
        },

        template: _.template(orderTemplate),

        events: {
            'submit #paymentForm': 'orderSubmit'
        },

        initialize: function () {
            _.bindAll(this, 'render', 'stripeResponseHandler', 'orderSubmit');
            Stripe.setPublishableKey('pk_live_YzLQL6HfUiVf8XAxGxWv5AkH');
        },

        render: function () {
            $(this.el).html(this.template());
            this.$('.ui.checkbox').checkbox();
            this.$('select.dropdown').dropdown();
            this.$('.ui.form').form({
                'first_name': {
                    identifier: 'first_name',
                    rules: [{
                        type: 'empty',
                        prompt: 'Please enter your first name'
                    }]
                },
                'last_name': {
                    identifier: 'last_name',
                    rules: [{
                        type: 'empty',
                        prompt: 'Please enter your last name'
                    }]
                },
                email: {
                    identifier: 'email',
                    rules: [{
                        type: 'empty',
                        prompt: 'Please enter your e-mail'
                    }, {
                        type: 'email',
                        prompt: 'Please enter a valid e-mail'
                    }]
                },
                address: {
                    identifier: 'address',
                    rules: [{
                        type: 'empty',
                        prompt: 'Please select a location'
                    }]
                },
                terms: {
                    identifier: 'terms',
                    rules: [{
                        type: 'checked',
                        prompt: 'You must agree to the terms and conditions'
                    }]
                }
            }, {
                on: 'blur',
                inline: 'true'
            });
            return this;
        },

        stripeResponseHandler: function (status, response) {
            var $form = $('#paymentForm');
            var self = this;
            if (response.error) {
                // Pop out the error message window
                self.displayPaymentFailDialog(response.error.message);
            	$('#orderBtn').prop('disabled', false);
                $('#orderBtn').removeClass('grey').addClass('red');
            }
            else { // No errors, submit the form.
                // Get the token from the response:
                var token = response.id;
                var paymentDetails = new PaymentModel();
                //

                var fname = $('#first_name').val();
                var lname = $('#last_name').val();
                var email = $('#email').val();
                var address = $('#addressdetails option:selected').text();
                var stripepayment = self.model.totalCharge;
                var i = 1;
                _.each(self.model.orders, function (order) {
                    var dishName = order.get('Description');
                    var quantity = order.get('count');
                    paymentDetails.set('dishName' + i, dishName);
                    paymentDetails.set('quantity' + i, quantity);
                    i++;
                });

                this.customerorderId = paymentDetails.get('orderId');



                Parse.Cloud.run('pay', {
                    totalCharge: stripepayment,
                    paymentToken: token
                }, {
                    success: function () {
                        paymentDetails.set('fname', fname);
                        paymentDetails.set('lname', lname);
                        paymentDetails.set('lowercaseLastName', lname.toLowerCase());
                        paymentDetails.set('email', email);
                        paymentDetails.set('stripeToken', token);
                        paymentDetails.set('address', address);
                        paymentDetails.set('totalPrice', stripepayment);
                        paymentDetails.set('paymentCheck', true);
                        paymentDetails.save(null, {
                            success: function (paymentDetails) {
                                var view1 = new TextView({
                                    model: paymentDetails
                                });
                                var view2 = new ConfirmView({
                                    model: paymentDetails
                                });
                                $("#paymentForm").remove();
                                $("#page").prepend(view1.render().el);
                                $("#page").append(view2.render().el);
            	                $('#orderBtn').prop('disabled', false);
                                $('#orderBtn').removeClass('grey').addClass('red');
                                self.emailService(paymentDetails.id);
                            },
                            error: function (payment, error) {
                                alert('Failed to create new object, with error code: ' + error.message);
                            }
                        });
                    },
                    error: function (error) {
                        self.displayPaymentFailDialog(error.message);
            	        $('#orderBtn').prop('disabled', false);
                        $('#orderBtn').removeClass('grey').addClass('red');
                    }
                });
            }
	    //Enable the button
	    //setTimeout(function() {
            //	$('#orderBtn').prop('disabled', false);
            //	$('#orderBtn').removeClass('grey').addClass('red');
	    //}, 2000);
        },
        orderSubmit: function (e) {
            e.preventDefault();
            var $form = this.$('form');
            //Disable the button
            $('#orderBtn').removeClass('red').addClass('grey');
            $('#orderBtn').prop('disabled', true);
            Stripe.card.createToken($form, this.stripeResponseHandler);
        },

        displayPaymentFailDialog: function (errorMessage) {
            $('#paymentFailMessage').text(errorMessage);
            $('#failPaymentDialog').modal({
                closable: false,
                onApprove: function () {
                    //Do nothing
                }
            }).modal('show');
        },

        emailService: function (orderId) {
            Parse.Cloud.run('email', {
                orderId: orderId

            }, {
                success: function () {
                    console.log("Confirmation email has been sent!");
                },

                error: function (error) {
                    console.log("Fail to send email...");
                }
            });
        }
    });
    return OrderView;
});
