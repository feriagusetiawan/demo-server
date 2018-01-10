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


/** ============================================
*   CHAT API
* ================================================
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


  /** ============================================
  *   FASTOAUTH
  * ================================================
  */

  /*
  * exchange for long lived token, and store it in db
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

  /** ============================================
  *   NORMAL OAUTH
  * ================================================
  */

  /*
  * get Token from Authorization code
  */
  exports.getToken = function (code,callback) {

    console.log('getToken from Token service ' + code);


    var body = { grant_type:'authorization_code', scope: 'v1',code: code, redirect_uri: process.env.redirectUrl,  state:'newstate'  }
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
