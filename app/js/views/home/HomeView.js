define([
  'views/home/DishView',
  'views/order/OrderView',
  'models/dish/DishModel',
  'models/dish/DishCollection',
  'text!templates/home/homeTemplate.html',
  'text!templates/home/statsTemplate.html',
  'text!templates/order/orderTemplate.html'
], function(DishView, OrderView, DishModel, DishCollection, homeTemplate, statsTemplate, orderTemplate) {

  var HomeView = Parse.View.extend({
    // tagName: 'ul', // required, but defaults to 'div' if not set
    el: $("#page"),

    statsTemplate: _.template(statsTemplate),
    stats: {
      orders: [],
      tax: 0,
      totalCharge: 0,
    },

    events: {
      'click #paymentBtn': 'continuePay'
    },

    initialize: function() {

      _.bindAll(this, 'render', 'loadAll', 'addOne', 'continuePay');
      this.$el.html(_.template(homeTemplate)());

      this.dishes = new DishCollection;

      var bdQuery = new Parse.Query(DishModel);
      bdQuery.equalTo("Dish_Id", this.getDishId());
      var comboQuery = new Parse.Query(DishModel);
      comboQuery.equalTo("Dish_Id", 11);

      var mainQuery = Parse.Query.or(bdQuery, comboQuery);

      this.dishes.query = mainQuery;

      this.dishes.bind('reset', this.loadAll);
      this.dishes.bind('all', this.render);

      this.dishes.fetch();
    },

    render: function() {
      this.stats.orders = this.dishes.orders();
      this.stats.tax = parseFloat((this.dishes.charge()*0.1).toFixed(3));
      this.stats.totalCharge = parseFloat((this.dishes.charge()+this.stats.tax).toFixed(3));
      this.$('#orderStats').html(this.statsTemplate(this.stats));

      this.delegateEvents();

      return this;
    },

    getDishId: function() {
      var today = new Date();
      var onejan = new Date(today.getFullYear(), 0, 1);
      var weekOfYear = Math.ceil((((this - onejan) / 86400000) + onejan.getDay() + 1) / 7);
      var dayOfWeek = today.getDay();
      if (dayOfWeek == 0 || dayOfWeek == 6) {
        dayOfWeek = 1;
        weekOfYear++;
      }
      if (weekOfYear % 2 == 0) {
        dayOfWeek += 5;
      }
      return dayOfWeek;
    },

    addOne: function(dish) {
      var view = new DishView({
        model: dish
      });
      this.$("#dishList").append(view.render().el);
    },

    loadAll: function(collection, filter) {
      this.$("#dishList").html("");
      this.dishes.each(this.addOne);
    },

    continuePay: function() {
      var currentTime = new Date();
      var weekday = currentTime.getDay();
      var hours = currentTime.getHours();
      var view = new OrderView({
        model: this.stats
      });
      
      if((weekday == 6)||(weekday == 0 && hours < 20)){
        $("#paymentBtn").addClass('disabled');
        $("#timeAlert").text("不好意思，带饭大哥周末不订餐，周一订餐从周日晚八点开始");
      }else if((weekday == 0 && hours >= 14)||(weekday == 5 && hours <= 10) && ($("#order").length == 0)){
         $("#dishTitle,#dishList,#paymentBtn,#orderMessage").remove();
         $("#page").append(view.render().el);
      }else if((weekday >= 1 && weekday <= 4) && (hours <= 10 ||hours >= 14) && ($("#order").length == 0)){
        $("#dishTitle,#dishList,#paymentBtn,#orderMessage").remove();
        $("#page").append(view.render().el);
      }else{
        $("#paymentBtn").addClass('disabled');
        $("#timeAlert").text("不好意思，带饭大哥订餐11点结束，明天请早儿吧");
      }
    }
  });
  return HomeView;
});
