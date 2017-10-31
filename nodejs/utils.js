

var rand = require("random-key");


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
         'Content-Type':"application/x-www-form-urlencoded",
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
  exports.getReqOptionsForApiService = function(url,method,body,token) {

      // Set the headers
      var headers = {
          'Accept': 'application/json',
        //   'Accept-Encoding': 'gzip',
           //'Content-Type':"application/x-www-form-urlencoded",
           'Content-Type':"application/json;charset=utf-8",
      //     "Authorization": "Bearer " + token
      }
      // Configure the request
      var options = {
          url: url,
          method: method,
          headers: headers,
          auth: {
             'bearer':  token
           },
          body: JSON.stringify(body)
      }

      return options;
    }

    exports.createUser = function (bbmId,accessToken,refreshToken,tokenExpiresIn) {
        var user = {
              id: rand.generate(),
              bbmId:bbmId,
              accessToken:accessToken,
              refreshToken:refreshToken,
              tokenExpiresIn:tokenExpiresIn,
              ts:Date.now()
            };
            db.get('users').push(user).write();
           return user;
    }

    exports.updateUser = function (id,accessToken,refreshToken,tokenExpiresIn) {
      db.get('users')
          .find({id:id})
          .assign({accessToken:accessToken,refreshToken:refreshToken,tokenExpiresIn:tokenExpiresIn,
                    ts:Date.now()}).write();

    }
    exports.getUser = function (id) {
    //  if (db.get('users').find({ id:  id }).size()>0 )
        return db.get('users[0]').find({ id:  id }).value();
    //  else
      //  return null;
    }
