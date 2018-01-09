/**
 * Error Handling
 * Common reponse error objects and a generic middleware error handler to log and respond
 */

const _ = require('lodash');

//Respponse Error objects
const unauthorized = new Error('Unauthorized');
unauthorized.status = 401;

const forbidden = new Error('Forbidden');
forbidden.status = 403;

const notFound = new Error('Not Found');
notFound.status = 404;


exports.forbidden = forbidden;
exports.unauthorized = unauthorized;
exports.notFound = notFound;



/**
 * 404 route
 */
exports.sendNotFound = (req, res, next) => {
  next(exports.notFound);
};

/**
 * Error handler to log errors
 */
exports.logErrors = (err, req, res, next) => {
  console.error('ERROR:', err.message, err.stack);
  next(err);
};

/**
 * Error hndler to return error
 */
exports.errorHandler = (err, req, res, next) => {

  //Errorify string error messages
  if (_.isString(err)) {
    err = new Error(err);
  }

  var data = { error: err.message || 'An undefined error occurred' };
  res.status(err.status || 400);

  if (req.accepts('json')) {
    res.json(data);
  } else {
    res.send(`Error: ${data.error}`);
  }


};