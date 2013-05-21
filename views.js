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
		          res.render('files', { 
		            title : 'Files', 
		            files: data.files,
		            loggedUser: req.user
		          });
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
        // List file users from server
        client.listFileUsers(req.user.accessToken, req.user.userId, req.params.fileid).on('complete', function(userListData, userListResponse) {
          if (!userListResponse) {
            res.send("Could not connect to Co-Ops server.", 500);
          } else {
            if (userListResponse.statusCode >= 200 && userListResponse.statusCode <= 299) {
              var serverFileUsers = userListData;
              var serverUserIds = _.uniq(_.pluck(serverFileUsers, "userId"));
              
			        // find local matches for users
              database.model.User.find({ 'userId': { $in: serverUserIds } }, function (err1, users) {
                if (err1) {
                  res.send(err1, 500);
                } else {
                  var localUserIds = _.pluck(users, '_id');
                  var userMap = new Object();
                  users.forEach(function (user) {
                    userMap[user.userId] = user;
                  });
                  
                  database.model.UserEmail.find({ 'userId': { $in: localUserIds } }, function (err2, userEmails) {
    	              if (err2) {
    				          res.send(err2, 500);
                    } else {
                      var emailMap = _.object(_.pluck(userEmails, 'userId'), _.pluck(userEmails, 'email'));
                  
	                    // Add users to users array
	                    var users = new Array();
	                  
	                    serverFileUsers.forEach(function (serverFileUser) {
	                      var localUser = userMap[serverFileUser.userId];
	                      var name = localUser.name;
                        var email = emailMap[localUser._id];
                        var text = name ? name + (email ? ' <' + email + '>' : '') : email;

	                      users.push({
		                      userId: serverFileUser.userId,
		                      role: serverFileUser.role,
		                      name: text || 'Anonymous'
	      	              });
	                    });
	                  
	                    client.getFile(req.user.accessToken, req.user.userId, req.params.fileid).on('complete', function(fileData, fileResponse) {
	                      if (userListResponse.statusCode >= 200 && userListResponse.statusCode <= 299) {
  	                      res.render('edit_ckeditor', {
      		                  title : fileData.name,
      		                  users: users,
      		           	      loggedUser: req.user,
      		           	      content: fileData.content
      		                });
	                      } else {
	                        res.send("Error occured while retriving file from Co-Ops server.", 500);
	                      }
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
  
  module.exports.fileViewCKEditor = function (req, res) {
    if (!req.user) {
      res.redirect('/');
    } else {
      client.getFile(req.user.accessToken, req.user.userId, req.params.fileid).on('complete', function(fileData, fileResponse) {
        res.render('view_ckeditor', {
          title : fileData.name,
          readOnly: true,
          loggedUser: req.user
        });
      });
    }
  };

  module.exports.usersSearch = function (req, res) {
    if (req.user) {
      var emailQuery = req.query.email;  
      if (emailQuery) {
        // Turn search text into lower case and escape special characters 
    	var searchEmail = emailQuery.toLowerCase().replace(/([^a-z@])/g, "\\$1");
    	var emailRegExp = new RegExp(['.*', searchEmail, '.*'].join(''));
    	database.model.UserEmail.find({email: emailRegExp }, function (err1, results) {
    	  if (err1) {
    		res.send(err1, 500);
          } else {
            var localUserIds = _.without(_.pluck(results, 'userId'), req.user.id);
            var emailMap = _.object(_.pluck(results, 'userId'), _.pluck(results, 'email'));
          
            database.model.User.find( { _id: { $in:  localUserIds } }, function (err2, users) {
      	      if (err2) {
    		    res.send(err2, 500);
    		  } else {
				var result = new Array();
    			users.forEach(function (user) {
  				  result.push({
      		        label: emailMap[user._id],
      		        value: user.userId
        		  });
    	        });
    		  
                res.send(JSON.stringify(result));    		  
    		  }
            });
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
          res.send("[]", 200);
        });
      });
    } else {
      res.send("Unauthorized", 401);
    }
  };
  

}).call(this);