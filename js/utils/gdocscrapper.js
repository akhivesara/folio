require('./Class');
require('./UrlParams');
var amplify = require('../../lib/amplify');

GoogleScrapper = new Class.create({
	
	baseUrl : 'https://spreadsheets.google.com/feeds/list/0AvQ4VSFhLa1bdF84LThaN1k5aV9uTkpodFZFOFJlcEE/1/public/values?alt=json-in-script&callback=listEntries',
	
	init : function(key , primaryKey) {
		if (!key) {
            var gkp = urlParams.get('p') , gk;
            if (gkp === 'ak') {
                gk = '0AvQ4VSFhLa1bdF84LThaN1k5aV9uTkpodFZFOFJlcEE';
            } else if (gkp === 'ag') {
                gk ='';
            }
			this.url = 'https://spreadsheets.google.com/feeds/list/'+gk+'/1/public/values?alt=json-in-script&callback=?'
			this.settledUrl = 'https://spreadsheets.google.com/feeds/list/'+gk+'/2/public/values?alt=json-in-script&callback=?'
		}
		this._primaryKey = primaryKey || 'symbol';
		//https://spreadsheets.google.com/feeds/cell/0AvQ4VSFhLa1bdF84LThaN1k5aV9uTkpodFZFOFJlcEE/worksheet/public/basic?alt=json-in-script&callback=myFunc	
	},

	fetch :function(url , callback) {
		var that = this , storedData;
		url = url || this.url;
		callback = callback || function() {};
		storedData = amplify.store(url);
		if (!storedData) {
			$.getJSON(url, {} , function(json) {
				var parsedData = that.googleEntries(json);
				amplify.store(url,parsedData);				
				callback(parsedData);
			});
		} else {
			callback(storedData);			
		}
	},
	
	googleEntries :function(json) {
		var primaryKey = [];
		var googleDoc = {};
		//window.data = json;
		var value = '$t'
		var gdata = json.feed.entry;
		var total = gdata.length;
		var first = gdata[0].content[value];
		var section  = first.split(',');
		var columns = [];

        // parse the column keys

        for (var i in json.feed.entry[0]) {
            if (i && i.indexOf('gsx$') === 0) {
                console.log(i);
                columns.push(i.split('gsx$')[1]);
            }
        }



/*
        for (var i=0;i<section.length;i++) {
			var s = section[i];
			columns.push(s.split(':')[0].trim());
		}
*/


		if (this._primaryKey && columns.indexOf(this._primaryKey) === -1) {
			columns.push(this._primaryKey);
		}
		
		//console.log('Data Cols = '+JSON.stringify(columns));
		for (var i=0;i<total;i++) {
			var feed = gdata[i];
			if (this._primaryKey) {
				primaryKey.push(feed['gsx$'+this._primaryKey][value]);				
			} else {
				primaryKey.push(feed['gsx$'+columns[0]][value]);
			}
			if (this._primaryKey) {
				googleDoc[feed['gsx$'+this._primaryKey][value]] = {};
			} else {
				googleDoc[feed['gsx$'+columns[0]][value]] = {};
			}
			for (var j=0 ; j<columns.length;j++) {
				if (this._primaryKey) {
					googleDoc[feed['gsx$'+this._primaryKey][value]][columns[j]] = feed['gsx$'+columns[j]][value];
				} else {
					googleDoc[feed['gsx$'+columns[0]][value]][columns[j]] = feed['gsx$'+columns[j]][value];					
				}
				//console.log('Col = '+columns[j] +' Value ='+ feed['gsx$'+columns[j]][value]);
			}
		}
		return {primaryKeys : primaryKey , columns : columns ,data : googleDoc , entries : gdata};
	}

});