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
    var url =  process.env.tokenServerUrl;
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
         var url =  process.env.tokenServerUrl;
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

    console.log('exchangeToken from Token service ' + shortLivedToken);


    var body = { grant_type:'exchange_token', access_token:shortLivedToken   }
    var url =  process.env.tokenServerUrl;
    // Start the request
    request(utils.getReqOptionsForTokenService(url,body,process.env.oauthUsername ,process.env.oauthPassword ), function (error, response, body) {
        if (!error && response.statusCode == 200) {
          console.log ( "200");
          body = JSON.parse (body);
            callback (body);
        }
        else {
          callback (response);
        }

    });
  }
