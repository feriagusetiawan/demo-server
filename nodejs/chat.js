
var bodyParser = require('body-parser');
var request = require('request');

var utils = require('./utils');
var auth = require('./auth');

//init the db
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const adapter = new FileSync('db.json')
const db = low(adapter)
db.defaults(
    {
      incomings:[],
      outgoings:[],
      clientcredential: [],  //client credential for chatbot
      token:[]   // token for API call, one record for each bbmId
    }).write();

var provision = {chId: "C00132297",
                  bbmId:"3175533613684883456",
                  botInfo: {"3175533613684883456": {
                                      "name": "Demo Bot",
                                    }
                                  }
                    }


/**
* Take action for Action message, for us we just dump the incoming message
*/
exports.doSomething = function (req,res) {

};

  /*This is how we handled message from BBM Chat server
  * 1. always find if we have check if the user have session before (chatID is in the DB)
  * 2. if no, parse the message look for "HelloCode", and associate HelloCode with ChatID
  * 3. if yes, parse the message present user with response for various scenarios
  */


exports.replyMessage = function (req,res) {


  //as best practice, send 'typing...' notification

  //now prepare the response based on what is coming ..
  var inMsg = req.body.messages[0].text;
  var outMsg = {};
  //if user say hello, establish association
  if (inMsg.toLowerCase().startsWith('hello')) {
    var msgs = inMsg.split(" ");
    if (msgs.size>1) {
      var helloCode = inMsg.trim();
      db.get('sessions').push({helloCode:helloCode,chatId:req.body.chatId}).write();
    }
    else { //invalid hello message
       createReplyMessage(provision.chId,req.body.chatId ,provision.bbmId,req.body.from,provision.botInfo,
        "Please say 'hello xxxx', where xxxx is 4 digit number shown in the demo website");
    }
  }
  //if its something other than hello, we need to check if association establish, if not then ask user to go to demo website
  else if(db.get('sessions').find({ chatId: req.body.chatId }).size()>0) {
    createReplyMessage(provision.chId,req.body.chatId ,provision.bbmId,req.body.from,provision.botInfo,
     "Please go to demo website https://demobbm.com/demo-client/chatapi from your laptop to use this chatbot");

  }
  else { //all looks good, show the menu
    switch(inMsg) {
    case "text-selected":
        outMsg =  createTextMessage(provision.chId,req.body.chatId ,provision.bbmId,req.body.from,provision.botInfo);
        break;
    case "image-selected":
        outMsg =  createImageMessage(provision.chId,req.body.chatId ,provision.bbmId,req.body.from,provision.botInfo);
        break;
    case "link-selected":
        outMsg =  createLinkMessage(provision.chId,req.body.chatId ,provision.bbmId,req.body.from,provision.botInfo);
        break;
    case "buttons-selected":
        outMsg =  createButtonsMessage(provision.chId,req.body.chatId ,provision.bbmId,req.body.from,provision.botInfo);
        break;
    default:
        outMsg =  createMenuMessage(provision.chId,req.body.chatId ,provision.bbmId,req.body.from,provision.botInfo);
        break;
      }

  }

  //get credential, then send message
  auth.getClientCredential (function (cred){
        console.log ('sending message now with token ' + cred.accessToken);
        sendMessage (cred.accessToken,req.body.mTok,req.body.chatId,outMsg);
       //dump the payload
        dumpPayload ("outgoings",req.body.chatId, outMsg) ;

  });

}

//do send message to BBM Chat Server
sendMessage = function (token,mTok,chatId,msg) {

  var url =  process.env.chatServerUrl + chatId+ "?mTok="+  encodeURIComponent(mTok);
  console.log ('do sending to ' + url);
  // Start the request
  request(  utils.getReqOptionsForApiService (url,'POST',msg,token) , function (error, response, body) {
      if (!error && response.statusCode == 200) {
        console.log ("OK");
      }
      else { //error , you can decide to resent
        console.log (response);

      }

  })
}

applyEnvelop = function (chId,chatId,from,to,botInfo, messages) {
    var msg = {
          "mType": "bot",
          "chId": chId,
          "chatId": chatId,
          "from": from,
          "to": to,
           "messages": messages,
           "userInfos": botInfo
         };

     return msg;

  }


createReplyMessage = function (chId,chatId,from,to,botInfo,msg)  {
  var messages = [{"index":1,"type": "text", "text":  msg}];
  return  applyEnvelop (chId,chatId,from,to,botInfo,messages);
}

createTextMessage = function (chId,chatId,from,to,botInfo)  {
  var messages = [{"index":1,"type": "text", "text": "This is demo text message."}];
  return  applyEnvelop (chId,chatId,from,to,botInfo,messages);
}

createImageMessage = function (chId,chatId,from,to,botInfo) {
  var messages = [{ "index": 1,
            "type": "image",
            "image": {
                "preview": "https://placeholdit.imgix.net/~text?txtsize=33&txt=256%C3%97144&w=256&h=144",
                 "url": "https://placeholdit.imgix.net/~text?txtsize=33&txt=1080×566&w=1080&h=566" } }];

  return  applyEnvelop (chId,chatId,from,to,botInfo,messages);

}
createLinkMessage = function (chId,chatId,from,to,botInfo) {
  var messages =  [{ "index": 1, "type": "link",
              "link": {
                "url": "https://placeholdit.imgix.net/~text?txtsize=33&txt=256%C3%97144&w=256&h=144",
                "target": "def" } }];
  return  applyEnvelop (chId,chatId,from,to,botInfo,messages);
}

createButtonsMessage = function (chId,chatId,from,to,botInfo) {

  var messages = [{ "type": "buttons",
              "buttons": {
                  "imageUrl": "https://example.com/bot/images/image.jpg",
                  "title": "Buttons Example",
                  "desc": "You can have up to 4 buttons (text,link and postback)",
                  "actions": [ { "type": "text", "text": { "label": "Text Example", "text": "Button Text" } },
                               { "type": "postback", "postback": { "label": "Postback example", "data": "action=myaction&param1=value1&param2=value2" } },
                               { "type": "link", "link": { "label": "Link Example", "url": "https://demobbm.com/demo-client/chat/", "text": "Go to our website" } }
                        ]}
                      }];

  return applyEnvelop (chId,chatId,from,to,botInfo,messages);
}

createMenuMessage = function (chId,chatId,from,to,botInfo) {

   var messages = [{ "type": "buttons",
               "buttons": {
                   "title": "Menu",
                   "desc": "Please select message you like to see",
                   "actions": [{ "type": "text","text": { "label": "Text", "text": "text-selected" } },
                              { "type": "text","text": { "label": "Image", "text": "image-selected" } },
                              { "type": "text","text": { "label": "Link", "text": "link-selected" } },
                              { "type": "text","text": { "label": "Buttons", "text": "buttons-selected" } },
                         ]}
                       }];


  return  applyEnvelop (chId,chatId,from,to,botInfo,messages);

}


//some utilities function
getHelloCodeByChat = function (chatId) {
      var session = db.get('sessions[0]').find({'chatId':chatId}).value();
      return session.helloCode;

   }



/*Dump payload so Demo page can feth later
* 1. get helloCode from sessions table
* 2. remove existing records for the helloCode
* 3. add new payload to table
*/
dumpPayload = function (table,chatId,payload) {
/*  var session = db.get('sessions[0]').find({chatId:chatId}).value();
  db.get(table).remove({helloCode:session.helloCode});
  db.get(table).push({helloCode:session.helloCode,payload:payload}).write();
  */
}
