require('dotenv').load();

var express = require("express");

var request = require('request');
var bodyParser = require('body-parser');
var session = require('express-session');
var auth = require('./auth');
var chat = require('./chat');
var api = require('./api');
var utils = require('./utils');

// create application/json parser
var jsonParser = bodyParser.json()
// create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({ extended: false })

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
db.defaults(
    { sessions:[],
      incomings:[],
      outgoings:[],
      clientcredential: [],  //client credential for chatbot
      token:[]   // token for API call, one record for each bbmId
    }).write();




    /* =====================================================
    * Handle request for fastoauth and calling partner api
    *
    * ======================================================
    */

    //client send Shortlived token, and we should exchange with long lived,
    //map it with and store in our db
    router.post('/fastoauth/exchangeToken',jsonParser, function(req, res) {
      console.log ('exchanging token for ' + JSON.stringify(req.body) );
      auth.exchangeToken (req.body.token,function (cred) {
        //put into session so we can retrieve back when needed to call api
        console.log ("echangeTOken success: " + JSON.stringify(cred));
        req.session.cred  =  cred;
        res.json ({status:'ok'})
      });
     });


     //client request for user profile
     router.get('/api/userProfile', jsonParser, function(req, res) {
       if (req.session.cred===undefined) {
             res.json ({status:'pls exchange token first'})
       }
       else api.getUserProfile (req.session.cred.access_token,function (body) {
          res.json (body);
       });
      });

     //client request for contact list
     router.get('/api/contacts', jsonParser, function(req, res) {
       if (req.session.cred===undefined) {
         res.code = 403;
         return;
       }
       api.getContacts (req.session.cred.access_token,function (body) {

          res.json (body);
       });
      });

      //client request to post to feed
      router.post('/api/post2Feed',jsonParser,  function(req, res) {
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
    router.post('/chat/v1/chats', jsonParser,  function(req, res) {

      //For this demo, we need to identify the user by means of Hello code
      //this is the 5 digit code that user will get from Demo website
      //they should enter in chat message 'hello 12345'
      //we store the session in db, so if we cant find, we need to keep asking user to go to website
      //and key in the code

/*       if(  db.get('sessions[0]')
            .find({ chatId:  req.body.chatId }).size().value()==0 ) { //we cant find session establish one
          //check if user entering code now
          if (req.body.messages.size()>0) {
            var msg = req.body.messages[0];
            if (startsWith('hello'))
            var helloCode = req.body.messages[0].trim().slice(-5);
            db.get('sessions').push({helloCode:helloCode,chatId:req.body.chatId}).write();

          }
          else {
              //ask user to enter hello code from website

          }
      }
            */
        //do reply immediately with 200, this will flag message as 'R'
        res.json(200,{status:"ok"});
        console.log ("==== RECVD ======");
        console.log (JSON.stringify(req.body));

      if (req.body.actions )
        chat.doSomething(req,res);
      else
        chat.replyMessage (req,res);


     });


     /* =====================================================
     * Handle postback when user click on our button message, etc.
     * we just show dummy message here to response
     * ======================================================
     */
     router.post('/chat/postback',jsonParser,  function(req, res) {
       res.send('Hello, thanks for posting back to me.');
      });

      /*===================================
      * Handle Request from BBM Demo Landing Page
      * ====================================
      */
      //request for hello "random" code
      //we will generate 5 digit random number
        router.get('/chat/hello',jsonParser,  function(req, res) {
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
