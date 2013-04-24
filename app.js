// http://openclipart.org/detail/169130/mapa-de-redes-by-ainara14-169130

var http = require('http');
var express = require('express');
var util = require('util');
var app = express();
var server = http.createServer(app);
var passport = require('passport');
var auth = require('./auth');
var views = require('./views');
var api = require('./api');
var apiClient = require('./apiclient');

app.configure(function () {
  app.use(express.logger());
  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.session({ secret: 'keyboard cat' }));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(app.router);
  
  app.set('views', __dirname + '/views')
  app.set('view engine', 'jade');
  app.use(express.static(__dirname + '/public'));
  
  app.use(express.errorHandler({ 
    dumpExceptions: true, 
    showStack: true 
  }));

  /**
   * Root view (login view or files list depending whether user is logged in or not)
   */
  app.get('/', views.root); 
  
  /**
   * New file dialog
   */
  app.get('/newfiledialog', views.newFileDialog);
  
  /**
   * Setup view
   */
  app.get('/setup', views.setup);
  
  app.post('/setup', views.saveSetup);

  /* Auth */
  
  // Facebook
  app.get('/auth/facebook',  passport.authenticate('facebook', { scope: ['email'] } ));
  app.get('/auth/facebook/callback', passport.authenticate('facebook'), function(req, res) {
    res.redirect('/');
  });
  
  app.get('/auth/github', passport.authenticate('github', { scope: ['user:email'] } ));
  app.get('/auth/github/callback', passport.authenticate('github', { failureRedirect: '/login' }), function(req, res) {
    res.redirect('/');
  });  

  /**
   * Logs user out
   */
  app.get('/auth/logout', function(req, res){
    req.logout();
    res.redirect('/');
  });
  
  // Edit views
  
  app.get('/files/:fileid/edit/ckeditor', views.fileEditCKEditor);
  
  app.get('/files/:fileid/view', views.fileView);

  
  // API
  
  app.post('/files', api.fileCreate);
  
  /**
    Client asks to join the collaboration of a document. 
  **/
  app.get('/files/:fileid/join', api.fileJoin);

  /**
   * Returns a file
   */
  app.get('/files/:fileid', api.fileGet);
  
  /**
   * Saves a file
   */
  app.put('/files/:fileid', api.fileSave);

  /**
   * Patches a file
   */
  app.patch('/files/:fileid', api.filePatch);
  
});

server.listen(process.env.NODE_ENV == 'production' ? 80 : 8080);