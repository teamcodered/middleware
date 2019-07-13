/**
 * Currents on Demand - Weather API
 *
 * - https://weather.com/swagger-docs/sun/v3/sunV3CurrentsOnDemand.json
 *
 * The Weather Current Conditions are generated on demand from The Weather Company (TWC) Currents On Demand (COD) system. 
 * The COD data feed returns a similar set of data elements as traditional site-based observations.
 * The API provides information on temperature, precipitation, wind, barometric pressure, visibility, ultraviolet (UV) radiation, and other related weather observations
 *  elements as well as date/time, weather icon codes and phrases. 
 * 
 * The COD is gridded across the globe at a 4KM geocode resolution.
 *
 * Base URL: api.weather.com/v3
 * Endpoint: /wx/observations/current
 */

const apiUtil = require('./api-util');

exports.requestOptions = function (lat, lon) {
    let options = apiUtil.defaultParams();
  
    options['uri'] = `${apiUtil.HOST}/v3/wx/observations/current`;
    options.qs['geocode'] = `${lat},${lon}`;
    options.qs['units'] = 'e';
    options.qs['format'] = 'json';
  
    return options;
};


exports.handleResponse = function (res) {
    if (res) {
      // Get weather observations by location
      console.log(`current weather data as of now ${res.validTimeLocal}: temprature ${res.temperature} - High of ${res.temperatureMax24Hour}, Low of ${res.temperatureMin24Hour}`)
    } else {
      console.log('weather data is not avaliable ')
    }
  
    return res;
};