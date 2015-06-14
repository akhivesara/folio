var safeLookup = require('./safeLookup');

/**
 *
 * @param dataTable : Array to look up in
 * @param entryToLookFor    : Key to match
 * @param keySelector   :  selector to lookup to match the  entryToLookFor
 * @param valueSelector : selector to lookup for the matched key
 * @return {*|XML|void}
 * @private
 */
var findValue = function(dataTable,entryToLookFor, keySelector,valueSelector) {
    var _table = dataTable ,
        i = 0 ,
        entry , k , v;

    if (!dataTable) {
        console.log("findValue:: no dataTable sent");
        _table = [];
    }
    for (;i< _table.length;i++) {
        entry = _table[i];
        if (keySelector) {
            k = safeLookup(entry,keySelector);
        } else {
            k = safeLookup(entry, 'td.0.p.content') || safeLookup(entry, 'td.0.p');
        }

        if (valueSelector) {
            v = safeLookup(entry , valueSelector);
        } else {
            if (entry.td[1].span) {
                v = entry.td[1].span.content ;
            } else if (entry.td[1].p) {
                v = safeLookup(entry, 'td.1.p.content') || safeLookup(entry, 'td.1.p');
            }
        }
        if (v && k && k.indexOf && k.indexOf(entryToLookFor)!=-1) {
            return v.replace(',','');
        }
    }
};

module.exports = findValue;
