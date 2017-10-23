var bodyParser = require('body-parser');
var request = require('request');

/*
* module that handle auth with BBM
*/

/*
* return client credential for bot
* check the db if it exists, otherwise, get from token server
*/


exports.getClientCredential = function (db,callback) {

  //check if we have access token, otherwise get it now
  if(db.get('clientcredential').size().value()==0) {
    console.log('getClientCredential from Token service');

    var fs = require('fs')
        , path = require('path')
        , certFile = path.resolve(__dirname, 'ssl/bbmmobilenews.com_thawte.crt')
        , keyFile = path.resolve(__dirname, 'ssl/bbmmobilenews.com_thawte.key')  ;
    //    , caFile = path.resolve(__dirname, 'ssl/ca.cert.pem');

    // Set the headers
    var headers = {
        'Accept': 'application/json',
         'Accept-Encoding': 'gzip',
         'Content-Type':"applicaiton/x-www-form-urlencoded",
      //   "Authorization: Basic ": new Buffer( process.env.username+ ':' + process.env.password ).toString('base64')
    }
    // Configure the request
    var options = {
        url: "https://auth-beta.bbm.blackberry.com:8443",
        method: 'POST',
        headers: headers,
        form: { grant_type:'client_credentials', scope:'bot'  },
        cert: fs.readFileSync(certFile),
        key: fs.readFileSync(keyFile),
        auth: {
          'user': process.env.username,
          'pass': process.env.password,
          'sendImmediately': true},


    }

    // Start the request
    request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          console.log ( "200");
          console.log (body);
           //store to db
           var cred = {access_token:body.access_token,refresh_token:body.refresh_token,expire_in:body.expires_in};
          db.get('clientcredential')
            .push(cred)
            .write();
            callback (cred);

        }
        else {
          console.log (response.statusCode);
          return callback (error);
        }

    })

  }
  else {

  }



  }
