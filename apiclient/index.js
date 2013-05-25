(function() {
  var rest = require('restler');
  var settings = require('../settings');
  var _ = require('underscore');
  var client = null;
  var database = require('../database');
  
  Client = rest.service(function(baseUrl, clientId, clientSecret) {
    this.baseURL = baseUrl;
    this._clientId = clientId;
    this._clientSecret = clientSecret;
  }, { }, {
    createUser: function(name, callback) {
      var request = this.post('/1/users', {
        username: this._clientId,
        password: this._clientSecret,
        data: {
          name: name
        }
      });
      
      request.on('complete', function(data, response) {
        callback(data, response);
      });
    },
    
    listFiles: function (user, userId, callback) {
      var request = this.get('/1/users/' + userId + '/files', {
        headers: {
          'Authorization': 'Bearer ' + user.accessToken
        }
      });
      
      this._processRequest(request, user, _.bind(function (retryUser) {
        this.listFiles(retryUser, userId, callback);
      }, this), callback);
    },
    createFile: function (user, userId, name, content, contentType, callback) {
      var request = this.post('/1/users/' + userId + '/files', {
        headers: {
          'Authorization': 'Bearer ' + user.accessToken
        },
        data: {
          name: name,
          content: content,
          contentType: contentType
        }
      });
      
      this._processRequest(request, user, _.bind(function (retryUser) {
        this.createFile(retryUser, userId, name, content, contentType, callback);
      }, this), callback);
    },
    joinFile: function (user, userId, fileId, algorithm, protocolVersion, callback) {
      var request = this.get('/1/users/' + userId + '/files/' + fileId + '/join?algorithm=' + algorithm + '&protocolVersion=' +  protocolVersion, {
        headers: {
          'Authorization': 'Bearer ' + user.accessToken
        }
      });
      
      this._processRequest(request, user, _.bind(function (retryUser) {
        this.joinFile(retryUser, userId, fileId, algorithm, protocolVersion, callback);
      }, this), callback);
    },
    getFile: function (user, userId, fileId, callback) {
      var request = this.get('/1/users/' + userId + '/files/' + fileId, {
        headers: {
          'Authorization': 'Bearer ' + user.accessToken
        }
      });
      
      this._processRequest(request, user, _.bind(function (retryUser) {
        this.getFile(retryUser, userId, fileId, callback);
      }, this), callback);
    },
    listFileUsers: function (user, userId, fileId, callback) {
      var request = this.get('/1/users/' + userId + '/files/' + fileId + '/users', {
        headers: {
          'Authorization': 'Bearer ' + user.accessToken
        }
      });
      
      this._processRequest(request, user, _.bind(function (retryUser) {
        this.listFileUsers(retryUser, userId, fileId, callback);
      }, this), callback);
    },
    updateFileUsers: function (user, userId, fileId, fileUsers, callback) {
      var request = this.post('/1/users/' + userId + '/files/' + fileId + '/users', {
        headers: {
          'Authorization': 'Bearer ' + user.accessToken,
          'Content-Type': 'application/json; charset=utf-8'
        },
        data: JSON.stringify(fileUsers)
      });
      
      this._processRequest(request, user, _.bind(function (retryUser) {
        this.updateFileUsers(retryUser, userId, fileId, fileUsers, callback);
      }, this), callback);
    },

    _processRequest: function (request, user, retry, callback) {
      request.on('complete', _.bind(function(data, response) {
        if (!response) {
          callback("Could not connect to Co-Ops server.", null);
        } else {
          if (response.statusCode == 401) {
            // Token expired or revoked 
            this._refreshToken(user, _.bind(function (err, user) {
              if (err) {
                callback(err, null);
              } else {
                if (user) {
                  retry(user);
                } else {
                  callback("Could not refresh expired or revoked token.", null);
                }
              }
            }, this));
          } else {
            if (response.statusCode >= 200 && response.statusCode <= 299) {
              callback(null, data);
            } else {
              callback(response.message, null);
            }
          }
        }
      }, this));
    },
    
    _refreshToken: function (user, callback) {
      var request = this.post('/oauth2/token', {
        username: this._clientId,
        password: this._clientSecret,
        data: {
          "refresh_token": user.refreshToken,
          "grant_type": "refresh_token"
        }
      });
      
      request.on('complete', function(data, response) {
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
      });
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