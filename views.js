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
		      res.render('login', { 
		        title : 'Login',
            loggedUser: null
		      })
		    } else {
		      apiClient.get(function (client) {
		        client.listFiles(req.user, req.user.userId, function(err, files) {
		          if (err) {
  		          res.send(err, 500);
		          } else {
		            res.render('files', { 
		              title : 'Files', 
		              files: files,
		              loggedUser: req.user
		            });
		          }
		        });		  
		      });
        }
      }
    });
  };
  
  module.exports.newFileDialog = function (req, res) {
    var contentType = req.query.contentType.split(';');
    var mimeType = contentType[0];
    var parametersArray = (contentType[1]||'').split('=');
    var parameters = new Object();
    for (var i = 0, l = parametersArray.length; i < l; i += 2) {
      parameters[parametersArray[i]] = ((i + 1) < l) ? parametersArray[i + 1] : '';
    }
    
    var title = mimeType == 'text/html' ? 'Create New Document' : 'Create New File';
    
    var editor = parameters['editor'];
    if (editor) {
      title += ' (' + editor + ')';
    }
    
    res.render('newfiledialog', { title: title });
  };
  
  module.exports.setup = function (req, res) {
    var keys = ['coops-server', 'coops-client-id', 'coops-client-secret', 
                'facebook-client-id', 'facebook-client-secret', 
                'github-client-id', 'github-client-secret', 
                'google-client-id', 'google-client-secret'];

    settings.get(keys, function (err, settings) {
      res.render('setup', { 
        title: "Setup", 
        settings: _.object(_.pluck(settings, 'key'), _.pluck(settings, 'value')),
        loggedUser: req.user
      });
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
        client.listFileUsers(req.user, req.user.userId, req.params.fileid, function(err1, userListData) {
          if (err1) {
            res.send(err1, 500);
          } else {
            var serverFileUsers = userListData;
            var serverUserIds = _.uniq(_.pluck(serverFileUsers, "userId"));
            
		        // find local matches for users
            database.model.User.find({ 'userId': { $in: serverUserIds } }, function (err2, users) {
              if (err2) {
                res.send(err2, 500);
              } else {
                var localUserIds = _.pluck(users, '_id');
                var userMap = new Object();
                users.forEach(function (user) {
                  userMap[user.userId] = user;
                });
                
                database.model.UserEmail.find({ 'userId': { $in: localUserIds } }, function (err3, userEmails) {
  	              if (err3) {
  				          res.send(err3, 500);
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
                  
                    client.getFile(req.user, req.user.userId, req.params.fileid, function(err4, fileData) {
                      if (err4) {
                        res.send(err4, 500);
                      } else {
	                      res.render('edit_ckeditor', {
    		                  title : fileData.name,
    		                  users: users,
    		           	      loggedUser: req.user
    		                });
                      } 
                    });
		              }
                });
              }
            });
          }
        });
      });
    }
  };
  
  module.exports.fileViewCKEditor = function (req, res) {
    if (!req.user) {
      res.redirect('/');
    } else {
      apiClient.get(function (client) {
        client.getFile(req.user, req.user.userId, req.params.fileid, function(err, fileData) {
          if (err) {
            res.send(err, 500);
          } else {
            res.render('view_ckeditor', {
              title : fileData.name,
              loggedUser: req.user,
              content: fileData.content
            });
          }
        });
      });
    }
  };
  
  module.exports.fileHistoryCKEditor = function (req, res) {
    if (!req.user) {
      res.redirect('/');
    } else {
      apiClient.get(function (client) {
        client.getFile(req.user, req.user.userId, req.params.fileid, function(err1, fileData) {
          if (err1) {
            res.send(err1, 500);
          } else {
            client.listFileRevisions(req.user, req.user.userId, req.params.fileid, function(err2, fileRevisions) {
              if (err2) {
                res.send(err2, 500);
              } else {
                var serverUserIds = _.uniq(_.pluck(fileRevisions, 'userId'));
                database.model.User.find({ 'userId': { $in: serverUserIds } }, function (err3, users) {
                  if (err3) {
                    res.send(err3, 500);
                  } else {
                    var localUserIds = _.pluck(users, '_id');
                    var userMap = new Object();
                    users.forEach(function (user) {
                      userMap[user.userId] = user;
                    });
                    
                    database.model.UserEmail.find({ 'userId': { $in: localUserIds } }, function (err4, userEmails) {
                      if (err4) {
                        res.send(err4, 500);
                      } else {
                        var emailMap = _.object(_.pluck(userEmails, 'userId'), _.pluck(userEmails, 'email'));
                        
                        var revisions = new Array();
                        fileRevisions.forEach(function (fileRevision) {
                          var localUser = userMap[fileRevision.userId];
                          var name = localUser.name;
                          var email = emailMap[localUser._id];
                          var text = name ? name + (email ? ' <' + email + '>' : '') : email;
                          var created = new Date(Date.parse(fileRevision.created));

                          revisions.push({
                            revisionNumber: fileRevision.revisionNumber,
                            userName: text || 'Anonymous',
                            created: created.toUTCString(),
                            link: '/files/' + req.params.fileid + '/history/ckeditor/' + fileRevision.revisionNumber
                          });
                        });
                        
                        res.render('history_ckeditor', {
                          title : fileData.name,
                          loggedUser: req.user,
                          revisions: revisions
                        });
                      }
                    });
                  }
                });
              }
            });
          }
        });
      });
    }
  };
  
  module.exports.fileRevisionCKEditor = function (req, res) {
    if (!req.user) {
      res.redirect('/');
    } else {
      apiClient.get(function (client) {
        client.getFileRevision(req.user, req.user.userId, req.params.fileid, req.params.revisionNumber, function(err1, fileRevision) {
          if (err1) {
            res.send(err1, 500);
          } else {
            res.render('revision_ckeditor', {
              title : fileRevision.name,
              backLink: '/files/' + req.params.fileid + '/history/ckeditor',
              revisionNumber: fileRevision.revisionNumber,
              created: new Date(Date.parse(fileRevision.modified)).toUTCString(),
              loggedUser: req.user,
              content: fileRevision.content
            });
          }
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
        client.updateFileUsers(req.user, req.user.userId, req.params.fileid, req.body, function(err, data) {
          if (err) {
            res.send(err, 500);
          } else {
            res.send("[]", 200);
          }
        });
      });
    } else {
      res.send("Unauthorized", 401);
    }
  };
  
  module.exports.about = function (req, res) {
    res.render('about', {
      title : 'CoOps demo (NodeJs)',
      version: '0.0.1',
      loggedUser: req.user
    });
  };
  

}).call(this);