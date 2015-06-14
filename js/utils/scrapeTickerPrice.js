var safeLookup = require('./safeLookup');
var findValue = require('./findValue');

var yqlScrapperCall = require('./yqlscrapper');

var scrapeTickerPrice = function(ticker, callback)  {
    try {
        var url,
            tickerObj = {};

        callback = callback && typeof callback === "function" ?  callback : function() {};

        url = "http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20html%20where%20url%3D%22http%3A%2F%2Ffinance.yahoo.com%2Fq%2Fks%3Fs%3D"+ticker+"%2BKey%2BStatistics%22%20%20%20and%20xpath%3D%27%2F%2F*%5B%40class%3D%22yfi_rt_quote_summary%22%5D%27&format=json&diagnostics=true";
        yqlScrapperCall(url, function tickerPrice(results) {
            if (results === null) {
                callback(tickerObj);
                return;
            }
            var price ,
                d_change ,
                u_change ,
                price_aft ,
                d_change_aft ,
                u_change_aft ,
                priceTable,
                change,
                change_aft;
            console.log(results);
            priceTable = safeLookup(results,'div.div.1.div.0.span');

            price = findValue(priceTable,'time_rtq_ticker','class','span.content');
            console.log(price);

            d_change = findValue(priceTable,'down_r time_rtq_content','class','span.1.content');
            console.log('d_change = '+d_change);
            u_change = findValue(priceTable,'up_g time_rtq_content','class','span.1.content');
            console.log('u_change = '+u_change);

            if (d_change != undefined) {
                if (d_change) {
                    d_change = d_change.substring(1,d_change.length -3);
                }
                change = -1 * d_change;
            } else {

                if (u_change) {
                    u_change = u_change.substring(1,u_change.length -3);
                }
                change = 1 * u_change;
            }

            //change = d_change != undefined ? "-"+d_change : "+"+u_change;


            priceTable = safeLookup(results,'div.div.1.div.1.span');
            price_aft = findValue(priceTable,'yfs_rtq_quote','class','span.content');
            console.log(price_aft);
            if (price_aft) {
                if (price_aft > price) {
                    u_change_aft = (100 * ((price_aft - price)/price)).toFixed(2);
                    console.log('u_change_aft = '+u_change_aft);
                } else {
                    d_change_aft =  (100*((price - price_aft)/price)).toFixed(2);
                    console.log('d_change_aft = '+u_change_aft);
                }
            }
            change_aft = d_change_aft != undefined ? -1*d_change_aft+"" : +1*u_change_aft;
            tickerObj = {
                ticker : ticker,
                price : price,
                dayChange : change,
                afterPrice : price_aft,
                afterChange : change_aft
            };
            callback(tickerObj);

        });
    } catch(e) {
        console.log('scrapeTickerPrice exception '+e);
    }

};

module.exports = scrapeTickerPrice;