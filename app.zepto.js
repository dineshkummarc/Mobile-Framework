var app = {
	
	history_support: (function(){
		return !!(window.history && window.history.pushState);
	}()),
	
	init: function() {
	
		var win = $(window),
			body = $('.body');
		
		// If no support for HTML5 History API then check the url #hash
		if (!app.history_support) {
			console.log('Has user loaded a bookmark with hash already set? ', History.getHash(), ' - if so then we need to load the relevant state');
			// This is the same as the onhashchange
			win.on('anchorchange', function(e){
				// Get the hash and load the relevant data
				console.log(History.getHash());
			});
		} else {
			// This is the same as the onpopstate
			win.on('statechange', function(e){
				// Get the state and load the relevant data
				console.log(History.getState());
			});
		}
		
		// AJAX load any <a href> found
		body.on('click', 'a', function(e){
			
			// Define the data that will be passed to pushState()
			var state = null,
				title = 'This is the text from the button from the previous page!?… ' + this.innerHTML, // for the page title we'll just use the text from the link (because we've nothing better, so just make sure the link is descriptive!)
				url = this.href;

			// Grab the content of .body from within the page referenced by element.href and insert it into the specified element of this page
			body.load(this.href + ' .body', function(){
				History.pushState(state, title, url);
			});
			
			e.preventDefault();
			
		});
		
	}
	
};

$.fn.ready(app.init);