define([
  'models/dish/DishModel',
  'models/Restaurant',
  'text!templates/home/dishTemplate.html'
], function(DishModel, RestaurantModel, dishTemplate) {

  var DishView = Parse.View.extend({
   
    tagName: "div",
    attributes: {
      class: 'column'
    },
    template: _.template(dishTemplate),
   
    events: {
      'click .plusone': 'addOne',
      'click .minusone': 'minusOne'
    },

    currentQuantity: 0,

    initialize: function() {
    	this.model.initialize();
      _.bindAll(this, 'render', 'addOne', 'minusOne');
      this.model.bind('change:count', this.render);
    },

    render: function() {
        $(this.el).html(this.template(this.model._toFullJSON([])));
        if (this.model.get('count') === this.currentQuantity) {
            $('#' + this.model.id + '-plusButton').prop('disabled', true);
        } else {
            $('#' + this.model.id + '-dimmer').dimmer('hide');
        }

        if (this.currentQuantity <= 5) {
            $('#' + this.model.id + '-currentQuantityWarning').text("Only " + this.currentQuantity + " left!");
            $('#' + this.model.id + '-currentQuantityWarning').show();
        }
        $('#' + this.model.id + ' .menu .item').tab({context: $('#' + this.model.id)});
        $('#' + this.model.id + '-currentQuantity').text(this.currentQuantity);
        $('.ui.rating').rating({
            interactive: false
        });
      //this.delegateEvents();
      return this;
    },

    setCurrentQuantity: function(quantity) {
      this.currentQuantity = quantity;
    },

    addOne: function() {
      this.model.addOne();
    },

    minusOne: function() {
      this.model.minusOne();
    }
  });
  return DishView;
});
