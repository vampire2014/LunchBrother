define([
    'models/Grid',
    'models/Restaurant',
    'models/PickUpLocation',
    'models/InventoryModel',
    'text!templates/manage/managerHomeTemplate.html',
    'text!templates/manage/menuListTemplate.html'
], function(GridModel, RestaurantModel, PickUpLocationModel, InventoryModel, managerHomeTemplate, menuListTemplate) {

    var ManagerHomeView = Parse.View.extend({
        el: $("#page"),
        template: _.template(managerHomeTemplate),
        menuListTemplate: _.template(menuListTemplate),
        events: {
            'click #DPAdd': 'onEditOrAddClick',
            'click #showDistributorStatus': 'onShowDistributorStatusClick',
            'click #showDriverStatus': 'onShowDriverStatusClick',
            'click #publishMenu': 'onPublishMenuClick'
        },

        days: {0:'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat'},
        weeklyMenu: {
            menus:[
                {
                    day:"MONDAY",
                    date: "",
                    dishes:[],
                    inventoryIds:[]
                },

                {
                    day:"TUESDAY",
                    date: "",
                    dishes:[],
                    inventoryIds:[]
                },

                {
                    day:"WEDNESDAY",
                    date: "",
                    dishes:[],
                    inventoryIds:[]
                },

                {
                    day:"THURSDAY",
                    date: "",
                    dishes:[],
                    inventoryIds:[]
                },

                {
                    day:"FRIDAY",
                    date: "",
                    dishes:[],
                    inventoryIds:[]
                }
            ]},

        initialize: function() {
            _.bindAll(this, 'render');
            var currentUser = Parse.User.current();
            if(currentUser != null) {
                currentUser.fetch();
                $("#userEmail").text(currentUser.get('email'));
                var gridId = "nmbyDzTp7m";
                if (currentUser.get('gridId') == undefined) {
                    $("#userGrid").text("University of Maryland College Park");
                }else {
                    var gridQuery = new Parse.Query(GridModel);
                    gridId = currentUser.get('gridId').id;
                    gridQuery.get(currentUser.get('gridId').id, {
                        success: function(grid) {
                            $("#userGrid").text(grid.get('name'));
                        },
                        error: function(object, error) {
                            console.log(error.message);
                        }
                    });
                }
                $("#userPhone").text(currentUser.get('telnum'));
                $("#userFullName").text(currentUser.get('firstName') + " " + currentUser.get('lastName'));
                $("#userCreditBalance").text(currentUser.get('creditBalance').toFixed(2));
                $("#accountBarFirstName").text(currentUser.get('firstName'));
            }
            $('#account').show();
        },

        render: function() {
            var self = this;
            var chefGrid = Parse.User.current().get('gridId');
            var newEvent = {};
            //default chef's grid to University of Maryland College Park
            if (chefGrid == undefined){
                chefGrid = new GridModel();
                chefGrid.id = "nmbyDzTp7m";
            }

            var pickUpLocationQuery = new Parse.Query(PickUpLocationModel);
            pickUpLocationQuery.equalTo("gridId", chefGrid);
            pickUpLocationQuery.find({
                success:function(locations) {
                    _.each(locations, function(location) {
                        newEvent["click #dpEditButton-" + location.id] = 'onEditOrAddClick';
                        newEvent["click #dpDeleteButton-" + location.id] = 'onDeleteClick';
                    });
                    self.delegateEvents(_.extend(self.events, newEvent));

                    var d = new Date();
                    var day = d.getDay(),
                        diff = d.getDate() - day + (day == 0 ? -6:1); // adjust when day is sunday
                    var monday = new Date(d.setDate(diff));
                    var firstWeek = (monday.getMonth() + 1) + "/" + monday.getDate() + "-";

                    var diff2 = monday.getDate() + 4;
                    var friday = new Date(monday.setDate(diff2));
                    firstWeek += (friday.getMonth() + 1) + "/" + friday.getDate();

                    var diff3 = friday.getDate() + 3;
                    var monday2 = new Date(friday.setDate(diff3));
                    var secondWeek = (monday2.getMonth() + 1) + "/" + monday2.getDate() + "-";

                    var diff4 = monday2.getDate() + 4;
                    var friday2 = new Date(monday2.setDate(diff4));
                    secondWeek += (friday2.getMonth() + 1) + "/" + friday2.getDate();

                    var diff5 = friday2.getDate() + 3;
                    var monday3 = new Date(friday2.setDate(diff5));
                    var thirdWeek = (monday3.getMonth() + 1) + "/" + monday3.getDate() + "-";

                    var diff6 = monday3.getDate() + 4;
                    var friday3 = new Date(monday3.setDate(diff6));
                    thirdWeek += (friday3.getMonth() + 1) + "/" + friday3.getDate();


                    self.$el.html(self.template({distributingPoints: locations, weeks: [firstWeek, secondWeek, thirdWeek]}));
                    self.$(".week-selection").dropdown({
                        onChange: function (week) {
                            self.refreshWeekMenu(week);
                        }
                    });
                    self.$("#publishMenu").addClass('disabled');
                },
                error: function(error) {
                    console.log(error.message);
                }
            });
        },

        refreshWeekMenu: function(week) {
            var days = week.split("-");
            var mondayMonth = parseInt(days[0].split("/")[0]) - 1, mondayDate = parseInt(days[0].split("/")[1]);
            var monday = new Date();
            monday.setFullYear(monday.getFullYear(), mondayMonth, mondayDate);
            monday.setHours(0, 0, 0, 0);

            var fridayMonth = parseInt(days[1].split("/")[0]) - 1, fridayDate = parseInt(days[1].split("/")[1]);
            var friday = new Date();
            friday.setFullYear(friday.getFullYear(), fridayMonth, fridayDate);
            friday.setHours(23, 59, 59, 0);

            for (var pickUpDay = 0; pickUpDay < 5; pickUpDay++) {
                this.weeklyMenu.menus[pickUpDay].date = this.getDateForEachDay(monday, pickUpDay, this.weeklyMenu.menus[pickUpDay].day);
                this.weeklyMenu.menus[pickUpDay].dishes = [];
                this.weeklyMenu.menus[pickUpDay].inventoryIds = [];
            }

            var self = this;
            var currentUser = Parse.User.current();
            var inventoryQuery = new Parse.Query(InventoryModel);
            inventoryQuery.equalTo("orderBy", currentUser);
            inventoryQuery.greaterThan("pickUpDate", monday);
            inventoryQuery.lessThan("pickUpDate", friday);
            inventoryQuery.include("dish");
            inventoryQuery.include("dish.restaurant");
            inventoryQuery.find({
                success: function (inventories) {
                    for (var i=0; i<inventories.length; i++) {
                        var pickUpDay = inventories[i].get('pickUpDate').getDay();
                        var dishInfo = {
                            dishName: inventories[i].get('dish').get('dishName'),
                            restaurantName: inventories[i].get('dish').get('restaurant').get('name'),
                            quantity: inventories[i].get('preorderQuantity'),
                            price: inventories[i].get('dish').get('Unit_Price')
                        };

                        self.weeklyMenu.menus[pickUpDay - 1].inventoryIds.push(inventories[i].id);
                        self.weeklyMenu.menus[pickUpDay - 1].dishes.push(dishInfo);
                    }

                    self.$("#menuList").html(self.menuListTemplate(self.weeklyMenu));
                    self.$("#publishMenu").removeClass('disabled');

                    var newEvent = {};
                    for (var i=0; i<5; i++) {
                        newEvent["click #menuEditBtn-" + self.weeklyMenu.menus[i].day] = 'onEditMenuClick';
                    }

                    self.delegateEvents(_.extend(self.events, newEvent));
                },
                error: function (error) {
                    console.log("Inventory Query Error: " + error.code + " " + error.message);
                }
            });

        },

        getDateForEachDay: function(monday, offset, day) {
            var date = new Date(monday.getTime() + 24 * 60 * 60 * 1000 * offset);
            var dateString = date.getMonth() + 1 + "/" + date.getDate() + " " + day;
            return dateString
        },

        onEditMenuClick: function(ev) {
            var inventoryIds = $(ev.currentTarget).data('inventoryIds');
            var date = $(ev.currentTarget).data('date');
            window.location.hash = "#menuEdit?inventoryIds=" + inventoryIds + "&date=" + date;

        },

        onEditOrAddClick: function(ev) {
            this.$('.ui.form').form({
                dp_location: {
                    identifier: 'dp_location',
                    rules: [{
                        type: 'empty',
                        prompt: 'Please enter the name of your location'
                    }]
                },
                dp_youtube_link: {
                    identifier: 'dp_youtube_link',
                    rules: [{
                        type: 'empty',
                        prompt: 'Please enter youtube link'
                    }]
                }
            }, {
                on: 'blur',
                inline: 'true'
            });

            var self = this;
            var dpId = $(ev.currentTarget).data('id');
            var address = $(ev.currentTarget).data('address');
            var youtubeLink = $(ev.currentTarget).data('youtube');
            $("#dp_location").val(address);
            $("#dp_youtubeLink").val(youtubeLink);
            $('#editDPDialog').modal({
                closable: false,
                onDeny: function () {

                },
                onApprove: function () {
                    self.saveDP(dpId, $("#dp_location").val(), $("#dp_youtubeLink").val());
                }
            }).modal('show');
        },

        onDeleteClick: function(ev) {
            var self = this;
            var dpId = $(ev.currentTarget).data('id');
            $('#deleteDPDialog').modal({
                closable: false,
                onDeny: function () {

                },
                onApprove: function () {
                    self.deleteDP(dpId);
                }
            }).modal('show');
        },

        onShowDistributorStatusClick: function() {
            window.location.hash = '#distributor';
        },

        onShowDriverStatusClick: function() {
            window.location.hash = '#driver';
        },

        saveDP: function(id, address, youtubeLink) {
            var chefGrid = Parse.User.current().get('gridId');
            //default chef's grid to University of Maryland College Park
            if (chefGrid === undefined){
                chefGrid = new GridModel();
                chefGrid.id = "nmbyDzTp7m";
            }

            if (address.trim() !== "" && youtubeLink.trim() !== "") {
                var dp = new PickUpLocationModel();
                dp.id = id;
                dp.set("gridId", chefGrid);
                dp.set("address", address);
                dp.set("youtubeLink", youtubeLink);
                dp.save(null, {
                    success: function(dp) {
                        if (id === undefined) {
                            alert('New distributing point created with Id: ' + dp.id);
                        } else {
                            alert('Distributing point info updated!');
                        }
                        location.reload();
                    },
                    error: function(error) {
                        alert('Update failed! Reason: ' + error.message);
                    }
                });
            } else {
                alert("Please enter the required information.");
            }
        },

        deleteDP: function(id) {
            var dp = new PickUpLocationModel();
            dp.id = id;
            dp.destroy({
                success: function(dp) {
                    alert("Delete Distributing Point successfully!");
                    location.reload();
                },
                error: function(dp, error) {
                    alert("Delete fail: Reason: " + error.message);
                }
            });
        },

        onPublishMenuClick: function() {
            $("#publishMenu").addClass('disabled');
            $("#publishMenu").text('Published!');
            $("div[id*='menuEditBtn']").addClass('disabled');

            //TODO@Jack - Save published = true for each inventory
        }
    });
    return ManagerHomeView;
});
