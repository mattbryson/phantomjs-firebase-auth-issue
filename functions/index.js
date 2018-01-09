//Firebase App set up
const functions = require('firebase-functions');
const admin = require('firebase-admin');

const config = require('./config');

admin.initializeApp({
  credential: admin.credential.cert(config.serviceKey),
  databaseURL: config.databaseURL,
  storageBucket: config.storageBucket
});


//Expose our custom Express API app
exports.api = require('./api');
