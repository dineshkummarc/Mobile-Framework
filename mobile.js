/*!
* Pub/Sub implementation
* http://addyosmani.com/
* Licensed under the GPL
* http://jsfiddle.net/LxPrq/
*/

;(function(window, doc, undef) {

    var topics = {},
        subUid = -1,
        pubsubz ={};

    pubsubz.publish = function ( topic, args ) {

        if (!topics[topic]) {
            return false;
        }

        setTimeout(function () {
            var subscribers = topics[topic],
                len = subscribers ? subscribers.length : 0;

            while (len--) {
                subscribers[len].func(topic, args);
            }
        }, 0);

        return true;

    };

    pubsubz.subscribe = function ( topic, func ) {

        if (!topics[topic]) {
            topics[topic] = [];
        }

        var token = (++subUid).toString();
        topics[topic].push({
            token: token,
            func: func
        });
        return token;
    };

    pubsubz.unsubscribe = function ( token ) {
        for (var m in topics) {
            if (topics[m]) {
                for (var i = 0, j = topics[m].length; i < j; i++) {
                    if (topics[m][i].token === token) {
                        topics[m].splice(i, 1);
                        return token;
                    }
                }
            }
        }
        return false;
    };

    getPubSubz = function(){
        return pubsubz;
    };

    window.ps = getPubSubz();

}(this, this.document));

/**
 * @license Copyright (c) 2011 Mark McDonnell
 * LICENSE: see the LICENSE.txt file. 
 * If file is missing, this file is subject to the MIT License at: 
 * http://www.opensource.org/licenses/mit-license.php.
 */
