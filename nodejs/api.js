
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
  request(  utils.getReqOptionsForApiService (url,'GET',null,token) , function (error, response, body) {
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
  // Start the request
  request(  utils.getReqOptionsForApiService (process.env.apiServerUrl + '/v2/user/contacts','GET',null,token) , function (error, response, body) {
      if (!error && response.statusCode == 200) {
        console.log ( "200");
            var contacts = JSON.parse (body);
            contacts = contacts.slice (0,contacts.length>=3?3:contacts.length);
        request(  utils.getReqOptionsForApiService (process.env.apiServerUrl + '/v2/user/profile','POST',contacts,token) , function (error, response, body) {
            if (!error && response.statusCode == 200) {
              console.log ( "200");
             callback (JSON.parse (body));
            }
            else { //error , you can decide to resent
              console.log (response );
              callback(  error);

            }
        });
      }
      else { //error , you can decide to resent
        console.log (response );
        callback(  error);

      }
  });
}




exports.post2Feed = function (token,msg,callback) {
  var url =  process.env.apiServerUrl +  '/v2/user/timeline/post' ;
  // Start the request
  request( utils.getReqOptionsForApiService (url,'POST',
          { "templateId":"text",
            "description": msg},token) , function (error, response, body) {
      if (!error && response.statusCode == 200) {
        console.log ( "200");
        callback ({status:"OK",message:msg});
      }
      else { //error
        console.log (response );
        callback(  error);

      }
  })
}
