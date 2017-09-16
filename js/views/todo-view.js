/*global Backbone, jQuery, _, ENTER_KEY, ESC_KEY */
var app = app || {};
// modal is passed at runtime here
// $el refers to this view.
(function ($) {
	'use strict';

	// Todo Item View
	// --------------

	// The DOM element for a todo item...
	app.TodoView = Backbone.View.extend({
		//... is a list tag.
		tagName:  'li',

		// Cache the template function for a single item.
		template: _.template($('#item-template').html()),

		// The DOM events specific to an item.
		events: {
			'click .toggle': 'toggleCompleted',
			'click .priority-btn': 'openPriorityDropdown',
			'click .priority-item':'setPriority',
			'click .color-btn': 'openColorPallete',
			'click .color-pallete-color':'changeColor',
			'click .label-btn':'labeling',
			'dblclick label': 'edit',
			'click .edit-btn':'edit',
			'click .destroy.deleted': 'clear',
			'click .destroy': 'toggleDeleted',
			'keypress .edit': 'updateOnEnter',
			'keypress .add-label': 'updateLabelOnEnter',
			'keydown .edit': 'revertOnEscape',
			'keydown .add-label': 'revertOnEscape',
			'blur .edit': 'close',
			'blur .add-label': 'closeAddLabel',
			'mouseleave':'closeAllPopups',
		},

		// The TodoView listens for changes to its model, re-rendering. Since
		// there's a one-to-one correspondence between a **Todo** and a
		// **TodoView** in this app, we set a direct reference on the model for
		// convenience.
		initialize: function () {
			this.listenTo(this.model, 'change', this.render);
			this.listenTo(this.model, 'destroy', this.remove);
			this.listenTo(this.model, 'visible', this.toggleVisible);
			this.listenTo(this.model, 'delete', this.toggleDeleteView);
		},

		// Re-render the titles of the todo item.
		render: function () {
			// Backbone LocalStorage is adding `id` attribute instantly after
			// creating a model.  This causes our TodoView to render twice. Once
			// after creating a model and once on `id` change.  We want to
			// filter out the second redundant render, which is caused by this
			// `id` change.  It's known Backbone LocalStorage bug, therefore
			// we've to create a workaround.
			// https://github.com/tastejs/todomvc/issues/469
			if (this.model.changed.id !== undefined) {
				return;
			}
			this.$el.html(this.template(this.model.toJSON()));// convert template to view for this model

			// These both are just to set li tag attributes. Other template attributes are set from html
			this.$el.toggleClass('completed', this.model.get('completed'));
			this.$el.toggleClass('priority', this.model.get('priority')!==0);


			// Useful on page refresh. Else triggers are handled by app-view.
			this.toggleVisible();
			this.toggleDeleteView();

			this.$input = this.$('.edit');
			this.$labelInput = this.$('.add-label');
			this.$colorPallete = this.$('.color-pallete');
			this.$colorMark = this.$('.color-mark');
			this.$priorityDropdown = this.$('.dropdown-content');
			return this;
		},



		toggleVisible: function () {
			this.$el.toggleClass('hidden', this.isHidden());
		},

		isHidden: function () {
			return this.model.get('completed') ?
				app.TodoFilter === 'active' :
				app.TodoFilter === 'completed';
		},

		toggleDeleteView: function () {
			this.$el.toggleClass('deleted', this.isDeleted());
		},

		isDeleted: function () {
			this.$el.toggleClass('show-delete', app.TodoFilter === 'deleted' && this.model.get('isDeleted'));
			return this.model.get('isDeleted') ?
				app.TodoFilter !== 'deleted' :
				app.TodoFilter === 'deleted';
		},

		labeling: function (){
			this.$el.addClass('labeling');
			this.$labelInput.focus();
		},

		// Change and toggle the color of the marker(div tag) to the clicked color.
		changeColor: function(e){
			if(this.$colorMark.css('border-color')!==e.currentTarget.style.background){
				this.model.setColor(e.currentTarget.style.background);
			}else{
				this.model.setColor('');
			}
		},

		openPriorityDropdown: function(){
			this.$priorityDropdown.toggleClass('show', !this.$priorityDropdown.hasClass('show'));
		},

		// Set the view class so that csss can display the view with specified colors
		openColorPallete: function(){
			this.$colorPallete.toggleClass('show',!this.$colorPallete.hasClass('show'));
			this.$colorPallete.html(pallete(["#96cdf2","#eea36a","#83ba6d","#d92120"]));
		},

		// close the open popups.
		closeAllPopups:function(){
			this.$colorPallete.toggleClass('show',false);
			this.$priorityDropdown.toggleClass('show',false);
		},

		// Toggle the `"prioirty"` state of the model.
		togglePriority: function() {
			this.model.togglePriority();
		},

		setPriority: function(e){
			var newPriority = e.currentTarget.dataset.priority;
			var oldPriority = this.model.get('priority');
			if(newPriority===oldPriority){
				this.model.setPriority(0); // toggle to default
			}else{
				this.model.setPriority(e.currentTarget.dataset.priority);
			}
		},

		// Toggle the `"completed"` state of the model.
		toggleCompleted: function () {
			this.model.toggle();
		},

		// Toggle the `"deleted"` state of the model.
		toggleDeleted: function(){
			this.model.toggleDeleted();
		},

		// Switch this view into `"editing"` mode, displaying the input field.
		edit: function () {
			this.$el.addClass('editing');
			this.$input.focus();
		},

		// Close the `"labeling"` mode, saving changes to the todo.
		closeAddLabel: function(){
			// console.log("closeAddLabel");
			var value = this.$labelInput.val();
			var trimmedValue = value.trim();

			if (!this.$el.hasClass('labeling')) {
				return;
			}
			if (trimmedValue) {
				this.model.save({ label: [trimmedValue] });
				// ommiting the whitespace part
			}
			this.$el.removeClass('labeling');
		},

		// Close the `"editing"` mode, saving changes to the todo.
		close: function () {
			var value = this.$input.val();
			var trimmedValue = value.trim();

			// We don't want to handle blur events from an item that is no
			// longer being edited. Relying on the CSS class here has the
			// benefit of us not having to maintain state in the DOM and the
			// JavaScript logic.
			if (!this.$el.hasClass('editing')) {
				return;
			}

			if (trimmedValue) {
				this.model.save({ title: trimmedValue });


				// Problem: if just whitespaces are added while edit than trimmed
				//version will be saved but not triggered!!! So
				if (value !== trimmedValue) {
					// Model values changes consisting of whitespaces only are
					// not causing change to be triggered Therefore we've to
					// compare untrimmed version with a trimmed one to check
					// whether anything changed
					// And if yes, we've to trigger change event ourselves
					this.model.trigger('change');
				}
			} else {
				this.clear();
			}

			this.$el.removeClass('editing');
		},

		// If you hit `enter`, we're through adding label to the item.
		updateLabelOnEnter: function (e) {
			if (e.which === ENTER_KEY) {
				this.closeAddLabel();
			}
		},


		// If you hit `enter`, we're through editing the item.
		updateOnEnter: function (e) {
			if (e.which === ENTER_KEY) {
				this.close();
			}
		},

		// If you're pressing `escape` we revert your change by simply leaving
		// the `editing` state.
		revertOnEscape: function (e) {
			if (e.which === ESC_KEY) {
				this.$el.removeClass('editing');
				// Also reset the hidden input back to the original value.
				this.$input.val(this.model.get('title'));

				// also if present
				this.$el.removeClass('labeling');
			}
		},

		// Remove the item, destroy the model from *localStorage* and delete its view.
		clear: function () {
			this.model.destroy();
		}
	});
})(jQuery);
