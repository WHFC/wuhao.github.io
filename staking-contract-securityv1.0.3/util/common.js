module.exports.formatSymbol = function(symbol) {
    if (symbol == 'WETH') {
        return 'ETH';
    } else if (symbol == 'WHT') {
        return 'HT';
    } else if (symbol == 'WBNB') {
        return 'BNB';
    } else if (symbol == 'BTCB') {
        return 'BTC';
    } else {
        return symbol;
    }
}
