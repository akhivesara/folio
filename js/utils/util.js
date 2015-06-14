
//function safeLookup (base, path, defaultValue) {
//
//	if (typeof path === 'string') {
//		path = path.split('.');
//	}
//
//	for (var i = 0, l = path.length; i < l; i++) {
//		if (typeof base !== 'undefined' && base !== null && (base = base[path[i]])) {
//		} else {
//			return defaultValue;
//		}
//	}
//	return base;
//}
(function(scope){

scope.isArray = function isArray (obj) {
   if ( obj && obj.constructor.toString().indexOf("Array") != -1)
      return true;
   else {
      return false;
   }
}

scope.isMarketOpen = function isMarketOpen() {
    var now = Date.now() ,
        hour = now.getHours() ,
        day = now.getDayName();
    return !(hour >= 13 || hour < 6 || day === 'Sunday' || day === 'Saturday');
}

Array.prototype.merge = function() {
    var results = [];
    this.forEach(function(subArray) {
        results.push.apply(results, subArray);
    });

    return results;
};

scope.strip_tags = function strip_tags(input, allowed) {
    // +   original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    allowed = (((allowed || "") + "").toLowerCase().match(/<[a-z][a-z0-9]*>/g) || []).join(''); // making sure the allowed arg is a string containing only tags in lowercase (<a><b><c>)
    var tags = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi,
        commentsAndPhpTags = /<!--[\s\S]*?-->|<\?(?:php)?[\s\S]*?\?>/gi;
    return input.replace(commentsAndPhpTags, '').replace(tags, function ($0, $1) {
        return allowed.indexOf('<' + $1.toLowerCase() + '>') > -1 ? $0 : '';
    });
};

/**
*	Sums all the numbers in an array
*	@return	number	sum of all the numbers
*/
Array.prototype.sum = function() {
	var ret = 0, i = 0, num;
	for (i = 0; i < this.length; i++) {
		num = this[i];
		if (typeof num === 'number') {
			ret += num;
		}
	}
	return ret;
};

scope.NOOP = function() {};

})(window);