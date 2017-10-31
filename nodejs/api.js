
var bodyParser = require('body-parser');
var request = require('request');
var utils = require('./utils');

// create application/json parser
var jsonParser = bodyParser.json()
// create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({ extended: false })




exports.getUserProfile = function (token,callback) {

  var url =  process.env.apiServerUrl  + '/v2/user/profile' ;

  console.log ( "getUserProfile with " + token);

  // Start the request
  request(  utils.getReqOptionsForApiService (url,'GET',{},token) , function (error, response, body) {
      if (!error && response.statusCode == 200) {
        console.log ( "200");

        callback ( body );
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
  request(  utils.getReqOptionsForApiService (url,'GET',{},token) , function (error, response, body) {
      if (!error && response.statusCode == 200) {
        console.log ( "200");
        callback (body);
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
  request(  utils.getReqOptionsForApiService (url,'POST',
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
