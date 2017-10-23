/*
* module that handle auth with BBM
*/


var bodyParser = require('body-parser');
var request = require('request');
//init the db
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const adapter = new FileSync('db.json')
const db = low(adapter)

// Set some defaults
db.defaults({ clientcredential: [],tokens:[] })
  .write()


/**
* internal utils function
*/
  getReqOptions = function(url,form,username,password) {
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
      //  "Authorization": "Basic RHk2TDhTcDlRU2hXT1RxalNVOkhKR2NxT3c3b29TWnRmWU9XdkhkR1dpRk1WTGhyUVlwZzhQa3BJMlRpUWZh"
        "Authorization": "Basic " + new Buffer( username + ":" + password ).toString('base64')
    }
    // Configure the request
    var options = {
        url: url,
        method: 'POST',
        headers: headers,
        form: form,
        cert: fs.readFileSync(certFile),
        key: fs.readFileSync(keyFile),

    }
    return options;
  }


/*
* provide access token for app to make API call
* check from db, if, it's expired or not exist make new request from token server
*/
exports.getAccessToken = function (bbmid, callback) {


   if (db.get('tokens[0]').find({ bbmid:  bbmid }).size().value()) { //token not acquired before


   }
   else { //token acquired, check validity, if expired, make new request
     token = db.get('tokens[0]').find({ bbmid:  bbmid }).value();
     if (token && (  Date.now() >  token.ts  + (token.expires_in *1000))  )  {
       callback (token);
     }
     else {
       console.log('getAccessToken from Token service');

       var params = { grant_type:'client_credentials', scope:'bot'  }
       var url = "https://auth-beta.bbm.blackberry.com:8443/oauth/token";
       // Start the request
       request(getReqOptions(url,params,"Dy6L8Sp9QShWOTqjSU" ,"HJGcqOw7ooSZtfYOWvHdGWiFMVLhrQYpg8PkpI2TiQfa" ), function (error, response, body) {
           if (!error && response.statusCode == 200) {
             console.log ( "200");
             body = JSON.parse (body);
           //  console.log ( JSON.parse (body).access_token);
              //store to db
              var cred = {access_token:body.access_token,refresh_token:body.refresh_token,expire_in:body.expires_in,ts:Date.now()};
              console.log (cred);
             db.get('clientcredential')
               .push(cred)
               .write();
               callback (cred);

           }
           else {
             console.log (response );
              callback (error);
           }

       })

     }

   }


}


/*
* exchange for long lived token, and store it in db
*/
exports.exchangeToken = function (sltoken,callback) {



}

/*
* acquire client credential for bot
* check the db if it exists, otherwise, get from token server
*/
exports.getClientCredential = function (callback) {

  //check if we have access token, otherwise get it now
  if(db.get('clientcredential').size().value()==0) {
    console.log('getClientCredential from Token service');

    var params = { grant_type:'client_credentials', scope:'bot'  }
    var url = "https://auth-beta.bbm.blackberry.com:8443/oauth/token";
    // Start the request
    request(getReqOptions(url,params), function (error, response, body) {
        if (!error && response.statusCode == 200) {
          console.log ( "200");
          body = JSON.parse (body);
        //  console.log ( JSON.parse (body).access_token);
           //store to db
           var cred = {access_token:body.access_token,refresh_token:body.refresh_token,expire_in:body.expires_in,ts:Date.now()};
           console.log (cred);
          db.get('clientcredential')
            .push(cred)
            .write();
            callback (cred);

        }
        else {
          console.log (response );
           callback (error);
        }

    })

  }
  else {
    callback (  db.get('clientcredential[0]').value());
  }
  }


/**
*
*/
