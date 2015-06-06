// Depends on jquery
function yqlScrapperCall (url , callback , scope , dontCache) {
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
}

function scrapeIndustryLink (ticker , callback) {
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
}

function scrapeTickerPrice(ticker, callback)  {
    try {
        var url,
            tickerObj = {};

        callback = callback && typeof callback === "function" ?  callback : function() {};

        url = "http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20html%20where%20url%3D%22http%3A%2F%2Ffinance.yahoo.com%2Fq%2Fks%3Fs%3D"+ticker+"%2BKey%2BStatistics%22%20%20%20and%20xpath%3D%27%2F%2F*%5B%40class%3D%22yfi_rt_quote_summary%22%5D%27&format=json&diagnostics=true";
        this.yqlScrapperCall(url, function tickerPrice(results) {
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

            price = this._findValue(priceTable,'time_rtq_ticker','class','span.content');
            console.log(price);

            d_change = this._findValue(priceTable,'down_r time_rtq_content','class','span.1.content');
            console.log('d_change = '+d_change);
            u_change = this._findValue(priceTable,'up_g time_rtq_content','class','span.1.content');
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
            price_aft = this._findValue(priceTable,'yfs_rtq_quote','class','span.content');
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


//            if (d_change_aft != undefined) {
//                if (d_change_aft) {
//                    d_change_aft = d_change_aft.substring(1,d_change_aft.length -3);
//                }
//                change_aft = -1 * d_change_aft;
//            } else {
//                if (u_change_aft) {
//                    u_change_aft = u_change_aft.substring(1,u_change_aft.length -3);
//                }
//                change_aft = 1 * u_change_aft;
//            }

            //change_aft = d_change_aft != undefined ? "-("+d_change_aft+"%)" : "+("+u_change_aft+"%)";
            change_aft = d_change_aft != undefined ? -1*d_change_aft+"" : +1*u_change_aft;
//
//            if (change_aft) {
//                change_aft = change_aft.substring(1,change_aft.length -3);
//            }


            tickerObj = {
                ticker : ticker,
                price : price,
                dayChange : change,
                afterPrice : price_aft,
                afterChange : change_aft
            }
            //console.log(JSON.stringify(tickerObj,null,2))
            callback(tickerObj);

        });
    } catch(e) {
        console.log('scrapeTickerPrice exception '+e);
    }

}

function scrapePrice (ticker , callback , callbackObj) {

    //console.log('scrapePrice called');
	var url = "http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20html%20where%20url%3D%22http%3A%2F%2Ffinance.yahoo.com%2Fq%2Fks%3Fs%3D"+ticker+"%2BKey%2BStatistics%22%20and%20xpath%3D'%2F%2F*%5B%40class%3D%22yfi_rt_quote_summary_rt_top%22%5D%2Fp'&format=json&diagnostics=true";
	this.yqlScrapperCall(url, function(results) {

        if (results === null) {
            callback();
            return;
        }

        var change , price , d_change , u_change , price_aft , d_change_aft , u_change_aft , change_aft , priceElement = $('#price') ;
		//console.log(results);
		//this.current.price = results.p.span;
		price = _findValue(results.p.span,'time_rtq_ticker','class','span.content');		
		//console.log(price);
		d_change = this._findValue(results.p.span,'down_r time_rtq_content','class','span.1.content');
		if (d_change !=undefined) {
			d_change = d_change.match(/\((\d+\.\d+)%\)/)[1];
			if (d_change !=undefined) {
				d_change = -1* +d_change;				
			}
		}
		//console.log('d_change = '+d_change);			
		u_change = _findValue(results.p.span,'up_g time_rtq_content','class','span.1.content');	
		if (u_change !=undefined) {
			u_change = u_change.match(/\((\d+\.\d+)%\)/)[1];
		}
		
//		console.log('u_change = '+u_change);	
		if (d_change !=undefined ) {
			change = d_change;
		} else {
			change = u_change;
		}

        price_aft = this._findValue(results.p.span,'yfs_rtq_quote','class','span.content');

        d_change_aft = this._findValue(results.p.span,'down_r time_rtq_content','class','span.1.content');
        if (d_change_aft !=undefined) {
            d_change_aft = d_change_aft.match(/\((\d+\.\d+)%\)/)[1];
            if (d_change_aft !=undefined) {
                d_change_aft = -1* +d_change_aft;
            }
        }

        u_change_aft = _findValue(results.p.span,'up_g','class','span.1.content');
        if (u_change_aft !=undefined) {
            u_change_aft = u_change_aft.match(/\((\d+\.\d+)%\)/)[1];
        }

        if (d_change_aft !=undefined ) {
            change_aft = d_change_aft;
        } else {
            change_aft = u_change_aft;
        }


        //console.log('change = '+change);
		callback(price,change,price_aft,change_aft);
	});
}
/**
 *
 * @param dataTable : Array to look up in
 * @param entryToLookFor    : Key to match
 * @param keySelector   :  selector to lookup to match the  entryToLookFor
 * @param valueSelector : selector to lookup for the matched key
 * @return {*|XML|void}
 * @private
 */
function _findValue(dataTable,entryToLookFor, keySelector,valueSelector) {
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
			k = entry.td[0].p.content || entry.td[0].p;				
		} 

		if (valueSelector) {
			v = safeLookup(entry , valueSelector);
		} else {
			if (entry.td[1].span) {
				v = entry.td[1].span.content ;
			} else if (entry.td[1].p) {
				v = entry.td[1].p.content || entry.td[1].p;							
			}
		}
		if (v && k && k.indexOf && k.indexOf(entryToLookFor)!=-1) {
			return v.replace(',','');
		}					
	}
}




