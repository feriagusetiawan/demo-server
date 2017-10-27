
var bodyParser = require('body-parser');
var request = require('request');

var utils = require('./utils');




exports.getUserProfile = function (token,callback) {

  var url =  process.env.apiServerUrl  + '/v2/user/profile' ;
  // Start the request
  request(  utils.getReqOptionsToApiService (url,'GET',{},token) , function (error, response, body) {
      if (!error && response.statusCode == 200) {
        console.log ( "200");
        callback (JSON.parse (body));
      }
      else { //error , you can decide to resent
        console.log (response );
        callback(  error);

      }
  })
}
exports.getContacts = function (token,callback) {
  var url =  process.env.apiServerUrl + '/v2/user/contacts' ;
  // Start the request
  request(  utils.getReqOptionsToApiService (url,'GET',{},token) , function (error, response, body) {
      if (!error && response.statusCode == 200) {
        console.log ( "200");
        callback (JSON.parse (body));
      }
      else { //error , you can decide to resent
        console.log (response );
        callback(  error);

      }
  })
}


exports.post2Feed = function (token,msg,callback) {
  var url =  process.env.apiServerUrl +  '/v2/user/timeline/post' ;
  // Start the request
  request(  utils.getReqOptionsToApiService (url,'POST',
          { "templateId":"text",
            "description": msg},token) , function (error, response, body) {
      if (!error && response.statusCode == 200) {
        console.log ( "200");
        callback (JSON.parse (body));
      }
      else { //error
        console.log (response );
        callback(  error);

      }
  })
}