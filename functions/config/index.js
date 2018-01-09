const functions = require('firebase-functions');
const path = require('path');

let config = {};
let fb = functions.config();

config.serviceKey = require('../serviceAccountKey.json');
config.phantomPath = path.resolve('./node_modules/phantomjs-prebuilt/lib/phantom/bin/phantomjs');
config.hostingURL = 'https://hello-firebase-ea30c.firebaseapp.com';
config.databaseURL = fb.firebase.databaseURL;
config.storageBucket = fb.firebase.storageBucket;

module.exports = config;
