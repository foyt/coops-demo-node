// http://openclipart.org/detail/169130/mapa-de-redes-by-ainara14-169130

var http = require('http');
var https = require('https');
var fs = require('fs');
var express = require('express');
var util = require('util');
var app = express();
var passport = require('passport');
var auth = require('./auth');
var views = require('./views');
var api = require('./api');
var apiClient = require('./apiclient');

if (process.env.COOPS_DEMO_UNSECURE_PORT) {
  var unsecureServer = http.createServer(app);
  unsecureServer.listen(process.env.COOPS_DEMO_UNSECURE_PORT);
  console.log("Listening unsecure port " + process.env.COOPS_DEMO_UNSECURE_PORT);
}

if (process.env.COOPS_DEMO_SECURE_PORT && process.env.COOPS_DEMO_SECURE_CERT && process.env.COOPS_DEMO_SECURE_CERT_KEY) {
  var certificate = { 
    key: fs.readFileSync(process.env.COOPS_DEMO_SECURE_CERT_KEY).toString(), 
    cert: fs.readFileSync(process.env.COOPS_DEMO_SECURE_CERT).toString() 
  };

  secureServer = https.createServer(certificate, app);
  secureServer.listen(process.env.COOPS_DEMO_SECURE_PORT);
  console.log("Listening secure port " + process.env.COOPS_DEMO_SECURE_PORT);
}

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
  
  // GitHub
  app.get('/auth/github', passport.authenticate('github', { scope: ['user:email'] } ));
  app.get('/auth/github/callback', passport.authenticate('github', { failureRedirect: '/login' }), function(req, res) {
    res.redirect('/');
  });  
  
  // Google
  app.get('/auth/google', passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/userinfo.email'] } ));
  app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), function(req, res) {
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
  
  app.get('/files/:fileid/view/ckeditor', views.fileViewCKEditor);
  
  // File users
  
  app.post('/files/:fileid/users', views.updateUsers);

  // Users
  
  app.get('/users/search', views.usersSearch);

  
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