const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const logger = require('morgan');

// Common Error Logger for app
function logErrors(err, req, res, next){
    console.error(err.stack);
    next(err);
};

module.exports = function(app){
    app.use(logger('combined'));

    app.use(bodyParser.urlencoded({
        extended: true
      }));
    app.use(bodyParser.json());
    
    app.use(methodOverride());

    app.use(logErrors);
};
