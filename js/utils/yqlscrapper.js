require('../../lib/jQuery');
var amplify = require('../../lib/amplify');
var safeLookup = require('./safeLookup');

// Depends on jquery
yqlScrapperCall  = function(url , callback , scope , dontCache) {
	var storedData;
	scope = scope || this;
    callback = callback || NOOP;
    if (!dontCache) {
	    storedData = amplify.store(url);
    }
	if (!storedData) {
		$.getJSON(url, {}, 
			function(json) {
	        	if (typeof json === "object" && json.query && json.query.results) {
	            	// we have a json object with an array of company info, cache it, and display suggestions
					var results = json.query.results;
					//console.log('yqlScrapperCall');
					//console.log(results);
					// store in l
					if (!dontCache) {
						amplify.store(url,results);	
					}
					callback.call(scope,results);
				} else {
                    callback.call(scope, null);
                }
			}
		);
	} else {
		callback.call(scope,storedData);		
	}
};

module.exports = yqlScrapperCall ;




