const functions = require('firebase-functions');
const admin = require('firebase-admin');
const pdf = require('../node-html-pdf');
const config = require('../config')


exports.create = (url, filePath) => {
    //Create storage destination
    var bucket = admin.storage().bucket();
    var file = bucket.file(filePath);

    //Create pdf and save to file
    var options = {
      format: 'A4',
      phantomPath: config.phantomPath,
      phantomArgs:['--ignore-ssl-errors=yes', '--ssl-protocol=tlsv1', '--web-security=false'],
      renderDelay: 'manual'
    };

    return new Promise((resolve, reject) => {
      
      console.log('Creating pdf from:', url, options);
      
      pdf.create(url, options).toStream(function (err, stream) {
        
        if (err) {
          console.error('Failed to create pdf:', err.message, err.stack);
          return reject(err);
        }

        stream.pipe(file.createWriteStream())
          .on('error', err => {
            console.error('Failed to write pdf to storage:', err.message);
            return reject(err);
          })
          .on('finish', () => {
            return resolve(filePath);
          });
      });
    });

};
