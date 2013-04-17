(function() {

  var database = require('./database');
  var _ = require('underscore');

  module.exports = {
    get: function (keys, callback) {
      database.model.Setting.find({ 'key': { $in: keys } }, callback);
    },
    getOne: function (key, callback) {
	
	  database.model.Setting.findOne({ 'key': key }, function (err, setting) {
	    if (err) {
	      callback(err, null);
	    } else {
	      callback(null, setting != null ? setting.value : null);
	    }
	  });        
	  
    },
    set: function (settings, callback) {
      var keys = _.keys(settings);
      
      var _this = this;
      var count = 0;
      var result = null;
      
	  keys.forEach(function (key) {
        _this.setOne(key, settings[key], function (err, saved) {
          if (err) {
            result = err;
          }
          
          count++;
          
          if (count == keys.length) {
            callback(result);
          }
          
        });
      });
      
    },
    setOne: function (key, value, callback) {
    
      database.model.Setting.findOne({ key: key }, function (err, setting) {
	    if (err) {
	      callback(err, null);
	    } else {
	      if (setting) {
	        setting.value = value;
	        setting.save(callback);
	      } else {
	        new database.model.Setting({key: key, value: value}).save(callback);
	      }
	    }
	  });
    },
    
    
    isInitialized: function (callback) {
      var required = ['coops-server', 'coops-client-id', 'coops-client-secret'];
    
      this.get(required, function (err, settings) {
        if (err) {
          callback(err, null);
        } else {
          var settingMap = _.object(_.pluck(settings, 'key'), _.pluck(settings, 'value'));
          
	      for (var i = 0, l = required.length; i < l; i++) {
	        if (!settingMap[required[i]]) {
  	          return callback(null, false);
	        }
	      }
	      
	      return callback(null, true);
	    }
      });
    }
  };
	  
}).call(this);