require('dotenv').load();

var express = require("express");
var bodyParser = require('body-parser');
var request = require('request');
var auth = require('./auth');
var auth = require('./utils');

var app = express();
app.use(bodyParser.json({ type: 'application/json' }));

var router = express.Router();
var path = __dirname + '/views/';

var username = process.env.username; //your username
var pasword = process.env.password; //client secreet
var provision = {chId: "C00132297",
                  bbmId:"3175533613684883456",
                  botInfo: {"3175533613684883456": {
                                      "name": "Demo Bot",
                                    }
                                  }
      }

//init the db
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const adapter = new FileSync('db.json')
const db = low(adapter)


//request from fastoauth demo page, to exchange the short-lived token with long-lived
router.post('/requestLLT', function(req, res) {
/*
    // Set the headers
    var headers = {
        'Accept': 'application/json',
         'Accept-Encoding': 'gzip',
         'Content-Type':"applicaiton/x-www-form-urlencoded" ,
      //   "Authorization: Basic ": new Buffer( username + ':' + password ).toString('base64') ;
    }

    // Configure the request
    var options = {

        url: "https://auth-str.eval.blackberry.com:8443",
        method: 'POST',
        headers: headers,
        form: { grant_type:'exchange_token', access_token: req.body.token    }
    }

    // Start the request
    request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            // Print out the response body
            console.log(body);
            res.statusCode = 200;
        }
        else {
            res.statusCode = response.statusCode ;
             res.json( {error:error});
        }

    })
*/

 });


 //request from asyncOauth to return user profile
 router.get('/asyncOAuth', function(req, res) {
     // Set the headers
  /*   var headers = {
         'Accept': 'application/json',
          'Accept-Encoding': 'gzip',
          'Content-Type':"applicaiton/x-www-form-urlencoded",

     }
     // Configure the request
     var options = {
         url: "https://auth-str.eval.blackberry.com:8443",
         method: 'POST',
         headers: headers,
         form: { grant_type:'exchange_token', access_token: req.body.token    }
     }

     // Start the request
     request(options, function (error, response, body) {
         if (!error && response.statusCode == 200) {
             // Print out the response body
             console.log(body);
             res.statusCode = 200;
         }
         else {
             res.statusCode = response.statusCode ;
              res.json( {error:error});
         }

     })

*/
  });




  /**
  * CHAT SECTION
  * 1. request acces token
  * 4. request for client credential (scope=bot)
  * 5 respond to chat message
  */

  router.get('/chat/test/clientcred', function(req, res) {

      auth.getClientCredential (function (cred){
        res.json (cred);
      });

    });


/*===================================
*Request from BBM Demo Landing Page
* ====================================
*/

//request comes from Chatbot Demo landing page, asking for hello "random" code
//we will generate 5 digit random number
//this opportunity to acquire access token, if not done so
router.get('/chat/hello', function(req, res) {

   res.json ( {helloCode:'12345'});


  });

   // Get latest incoming payload
  router.get('/chat/incomings/:helloCode', function(req, res) {
       res.json(db.get('incomings').find({helloCode:req.params.helloCode}).value);
        db.get('incomings').remove({helloCode:req.params.helloCode});
    });
    //the latest outgoing payload
   router.get('/chat/outgoings/:helloCode', function(req, res) {
        res.json(db.get('outgoings').find({helloCode:req.params.helloCode}).value);
         db.get('outgoings').remove({helloCode:req.params.helloCode});
     });





    /* =====================================================
    * This is how we handled message from BBM Chat server, our callback URL is /chat
    * 1. always find if we have check if the user have session before (chatID is in the DB)
    * 2. if no, parse the message look for "HelloCode", and associate HelloCode with ChatID
    * 3. if yes, parse the message present user with response for various scenarios
    * ======================================================
    */
    router.get('/chat/v1/chats', function(req, res) {
      //always return with 200 to ack
      res.code = 200;
      //as best practice, send 'typing...' notification

      //now prepare the response based on what is coming ..

      //if new session, establish association first
      if(  db.get('sessions[0]').find({ chatId:  req.body.chatId }).size().value()==0 ) {
        //we are expecting user typed in Hello <5 digit hello-code>
          var helloCode = req.body.messages[0].trim().slice(-5);
          db.get('sessions').push({helloCode:helloCode,chatId:req.body.chatId}).write();
      }

      var inMsg = req.body.messages[0].trim();
      var outMsg = {};

      switch(inMsg) {
      case "text-selected":

          outMsg = utils.createTextMessage(provision.chId,req.body.chatId ,provision.bbmId,req.body.from,provision.botInfo)
          break;
      case "image-selected":
          outMsg = utils.createImageMessage(provision.chId,req.body.chatId ,provision.bbmId,req.body.from,provision.botInfo)
          break;
      case "link-selected":
          outMsg = utils.createLinkMessage(provision.chId,req.body.chatId ,provision.bbmId,req.body.from,provision.botInfo)
          break;
      case "buttons-selected":
          outMsg = utils.createButtonsMessage(provision.chId,req.body.chatId ,provision.bbmId,req.body.from,provision.botInfo)
          break;
      default:
          outMsg = utils.createMenuMessage(provision.chId,req.body.chatId ,provision.bbmId,req.body.from,provision.botInfo)
          break;
        }

      //get credential, then send message
      auth.getClientCredential (function (cred){
           utils.sendMessage (cred.accessToken,req.body.mTok,req.body.chatId,outMsg);
           //dump the payload
            utils.dumpPayload ("outgoings",req.body.chatId, outMsg) ;

      });

     });


     /* =====================================================
     * This is our simulated postback handler
     * we just dump the payload to database, so the Demo Landing page can fetch
     * ======================================================
     */
     router.post('/chat/postback', function(req, res) {
       utils.dumpPayload ("incomings",req.body.chatId,req.body) ;
      });




app.use("/",router);



app.listen(3000,function(){
  console.log("Live at Port 3000");
});
