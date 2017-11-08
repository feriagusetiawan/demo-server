

require('dotenv').load();

var express = require("express");

var request = require('request');
var bodyParser = require('body-parser');
var session = require('express-session');
var auth = require('./auth');
var chat = require('./chat');
var api = require('./api');
var utils = require('./utils');
var crypto = require('crypto');

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
    router.post('/fastoauth/exchangeToken', urlencodedParser  , function(req, res) {
      console.log ('exchanging token for ' +  req.body.token );
      auth.exchangeToken (req.body.token,function (cred) {
        //put into session so we can retrieve back when needed to call api
        //console.log ("echangeTOken success: " + JSON.stringify(cred));
        req.session.cred  =  cred;
        res.json ({status:'ok'})
      });
     });


     //client request for user profile
     router.get('/api/userProfile',urlencodedParser  ,function(req, res) {
       if (req.session.cred===undefined) {
            console.log ( "cred not found");
             res.json ({status:'pls exchange token first'});
       }
       else api.getUserProfile (req.session.cred.access_token,function (body) {
           console.log ( "USERPROF " + JSON.stringify(body));
          res.json (body);
       });
      });

     //client request for contact list
     router.get('/api/contacts', urlencodedParser  , function(req, res) {
       if (req.session.cred===undefined) {
         res.code = 403;
         return;
       }
       api.getContacts (req.session.cred.access_token,function (body) {

          res.json (body);
       });
      });

      //client request to post to feed
      router.post('/api/post2Feed',urlencodedParser  , function(req, res) {
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


        /*
        * Compute signature and match it with BBM provided signature
        * if not match, simply reject, the request not coming from BBM
        */
        var clientSigKey = process.env.clientSigKey;
        var signature = crypto.createHmac('sha256', clientSigKey).update( JSON.stringify(req.body)).digest().toString('base64');

        if (signature != req.headers['bbm-sig']) {
                res.status(403).send('Invalid signature');
                return;
        }

        //do reply immediately with 200, this will flag message as 'R'
        res.json(200,{status:"ok"});
        console.log ("==== RECVD ======");
        console.log (JSON.stringify(req.body));

        //if postback (actions), handle with doSomething
        //if messages, check if this is the first chat or not
        //for first chat with the user, show welcome message
        //otherwise run logic to reply message
        if (req.body.actions )
          chat.doSomething(req,res);
        else {
          if (  db.get('sessions').find({chatId:req.body.chatId}).size()<=1)
            chat.welcomeMessage (req,res);
          else
            chat.replyMessage (req,res);
        }
        //log the session
        db.get('sessions').remove({chatId:req.body.chatId}).write();
        db.get('sessions').push({chatId:req.body.chatId,mTok:req.body.mTok,ts: Date.now()}).write();



     });







app.use("/",router);

app.listen(3000,function(){
  console.log("Live at Port 3000");
});
