const request = require('request-promise-native')

const apiUtil = require('./lib/api-util');
const fs = require('fs');
let Emitter = require('events');
let config = require('./events/config');

const currentsOnDemand = require('./lib/currents-on-demand');
const jp = require('jsonpath');
const weatherAlertHeadlines = require('./lib/weather-alert-headlines')
const weatherAlertDetails = require('./lib/weather-alert-details')
const tropicalForecastProjectedPath = require('./lib/tropical-forecast-projected-path')
const dailyForecast = require('./lib/daily-forecast')
const severeWeatherPower = require('./lib/severe-weather-power-disruption-index')

let alertCounter = 0;
let alertsFonud = [];
let alertEventEmitter = new Emitter();
const writable = fs.createWriteStream(__dirname + config.alerts.fileLocation, 'utf8');

const handleAlertEmitter = function(msg){
  console.log("&&&&&&&&&&&&&&  " + msg);
  console.log("Weather alerts are aggregated in the file");
  try{
    writable.write(JSON.stringify(alertsFonud));
  }catch(e){
    handleFail(e);
  }
};

const handleFail = function (err) {
  // API call failed...
  console.error(err.hasOwnProperty('message') ? err.message : err)
};


// Main Event Emitters Listener
alertEventEmitter.on(config.events.alertCODDone, (msg)=>handleAlertEmitter(msg));
writable.on('error', function(e) {handleFail(e)});

const callWeatherAlertHeadlines = function (lat, lon) {
  let options = weatherAlertHeadlines.requestOptions(lat, lon)

  request(options)
    .then(parsedBody => {
      console.log(parsedBody);
      let detailKeys = weatherAlertHeadlines.handleResponse(parsedBody)
      if (detailKeys && detailKeys.length > 0) {
        detailKeys.forEach(detailKey => {
          callWeatherAlertDetails(detailKey)
        })
      }
    })
    .catch(handleFail)
}

const callCurrentsOnDemand = function(alertEvent){
  let options = currentsOnDemand.requestOptions(alertEvent.latitude, alertEvent.longitude);
  request(options)
    .then(parsedBody => {
      let weatherTempData = currentsOnDemand.handleResponse(parsedBody);
      let tempNode = jp.nodes(alertsFonud, `$[?(@.detailKey=="${alertEvent.detailKey}")]`);
      tempNode[0].value.cod=weatherTempData;
      ++alertCounter;
      if(alertsFonud.length == alertCounter){
        alertEventEmitter.emit(config.events.alertCODDone, 'Done');
        alertCounter=0;
      }
    })
    .catch(handleFail)
};

const callWeatherAlertHeadlinesByState = function (state, country, next) {
  let options = weatherAlertHeadlines.requestByStateOptions(state,country,next);
  request(options)
    .then(parsedBody => {
      let alertsToWorkOn = weatherAlertHeadlines.handleResponseFiltered(parsedBody);
      // alertsFonud.push(JSON.parse(JSON.stringify(alertsToWorkOn)));
      alertsFonud = JSON.parse(JSON.stringify(alertsToWorkOn));
      if(alertsToWorkOn){
        alertsToWorkOn.forEach( alert =>{
          // console.log(alert);
          callCurrentsOnDemand(alert);
        });
      }
      // if (detailKeys && detailKeys.length > 0) {
      //   detailKeys.forEach(detailKey => {
      //     callWeatherAlertDetails(detailKey)
      //   })
      // }
    })
    .catch(handleFail)
}

const callWeatherAlertDetails = function (detailKey) {
  let options = weatherAlertDetails.requestOptions(detailKey)

  request(options)
    .then(weatherAlertDetails.handleResponse)
    .catch(handleFail)
}

const callTropicalForecastProjectedPath = function () {
  let options = tropicalForecastProjectedPath.requestOptions()

  request(options)
    .then(tropicalForecastProjectedPath.handleResponse)
    .catch(handleFail)
}

const callDailyForecast = function (lat, lon) {
  let options = dailyForecast.requestOptions(lat, lon)

  request(options)
    .then(dailyForecast.handleResponse)
    .catch(handleFail)
}

const callSevereWeatherPowerDisruption = function (lat, lon) {
  let options = severeWeatherPower.requestOptions(lat, lon)

  request(options)
    .then(severeWeatherPower.handleResponse)
    .catch(handleFail)
};

// Configure the locations (lat/lon) you want to use
const loc = {
  boston: { lat: '42.3600', lon: '-71.06536' }, // Boston, MA, United States
  raleigh: { lat: '35.843686', lon: '-78.78548' }, // Raleigh, NC, United States
  losangeles: { lat: '34.040873', lon: '-118.482745' }, // Los Angeles, CA, United States
  lakecity: { lat: '44.4494119', lon: '-92.2668435' }, // Lake CIty, MN, United States
  newyork: { lat: '40.742089', lon: '-73.987908' }, // New York, NY, United States
  hawaii: { lat: '33.40', lon: '-83.42' }, // Hawaii, United States
  puntacana: { lat: '18.57001', lon: '-68.36907' }, // Punta Cana, Dominican Republic
  jakarta: { lat: '-5.7759349', lon: '106.1161341' } // Jakarta, Indonesia
}

const states = {
  california : {stateCode: 'CA', countryCode: 'US'}
};
/**
 * Make a single API call
 */
// callDailyForecast(loc.raleigh.lat, loc.raleigh.lon)
// callWeatherAlertHeadlines(loc.lakecity.lat, loc.lakecity.lon)
callWeatherAlertHeadlinesByState(states.california.stateCode,states.california.countryCode, null);
// callSevereWeatherPowerDisruption(loc.jakarta.lat, loc.jakarta.lon)
// callTropicalForecastProjectedPath()
// callWeatherAlertDetails('06439e88-320a-3722-ae90-097484ff2277')

// Next API Event Emitters Listener
apiUtil.nextAPICallEmitter.on(config.events.nextAPICall, (next)=>callWeatherAlertHeadlinesByState(states.california.stateCode,states.california.countryCode, next));


/**
 * Setting up a job to look for weather alert headlines every 10 minutes
 */
const interval = 1000 * 60 * 10 // 10 minutes

setInterval(() => {
  // callWeatherAlertHeadlines(loc.lakecity.lat, loc.lakecity.lon)
  callWeatherAlertHeadlinesByState(states.california.stateCode,states.california.countryCode, null);
}, interval)
