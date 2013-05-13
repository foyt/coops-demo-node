(function() {

  var passport = require('passport');
  var FacebookStrategy = require('passport-facebook').Strategy;
  var GitHubStrategy = require('passport-github').Strategy;
  var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
  var passport = require('passport');
  var database = require('./database.js');
  var apiClient = require('./apiclient');
  var settings = require('./settings');
  var rest = require('restler');
  var _ = require('underscore');
  
  function resolveUser(identifier, emails, callback) {
    database.model.UserIdentifier.findOne({ identifier: identifier }, function (uidErr, userIdentifier) {
      if (uidErr) {
        // Error occurred while trying to find UserIdentifier
        callback(uidErr, null);
      } else {
        if (userIdentifier != null) {
          // UserIdentifier found, trying to find matching User 
          database.model.User.findOne({ _id: userIdentifier.userId }, function (userErr, user) {
            callback(userErr, user);
          });
        } else {
          database.model.UserEmail.find({ 'email': { $in: emails } }, function (emailErr, userEmails) {
            if (userEmails.length == 0) {
              // Could not find user, returning null
              callback(null, null);
            } else {
              var firstUserId = userEmails[0].userId;
              userEmails.forEach(function (userEmail) {
                if (userEmail.userId != firstUserId) {
                  callback("Several users found with given set of emails", null);
                  return;
                }
              });
              
              database.model.User.findOne({ _id: firstUserId }, function (userErr, user) {
                callback(userErr, user);
              });
            }
          });
        }
      }
    });
  };
  
  function newUser(identifier, name, emails, callback) {
    new database.model.User({ name: name }).save(function (err, newUser) {
      if (err) {
        return callback(err, null);
      } else {
        new database.model.UserIdentifier({
          userId: newUser._id,
          identifier: identifier
        }).save(function (err, userIdentifier) {
          callback(null, newUser);
        });
      }
    });
  };
  
  function addUserEmails(user, emails, callback) {
    var result = new Array();
    database.model.UserEmail.find({ 'email': { $in: emails } }, function (err, userEmails) {
      var existingEmails = _.pluck(userEmails, 'email');
      var missingEmails = emails;
      existingEmails.forEach(function (existingEmail) {
        missingEmails = _.without(emails, existingEmail);
      });
      
      if (missingEmails.length == 0) {
        callback(null);
      } else { 
        missingEmails.forEach(function (email) {
          new database.model.UserEmail({ userId: user._id, email: email }).save(function (err2, userMail) {
	        result.push(err2);        
		  
		    if (result.length == missingEmails.length) {
		      callback(result);
		    }
          }); 
        });
      }
    });
  }
  
  function loginUser(identifier, emails, name, callback) {
    resolveUser(identifier, emails, function (err, user) {
      if (err) {
        return callback(err, null);
      } else {
        if (user == null) {
          newUser(identifier, name, emails, function (err, user) {
            addUserEmails(user, emails, function (errs) {
              callback(err, user);
            });
          });
        } else {
          addUserEmails(user, emails, function (errs) {
            return callback(null, user);
          });
        }
      }
    });
  }
  
  function loginCoOps(user, callback) {
    if (!user.accessToken) {
      apiClient.get(function (client) {
        client.createUser(user.name).on('complete', function(data, response) {
          if (response.statusCode >= 200 && response.statusCode <= 299) {
            var resp = data['response'];
            if (!resp) {
              callback("Invalid response from CoOPS server.", null);
            } else {
	          var tokenResponse = resp['access_token'];
	          
	          user.userId = resp['user_id'];
	          user.accessToken = tokenResponse['access_token'];
	          user.refreshToken = tokenResponse['refresh_token'];
	          user.tokenExpires = new Date().getTime() + tokenResponse['expires_in'];
	          
	          user.save(function (err, user) {
	            callback(err, user);
	          });
            }
          } else {
            callback("Could not connect to Co-Ops Server.", null);
          }
        });
      });
    } else {
      callback(null, user);
    }
  }
  
  passport.serializeUser(function(user, done) {
    done(null, user._id);
  });
  
  passport.deserializeUser(function(id, done) {
    database.model.User.findOne({ _id: id }, function (userErr, user) {
      done(userErr, user);
    });
  });
  
  settings.get(['facebook-client-id', 'facebook-client-secret'], function (err, settings) {
    var settingMap = _.object(_.pluck(settings, 'key'), _.pluck(settings, 'value'));
  
    if (settingMap['facebook-client-id'] && settingMap['facebook-client-secret']) {
	  passport.use(new FacebookStrategy({
	      clientID: settingMap['facebook-client-id'],
	      clientSecret: settingMap['facebook-client-secret'],
	      callbackURL: "/auth/facebook/callback"
	    },
	    function(accessToken, refreshToken, profile, done) {
	      process.nextTick(function(){
	        var identifier = 'facebook-' + profile.id;
	        var emails = _.pluck(profile.emails, 'value');
	
	        loginUser(identifier, emails, profile.name, function (err, user) {
	          loginCoOps(user, function (err, loggedUser) {
	            done(err, loggedUser);              
	          });
	        });
	      });
	    }
	  ));
    }
  });
  
  settings.get(['github-client-id', 'github-client-secret'], function (err, settings) {
    var settingMap = _.object(_.pluck(settings, 'key'), _.pluck(settings, 'value'));
  
    if (settingMap['github-client-id'] && settingMap['github-client-secret']) {
      passport.use(new GitHubStrategy({
          clientID: settingMap['github-client-id'],
          clientSecret: settingMap['github-client-secret'],
          callbackURL: "/auth/github/callback"
        },
        function(accessToken, refreshToken, profile, done) {
          process.nextTick(function(){
            var identifier = 'github-' + profile.id;
            var emails = _.pluck(profile.emails, 'value');

            rest.get('https://api.github.com/user/emails', {
              headers: {
                'Accept': 'application/vnd.github.v3',
                'Authorization': 'token ' + accessToken
              }
            }).on('complete', function(result) {
  			  if (result instanceof Error) {
  			    done(result, null);
  			  } else {
  			    var emails = _.pluck(result, 'email');
  			    
  			    loginUser(identifier, emails, profile.name, function (err, user) {
	              loginCoOps(user, function (err, loggedUser) {
	                done(err, loggedUser);              
	              });
	            });
  			  }
	        });
          });
        }
      ));
    }
  });
  
  settings.get(['google-client-id', 'google-client-secret'], function (err, settings) {
    var settingMap = _.object(_.pluck(settings, 'key'), _.pluck(settings, 'value'));
  
    if (settingMap['google-client-id'] && settingMap['google-client-secret']) {
  	  passport.use(new GoogleStrategy({
  	    clientID: settingMap['google-client-id'],
  	    clientSecret: settingMap['google-client-secret'],
  	    callbackURL: "/auth/google/callback"
  	  },
	    function(accessToken, refreshToken, profile, done) {
	      process.nextTick(function(){
	        var identifier = 'google-' + profile.id;
	        var emails = _.pluck(profile.emails, 'value');
	
			var name = profile.name.givenName;
  			if (name && profile.name.familyName) {
  			  name += ' ' + profile.name.familyName;
  			}
  			    
  			if (!name) {
  			  name = 'Anonymous';
  			}
  			    
	        loginUser(identifier, emails, name, function (err, user) {
	          loginCoOps(user, function (err, loggedUser) {
	            done(err, loggedUser);              
	          });
	        });
	      });
	    }
	    ));
    }
  });
  
}).call(this);