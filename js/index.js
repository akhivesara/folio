$(document).ready(function() {
    scrapper = new Scrapper();
    portfolio = new Portfolio();
    hour = new Date().getHours();
    news = new util.News();
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

