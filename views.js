(function() {
  var apiClient = require('./apiclient');
  var settings = require('./settings');
  var database = require('./database.js');
  var _ = require('underscore');
  
  /* Views */
  
  module.exports.root = function (req, res) {
    settings.isInitialized(function (err, initialized) {
      if (!initialized) {
        res.redirect('/setup');
      } else {
        if (!req.user) {
		  res.render('login', { title : 'Login' })
		} else {
		  apiClient.get(function (client) {
		    client.listFiles(req.user.accessToken, req.user.userId).on('complete', function(data, response) {
		      if (!response) {
  		        res.send("Could not connect to Co-Ops server.", 500);
		      } else {
		        if (response.statusCode >= 200 && response.statusCode <= 299) {
		          var resp = data['response'];
		          res.render('files', { title : 'Files', files: resp.files })
		        } else {
		          res.send("Error occured while listing user files from Co-Ops server.", 500);
		        }
		      }
		    });		  
		  });
        }
      }
    });
  };
  
  module.exports.newFileDialog = function (req, res) {
    res.render('newfiledialog', { title: 'Create New Document (CKEditor)', type: req.query.type });
  };
  
  module.exports.setup = function (req, res) {
    var keys = ['coops-server', 'coops-client-id', 'coops-client-secret', 
                'facebook-client-id', 'facebook-client-secret', 
                'github-client-id', 'github-client-secret', 
                'google-client-id', 'google-client-secret'];

    settings.get(keys, function (err, settings) {
      res.render('setup', { title: "Setup", settings: _.object(_.pluck(settings, 'key'), _.pluck(settings, 'value')) });
    });
  };
  
  module.exports.saveSetup = function (req, res) {
    settings.set({
      'coops-server': req.body['coops-server'],
      'coops-client-id': req.body['coops-client-id'],
      'coops-client-secret': req.body['coops-client-secret'],
      'facebook-client-id': req.body['facebook-client-id'],
      'facebook-client-secret': req.body['facebook-client-secret'],
      'github-client-id': req.body['github-client-id'],
      'github-client-secret': req.body['github-client-secret'],
      'google-client-id': req.body['google-client-id'],
      'google-client-secret': req.body['google-client-secret']
    }, function (err) {
      if (err) {
        res.send(err, 500);
      } else {
        res.send("Settings saved, please restart service.", 200);
      }
    });
  };
  
  module.exports.fileEditCKEditor = function(req, res) {
    if (!req.user) {
      res.redirect('/');
    } else {
      apiClient.get(function (client) {
        client.listFileUsers(req.user.accessToken, req.user.userId, req.params.fileid).on('complete', function(data, response) {
          if (!response) {
              res.send("Could not connect to Co-Ops server.", 500);
          } else {
            if (response.statusCode >= 200 && response.statusCode <= 299) {
              var fileUsers = data['response'];
              var userIds = _.uniq(_.pluck(fileUsers, "userId"));
              
              database.model.User.find({ 'userId': { $in: userIds } }, function (err1, users) {
                if (err1) {
                  res.send(err1, 500);
                } else {
                  var userMap = _.object(_.pluck(users, 'userId'), _.pluck(users, '_id'));
                
				  database.model.UserEmail.find({ 'userId': { $in: _.uniq(_.pluck(users, "_id")) } }, function (err2, userEmails) {
				    if (err2) {
                      res.send(err2, 500);
                    } else {
				      var emailMap = _.object(_.pluck(userEmails, 'userId'), _.pluck(userEmails, 'email'));
	              
	                  var users = new Array();
	                  fileUsers.forEach(function (fileUser) {
	                    var name = '';
	                    var email = emailMap[userMap[fileUser.userId]];
	                  
	                    users.push({
	                      userId: fileUser.userId,
	                      role: fileUser.role,
	                      name: name,
	                      email: email
      	                });
  	                  });
	                 
	                  res.render('edit_ckeditor', {
	                    title : 'Dokumentti - otsake',
	                    users: users
	                  });
	                }
	              });
	            }
              });
            } else {
              res.send("Error occured while listing user files from Co-Ops server.", 500);
            }
          }
        });
      });
    }
  };
  
  module.exports.fileView = function (req, res) {
  };

  module.exports.usersSearch = function (req, res) {
    if (req.user) {
    	var emailQuery = req.query.email;  
    	if (emailQuery) {
    	  // Turn search text into lower case and escape special characters 
    	  var searchEmail = emailQuery.toLowerCase().replace(/([^a-z@])/g, "\\$1");
    	  var emailRegExp = new RegExp(['.*', searchEmail, '.*'].join(''));
    	  database.model.UserEmail.find({email: emailRegExp }, function (err, results) {
    		if (err) {
    		  res.send(err, 500);
    		} else {
    		  var result = new Array();
    		  results.forEach(function (i) {
    		    if (i.userId != req.user.id) {
      		    result.push({
      		      label: i.email,
      		      value: i.userId
      		    });
    		    }
    		  });
    		  
    		  res.send(JSON.stringify(result));
    		}    
    	  });
    	} else {
        res.send("[]", 200);
      }
    } else {
      res.send("Unauthorized", 401);
    }
  };
  
  module.exports.updateUsers = function (req, res) {
    if (req.user) {
      apiClient.get(function (client) {
        client.updateFileUsers(req.user.accessToken, req.user.userId, req.params.fileid, req.body).on('complete', function(data, response) {
          res.send(200);
        });
      });
    } else {
      res.send("Unauthorized", 401);
    }
  };
  

}).call(this);