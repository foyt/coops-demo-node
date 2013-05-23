(function() {

  var apiClient = require('./apiclient');

  module.exports.fileJoin = function (req, res) {
    if (req.user) {
      var fileId = req.params.fileid;
      var algorithm = req.query['algorithm'];
      var protocolVersion = req.query['protocolVersion'];
      
      apiClient.get(function (client) {
        client.joinFile(req.user.accessToken, req.user.userId, fileId, algorithm, protocolVersion).on('complete', function(data, response) {
          if (response) {
            res.send(data, response.statusCode);
          } else {
            res.send("Could not connect to Co-Ops server.", 500);
          }
        });    
      });
    } else {
      res.send("Unauthorized", 401);
    }
  };
  
  module.exports.fileGet = function (req, res) {
    if (req.user) {
      var fileId = req.params.fileid;
      
      apiClient.get(function (client) {
        client.getFile(req.user.accessToken, req.user.userId, fileId).on('complete', function(data, response) {
          if (response) {
            res.send(data, response.statusCode);
          } else {
            res.send("Error occured while listing user files from Co-Ops server.", 500);
          }
        });
      }); 
    } else {
      res.send("Unauthorized", 401);
    }
  };
  
  module.exports.fileSave = function (req, res) {
    
  };
  
  module.exports.filePatch = function (req, res) {
    
  };
  
  module.exports.fileCreate = function (req, res) {
    if (req.user) {
      var name = req.body['name'];
      var content = req.body['content'];
      var contentType = req.body['contentType'];
      
      apiClient.get(function (client) {
        client.createFile(req.user.accessToken, req.user.userId, name, content, contentType).on('complete', function(data, response) {
          if (response) {
            res.send(data, response.statusCode);
          } else {
            res.send("Error occured while listing user files from Co-Ops server.", 500);
          }
        });      
      });
    } else {
      res.send("Unauthorized", 401);
    }
  };
  
}).call(this);