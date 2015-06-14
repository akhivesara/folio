var safeLookup = require('./safeLookup');
var yqlScrapperCall = require('./yqlscrapper');

var scrapeIndustryLink = function(ticker , callback) {
    //data.table.tr.td.table.tr.td[0].p[0].a.href
    try {
        var ticker = ticker || $.trim( Y.autoSuggest.$searchbox.val());
        var url = "http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20html%20where%20url%3D%22http%3A%2F%2Ffinance.yahoo.com%2Fq%2Fin%3Fs%3D"+ticker+"%2BIndustry%22%20and%20xpath%3D'%2F%2F*%5B%40id%3D%22yfncsumtab%22%5D'&format=json&diagnostics=true";
        this.yqlScrapperCall(url,function(results) {
            //debugger;
            console.log(results);
            var links = safeLookup(results,'table.tbody.tr.1.td.0.table.1.tbody.tr.td.table.tbody.tr');

            //.1.td.a

            var industryLink = safeLookup(links,'1.td.a', {});
            var sectorLink = safeLookup(links,'0.td.a', {});
            callback(industryLink.content,sectorLink.content);

        });
    } catch(e) {
        console.log("scrapeIndustryLink exception "+e)
    }
};

module.exports = scrapeIndustryLink;
