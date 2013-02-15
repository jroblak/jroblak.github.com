// Parse tracker app by Justin Oblak

$(function() {

  Parse.$ = jQuery;

  Parse.initialize("KKcMZTMG3lWdgUrxj6CUUiRqzjBcsf6oqbH754NR", "TOgQkq5SZGfyr50FAjXL6pmwmhwR46vLbDZdFS22");

  // Tracker Model
  var Tracker = Parse.Object.extend("Tracker", {
    // Default attributes
    defaults: {
      title: "Read",
      progress: 0,
	  multiplier: 100,
	  target: 5,
	  type: "Books",
      done: false
    },

    // Ensure that each todo created has `content`.
    initialize: function() {
	  this.set({"progress": this.defaults.progress});
      if (!this.get("title")) {
        this.set({"title": this.defaults.title});
      }
	  if (!this.get("unit")) {
        this.set({"unit": this.defaults.type});
      }
	  if (!this.get("target")) {
        this.set({"unit": this.defaults.target});
      }
    },

    // Toggle the `done` state of this todo item.
    toggle: function() {
      this.save({done: !this.get("done")});
    },

	addOne: function() {
		var add = this.get("progress") + (1*this.get("multiplier"));
		if(add <= 100) {
			this.save({"progress": add});
		} else {
			return;
		}
	},
	
	removeOne: function() {
		var remove = this.get("progress") - (1*this.get("multiplier"));
		if(remove >= 0) {
			this.save({"progress": remove});
		} else {
			return;
		}
	},
	
	getProgress: function() {
		return this.get("progress");
	}
	
  });

  var TrackerList = Parse.Collection.extend({

    model: Tracker,

    // We keep the Todos in sequential order, despite being saved by unordered
    // GUID in the database. This generates the next order number for new items.
    nextOrder: function() {
      if (!this.length) return 1;
      return this.last().get('order') + 1;
    }

  });

  // Main tracker item view
  var TrackerView = Parse.View.extend({
	
	tagName: 'li',
	
    // "Load" the template for a item
    template: _.template($('#trackertemplate').html()),

    // The DOM events specific to an item.
    events: {
      "click .toggle"              : "toggleDone",
	  "click .add"				   : "addProgress",
	  "click .remove"			   : "removeProgress",
      "click .destroyme"   : "clear",
    },

    // Listen for 'changes' and call render whenever it's changed
    initialize: function() {
      _.bindAll(this, 'render', 'remove');
      this.model.bind('change', this.render);
      this.model.bind('destroy', this.remove);
      this.displayBar();
    },

    // Render the contents of the item
    render: function() {
      $(this.el).html(this.template(this.model.toJSON()));
      this.displayBar();
      return this;
    },
    
    displayBar: function() {
	  var pBar = $('#'+this.model.get("title")+"bar");
	  var poverlay = $('#'+this.model.get("title")+"overlay");
	  pBar.progressbar({ value: this.model.getProgress() });
	  poverlay.html(this.model.getProgress()+"%");
    },

    toggleDone: function() {
      this.model.toggle();
    },

	addProgress: function() {
	  this.model.addOne();
	},
	
	removeProgress: function() {
	  this.model.removeOne();
	},

    // Remove the item
    clear: function() {
      this.model.destroy();
    }

  });


  // The "main" view for the bulk of the app. Controls setting up, displaying
  // adding, etc.

  var ManageTrackersView = Parse.View.extend({

    // Delegated events
    events: {
      "keypress #newtracker":  "createOnEnter",
	  "keypress #target":  "createOnEnter",
	  "keypress #unit":  "createOnEnter",
      "click .log-out": "logOut",
    },

    el: ".content",

    initialize: function() {
      var self = this;

      _.bindAll(this, 'addOne', 'addAll', 'render', 'logOut', 'createOnEnter');

      // "load" the main template
      this.$el.html(_.template($("#managetrackerstemplate").html()));
      
      this.input = this.$("#newtracker");

      // Create our list of "things" to track
      this.trackers = new TrackerList;

      // Setup the query for the collection to look for items for the current user
      this.trackers.query = new Parse.Query(Tracker);
      this.trackers.query.equalTo("user", Parse.User.current());
        
      this.trackers.bind('add',     this.addOne);
      this.trackers.bind('reset',   this.addAll);
      this.trackers.bind('all',     this.render);
	
      // Fetch the items
      this.trackers.fetch();

    },

    // Logs out the user and shows the login view
    logOut: function(e) {
      Parse.User.logOut();
      new LogInView();
      this.undelegateEvents();
      delete this;
    },

    // Re-rendering the App just means refreshing the statistics -- the rest
    // of the app doesn't change.
    render: function() {
      this.delegateEvents();
	  return this;
    },

    // Add an item to the list by creating a view for it, and
    // appending its element
    addOne: function(tracker) {
      var view = new TrackerView({model: tracker});
      this.$("#trackerlist").append(view.render().el);
	  view.render();
    },

    // Clear the list then show everything
    addAll: function() {
      this.$("#trackerlist").html("");
      this.trackers.each(this.addOne);
    },

    // If you hit return in any input, create the new tracker item
    createOnEnter: function(e) {
      var self = this;
      if (e.keyCode != 13) return;

      this.trackers.create({
        title: this.$('#title').val(),
        target: this.$('#target').val(),
		multiplier: 100/this.$('#target').val(),
		type:    this.$('#unit').val(),
        order:   this.trackers.nextOrder(),
        done:    false,
        user:    Parse.User.current(),
        ACL:     new Parse.ACL(Parse.User.current())
      });

      this.input.val('');
	  this.$('#target').val('');
	  this.$('#unit').val('');
    }
  });

  // LogIn view for the user to sign up for an account or log into one
  var LogInView = Parse.View.extend({
    events: {
      "submit form.login-form": "logIn",
      "submit form.signup-form": "signUp"
    },

    el: ".content",
    
    initialize: function() {
      _.bindAll(this, "logIn", "signUp");
      this.render();
    },

    logIn: function(e) {
      var self = this;
      var username = this.$("#login-username").val();
      var password = this.$("#login-password").val();
      
      Parse.User.logIn(username, password, {
        success: function(user) {
          new ManageTrackersView();
          self.undelegateEvents();
          delete self;
        },

        error: function(user, error) {
          self.$(".login-form .error").html("Invalid username or password. Please try again.").show();
          this.$(".login-form button").removeAttr("disabled");
        }
      });

      this.$(".login-form button").attr("disabled", "disabled");

      return false;
    },

    signUp: function(e) {
      var self = this;
      var username = this.$("#signup-username").val();
      var password = this.$("#signup-password").val();
      
      Parse.User.signUp(username, password, { ACL: new Parse.ACL() }, {
        success: function(user) {
          new ManageTrackersView();
          self.undelegateEvents();
          delete self;
        },

        error: function(user, error) {
          self.$(".signup-form .error").html(error.message).show();
          this.$(".signup-form button").removeAttr("disabled");
        }
      });

      this.$(".signup-form button").attr("disabled", "disabled");

      return false;
    },

    render: function() {
      this.$el.html(_.template($("#login-template").html()));
      this.delegateEvents();
    }
  });

  // We start here -- AppView checks if the user is logged into Parse
  // If yes, we move onto the Manage view, otherwise we go to a logon view
  var AppView = Parse.View.extend({

    el: $("#trackerapp"),

    initialize: function() {
      this.render();
    },

    render: function() {
      if (Parse.User.current()) {
        new ManageTrackersView();
      } else {
        new LogInView();
      }
    }
  });

  // Start app!
  new AppView;
});