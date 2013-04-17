(function() {
  var apiClient = require('./apiclient');
  var settings = require('./settings');
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
    // TODO: Create admin user
    // TODO: Admin user may modify settings
    
    var keys = ['coops-server', 'coops-client-id', 'coops-client-secret', 'facebook-client-id', 'facebook-client-secret', 'github-client-id', 'github-client-secret'];

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
      'github-client-secret': req.body['github-client-secret']
    }, function (err) {
      if (err) {
        res.send(err, 500);
      } else {
        res.send("Settings saved, please restart service.", 200);
      }
    });
  };
  
  module.exports.fileEditCKEditor = function (req, res) {
    var fileId = req.params.fileId;
    
    res.render('edit_ckeditor', { 
      fileId: fileId,
      title: 'Dokumentti - otsake'
    });
  };
  
  module.exports.fileView = function (req, res) {
  };

}).call(this);