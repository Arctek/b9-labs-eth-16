// CREDITS: https://ethereum.stackexchange.com/questions/15353/how-to-listen-for-contract-events-in-javascript-tests

var _ = require("lodash");
var Promise = require("bluebird");

module.exports = {
    assertEvent: function(contract, filter) {
        return new Promise((resolve, reject) => {
            var event = contract[filter.event]();
            event.watch();
            event.get((error, logs) => {
                var log = _.filter(logs, filter);
                if (log) {
                    resolve(log);
                } else {
                    throw Error("Failed to find filtered event for " + filter.event);
                }
            });
            event.stopWatching();
        });
    }
}