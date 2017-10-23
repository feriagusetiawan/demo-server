require('dotenv').load();

var express = require("express");
var bodyParser = require('body-parser');
var request = require('request');
var auth = require('./auth');


var app = express();
app.use(bodyParser.json({ type: 'application/json' }));

var router = express.Router();
var path = __dirname + '/views/';

var username = process.env.username; //your username
var pasword =process.env.password; //client secreet

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

  router.get('/test/clientcred', function(req, res) {

      auth.getClientCredential (function (cred){
        res.json (cred);
      });

    });


     //request comes from Chatbot demo page, asking for refresh payload between chat exchange
    router.get('/chat/incomings/:helloCode', function(req, res) {
         res.json(db.get('incomings').find({helloCode:req.params.helloCode}).value);
          db.get('incomings').remove({helloCode:req.params.helloCode});
      });
      //request comes from Chatbot demo page, asking for refresh payload between chat exchange
     router.get('/chat/outgoings/:helloCode', function(req, res) {
          res.json(db.get('outgoings').find({helloCode:req.params.helloCode}).value);
           db.get('outgoings').remove({helloCode:req.params.helloCode});
       });

   //request comes from Chatbot demo page, asking for hello "random" code
   //we will generate 4 digit random number
   //this opportunity to acquire access token, if not done so
   router.get('/chat/hello', function(req, res) {

      res.json ( {title:'hello...'});


     });

    getHelloCodeByChat = function (chatId) {
        var session = db.get('sessions[0]').find('chatId':chatId).value;
        return session.helloCode;

     }
    /* message from BBM Chat server, user have sent something
    * 1. check if the user have been idenitified
    * 2. if no, parse the message look for "Hello"
    * 3. if yes, present user with button message for various scenarios
    */
    router.get('/chat', function(req, res) {

      if (body.messages.length > 0 && body.messages[0].toLowerCase().startsWith()=='hello' ) {
          var helloCode = body.messages[0].slice(-4);
          db.get('sessions').push({helloCode:helloCode,chatId:req.body.chatId}).write();
      }
      else {
           db.get('incomings').push({helloCode:getHelloCodeByChat(req.body.chatId), body:req.body ).write();
           

      }




     });

     //user select "Send Text Message"
     //lets say something
     router.get('/chat/send-message-text', function(req, res) {

      });
      //user select "Send Image Message"
      //lets say something
      router.get('/chat/send-message-image', function(req, res) {
        auth.getClientCredential (function (cred){
          res.json (cred);
        });

       });
       //user select "Send Link Message"
       //lets say something
       router.get('/chat/send-message-link', function(req, res) {

        });
        //user select "Send Link Message"
        //lets say something
        router.get('/chat/send-message-link', function(req, res) {

         });
         //user select "Send Multiple Message"
         //lets say something
         router.get('/chat/send-multi-message', function(req, res) {

          });
         //user select "Send Notification"
         //lets say something
         router.get('/chat/send-notification', function(req, res) {

          });
        //user have responded fron our demo link or button callback
        //just push the received message to demo page
        router.get('/chat/user-responded', function(req, res) {

         });




app.use("/",router);



app.listen(3000,function(){
  console.log("Live at Port 3000");
});
