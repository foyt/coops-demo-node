(function() {
  
  var request = require('request');
  var settings = require('../settings');
  var _ = require('underscore');
  var client = null;
  var database = require('../database');
  
  function Client(baseUrl, clientId, clientSecret) {
    console.log("New CoOps client created. Using server at " + baseUrl);
    this._baseURL = baseUrl;
    this._clientId = clientId;
    this._clientSecret = clientSecret;
  }
  
  Client.prototype = Object.create(null, {
    constructor: {
      value: Client,
      enumerable: false
    },
    
    createUser: {
      value: function(name, callback) {
        this._doRequest("POST", '/1/users', this._clientId, this._clientSecret, { }, {
          name: name
        }, function (error, response, body) {
          if (error) {
            callback(error, null);
          } else {
            if (response.statusCode == 200) {
              callback(error, body);
            } else {
              callback("Could not create user", null);
            }
          }
        });
      }
    },
    
    listFiles: {
      value: function (user, userId, callback) {
        this._doBearerRequest("GET", user, '/1/users/' + userId + '/files', {}, callback);
      }
    },
    
    createFile: {
      value: function (user, userId, name, content, contentType, callback) {
        this._doBearerRequest("POST", user, '/1/users/' + userId + '/files', {
          name: name,
          content: content,
          contentType: contentType
        }, callback);
      }
    },
    
    joinFile: {
      value: function (user, userId, fileId, algorithm, protocolVersion, callback) {
        this._doBearerRequest("GET", user, '/1/users/' + userId + '/files/' + fileId + '/join?algorithm=' + algorithm + '&protocolVersion=' +  protocolVersion, {}, callback);
      }
    },
    
    getFile: {
      value: function (user, userId, fileId, callback) {
        this._doBearerRequest("GET", user, '/1/users/' + userId + '/files/' + fileId, {}, callback);
      }
    },
    
    getFileRevision: {
      value: function (user, userId, fileId, revisionNumber, callback) {
        this._doBearerRequest("GET", user, '/1/users/' + userId + '/files/' + fileId + '?revisionNumber=' + revisionNumber, {}, callback);
      }
    },
    
    listFileUsers: {
      value: function (user, userId, fileId, callback) {
        this._doBearerRequest("GET", user, '/1/users/' + userId + '/files/' + fileId + '/users', {}, callback);
      }
    },
    
    listFileRevisions: {
      value: function (user, userId, fileId, callback) {
        this._doBearerRequest("GET", user, '/1/users/' + userId + '/files/' + fileId + '/revisions', {}, callback);
      }
    },
    
    updateFileUsers: {
      value: function (user, userId, fileId, fileUsers, callback) {
        this._doBearerRequest("POST", user, '/1/users/' + userId + '/files/' + fileId + '/users', fileUsers, callback);
      }
    },

    _doBearerRequest: {
      value: function (method, user, url, parameters, callback) {
        this._doRequest(method, url, null, null, {
          'Authorization': 'Bearer ' + user.accessToken
        }, parameters, _.bind(function (error, response, body) {
          if (error) {
            callback(error, null);
          } else {
            if (response.statusCode == 401) {
              // Token expired or revoked 
              this._refreshToken(user, _.bind(function (err, user) {
                if (err) {
                  callback(err, null);
                } else {
                  if (user) {
                    this._doBearerRequest(method, user, url, parameters, callback);
                  } else {
                    callback("Could not refresh expired or revoked token.", null);
                  }
                }
              }, this));
            } else {
              if (response.statusCode >= 200 && response.statusCode <= 299) {
                callback(null, body);
              } else {
                callback(response.message, null);
              }
            }
          }
        }, this));
      }
    },
    
    _doRequest: {
      value: function (method, url, username, password, headers, body, callback) {
        var options = {
          uri: this._baseURL + url,
          method: method,
          headers: headers,
          json: body
        };
        
        if (username || password) {
          options.auth = {
            username: username,
            password: password
          };
        }
        
        request(options, callback);
      }
    },

    _refreshToken: {
      value: function (user, callback) {
        this._doRequest('POST', '/oauth2/token', this._clientId, this._clientSecret, {}, {
          "refresh_token": user.refreshToken,
          "grant_type": "refresh_token"
        }, function (error, response, data) {
          if (error) {
            callback(error, null);
          } else {
            if (response.statusCode == 200) {
              user.accessToken = data['access_token'];
              user.tokenExpires = new Date().getTime() + data['expires_in'];
              
              user.save(function (err, savedUser) {
                if (err) {
                  callback(err, null);
                } else {
                  callback(null, user);            
                }
              });
            } else {
              callback("Could not refresh token", null);
            }
          }
        });
      }
    }
  });

  module.exports = {
    get: function (callback) {
      if (client) {
        callback(client);
      } else {
        settings.get(['coops-server', 'coops-client-id', 'coops-client-secret'], function (err, settings) {
	        var settingMap = _.object(_.pluck(settings, 'key'), _.pluck(settings, 'value'));
	        client = new Client(settingMap['coops-server'], settingMap['coops-client-id'], settingMap['coops-client-secret']);
          callback(client);
  	    });
      }
    }
  };
  
}).call(this);