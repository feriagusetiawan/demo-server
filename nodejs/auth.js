/*
* module that handle auth with BBM
*/


var bodyParser = require('body-parser');
var request = require('request');


var utils = require('./utils');

//init the db
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const adapter = new FileSync('db.json')
const db = low(adapter)

// Set some defaults
db.defaults(
    { clientcredential: [],  //client credential for chatbot
      token:[]   // token for API call, one record for each bbmId
    }).write()


/**
* internal utils function

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
        "Authorization": "Basic " + new Buffer( process.env.username + ":" + process.env.password ).toString('base64')
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

*/

/*
* acquire client credential for bot
* check the db if it exists, otherwise, get from token server
*/
exports.getClientCredential = function (callback) {

    console.log ('getting client cred... ');

  //check if we have access token, otherwise get it now
  if(db.get('clientcredential').size().value()==0) {
    console.log('getClientCredential from Token service');

    var params = { grant_type:'client_credentials', scope:'bot'  }
    var url = "https://auth-beta.bbm.blackberry.com:8443/oauth/token";
    // Start the request
    request(utils.getReqOptionsForTokenService(url,params,process.env.username,process.env.password ), function (error, response, body) {
        if (!error && response.statusCode == 200) {
          console.log ( "200");
          body = JSON.parse (body);



        //  console.log ( JSON.parse (body).access_token);
           //store to db
           var cred = {accessToken:body.access_token,refreshToken:body.refresh_token,expiresIn:body.expires_in,ts:Date.now()};
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




  /*
  * provide access token for app to make Partner API call
  * check from db, if it's expired  make new request from token server with refreshtoken
  */
  exports.getAccessToken = function (bbmId, callback) {

     if (db.get('tokens[0]').find({ bbmId:  bbmId }).size().value()) { //token not acquired before
       throw new Error('token not found,in fastoauth at least we should have Long-lived or refresh token');
     }
     else { //token acquired, check validity, if expired, make new request
       token = db.get('tokens[0]').find({ bbmId:  bbmId }).value();
       if (token && (  Date.now() >  token.ts  + (token.expiresIn * 1000))  )  {
         callback (token);
       }
       else {
         console.log('getAccessToken with refresh token');

         var body = { grant_type:'refresh_token', scope:'v1'  }
         var url = "https://auth-beta.bbm.blackberry.com:8443/oauth/token";
         // Start the request
         request(utils.getReqOptionsForTokenService(url,body,process.env.username ,process.env.password ), function (error, response, body) {
             if (!error && response.statusCode == 200) {
               console.log ( "200");
               body = JSON.parse (body);
             //  console.log ( JSON.parse (body).access_token);
                //store to db
                var cred = {bbmId:bbmId, accessToken:body.access_token,refreshToken:body.refresh_token,expiresIn:body.expires_in,ts:Date.now()};
                console.log (cred);
                //delete existing expired token
                 db.get('tokens[0]').remove({ bbmId:  bbmId }).write();
                 db.get('tokens').push(cred).write();
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
  *if the session already associated with users, update the token
  *otherwise create new user
  */
  exports.exchangeToken = function (shortLivedToken,callback) {

    console.log('exchangeToken from Token service');

    var body = { grant_type:'exchange_token', access_token:shortLivedToken   }
    var url = "https://auth-beta.bbm.blackberry.com:8443/oauth/token";
    // Start the request
    request(utils.getReqOptionsForTokenService(url,body,process.env.username ,process.env.password ), function (error, response, body) {
        if (!error && response.statusCode == 200) {
          console.log ( "200");
          body = JSON.parse (body);
            callback (body);
        }
        else {
          callback (error);
        }

    });
  }