(function(window, document, undef) {
	
	// Stand.ard.iz.er library
	var standardizer = (function(){
	
		// Private implementation
		var __standardizer = {
			
			// Errors for AJAX request
			errors: [],
			
			/**
			 * A basic AJAX method.
			 * 
			 * @param settings { Object } user configuration
			 * @return undefined {  } no explicitly returned value
			 */
		 	ajax: function(settings) {
		 	
		 		// JavaScript engine will 'hoist' variables so we'll be specific and declare them here
		 		var xhr, url, requestDone, xhrTimeout,  
		 		
		 		// Load the config object with defaults, if no values were provided by the user
				config = {
					// The type of HTTP Request
					method: settings.method || 'POST',
					
					// The data to POST to the server
					data: settings.data || '',
				
					// The URL the request will be made to
					url: settings.url || '',
				
					// How long to wait before considering the request to be a timeout
					timeout: settings.timeout || 5000,
				
					// Functions to call when the request fails, succeeds, or completes (either fail or succeed)
					onComplete: settings.onComplete || function(){},
					onError: settings.onError || function(){},
					onSuccess: settings.onSuccess || function(){},
				
					// The data type that'll be returned from the server
					// the default is simply to determine what data was returned from the server and act accordingly.
					dataType: settings.dataType || ''
				};
				
				// Create new cross-browser XMLHttpRequest instance
				xhr = window.XMLHttpRequest();
				
				// Open the asynchronous request
				xhr.open(config.method, config.url, true);
				
				// Determine the success of the HTTP response
				function httpSuccess(r) {
					try {
						// If no server status is provided, and we're actually
						// requesting a local file, then it was successful
						return !r.status && location.protocol == 'file:' ||
						
						// Any status in the 200 range is good
						( r.status >= 200 && r.status < 300 ) ||
						
						// Successful if the document has not been modified
						r.status == 304 ||
						
						// Safari returns an empty status if the file has not been modified
						navigator.userAgent.indexOf('Safari') >= 0 && typeof r.status == 'undefined';
					} catch(e){
						// Throw a corresponding error
						throw new Error("httpSuccess Error = " + e);
					}
					
					// If checking the status failed, then assume that the request failed too
					return false;
				}
				
				// Extract the correct data from the HTTP response
				function httpData(xhr, type) {
					
					if (type === 'json') {
						// Make sure JSON parser is natively supported
						if (window.JSON !== undefined) {
							return JSON.parse(xhr.responseText);
						} 
						// IE<8 hasn't a native JSON parser so instead of eval()'ing the code we'll use Douglas Crockford's json2 parse() method
						else {
							return __standardizer.json(xhr.responseText);
							//return eval('(' + xhr.responseText + ')');
						}
					}
					
					//
					else if (type === 'html') {
						return xhr.responseText;
					}
					
					//
					else if (type === 'xml') {
						return xhr.responseXML;
					}
					
					// Attempt to work out the content type
					else {
						// Get the content-type header
						var contentType = xhr.getResponseHeader("content-type"), 
							 data = !type && contentType && contentType.indexOf("xml") >= 0; // If no default type was provided, determine if some form of XML was returned from the server
						
						// Get the XML Document object if XML was returned from the server,
						// otherwise return the text contents returned by the server
						data = (type == "xml" || data) ? xhr.responseXML : xhr.responseText;	
						
						// Return the response data (either an XML Document or a text string)
						return data;
					}
					
				}
				
				// Initalize a callback which will fire within the timeout range, also cancelling the request (if it has not already occurred)
				xhrTimeout = window.setTimeout(function() {
					requestDone = true;
					config.onComplete();
				}, config.timeout);
				
				// Watch for when the state of the document gets updated
				xhr.onreadystatechange = function() {
					
					// Wait until the data is fully loaded, and make sure that the request hasn't already timed out
					if (xhr.readyState == 4 && !requestDone) {
						
						// Check to see if the request was successful
						if (httpSuccess(xhr)) {
							// Execute the success callback
							config.onSuccess(httpData(xhr, config.dataType));
						}
						
						/**
						 * For some reason, in an example PHP script that returns JSON data,
						 * even though the request 'timed out' it still generated a readyState of 4.
						 * I believe this was because although the script used sleep() to delay the data returned, the fact it returned data after the timeout caused an error.
						 * So when the httpSuccess expression used in the above condition returns false we need to execute the onError handler.
						 */
						else {
							config.onError(xhr);
						}
			
						// Call the completion callback
						config.onComplete();
						
						// Clean up after ourselves (+ help to avoid memory leaks)
						clearTimeout(xhrTimeout);
						xhr.onreadystatechange = null;
						xhr = null;
						
					} else if (requestDone && xhr.readyState != 4) {
						// If the script timed out then keep a log of it so the developer can query this and handle any exceptions
						__standardizer.errors.push(url + " { timed out } ");
						
						// Bail out of the request immediately
						xhr.onreadystatechange = null;
						xhr = null;
					}
					
				};
				
				// Get if we should POST or GET...
				if (config.data) {
					// Settings
					xhr.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
					
					// Establish the connection to the server
					xhr.send(config.data);
				} else {					
					// Establish the connection to the server
					xhr.send(null);
				}
	
			},
			
			utilities: {
			
				/**
				 * The following method truncates a string by the length specified.
				 * The second argument is the suffix (e.g. rather than ... you could have !!!)
				 *
				 * @param str { String } the string to 
				 * @param length { Integer } the length the string should be (if none specified a default is used)
				 * @param suffix { String } default value is ... but can be overidden with any number of characters
				 * @return { String } the modified String value
				 */
				truncate: function(str, length, suffix) {
					length = length || 30;
					suffix = (typeof suffix == "undefined") ? '...' : suffix;
					
					// If the string isn't longer than the specified cut-off length then just return the original string
					return (str.length > length) 
						// Otherwise, we borrow the String object's "slice()" method using the "call()" method
						? String.prototype.slice.call(str, 0, length - suffix.length) + suffix
						: str;
				},
				
				/**
				 * The following method inserts a specified element node into the DOM after the specified target element node.
				 * For some reason the DOM api provides different methods to acheive this functionality but no actual native method?
				 *
				 * @param newElement { Element/Node } new element node to be inserted
				 * @param targetElement { Element/Node } target element node where the new element node should be inserted after
				 * @return undefined {  } no explicitly returned value
				 */
				insertAfter: function(newElement, targetElement) {
					var parent = targetElement.parentNode;
					
					(parent.lastChild == targetElement) 
						? parent.appendChild(newElement) 
						: parent.insertBefore(newElement, targetElement.nextSibling);
					
				},
				
				/**
				 * Following method is short hand for document.getElementById
				 * This can help improve performance by not having to keep looking up scope chain for either 'document' or 'getElementById'
				 * 
				 * @param id { String } the identifier for the element we want to access.
				 * @return { Element | Undefined } either the element we require or undefined if it's not found
				 */
				getEl: function(id) {
					return document.getElementById(id);
				},
				
				/**
				 * Following method is short hand for document.getElementsByTagName
				 * This can help improve performance by not having to keep looking up scope chain for either 'document' or 'getElementsByTagName'
				 * Also allows us to return the first found element if we so choose.
				 * 
				 * @param options { Object } object literal of options
				 *	@param tag { String } the HTML tag to search for (e.g. 'div')
				 *	@param context { Element/Node } an element to anchor the search by (defaults to window.document)
				 *	@param first { Boolean } determines if we return the first element or the entire HTMLCollection
				 * @return { Element | HTMLCollection/Array | Undefined } either the element(s) we require or undefined if it's not found
				 */
				getTag: function(options) {
					var tag = options.tag || '*', 
						 context = options.context || this.doc, 
						 returnFirstFound = options.first || false;
					
					return (returnFirstFound) 
						? context.getElementsByTagName(tag)[0] 
						: context.getElementsByTagName(tag);
				},
				
				/**
				 * Following property stores a reference to the core Object's toString() method.
				 * This allows us to access JavaScript's internal [[Class]] property which helps us determine the type of certain primitives.
				 * This version was updated to use @cowboy's version: https://gist.github.com/1131946
				 * 
				 * Example Usage:
				 * 	__standardizer.utilities.getType([1, 2, 3]); 					// Array
				 * 	__standardizer.utilities.getType({ a: 1, b: 2, c: 3 }); 		// Object
				 * 	__standardizer.utilities.getType(123); 							// Number
				 * 	__standardizer.utilities.getType(new Date); 						// Date
				 * 	__standardizer.utilities.getType("String"); 						// String
				 * 	__standardizer.utilities.getType(window); 						// Global
				 * 
				 * Running {}.toString.call() doesn't work with null or undefined, because executing call() with null or undefined passes window as this.
				 * So for Null we check explicit value/type match, and after that if Null doesn't match then we check value is null so we know the obj is Undefined.
				 * 
				 * @return { String } a trimmed version of the internal [[Class]] value for the specified object (i.e. the object's true data type)
				 */
				getType: (function() {
					
					var types = {};
					
					return function(obj) {
						var key;
						
						// If the object is null, return "Null" (IE <= 8)
						return obj === null ? "Null"
							// If the object is undefined, return "Undefined" (IE <= 8)
							: obj == null ? "Undefined"
							// If the object is the global object, return "Global"
							: obj === window ? "Global"
							// Otherwise return the XXXXX part of the full [object XXXXX] value, from cache if possible.
							: types[key = types.toString.call(obj)] || (types[key] = key.slice(8, -1));
					};
					
				}())
				
			},
			
			css: {
			
				/**
				 * The getArrayOfClassNames method is a utility method which returns an array of all the CSS class names assigned to a particular element.
				 * Multiple class names are separated by a space character
				 * 
				 * @param element { Element/Node } the element we wish to retrieve class names for
				 * @return classNames { String } a list of class names separated with a space in-between
				 */
			 	getArrayOfClassNames: function(element) {
			 	
					var classNames = []; 
					
					if (element.className) { 
						// If the element has a CSS class specified, create an array 
						classNames = element.className.split(' '); 
					} 
					
					return classNames;
					
				},
				
				/**
				 * The addClass method adds a new CSS class of a given name to a particular element
				 * 
				 * @param element { Element/Node } the element we want to add a class name to
				 * @param className { String } the class name we want to add
				 * @return undefined {  } no explicitly returned value
				 */
			 	addClass: function(element, className) {
			 	
					// Get a list of the current CSS class names applied to the element 
					var classNames = this.getArrayOfClassNames(element); 
					
					// Make sure the class doesn't already exist on the element
				   if (this.hasClass(element, className)) {
				   	return;
				   }
				   
					// Add the new class name to the list 
					classNames.push(className);
					
					// Convert the list in space-separated string and assign to the element 
					element.className = classNames.join(' '); 
					
				},
				
				/**
				 * The removeClass method removes a given CSS class name from a given element
				 * 
				 * @param element { Element/Node } the element we want to remove a class name from
				 * @param className { String } the class name we want to remove
				 * @return undefined {  } no explicitly returned value
				 */
			 	removeClass: function(element, className) { 
			 	
					var classNames = this.getArrayOfClassNames(element),
						 resultingClassNames = []; // Create a new array for storing all the final CSS class names in 
			        
					for (var index = 0, len = classNames.length; index < len; index++) { 
					
						// Loop through every class name in the list 
						if (className != classNames[index]) { 
						
							// Add the class name to the new list if it isn't the one specified 
							resultingClassNames.push(classNames[index]); 
							
						} 
						
					}
					  
					// Convert the new list into a  space- separated string and assign it 
					element.className = resultingClassNames.join(" "); 
					
				},
				
				/**
				 * The hasClass method returns true if a given class name exists on a specific element, false otherwise
				 * 
				 * @param element { Element/Node } the element we want to check whether a class name exists on
				 * @param className { String } the class name we want to check for
				 * @return isClassNamePresent { Boolean } if class name was found or not
				 */
			 	hasClass: function(element, className) { 
			 	
					// Assume by default that the class name is not applied to the element 
					var isClassNamePresent = false,
						 classNames = this.getArrayOfClassNames(element); 
			        
					for (var index = 0, len = classNames.length; index < len; index++) { 
					
						// Loop through each CSS class name applied to this element 
						if (className == classNames[index]) { 
						
							// If the specific class name is found, set the return value to true 
							isClassNamePresent = true; 
							
						} 
						
					} 
			        
					// Return true or false, depending on if the specified class name was found 
					return isClassNamePresent; 
					
				}
				
			}
			
		};
		
		// Return public API
		return {
			load: __standardizer.ajax,
			utils: __standardizer.utilities,
			css: __standardizer.css
		};
		
	}());
	
	// Expose st to the global object
	window.st = standardizer;
	
}(this, this.document));

var app = {
	
	init: function() {
		console.log('page loaded, but we will simulate the effect of latency - as if the page has taken longer to load');
		window.setTimeout(function(){
			console.log('5 seconds has passed so trigger custom event');
			ps.publish('tester', 'some data published!');
		}, 5000);
	}
	
}

function test(topic, data) {
	console.log('tester executed: ', topic, data);
}
ps.subscribe('tester', test); // test() will execute when 'tester' event is triggered

document.addEventListener('DOMContentLoaded', app.init, false);