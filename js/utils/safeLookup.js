/**
 * Finds values in deeply nested objects, returning a default value if not found;
 *
 * @param {Object} The base object or array to start the search from
 * @param {String} Dot seperated path to lookup (use dots even for arrays)
 * @param {Object} The default value to return if lookup fails
 * @returns {Object} The value if found, otherwise false
 */
module.exports = function(base, path, defaultValue) {
    // Wrap in a try/catch in case base has unexpected values since throwing an exception would be bad.
    try {
        var i, len;

        // Both objects and arrays have type of 'object' (but so is null)
        // Allow function as reqact descriptors have meta associated with them, eg this.constructor.displayName
        if (!base || !(typeof base === 'object' || typeof base === 'function')) {
            return defaultValue;
        }

        if (typeof path === 'string') {
            path = path.split('.');
        }

        len = path.length;
        for (i = 0; i < len; i++) {
            base = base[path[i]];
            if (base === undefined || base === null) {
                return defaultValue;
            }
        }
    } catch(e) {
        base = defaultValue;
    }

    return base;
};