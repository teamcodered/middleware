exports.supportedAlertEventTypes = function (){
    const alertsClassifications = ['Miscellaneous', 'Temperature', 'Thunderstorm', 'Visibility'];
    const phenomenaTypes = ['TFI','FW', 'TSG', 'TSL', 'EH', 'HT', 'TSA', 'MS', 'SM'];
    const categoryCodeSupported = [2,3,5,6];
    const coveredSignificanceCodes = ['A', 'L', 'W', 'Y'];
    const messageTypeCode = [1,2];
    const urgencyCodeThreshold = 3; // any alert <= ${this value} => 3 would be watched
    const severityCodeThreshold = 3;// any alert <= ${this value} => 3 would be watched
    const certaintyCodeThreshold = 3;// any alert <= ${this value} => 3 would be watched
    
    alertEventsDimensions = {
        classifications: alertsClassifications,
        phenomena: phenomenaTypes,
        categories: categoryCodeSupported,
        significance: coveredSignificanceCodes,
        msgTypes: messageTypeCode,
        urgencyCodes: urgencyCodeThreshold,
        severityCodes: severityCodeThreshold,
        certaintyCodes: certaintyCodeThreshold
    };

    return alertEventsDimensions;
}