/**
 * An event emitter facility which provides the observer(Publisher/Subscriber) design pattern to javascript objects
 * Doesn't rely on the browser DOM. Super Simple.
 *
 * Modified from: 
 * https://github.com/jeromeetienne/microevent.js/blob/master/microevent.js
 *
 * @notes All methods are added via the prototype chain (see below)
 */
var observer = function(){};
observer.prototype = {
	/**
	 * The following method binds a custom 'event' to a handler function.
	 * Whenever the custom event is triggered then the associated function is called.
	 * 
	 * @param event { String } the custom event to listen out for
	 * @param callback { Function } the handler function to be associated with the custom event
	 * @return undefined {  } no explicitly returned value
	 */
	bind: function(event, callback) {
	
		this._events = this._events || {};
		this._events[event] = this._events[event]	|| [];
		this._events[event].push(callback);
		
	},
	
	/**
	 * The following method removes the association of a handler function with a custom 'event'.
	 * Note: this function uses indexOf() method on the Array object (which IE < 9 doesn't support)
	 * 
	 * @param event { String } the custom event this function is associated with
	 * @param callback { Function } the handler function associated with the custom event
	 * @return undefined {  } no explicitly returned value (will return undefined if no event found)
	 */
	unbind: function(event, callback) {
	
		// Make sure that an object is available to be checked against (in the odd case where a user calls unbind before actually binding anything first!)
		this._events = this._events || {};
		
		// If the event cannot be found then we return undefined
		if(event in this._events === false) {	
			return;
		}
		
		// Removes the specified event from the list.
		// splice( position of where to start changing Array, number of items from specified position to remove )
		this._events[event].splice(this._events[event].indexOf(callback), 1);
		
	},
	
	/**
	 * The following method can trigger a recognised (i.e. binded) custom event.
	 * This will then call the associated handler function.
	 * 
	 * @param event { String } a custom event that has already been binded to a function
	 * @param ? { ? } Optional arguments that are passed onto the handler function
	 * @return undefined {  } no explicitly returned value (will return undefined if no event found)
	 */
	trigger: function(event /* , args... */) {
		
		// Make sure that an object is available to be checked against (in the odd case where a user calls trigger before actually binding anything first!)
		this._events = this._events || {};
		
		// If the event cannot be found then we return undefined
		if (event in this._events === false) {
			return
		};
		
		// Loop through the events list (executing any functions associated with the event)
		for(var i = 0; i < this._events[event].length; i++) {
		
			// If any additional arguments are passed through to this 'trigger' method then we pass those onto the handler function
			this._events[event][i].apply(this, Array.prototype.slice.call(arguments, 1));
			
		}
		
	}
};

/**
 * This method will delegate all event emitter functions to the destination object
 *
 * @param destObject { Object } the object which will support MicroEvent
 * @return undefined {  } no explicitly returned value
 */
observer.mixin = function(destObject) {		
	var props	= ['bind', 'unbind', 'trigger'];
	
	for(var i = 0; i < props.length; i ++){
		destObject.prototype[props[i]] = observer.prototype[props[i]];
	}	
};

var View = function(){};

observer.mixin(View);

var footer = new View;

function init() {
	console.log('page loaded, but we will simulate the effect of latency - as if the page has taken longer to load');
	window.setTimeout(function(){
		console.log('5 seconds has passed so trigger custom event');
		footer.trigger('tester');
	}, 5000);
}

function test() {
	console.log('test');
}

footer.bind('tester', test);

document.addEventListener('DOMContentLoaded', init, false);