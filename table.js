var myTable = (function() {

    var	_table = null ,
        _data = [
            //["Ticker", "Price" , "Change" , "Shares" , "Day\'s Gain" , "Overall Gain",  "After Hour/'s" , "Earnings" , "Dividend" , "Price Target" , "P/E"],
            //["", "", ""]
        ];

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
                    {},  // ticker
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
                        case 0:
                            return "<b class='columnSorting'>Ticker</b>";
                        case 1:
                            return "<b>Price</b>";
                        case 2:
                            return "<b>Change %</b>";
                        case 3:
                            return "<b>Shares</b>";
                        case 4:
                        //    return "<b>Day\'s Gain</b>";
                        //case 5:
                            return "<b>Overall Gain %</b>";
                        case 5:
                            return "<b>After Hour\'s</b>";
                        case 6:
                            return "<b>Earnings</b>";
                        case 7:
                            return "<b>Dividend</b>";
                        case 8:
                            return "<b>Price Target</b>";
                    }
                }
            });

            primaryKeys.forEach(function(ticker) {
                var data = folioData[ticker];
                that.fillSlot(rowIndex,0,ticker);
                that.fillSlot(rowIndex,1,+data.quote);
                that.fillSlot(rowIndex,2,(+data.change).toFixed(2));
                that.fillSlot(rowIndex,3,+data.shares);
                //that.fillSlot(rowIndex,4,(+data.change).toFixed(2));
                that.fillSlot(rowIndex,4,(+data.gain).toFixed(2));
                that.fillSlot(rowIndex,5,(+data.aft_quote).toFixed(2));
                that.fillSlot(rowIndex,6,data.Earnings);
                that.fillSlot(rowIndex,7,data.yield);
                that.fillSlot(rowIndex,8,data.pricetarget);
                rowIndex++;
            })

            // scrapper calls
        },

        fillBackgroundColor : function(row,col,color) {
            $(tableId).handsontable('getCell',row,col).style['background-color'] = color;
        },

        fillSlot : function(row,col,value) {
            $(tableId).handsontable('setDataAtCell', row, col, value);
        }
    }
})();