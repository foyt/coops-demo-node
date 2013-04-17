(function() {
  var rest = require('restler');
  var settings = require('../settings');
  var _ = require('underscore');
  var client = null;
  
  Client = rest.service(function(baseUrl, clientId, clientSecret) {
    this.baseURL = baseUrl;
    this._clientId = clientId;
    this._clientSecret = clientSecret;
  }, { }, {
    createUser: function(name, callback) {
      return this.post('/1/users', {
        username: this._clientId,
        password: this._clientSecret,
        data: {
          name: name
        }
      });
    },
    listFiles: function (accessToken, userId) {
      return this.get('/1/users/' + userId + '/files', {
        headers: {
          'Authorization': 'Bearer ' + accessToken
        }
      });
    },
    createFile: function (accessToken, userId, name, type) {
      return this.post('/1/users/' + userId + '/files', {
        headers: {
          'Authorization': 'Bearer ' + accessToken
        },
        data: {
          name: name,
          type: type
        }
      });
    },
    joinFile: function (accessToken, userId, fileId, algorithm, protocolVersion) {
      return this.get('/1/users/' + userId + '/files/' + fileId + '/join?algorithm=' + algorithm + '&protocolVersion=' +  protocolVersion, {
        headers: {
          'Authorization': 'Bearer ' + accessToken
        },
        data: {
        }
      });
    },
    getFile: function (accessToken, userId, fileId) {
      return this.get('/1/users/' + userId + '/files/' + fileId, {
        headers: {
          'Authorization': 'Bearer ' + accessToken
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