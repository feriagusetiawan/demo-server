

//do send message to BBM Chat Server
exports.sendMessage = function (token,mTok,chatId,msg) {

  var url =  process.env.chatServerUrl + "?mTok="+mTok+"&chatId="+chatId;
  // Start the request
  request(  utils.getReqOptionsToApiService (url,msg,token) , function (error, response, body) {
      if (!error && response.statusCode == 200) {
        console.log ( "200");
      }
      else { //error , you can decide to resent
        console.log (response );

      }

  })
}


//some utilities function
  exports.getHelloCodeByChat = function (chatId) {
      var session = db.get('sessions[0]').find({'chatId':chatId}).value();
      return session.helloCode;

   }


  exports.applyEnvelope = function (chId,chatId,from,to,botInfo, messages) {
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



exports.createTextMessage = function (chId,chatId,from,to,botInfo)  {
  var messages = [{"index":1,"type": "text", "text": "This is demo text message."}];

  return this.applyEnvelop (chId,chatId,from,to,botInfo,messages);
}

exports.createImageMessage = function (chId,chatId,from,to,botInfo) {
  var messages = [{ "index": 1,
            "type": "image",
            "image": {
                "preview": "https://placeholdit.imgix.net/~text?txtsize=33&txt=256%C3%97144&w=256&h=144",
                 "url": "https://placeholdit.imgix.net/~text?txtsize=33&txt=1080×566&w=1080&h=566" } }];

  return this.applyEnvelop (chId,chatId,from,to,botInfo,messages);

}
exports.createLinkMessage = function (chId,chatId,from,to,botInfo) {
  var messages =  [{ "index": 1, "type": "link",
              "link": {
                "url": "https://placeholdit.imgix.net/~text?txtsize=33&txt=256%C3%97144&w=256&h=144",
                "target": "def" } }];
  return this.applyEnvelop (chId,chatId,from,to,botInfo,messages);
}

exports.createButtonsMessage = function (chId,chatId,from,to,botInfo) {

  var messages = [{ "type": "buttons",
              "buttons": {
                  "imageUrl": "https://example.com/bot/images/image.jpg",
                  "title": "Rome Dream Discount",
                  "desc": "Exclusive for BBM users. Special discount package for families.",
                  "actions": [ { "type": "text", "text": { "label": "Discover latest offers", "text": "Discover latest offers" } },
                               { "type": "postback", "postback": { "label": "Book this offer", "data": "action=book&location=rome&offer=123" } },
                               { "type": "postback", "postback": { "label": "Summer        catalogue", "data": "season=summer&location=rome" } },
                               { "type": "link", "link": { "label": "Go to our website", "url": "http://example.com/page/123", "text": "Go to our website" } }
                        ]}
                      }];

  return this.applyEnvelop (chId,chatId,from,to,botInfo,messages);
}

exports.createMenuMessage = function (chId,chatId,from,to,botInfo) {
  var messages = [
     { "type": "buttons",
       "buttons":
         { "imageUrl": "https://example.com/bot/images/image.jpg",
           "title": "Menu",
           "desc": "Please select message type you want to receive",
           "actions":
             [ { "type": "text",
                 "text": { "label": "Text", "text": "text-selected" } },
               { "type": "image",
                 "text": { "label": "Image", "text": "image-selected" } },
               { "type": "image",
                 "text": { "label": "Link", "text": "link-selected" } },
               { "type": "image",
                 "text": { "label": "Buttons", "text": "buttons-selected" } }]
           }
     }
   ];
  return this.applyEnvelop (chId,chatId,from,to,botInfo,messages);

}


/*Dump payload so Demo page can feth later
* 1. get helloCode from sessions table
* 2. remove existing records for the helloCode
* 3. add new payload to table
*/
exports.dumpPayload = function (table,chatId,payload) {
  var session = db.get('sessions[0]').find({chatId:chatId}).value();
  db.get(table).remove({helloCode:session.helloCode});
  db.get(table).push({helloCode:session.helloCode,payload:payload}).write();
}
