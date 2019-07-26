var configValues = require('./config');

module.exports = {
    getAlertsSummaryENDPOINT: function() {
        return configValues.alertsSummary_ENDPOINT;
    },
    getAlertsDetailsENDPOINT: function() {
        return configValues.alertsDetail_ENDPOINT;
    },
    getConfigureAlertsENDPOINT: function() {
        return configValues.configureFrequency_ENDPOINT;
    },
    getStopFrequentAlertsENDPOINT: function() {
        return configValues.stopFrequency_ENDPOINT;
    }
}