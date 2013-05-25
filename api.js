(function() {

  var apiClient = require('./apiclient');

  module.exports.fileJoin = function (req, res) {
    if (req.user) {
      var fileId = req.params.fileid;
      var algorithm = req.query['algorithm'];
      var protocolVersion = req.query['protocolVersion'];
      
      apiClient.get(function (client) {
        client.joinFile(req.user, req.user.userId, fileId, algorithm, protocolVersion, function(err, data) {
          if (err) {
            res.send(err, 500);
          } else {
            res.send(data, 200);
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
        client.getFile(req.user, req.user.userId, fileId, function(err, data) {
          if (err) {
            res.send(err, 500);
          } else {
            res.send(data, 200);
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
        client.createFile(req.user, req.user.userId, name, content, contentType, function(err, data) {
          if (err) {
            res.send(err, 500);
          } else {
            res.send(data, 200);
          }
        });      
      });
    } else {
      res.send("Unauthorized", 401);
    }
  };
  
}).call(this);