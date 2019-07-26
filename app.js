// Load Modules for handlling HTTP Requests.
const request = require('request-promise-native');
const createError = require('http-errors');
const setupHTTP = require('./middleware/global-handlers');
let intervalObjectReference = null;
// const zlib = require('zlib');
// const gzip = zlib.createGzip();

// Load Modules for Working with Files and Events
const fs = require('fs');
const path = require('path');
let Emitter = require('events');

// Load Custom Modules for Configuring the Application
const config = require('./config');
const eventsConfig = require('./events/config');
const apiUtil = require('./lib/api-util');

// Express Framework side of the app
const express = require('express');
const app = express();
const portNumber = process.env.PORT || 3000;

//  -- View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
// -- View Static Resources
app.use(express.static(path.join(__dirname, 'public')));
setupHTTP(app);

// Load Extrax modules for playing with complex json objects
const jp = require('jsonpath');

// Load embedded modules for working with external Weather APIs
const currentsOnDemand = require('./lib/currents-on-demand');
const weatherAlertHeadlines = require('./lib/weather-alert-headlines');
const weatherAlertDetails = require('./lib/weather-alert-details');

// Initiate global variables 
let alertCounter = 0;
let alertsFonud = [];
let alertEventEmitter = new Emitter();
/**
 * Setting up a job to look for weather alert headlines every 10 minutes
 */
let interval = 1000 * 60 * 60 // 60 minutes as default value


const handleFail = function (err) {
  // API call failed...
  console.error(err.hasOwnProperty('message') ? err.message : err);

};


const handleAlertEmitter = function(msg){
  fs.unlinkSync(path.join(__dirname,eventsConfig.alerts.fileLocation));
  console.log("===== File is cleared =====");
  const writable = fs.createWriteStream(path.join(__dirname,eventsConfig.alerts.fileLocation), 'utf8');
  console.log("Auto generated message from ON DEMAND service layer " + msg);
  try{
    writable.write(JSON.stringify(alertsFonud));
    console.log("======= Weather alerts are aggregated in the file =======");
  }catch(e){
    handleFail(e);
  }
  writable.on('error', function(e) {handleFail(e)});
};

// Main Event Emitters Listener
alertEventEmitter.on(eventsConfig.events.alertCODDone, (msg)=>handleAlertEmitter(msg));


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
        alertEventEmitter.emit(eventsConfig.events.alertCODDone, 'Done');
        alertCounter=0;
      }
    })
    .catch(handleFail)
};

const callWeatherAlertHeadlinesByState =  async function (state, country, next) {
  let options = weatherAlertHeadlines.requestByStateOptions(state,country,next);
  
  await request(options)
    .then(async parsedBody => {
        let alertsToWorkOn = await weatherAlertHeadlines.handleResponseFiltered(parsedBody);
        // alertsFonud.push(JSON.parse(JSON.stringify(alertsToWorkOn)));
        alertsFonud = await JSON.parse(JSON.stringify(alertsToWorkOn));
        
         if(alertsToWorkOn){
           alertsToWorkOn.forEach(alert =>{
            callCurrentsOnDemand(alert);
          });
        }
      
      return alertsFonud;
      // if (detailKeys && detailKeys.length > 0) {
      //   detailKeys.forEach(detailKey => {
      //     callWeatherAlertDetails(detailKey)
      //   })
      // }
    })
    .catch(handleFail);
  return alertsFonud;
};

const callWeatherAlertDetails = function (detailKey) {
  let options = weatherAlertDetails.requestOptions(detailKey)

  request(options)
    .then(weatherAlertDetails.handleResponse)
    .catch(handleFail)
}


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

// Next API Event Emitters Listener
apiUtil.nextAPICallEmitter.on(eventsConfig.events.nextAPICall, (next)=>callWeatherAlertHeadlinesByState(states.california.stateCode,states.california.countryCode, next));

app.get(config.getAlertsSummaryENDPOINT(), async (request, response) => {
  let alerts = await callWeatherAlertHeadlinesByState(states.california.stateCode,states.california.countryCode, null);
  response.send(alerts);
});

app.get(config.getAlertsDetailsENDPOINT(), (request, response) => {
  // const readable = fs.createReadStream(path.join(__dirname, eventsConfig.alerts.fileLocation), { encoding: 'utf8', highWaterMark: 16 * 1024 });
  response.setHeader('Content-Type', 'application/json')
  const readable = fs.readFileSync(path.join(__dirname, eventsConfig.alerts.fileLocation), 'utf8');
  // let alertsData = [];
  // readable.on('data', function(chunk) {
    
  // });
  // readable.on('open', function () {
  //   readable.pipe(response);
  // });
  // readable.pipe(response);
  response.json(JSON.parse(readable));
});

app.post(config.getConfigureAlertsENDPOINT(), (request, response, next) => {
  const postOutput = {'status': 'success'};
  try{
    let intervalInput = request.body.interval;
    if(intervalInput != undefined && intervalInput != 0){
      interval = 1000 * 60 * intervalInput;
      postOutput.intervalText = "The service will be frequently executed every " + intervalInput + "-minute"; 
      postOutput.interval = interval;
      postOutput.intervalType = "seconds";
      intervalObjectReference = setInterval(() => {
        callWeatherAlertHeadlinesByState(states.california.stateCode,states.california.countryCode, null);
      }, interval)
      response.status(200);
    }else{
      postOutput.status = 'disabled';
      postOutput.intervalText = "The service won't be running on frequent basis since the interval config is missing";
      postOutput.interval = 'NA';
      // const errorCode = new createError.BadRequest();
      response.status(400);
    }
  }catch(error){
    postOutput.status = "failed";
    postOutput.errorMessage = error.message;
    response.status(500);
    // throw new Error('Required');
    // next(createError(500),postOutput);
  }
  response.json(postOutput);
});

app.post(config.getStopFrequentAlertsENDPOINT(), (request,response,next)=>{
  const postOutput = {'status': 'success'};
  try{
    clearInterval(intervalObjectReference);
    postOutput.message = "Frequent Alerts Updates have been disabled";
    response.status(200);
  }catch(e){
    postOutput.status = "failed";
    postOutput.errorMessage = error.message;
    response.status(500);
  }
  response.json(postOutput);
});


// Initiate the file with list of alerts
callWeatherAlertHeadlinesByState(states.california.stateCode,states.california.countryCode, null);

// Catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// Generic Error Handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  // Render the error page
  res.status(err.status || 500);
  res.render('error');
});


// Initiate Middleware API Server
app.listen(portNumber);