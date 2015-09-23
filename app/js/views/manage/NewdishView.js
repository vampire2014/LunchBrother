define([
    'models/dish/DishModel',
    'text!templates/manage/newdishTemplate.html'
], function (DishModel, newdishTemplate) {

    var NewdishView = Parse.View.extend({
        el: $("#page"),

        events: {
            "click .save-dish-btn": "saveDish"
        },

        initialize: function () {
            _.bindAll(this, 'render', 'handleFileSelect');
        },

        template: _.template(newdishTemplate),
  
        render: function () {
            var self = this;
            var dishId = this.options.dishId;

            if(dishId) {
                var dishQuery = new Parse.Query(DishModel);
                dishQuery.get(dishId, {
                    success: function(dish) {
                        self.$el.html(self.template({dish: dish}));
                        $("#dish-spicy").prop('checked', dish.get('spicy'));
                        $("#dish-gluten-free").prop('checked', dish.get('glutenFree'));
                        $("#dish-vegetarian").prop('checked', dish.get('vegetarian'));
                        $(".dish-type-selection").dropdown('set selected', dish.get('dishType'));

                        $("#dishPhoto").change(self.handleFileSelect);
                    },
                    error: function(error) {
                        alert("Error in finding restaurant. Reason: " + error.message);
                    }
                });
            } else {
                var dish = new DishModel();
                this.$el.html(this.template({dish: dish}));
                $(".dish-type-selection").dropdown();
                $("#dishPhoto").change(this.handleFileSelect);
            }
        },

        handleFileSelect: function(evt) {
            $(".previewRow").remove();

            var files = evt.target.files; // FileList object

            // Loop through the FileList and render image files as thumbnails.
            for (var i = 0, f; f = files[i]; i++) {

                // Only process image files.
                if (!f.type.match('image.*')) {
                    continue;
                }

                var reader = new FileReader();

                // Closure to capture the file information.
                reader.onload = (function(theFile) {
                    return function(e) {
                        // Render thumbnail.
                        $('.dish-photo-upload').after('<div class="previewRow">' +
                            '<img class="thumb" src="' + e.target.result + '" style="width: 400px"/>' +
                            '</div>');
                    };
                })(f);

                // Read in the image file as a data URL.
                reader.readAsDataURL(f);
            }
        },

        saveDish: function() {
            var dishId = this.options.dishId;
            var restaurantId = this.options.restaurantId;

            var dish = new DishModel();
            if (dishId) {
                dish.id = dishId;
            }

            if (restaurantId) {
                dish.set('restaurant', {
                    __type: "Pointer",
                    className: "Restaurant",
                    objectId: restaurantId
                });
            }

            var dishName = $("#dish-name").val();

            var dishPhotoFiles = $("#dishPhoto")[0];
            if (dishPhotoFiles.files.length > 0) {
                var file = dishPhotoFiles.files[0];
                var parseFile = new Parse.File(dishName, file);
                dish.set('Image_File', parseFile);
            }

            dish.set("dishName", dishName);
            dish.set("descriptionEn", $("#dish-description").val());
            dish.set("ingredients", $("#dish-ingredients").val());
            dish.set("Unit_Price", Number($("#dish-price").val()));
            dish.set("dishType", $(".dish-type-selection").dropdown('get value'));
            dish.set("spicy", $("#dish-spicy").is(':checked'));
            dish.set("glutenFree", $("#dish-gluten-free").is(':checked'));
            dish.set("vegetarian", $("#dish-vegetarian").is(':checked'));
            dish.save({
                success: function(dish) {
                    alert("Dish save successfully!");
                    window.location.href = "#manageRestaurants";
                },
                error: function(error) {
                    alert("Dish save failed! Reason: " + error.message);
                }
            });
        }
    });
    return NewdishView;
});


