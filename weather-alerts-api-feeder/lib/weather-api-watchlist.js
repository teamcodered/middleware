const alertsClassifications = ['Miscellaneous', 'Temperature', 'Thunderstorm', 'Visibility'];
const phenomenaTypes = ['TFI','FW', 'TSG', 'TSL', 'EH', 'HT', 'TSA', 'MS', 'SM'];
const categoryCodeSupported = [2,3,5,6];
const coveredSignificanceCodes = ['A', 'L', 'W', 'Y', 'R'];
const messageTypeCode = [1,2];
const urgencyCodeThreshold = 3; // any alert <= ${this value} => 3 would be watched
const severityCodeThreshold = 3;// any alert <= ${this value} => 3 would be watched
const certaintyCodeThreshold = 3;// any alert <= ${this value} => 3 would be watched

const alertEventsDimensions = {
    classifications: alertsClassifications,
    phenomena: phenomenaTypes,
    categories: categoryCodeSupported,
    significance: coveredSignificanceCodes,
    msgTypes: messageTypeCode,
    urgencyCodes: urgencyCodeThreshold,
    severityCodes: severityCodeThreshold,
    certaintyCodes: certaintyCodeThreshold
};

// Basic initial filtering will be done here, the rest will be done on the analytics DB
exports.filterAlertEventToFireRelated = function(alertEvents){
    console.log(alertEvents.length);
    let alerts = [];
    alerts = alertEvents.filter(alert => 
       coveredSignificanceCodes.includes(alert.significance) && phenomenaTypes.includes(alert.phenomena)
    )
    console.log(alerts.length);
    return alerts;
};

exports.supportedAlertEventTypes = alertEventsDimensions;