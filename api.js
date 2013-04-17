(function() {

  var apiClient = require('./apiclient');

  module.exports.fileJoin = function (req, res) {
    var fileId = req.params.fileid;
    var algorithm = req.query['algorithm'];
    var protocolVersion = req.query['protocolVersion'];
    
    apiClient.get(function (client) {
      client.joinFile(req.user.accessToken, req.user.userId, fileId, algorithm, protocolVersion).on('complete', function(data, response) {
        if (response) {
          if (response.statusCode >= 200 && response.statusCode <= 299) {
            res.send(data, response.statusCode);
          } else {
            res.send("Error occured while listing user files from Co-Ops server.", 500);
          }
        } else {
          res.send("Could not connect to Co-Ops server.", 500);
        }
      });    
    });
  };
  
  module.exports.fileGet = function (req, res) {
    var fileId = req.params.fileid;
    
    apiClient.get(function (client) {
      client.getFile(req.user.accessToken, req.user.userId, fileId).on('complete', function(data, response) {
        if (response.statusCode >= 200 && response.statusCode <= 299) {
          res.send(data, response.statusCode);
        } else {
          res.send("Error occured while retriving file content from Co-Ops server.", 500);
        }
      });
    }); 
  };
  
  module.exports.fileSave = function (req, res) {
    
  };
  
  module.exports.filePatch = function (req, res) {
    
  };
  
  module.exports.fileCreate = function (req, res) {
    var name = req.query['name'];
    var type = req.query['type'];
    
    apiClient.get(function (client) {
      client.createFile(req.user.accessToken, req.user.userId, name, type).on('complete', function(data, response) {
        if (response.statusCode >= 200 && response.statusCode <= 299) {
          res.send(data, response.statusCode);
        } else {
          res.send("Error occured while listing user files from Co-Ops server.", 500);
        }
      });      
    });
  };
  
}).call(this);