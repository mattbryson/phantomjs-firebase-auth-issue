//Firebase App
const functions = require('firebase-functions');
const admin = require('firebase-admin');

//Create our Express App to handle custom API
const express = require('express');
const cookieParser = require('cookie-parser')();
const bodyParser = require('body-parser');
const cors = require('cors')({ origin: true });
const config = require('../config');
const firebaseToken = require('./middleware/firebaseToken');
const pdf = require('../helpers/pdf');
const errors = require('./middleware/errors');


const app = express();


//Set up middleware for the express app
app.use(cors);
app.use(cookieParser);
app.use(bodyParser.json());
//app.use(firebaseToken.validate); //all routes must have valid token


app.get('/pdf', function (req, res, next) {

  let uid = 'custom-account-id';
  let customClaims = {
    role: 'pdf'
  };
  let path = 'file_'+Date.now()+'.pdf';
  let url = '';
  
  admin.auth()
    .createCustomToken(uid, customClaims)
    .then(token => {
      token = encodeURIComponent(token);
      url = `${config.hostingURL}?token=${token}&auth=${req.query.auth}`;
      return pdf.create(url, path);
    })
    .then(() => {
      res.json({ path: path, url:url });
    })
    .catch(error => {
      console.error(error);
      next(error);
    });
})
 
//Catch all error handling
app.use(errors.sendNotFound);
app.use(errors.logErrors);
app.use(errors.errorHandler);

//export the express app as our custom api
module.exports = functions.https.onRequest(app);