Portfolio = new Class.create({

	//TODO: make the url configurable
	init : function() {
        var that = this;
        $(document).on('portfolioReady' , function() {
            that.getEarningsDates(myTable.create.bind(myTable))
        });
		this._myportfolio = null;		
		var google = new GoogleScrapper();
		google.fetch(null,$.proxy(this._onDataFetched, this)); 		
		google.fetch(google.settledUrl,$.proxy(this._settledComplete, this));

	},
	
	_settledComplete : function(data) {
		console.log('_settledComplete');
		this._settledmyportfolio = data;
		data.primaryKeys.forEach(function(ticker) {
			data.data[ticker]['gain'] = 100*((data.data[ticker].sellbasis - data.data[ticker].costbasis)/data.data[ticker].costbasis);
		});
		this.createCompletedChart(this._createData(true,['symbol', 'gain'],data),'gainComplete');
	},

    /**
     *
     * @param ticker
     * @returns { { gl: number,
      *             gainPercentage: number}
       *        }
     */
    calculateGain : function(ticker) {
        var data = this._myportfolio.data[ticker];
        var totalShares = +data.shares;
        var marketValue = +data.price * totalShares +  (+data.dividend);
        var cost = +data.costbasis + (+data.tax);
        var gl = marketValue - cost ;

        return {
            gl : gl,
            gainPercentage : 100*((gl)/cost)
        }
    },

    _extract : function(keys , source) {
        var data = {};

        keys.forEach(function(i) {
            data[i] = source.data[i]
        })

        return {
            primaryKeys: keys,
            data : data
        }
    },
	_onDataFetched : function(data) {
		console.log('_onDataFetched');
		var that=this;
		this._myportfolio = data;

		this.createTable();
		this.createPie();
		this.sectors = [];
		that._myportfolio.sectors = {};
		var count = 0;
        var tickerCount = 0
		var max = this._myportfolio.primaryKeys.length;
		this._myportfolio.primaryKeys.forEach(function(ticker) {
            scrapeTickerPrice(ticker, function(data) {
                tickerCount++;
                that._myportfolio.data[ticker]['price'] = data.price;

                var g = that.calculateGain(ticker);
                that._myportfolio.data[ticker]['gl'] = g.gl;
                that._myportfolio.data[ticker]['gainPercentage'] = g.gainPercentage;

                if (tickerCount >= max) {
                    //console.log('createSectorPie');
                    var gainData = that._createData(true,['symbol', 'gainPercentage' ],that._myportfolio, true);
                        //portfolio._createData(true,['symbol','dividend'],undefined, true).map(function(i) { return i[0]})
                    that.createGainCharts(gainData,'positions', {  title:"Positions", formatter : function() {
                                                                                var tooltip = this.x +': '+ this.y.toFixed(2) +' %';
                                                                                if (this.point.name !== 'Overall') {
                                                                                    tooltip += '<br><b>Gain: $'+(portfolio._myportfolio.data[this.point.name].gl).toFixed(2) + '</b></br>'
                                                                                } else {
                                                                                    var source;
                                                                                    source = that._myportfolio;
                                                                                    var totalcost = portfolio._createData(true,['costbasis'],source).
                                                                                        merge().
                                                                                        reduce(function(a, b) {
                                                                                            return a + b;
                                                                                        });
                                                                                    var totalgain = portfolio._createData(true,['gl'],source).
                                                                                        merge().
                                                                                        reduce(function(a, b) {
                                                                                            return a + b;
                                                                                        });
                                                                                    var divROI = 100 * totalgain / totalcost;
                                                                                    tooltip = '<b>ROI: '+divROI.toFixed(2) +' %</b>';
                                                                                    tooltip +='<br><b>Gain: $'+(totalgain).toFixed(2) + '</b></br>';
                                                                                    tooltip +='<br><b>Cost: $'+totalcost.toFixed(2)+ '</b></br>';
                                                                                }
                                                                                return tooltip;
                                                                               } ,
                                                                               keys : gainData.map(function(i) { return i[0]}),
                                                                               xTitle : 'Gain',
                                                                               yTitle : 'Percentage (%)'
                    });
                    var divData = that._createData(true,['symbol', 'dividend' ],that._myportfolio, true);
                    that.createGainCharts(divData,'dividend',{  title:"Dividends", formatter : function() {
                                                                            var div = safeLookup(that._myportfolio.data[this.point.name], 'dividend');
                                                                            var divROI;
                                                                            if (div) {
                                                                                divROI = 100* div / that._myportfolio.data[this.point.name].costbasis;
                                                                            }
                                                                            var tooltip = '$'+this.y.toFixed(2);
                                                                            if (this.point.name !== 'Overall') {
                                                                                if (div) {
                                                                                    tooltip += '<br><b>ROI %: '+divROI.toFixed(2) + '</b></br>'
                                                                                }
                                                                            } else {
                                                                                var source;
                                                                                source = that._extract(divData.map(function(i) { return i[0]}),that._myportfolio);
                                                                                var totalcost = that._createData(true,['costbasis'],source).
                                                                                    merge().
                                                                                    reduce(function(a, b) {
                                                                                    return a + b;
                                                                                });
                                                                                var totaldiv = that._createData(true,['dividend'],source).
                                                                                    merge().
                                                                                    reduce(function(a, b) {
                                                                                    return a + b;
                                                                                });
                                                                                divROI = 100 * totaldiv / totalcost;
                                                                                tooltip += '<br><b>ROI %: '+divROI.toFixed(2) + '</b></br>'
                                                                            }
                                                                            return tooltip;
                                                                        },
                                                                            keys : divData.map(function(i) { return i[0]}),
                                                                            xTitle : 'Stocks',
                                                                            yTitle : 'Income ($)',
                                                                            overall : function() {
                                                                                var source;
                                                                                source = that._extract(divData.map(function(i) { return i[0]}),that._myportfolio);
                                                                                var totalcost = that._createData(true,['costbasis'],source).merge();
                                                                                var totaldiv = that._createData(true,['dividend'],source).merge();
                                                                                var total = totaldiv.reduce(function(a, b) {
                                                                                    return a + b;
                                                                                });
                                                                                return total;
                                                                            }

                    });
                }
            });
			scrapeIndustryLink(ticker,function(industry , sector) {
				count++
				if (!sector) sector = 'Unknown';
				that._myportfolio.data[ticker]['industry'] = industry;
				that._myportfolio.data[ticker]['sector'] = sector;				
				if (that.sectors.indexOf(sector) ==-1) {
					that.sectors.push(sector);
				}
				if (!that._myportfolio.sectors[sector]) {
					that._myportfolio.sectors[sector] = {primaryKeys : [] , industry : []};
				}
				that._myportfolio.sectors[sector].primaryKeys.push(ticker);
				that._myportfolio.sectors[sector].industry.push(industry);				
				if (count >= max) {
					console.log('createSectorPie');
					that.createSectorPie();
				}
			})
		});
		count = 0;
		window.priceCount =0;
		this._myportfolio.primaryKeys.forEach(function(ticker) {
			scrapeTickerPrice(ticker,function(data) {

                var price = data.price;
                var change = data.dayChange;
                var price_aft= data.afterPrice;
                var change_aft = data.afterChange;
				//console.log('scrapePrice call done');
				window.priceCount++;
				count++;
				that._myportfolio.data[ticker]['change'] = change;
				that._myportfolio.data[ticker]['quote'] = +price;
                that._myportfolio.data[ticker]['aft_change'] = change_aft;
                that._myportfolio.data[ticker]['aft_quote'] = +price_aft;

				that._myportfolio.data[ticker]['gain'] = 100*((+price* +that._myportfolio.data[ticker].shares) + (+that._myportfolio.data[ticker].dividend) - that._myportfolio.data[ticker].costbasis)/that._myportfolio.data[ticker].costbasis;
				if (window.priceCount >= max) {
                    $(document).trigger('portfolioReady');
					console.log('createCurrentGainChart');
                    that.createColumnChart(that._createData(true,['symbol' , 'gainPercentage']), 'dayGainColumn',true);
                    delete window.priceCount;
				}
			})
		});
	},
	
	_calculateTotalGain : function(sold , primaryData) {
		var cost = 0, sale =0  , gain=0 , that = this , primaryData = primaryData || this._myportfolio;
		primaryData.primaryKeys.forEach(function(ticker) {
			if (ticker != 'Overall') {
				cost += +primaryData.data[ticker]['costbasis'];
				if (sold) {
					sale += +primaryData.data[ticker]['sellbasis'];					
				} else {
					sale += (+primaryData.data[ticker]['quote'] * + primaryData.data[ticker].shares) ;
				}
			}
		});
		gain = 100* ((sale - cost)/cost);
		return gain;
	},
	
	createTable : function() {
		var tableData = this._createData();
		if (tableData.length > 1) {
		  _table = $("#portfolioTable").handsontable({
		    data: tableData
		  });		
		}
	},

	// TODO change signature
	_createData : function(noHeaders, keyMap , primaryData , excludeIfNoKey) {
		var tableData = [],
		singleEntry,
        more,
        key,
		primaryData = primaryData || this._myportfolio;

		if (!noHeaders) {
			tableData.push(primaryData.columns);
		}
		for (var key in primaryData.data) {
			singleEntry = [];
			for (var more in primaryData.data[key]) {
				if (!keyMap) {
					singleEntry.push(primaryData.data[key][more]);					
				} else if (keyMap.indexOf(more) !=-1) {
                    if (excludeIfNoKey && (primaryData.data[key][more] === 'undefined' || primaryData.data[key][more] === '' || primaryData.data[key][more] === '0')) {
                        if (keyMap[0] === 'symbol') {
                            singleEntry = [];
                        }
                        continue;
                    }
					if (+primaryData.data[key][more]) {
						singleEntry.push(+primaryData.data[key][more]);						
					} else {
						singleEntry.push(primaryData.data[key][more]);
					}
				}					
			}
            if (!excludeIfNoKey || singleEntry.length) {
			    tableData.push(singleEntry);
            }
		}		
		return tableData;
	},
	
	createDataObject : function(keyMap) {
		var tableData = [] ,
		singleEntry = {};
		for (var key in this._myportfolio.data) {
			singleEntry = {};
			for (var more in this._myportfolio.data[key]) {
				if (!keyMap) {
					singleEntry[more] = (this._myportfolio.data[key][more]);					
				} else if (keyMap.indexOf(more) !=-1) {					
					if (+this._myportfolio.data[key][more]) {
						singleEntry[more] = (+this._myportfolio.data[key][more]);						
					} else {
						singleEntry[more] = (this._myportfolio.data[key][more]);
					}
				}					
			}
			tableData.push(singleEntry);					
		}		
		return tableData;		
	},
	
	createSectorPie : function() {
//		var data = portfolio.createDataObject(['sector','costbasis','symbol']) ,
		var data = this.createDataObject(['sector','costbasis']) ,
		sectorData = {} ,
		pieData = [];
		this.sectors.forEach(function(sector) {
			sectorData[sector] = data.filter(function(item) { return item.sector == sector })			
		});
		for (var d in sectorData) {
			if (sectorData[d] && sectorData[d].length > 1) {
				var cost=0;
				for (var x=0;x<sectorData[d].length;x++) {
					cost += sectorData[d][x].costbasis;
				}
				sectorData[d] = [{'sector':d , 'costbasis' : cost }];
			}
			pieData.push([sectorData[d][0].sector , sectorData[d][0].costbasis]);
		}
		this.createPie(pieData,'sectorPie' , 'Sector Diversification');
	},
	
	createPie : function(data , elementId , title) {
		    var chart;
		        chart = new Highcharts.Chart({
		            chart: {
		                renderTo: elementId || 'portfolioPie',
		                plotBackgroundColor: null,
		                plotBorderWidth: null,
		                plotShadow: false
		            },
		            title: {
		                text: title || 'Stock Diversification'
		            },
		            tooltip: {
						formatter : function() {
							var sectorData = safeLookup(portfolio._myportfolio.sectors , this.key);
							if (sectorData) {
								return  this.point.name +': <b>'+this.point.percentage.toFixed(2) +'%</b> <br>Holdings: <b>'+sectorData.primaryKeys.toString().replace(/,/g,', ') +'</b></br><br>Industry: <b>'+sectorData.industry.toString().replace(/,/g,', ')+'</b></br>';
							} else {
								return  this.point.name +': <b>'+this.point.percentage.toFixed(2) +'%</b> <br>Shares: <b>'+portfolio._myportfolio.data[this.point.name].shares +'<b></br>';								
							}
						},
/*
		        	    pointFormat: '{series.name}: <b>{point.percentage}%</b> '+safeLookup(portfolio._myportfolio.sectors , 'Technology'),
*/		
		            	percentageDecimals: 1

		            },
		            plotOptions: {
		                pie: {
		                    allowPointSelect: true,
		                    cursor: 'pointer',
		                    dataLabels: {
		                        enabled: true,
		                        color: '#000000',
		                        connectorColor: '#000000',
		                        formatter: function() {
//									if (name) {
//		                            	return '<b>'+ this.point[name] +'</b>: '+ this.percentage.toFixed(1) +' %';										
//									} else {
		                            	return '<b>'+ this.point.name +'</b>: '+ this.percentage.toFixed(1) +' %';
//									}
		                        }
		                    },
		                    showInLegend: true
		                }
		            },
		            series: [{
		                type: 'pie',
		                name: 'Own',
		                data: data || this._createData(true,['symbol' , 'costbasis'])/*
		                [
		                		                    ['Firefox',   45.0],
		                		                    ['IE',       26.8],
		                		                    {
		                		                        name: 'Chrome',
		                		                        y: 12.8,
		                		                        sliced: true,
		                		                        selected: true
		                		                    },
		                		                    ['Safari',    8.5],
		                		                    ['Opera',     6.2],
		                		                    ['Others',   0.7]
		                		                ]*/
		                
		            }]
		        });		
	},
	
	createColumnChart : function(data , elementId , avoidOverall ) {
		    var chart ,
				data = data || this._createData(true,['symbol' , 'gainPercentage']) ,
				keys = this._myportfolio.primaryKeys ;
				if (!avoidOverall) {
					data.push(['Overall' , this._calculateTotalGain()]);
					keys.push('Overall');
				}
		        chart = new Highcharts.Chart({
		            chart: {
		                renderTo: elementId,
		                type: 'column'
		            },
		            title: {
		                text: 'Current Gain Chart'
		            },
		            xAxis: {
		                categories: keys		                
		            },
		            yAxis: {
		                title: {
		                    text: 'Percentage (%)'
		                }
		            },
		            tooltip: {
		                formatter: function() {
							var tooltip = this.x +': '+ this.y.toFixed(2) +' %';
							if (this.point.name == 'Overall') {
								//tooltip+= '<br><br> Gain: '+portfolio._settledmyportfolio.data[this.point.name].sellbasis - portfolio._settledmyportfolio.data[this.point.name].costbasis + '<b></br>'								
							} else {
								tooltip+= '<br><b>Gain: $'+((portfolio._myportfolio.data[this.point.name].shares * portfolio._myportfolio.data[this.point.name].quote)- portfolio._myportfolio.data[this.point.name].costbasis).toFixed(2) + '</b></br>'
							}
		                    return tooltip;
		                }
		            },
		            plotOptions: {
		                column: {
		                    pointPadding: 0.2,
		                    borderWidth: 0
		                }
		            },
	                series: [{
                            name : 'Total',
                            data: data
                        },
						{
							name : 'Day',
							data : this._createData(true,['symbol' , 'change'])
						}
					]
		        });
		//chart.legend.destroy();
		if (!avoidOverall) {
			keys.pop();
		}		
	},

    createGainCharts : function(data , elementId , options) {
        options = options || {};

        var chart ,
            data = data ,
            keys = options.keys || this._myportfolio.primaryKeys,
            that = this,
            title = options.title,
            formatter = options.formatter,
            avoidOverall = options.avoidOverall,
            xTitle = options.xTitle,
            yTitle = options.yTitle,
            overall = options.overall;

        if (!avoidOverall) {
            data.push(['Overall' , typeof overall === 'function' ?  overall() : /*this._calculateTotalGain(true , this._settledmyportfolio)*/ 100]);
            keys.push('Overall');
        }
        chart = new Highcharts.Chart({
            chart: {
                renderTo: elementId,
                type: 'column'
            },
            title: {
                text: title
            },
            xAxis: {
                categories: keys
            },
            yAxis: {
                title: {
                    text: yTitle
                }
            },
            tooltip: {
                formatter: formatter
            },
            plotOptions: {
                column: {
                    pointPadding: 0.2,
                    borderWidth: 0
                }
            },
            series: [{
                    name : xTitle,
                    data: data
                }]
        });
        if (!avoidOverall) {
            keys.pop();
        }
    },

    //TODO use createChartGains
    createCompletedChart : function(data , elementId , avoidOverall , title) {
		    var chart ,
				data = data ,
				keys = this._settledmyportfolio.primaryKeys ;
				if (!avoidOverall) {
					data.push(['Overall' , this._calculateTotalGain(true , this._settledmyportfolio)]);
					keys.push('Overall');
				}
        try{
		        chart = new Highcharts.Chart({
		            chart: {
		                renderTo: elementId,
		                type: 'column'
		            },
		            title: {
		                text: title || 'Closed Positions'
		            },
		            xAxis: {
		                categories: keys		                
		            },
		            yAxis: {
		                title: {
		                    text: 'Percentage (%)'
		                }
		            },
		            tooltip: {
		                formatter: function() {
							var tooltip = this.x +': '+ this.y.toFixed(2) +' %';
							if (this.point.name == 'Overall') {
								//tooltip+= '<br><br> Gain: '+portfolio._settledmyportfolio.data[this.point.name].sellbasis - portfolio._settledmyportfolio.data[this.point.name].costbasis + '<b></br>'
							} else {
								tooltip+= '<br><b>Gain: $'+(portfolio._settledmyportfolio.data[this.point.name].sellbasis - portfolio._settledmyportfolio.data[this.point.name].costbasis).toFixed(2) + '</b></br>'
							}

		                    return tooltip;

		                }
		            },
		            plotOptions: {
		                column: {
		                    pointPadding: 0.2,
		                    borderWidth: 0
		                }
		            },
	                series: [{
						name : 'Total',
		                data: data
		            }]
		        });
        } catch (e) {
            debugger;
        }
		//chart.legend.destroy();
		if (!avoidOverall) {
			keys.pop();
		}
	},

    //scrapper.scrape('http://finance.yahoo.com/q/ks?s=AAPL+Key+Statistics',null, '//*[@class="yfnc_datamodoutline1"]')

    getEarningsDates : function(callback) {
        callback = callback || NOOP;
        var baseUrl = 'http://finance.yahoo.com/q?s=INVN' ,
            xpath = '//*[@id="yfi_quote_summary_data"]' ,
        fns = []  ,
            that = this;

        //baseUrl.replace(/INFY/g,ticker.toUpperCase());
        var getEstimates = function() {
            var len = this._myportfolio.primaryKeys.length ,
                p =0 ,
               // fns = [] ,
                fnsString;
            for(;p<len;p++) {
                fns.push(
                    $.ajax({
                        type: "GET",
                        url: scrapper.buildScrapeUrl('http://finance.yahoo.com/q?s='+this._myportfolio.primaryKeys[p],xpath)
                    })
                )
            }
        //    return

        }

        getEstimates.call(this);
        var parseEarningsEstimate = function(results) {
            var date = _findValue(safeLookup(results, 'div.table.0.tbody.tr') , "Earnings Date" , "th.content" , "td.content");
            return date;
        }

        var parseDividendYield = function(results) {
            var dy = _findValue(safeLookup(results, 'div.table.1.tbody.tr') , "Div & Yield" , "th.content" , "td.content");
            return dy ;
        }

        var doneCallback = function() {
            var len , i  , json , sortedDates=[];
            if (arguments && (len=arguments.length)) {
                for (i=0 ; i<len ; i++) {
                    json = $.isArray(arguments[i]) ? arguments[i] : null;
                    json = $.isArray(json) ? json[0] : null;
                    if (typeof json === "object" && json.query && json.query.results) {
                        // we have a json object with an array of company info, cache it, and display suggestions
                        var results = json.query.results;
                        //console.log(results);
                        var url = $.isArray(json.query.diagnostics.url) ?  json.query.diagnostics.url[0] : json.query.diagnostics.url;
                        var ticker = url.content.split('=')[url.content.split('=').length -1];
                        var date = parseEarningsEstimate(results) , daysToGo = undefined , d;
                        if (date) {
                            date = date.trim();
                            d = Date.parse(date);

                            // is range?
                            if (!d && date.indexOf('-') !== -1) {
                                // pick earliest
                                date = date.split('-')[0];
                                date = date.trim();
                                d = Date.parse(date);
                            }

                            if (d) {
                                daysToGo = that.getDaysForEarnings(date);
                            }
                            console.log(ticker + '\'s Earning\'s Date = '+date + ' Days to go = '+daysToGo);

                            if (d) {
                                d = d.toString('d-MMM-yy');
                            }
                            portfolio._myportfolio.data[ticker]['Earnings'] = d;
                            sortedDates.push([ticker,d,daysToGo]);
                            sortedDates.sort(function(a, b) {return a[1] - b[1]})
                        }
                        var divYield = parseDividendYield(results) ;
                        portfolio._myportfolio.data[ticker]['yield'] = divYield;
                    }

                }
                //console.log(sortedDates);
                sortedDates.forEach(function(t) {
                   if (t[1]) {
                    console.log(t[0] + '\'s Earning\'s Date = '+t[1].toString('d-MMM-yy') + ' Days to go = '+t[2]);
                   }
                })
                callback();
            }
        }
        $.when.apply(this, fns).done(doneCallback)
    } ,

    getDaysForEarnings : function(earnings) {
        var date = earnings , daysToGo = undefined , d;
        if (date) {
            d = Date.parse(date);
            daysToGo = (d - Date.today())/(24*60*60*1000);
            //console.log('Days to go = '+daysToGo);
        }
        return daysToGo;
    },

    getInsiderMonkey : function(ticker,isFund) {
        scrapper.scrape('http://www.insidermonkey.com/search/all?x=7&y=11&q='+ticker, function(results) {
            var div = results.div;
            var url = !isFund ? safeLookup(div, 'a.href') || safeLookup(div , '0.a.href') : div[div.length - 1].a.href;
            var hedgeUrl = isFund ? url : url+'/hedge-funds/#/';
            scrapper.scrape(hedgeUrl, function(results) {
                var table = results.table.tbody.tr;
                var primaryKeys = [];
                var data = [];
                for (var x=0 ; x<results.table.tr.th.length;x++) {
                    primaryKeys.push(results.table.tr.th[x].p);
                }
                for (var x=0;x<table.length;x++) {
                    var item = table[x].td;
                    data[x] = {};
                    data[x][primaryKeys[0]] = item[0].p;
                    data[x][primaryKeys[1]] = {fund:item[1].div.a.content , link : item[1].div.a.href , manager:item[1].div.p};
                    data[x][primaryKeys[2]] = item[2].p;
                    data[x][primaryKeys[3]] = item[3].p;
                    data[x][primaryKeys[4]] = safeLookup(item[4], 'p.content');
                    data[x][primaryKeys[5]] = item[5].p;
                }
                console.dir(data);
                if (portfolio._myportfolio.data[ticker]) {
                    portfolio._myportfolio.data[ticker]['hedge'] = data;
                }
            }, '//*[@id="stock-holdings-table"]')
        } , '//*[@class="result"]')
    },

    getPrice : function(ticker , callback , afterhours , force) {
        callback = callback || NOOP;
        var url = 'http://www.nasdaq.com/symbol/'+ticker.toLowerCase();

        if (afterhours) {
            url = url+'/after-hours';
        } else {
            url = url+'/real-time';
        }

        //url = scrapper.buildScrapeUrl(url,'//*[@id="qwidget_lastsale"]');

        scrapper.scrape(url,function(results) {
            var data , sData;
            var price = _findValue(results.div.div,"qwidget_lastsale",'id','content');
            if (price) {
                price = price.split('$')[1];
            }
            var net_change = _findValue(results.div.div,"qwidget_netchange",'id','content');
            var net_change_percent = _findValue(results.div.div,"qwidget_percent",'id','content');
            var dir = _findValue(results.div.div,"qwidget-Red",'class','class') ;
            if (dir) {
                dir = -1;
                net_change = net_change * dir;
                net_change_percent = parseFloat(net_change_percent) * dir;
            }
            data = {
                price : price,
                change : net_change,
                change_percent : net_change_percent,
                up : dir !== -1
            }

            if ((sData=safeLookup(portfolio , '_myportfolio.data.ticker'))) {
                if (afterhours) {
                    sData.afterData = data;
                } else {
                   sData.liveData = data;
                }

           } else {
               if (!window.stocks) {
                   window.stocks = {};
               }
                if (!window.stocks[ticker]) {
                    window.stocks[ticker] = {};
                }
                if (afterhours) {
                    window.stocks[ticker].afterData = data;
                } else {
                    window.stocks[ticker].liveData = data;
                }
           }
            callback(data);
        },'//*[@id="qwidget_quote"]',force);

    },

    priceUpdater : function() {
        var rows = $('#folio').handsontable('countRows') ,
        regEx , ticker , afterhours , folio , hour = Date.now().getHours();
        for (var i=0;i<rows;i++) {

            afterhours = !isMarketOpen();
            ticker = $('#folio').handsontable('getDataAtCell' , i,0);
            regEx = new RegExp(/.*>([A-Z]+)<\/a>/i);
            ticker = regEx.exec(ticker)[1];
            this.getPrice(ticker , (function(rowIdx , tick) {return function(data) {
                folio = portfolio._myportfolio.data[tick];
                //console.log('callback row ='+rowIdx);
                if (afterhours) {
                    //data = data.afterData;
                    console.log(tick + ' price is ='+data.price);
                    myTable.fillSlot(rowIdx,5,(+data.price).toFixed(2));
                } else {
                    console.log(tick + ' price is ='+data.price);
                    //data = data.liveData;
                    myTable.fillSlot(rowIdx,1,(+data.price).toFixed(2));
                    myTable.fillSlot(rowIdx,2,(parseFloat(data.change_percent)).toFixed(2));
                    //that.fillSlot(rowIndex,4,(+data.change).toFixed(2));
                    var gain = 100*(((+data.price * +folio.shares) - folio.costbasis)/folio.costbasis);
                    console.log(tick + ' gain is ='+gain);
                    myTable.fillSlot(rowIdx,4,(gain).toFixed(2));
                }

            }})(i, ticker), afterhours,true)

        }
    }




	
	
	
	
})