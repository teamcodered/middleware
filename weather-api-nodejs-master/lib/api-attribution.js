let attributionTemplateText = "Issued by <Office Name>  - <Office Admin District Code>, <Office Country Code>, <Source>, <Disclaimer>.";

exports.generateAttribution = function(officeName, officeAdminDistrictCode, officeCountryCode, source, disclaimer){
    // let attributionText = attributionTemplateText.replace()
    if(!disclaimer)
        disclaimer = 'no disclaimer as of the moment';
    let attributionText = `Issued by ${officeName}  - ${officeAdminDistrictCode}, ${officeCountryCode}, ${source}, ${disclaimer}`;
    return attributionText;
};