require('../lib/jQuery');
var amplify = require('../lib/amplify');
require('../js/utils/scrapper');
require('../js/portfolio');
var News = require('../js/utils/news');

$(document).ready(function() {
    scrapper = new Scrapper();
    portfolio = new Portfolio();
    hour = new Date().getHours();
    news = new News();
});
refresh = function() {
    amplify.clear();
    window.location = location.href;
}

updater = function() {
    if (portfolio) {
        portfolio.priceUpdater();
    }
}

