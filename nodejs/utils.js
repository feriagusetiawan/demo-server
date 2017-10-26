

//
/**
* internal utility to get Request options for accessing Token Server
*/
 exports.getReqOptionsForTokenService = function(url,body,username,password) {

   console.log ('options for token service: ' + url + ":" + username + ":" + password);
    var fs = require('fs')
        , path = require('path')
        , certFile = path.resolve(__dirname, 'ssl/bbmmobilenews.com_thawte.crt')
        , keyFile = path.resolve(__dirname, 'ssl/bbmmobilenews.com_thawte.key')  ;
    //    , caFile = path.resolve(__dirname, 'ssl/ca.cert.pem');

    // Set the headers
    var headers = {
        'Accept': 'application/json',
         'Accept-Encoding': 'gzip',
         'Content-Type':"applicaiton/x-www-form-urlencoded",
         "Authorization": "Basic " + new Buffer( username + ":" + password ).toString('base64')
    }
    // Configure the request
    var options = {
        url: url,
        method: 'POST',
        headers: headers,
        form: body,
        cert: fs.readFileSync(certFile),
        key: fs.readFileSync(keyFile),
    }
    return options;
  }

  //
  /**
  * internal utility to get Request options for accessing Partner API
  */
  exports.getReqOptionsForApiService = function(url,body,token) {
      /* var fs = require('fs')
          , path = require('path')
           , certFile = path.resolve(__dirname, 'ssl/bbmmobilenews.com_thawte.crt')
           , keyFile = path.resolve(__dirname, 'ssl/bbmmobilenews.com_thawte.key')  ;
           , caFile = path.resolve(__dirname, 'ssl/ca.cert.pem');
        */

      // Set the headers
      var headers = {
          'Accept': 'application/json',
           'Accept-Encoding': 'gzip',
           'Content-Type':"applicaiton/x-www-form-urlencoded",
           "Authorization": "Bearer " + token
      }
      // Configure the request
      var options = {
          url: url,
          method: 'POST',
          headers: headers,
          form: body
      }
      return options;
    }
