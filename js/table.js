var Handsontable = require('../lib/jquery.handsontable.full');

var myTable = (function() {

    var	_table = null ,
        _data = [
            //["Ticker", "Price" , "Change" , "Shares" , "Day\'s Gain" , "Overall Gain",  "After Hour/'s" , "Earnings" , "Dividend" , "Price Target" , "P/E"],
            //["", "", ""]
        ];




    var COLS = {
        TICKER : 0,
        PRICE : 1,
        DAY_CHANGE : 2,
        SHARES : 3,
        GAIN_LOSS : 4,
        AFTER_HOURS : 5,
        EARNINGS_DATE : 6,
        DIVIDEND_YIELD : 7,
        PRICE_TARGET : 8
    };

    var tableId = "#folio" ;
    return {

        current : {},

        clear : function() {
            var rows = $(tableId).handsontable('countRows') ,
                cols = $(tableId).handsontable('countCols') ,
                r = 0 , c = 0;
            for (; r < rows;r++) {
                for (c=0;c < cols ; c++) {
                    this.fillBackgroundColor(r,c,'');
                    //$("#evaluationTable").handsontable('getCell',i,c).style['background-color'] = '';
                }
            }
            this.create(_data);
        },

        create : function(data) {
            var folioData = portfolio._myportfolio.data ,
                primaryKeys = portfolio._myportfolio.primaryKeys ,
                that = this  ,
                rowIndex = 0;

            _table = $(tableId).handsontable({
                data: data || _data,
                startRows: primaryKeys.length,
                stretchH : 'hybrid' ,
                stretchV : 'hybrid',
                columnSorting:true ,
                colHeaders: true,
                columns: [
                    {type:'numeric'},  // ticker
                    {type: 'numeric'}, // price
                    {type: 'numeric'},  // change
                    {type: 'numeric'},  //shares
                    //{type: 'numeric'},   //day's gain
                    {type: 'numeric'},   // overall gain
                    {}, //after hours
                    {type:'custom' , sortFunction : function(a,b) {
                        var d1 = $.isNumeric(a) ? a : Date.parse(a)
                            , d2 = $.isNumeric(b) ? b : Date.parse(b) ,
                            daysToGo1 = $.isNumeric(a) ? a : (d1 - Date.today())/(24*60*60*1000) ,
                            daysToGo2 = $.isNumeric(b) ? b : (d2 - Date.today())/(24*60*60*1000);
                            return {a:daysToGo1 , b : daysToGo2};
                    }
                    }, // earnings
                    {type: 'numeric'}, //yield
                    {} // pricetarget
                ],
                colHeaders: function (col) {
                    switch (col) {
                        case COLS.TICKER:
                            return "<b class='columnSorting'>Ticker</b>";
                        case COLS.PRICE:
                            return "<b>Price</b>";
                        case COLS.DAY_CHANGE:
                            return "<b>%</b>";
                        case COLS.SHARES:
                            return "<b>Shares</b>";
                        case COLS.GAIN_LOSS:
                            return "<b>Gain %</b>";
                        case COLS.AFTER_HOURS:
                            return "<b>After Hour\'s</b>";
                        case COLS.EARNINGS_DATE:
                            return "<b>Earnings</b>";
                        case COLS.DIVIDEND_YIELD:
                            return "<b>Dividend</b>";
                        case COLS.PRICE_TARGET:
                            return "<b>Price Target</b>";
                    }
                },
                cells: function (row, col, prop) {
                    var cellProperties = {};
                    if (col === COLS.TICKER || _table.handsontable('getData')[row][col] === 'readOnly') {
                        cellProperties.readOnly = true; //make cell read-only if it is first row or the text reads 'readOnly'
                        if (col === COLS.TICKER) {
                            cellProperties.type = {
                                renderer: that.tickerRenderer
                            }
                        }
                    } else {
                        cellProperties.type = {
                            renderer: that.negativeValueRenderer
                        }
                    }
                    return cellProperties;
                }
            });

            primaryKeys.forEach(function(ticker) {
                var data = folioData[ticker];
                var u = 'http://ashishkhivesara.com/finance?s='+ticker;
                that.fillSlot(rowIndex,COLS.TICKER,"<a href='"+u+"' target='_blank'>"+ticker+"</a>");
                that.fillSlot(rowIndex,COLS.PRICE,+data.quote);
                that.fillSlot(rowIndex,COLS.DAY_CHANGE,(+data.change).toFixed(2));
                that.fillSlot(rowIndex,COLS.SHARES,+data.shares);
                //that.fillSlot(rowIndex,4,(+data.change).toFixed(2));
                that.fillSlot(rowIndex,COLS.GAIN_LOSS,(+data.gain).toFixed(2));
                that.fillSlot(rowIndex,COLS.AFTER_HOURS,(+data.aft_quote).toFixed(2));
                that.fillSlot(rowIndex,COLS.EARNINGS_DATE,data.Earnings);
                that.fillSlot(rowIndex,COLS.DIVIDEND_YIELD,data.yield);
                that.fillSlot(rowIndex,COLS.PRICE_TARGET,data.pricetarget);
                rowIndex++;
            })

            // scrapper calls
        },

        fillBackgroundColor : function(row,col,color) {
            $(tableId).handsontable('getCell',row,col).style['background-color'] = color;
        },

        fillSlot : function(row,col,value) {
            $(tableId).handsontable('setDataAtCell', row, col, value);
        },

        tickerRenderer : function (instance, td, row, col, prop, value, cellProperties) {
            var escaped = Handsontable.helper.stringify(value);
            escaped = strip_tags(escaped, '<a>'); //be sure you only allow certain HTML tags to avoid XSS threats (you should also remove unwanted HTML attributes)
            td.innerHTML = escaped;
            return td;
        },

        negativeValueRenderer : function(instance, td, row, col, prop, value, cellProperties) {

            if (!value || value == 'NaN' || value == 'N/A') {
                value='';
                td.style.background = '#EEE';
            }

            if (col === COLS.PRICE || col === COLS.SHARES || col === COLS.EARNINGS_DATE || col === COLS.DIVIDEND_YIELD) {
                Handsontable.TextCell.renderer.apply(this, arguments);
                return;
            }
            if (col === COLS.TICKER) {
                td.style['font-weight'] = 'bold';
                td.style['font-style'] = 'italic';
                Handsontable.TextCell.renderer.apply(this, arguments);
                return;
            }
            if (col === COLS.AFTER_HOURS) {

                var lastQuote = _table.handsontable('getCell', row, 1).textContent //|| _table.handsontable('getData')[row][1];
                if (value < lastQuote) {
                    td.className = 'negative'; //add class "negative"
                    Handsontable.TextCell.renderer.apply(this, arguments);
                } else if (value > lastQuote) {
                    td.className = 'positive';
                    Handsontable.TextCell.renderer.apply(this, arguments);
                }

                return;
            }

            if (col === COLS.PRICE_TARGET) {
                var lastQuote = _table.handsontable('getCell', row, 1).textContent  //|| _table.handsontable('getData')[row][1];
                var afterQuote = _table.handsontable('getCell', row, 5).textContent //|| _table.handsontable('getData')[row][5];
                if (value) {
                    if (+value <= +lastQuote || +value<=+afterQuote) {
                        td.className = 'target';
                    }
                }
                Handsontable.TextCell.renderer.apply(this, arguments);
                return;
            }

            if (value < 0) { //if row contains negative number
                td.className = 'negative'; //add class "negative"
            } else {
                td.className = 'positive';
            }

            Handsontable.TextCell.renderer.apply(this, arguments);
        }
    }
})();

module.exports = myTable;