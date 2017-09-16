/*global Backbone */
var app = app || {};

(function () {
	'use strict';

	// Todo Model
	// ----------

	// Our basic **Todo** model has `title`, `order`, and `completed` attributes.
	app.Todo = Backbone.Model.extend({
		// Default attributes for the todo
		// and ensure that each todo created has `title` and `completed` keys.
		defaults: {
			title: '',
			completed: false,
			priority: 0,
			color: '',
			label: [],
			isDeleted: false
		},

		// Toggle the `completed` state of this todo item.
		toggle: function () {
			this.save({
				completed: !this.get('completed')
			});
		},

		// Toggle the `priority` state of this todo item.
		setPriority: function(newPriority){
			this.save({
				priority: newPriority
			});
		},

		// Set color mark for the todo item.
		setColor: function(newColor){
			this.save({
				color: newColor
			});
		},

		// add label to the todo item
		addLabel: function(newLabel){
			this.save({
				label: this.label.push(newLabel)
			});
		},

		// Toggle the 'deleted' state of this todo item.
		toggleDeleted: function (){
			this.save({
				isDeleted: !this.get('isDeleted')
			});
		}

	});
})();
