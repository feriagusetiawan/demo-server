require('dotenv').load();

var express = require("express");
var bodyParser = require('body-parser');
var request = require('request');
var session = require('express-session');
var auth = require('./auth');
var chat = require('./chat');
var utils = require('./utils');

var app = express();
app.use(bodyParser.json({ type: 'application/json' }));
app.use(session({
  cookieName: 'session',
  secret: 'eg[isfd-8yF9-7w2315df{}+Ijs123456',
  duration: 30* 24 * 60 * 60 * 1000,
  activeDuration: 30* 24 * 60 * 60 * 1000,
  httpOnly: true,
  secure: true,
  ephemeral: true
}));

var router = express.Router();
var path = __dirname + '/views/';

var username = process.env.username; //your username
var pasword = process.env.password; //client secreet

//init the db
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const adapter = new FileSync('db.json')
const db = low(adapter)


 

    /* =====================================================
    * Handle request for fastoauth and calling partner api
    *
    * ======================================================
    */

    //client send Shortlived token, and we should exchange with long lived,
    //map it with and store in our db
    router.get('/fastoauth/exchangeToken', function(req, res) {
      auth.exchangeToken (req.body.token,function (cred) {
        //put into session so we can retrieve back when needed to call api
        req.session.cred  =  cred;
        res.code = 200;
      });
     });


     //client request for user profile
     router.get('/api/userProfile', function(req, res) {
       if (req.session.cred===undefined) {
         res.code = 403;
         return;
       }
       api.getUserProfile (req.session.cred.access_token,function (body) {
          res.json (body);
       });
      });

     //client request for contact list
     router.get('/api/contacts', function(req, res) {
       if (req.session.cred===undefined) {
         res.code = 403;
         return;
       }
       api.getContacts (req.session.cred.access_token,function (body) {
          res.json (body);
       });
      });

      //client request to post to feed
      router.post('/api/post2Feed', function(req, res) {
        if (req.session.cred===undefined) {
          res.code = 403;
          return;
        }
        api.post2Feed (req.session.cred.access_token,"Hello from BBM Demo",function (body) {
           res.json (body);
        });
       });


    /* =====================================================
    * Handle callback from BBM Chat Server
    *
    * ======================================================
    */
    router.get('/chat/v1/chats', function(req, res) {
      chat.replyMessage (req,res);
     });


     /* =====================================================
     * Handle postback when user click on our button message, etc.
     * we just show dummy message here to response
     * ======================================================
     */
     router.post('/chat/postback', function(req, res) {
       res.send('Hello, thanks for posting back to me.');
      });



      /*===================================
      * Handle Request from BBM Demo Landing Page
      * ====================================
      */

      //request for hello "random" code
      //we will generate 5 digit random number
        router.get('/chat/hello', function(req, res) {

         res.json ( {helloCode:'12345'});


        });

         // request for latest incoming payload
        router.get('/chat/incomings/:helloCode', function(req, res) {
             res.json(db.get('incomings').find({helloCode:req.params.helloCode}).value);
              db.get('incomings').remove({helloCode:req.params.helloCode});
          });

          //request for latest outgoing payload
        router.get('/chat/outgoings/:helloCode', function(req, res) {
              res.json(db.get('outgoings').find({helloCode:req.params.helloCode}).value);
               db.get('outgoings').remove({helloCode:req.params.helloCode});
           });


app.use("/",router);

app.listen(3000,function(){
  console.log("Live at Port 3000");
});