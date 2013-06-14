(function() {

  CKEDITOR.plugins.add('coops-rest', {
    requires : [ 'coops' ],
    init : function(editor) {
      
      RestConnector = CKEDITOR.tools.createClass({
        base : CKEDITOR.coops.Feature,
        $ : function(editor) {
          this.base(editor);
          
          editor.on('CoOPS:Join', this._onCoOpsJoin, this);
        },
        proto : {
          getName: function () {
            return 'rest';
          },
          
          _onCoOpsJoin: function (event) {
            var protocolVersion = event.data.protocolVersion;
            var algorithms = event.data.algorithms;
            var editor = event.editor;
            
            this._fileJoin(algorithms, protocolVersion, CKEDITOR.tools.bind(function (status, responseJson, error) {
              if (error) {
                // TODO: Proper error handling
                alert('Could not join:' + error);
              } else {
                editor.fire("CoOPS:Joined", responseJson);
              }
            }));
          },
          
          _fileJoin: function (algorithms, protocolVersion, callback) {
            var parameters = new Array();
            for (var i = 0, l = algorithms.length; i < l; i++) {
              parameters.push({
                name: 'algorithm',
                value: algorithms[i]
              });
            }
            
            parameters.push({
              name: 'protocolVersion',
              value: protocolVersion
            });
          
            var url = this._editor.config.coops.serverUrl + '/join';
      
            this._doGet(url, parameters, callback);
          },

          _doGet: function (url, parameters, callback) {
            this._doGetRequest(url, parameters, function (status, responseText) {
              if (!responseText) {
                // Request was probably aborted...
                return;
              }
              
              try {
                if (status != 200) {
                  callback(status, null, responseText);
                } else {
                  var responseJson = eval("(" + responseText + ")");
                  callback(status, responseJson, null);
                }
              } catch (e) {
                callback(status, null, e);
              }
              
            });
          },
          
          _doPost: function (url, object, callback) {
            this._doJsonPostRequest("post", url, object, callback);
          },
          
          _doPut: function (url, object, callback) {
            this._doJsonPostRequest("put", url, object, callback);
          },
          
          _doPatch: function (url, object, callback) {
            this._doJsonPostRequest("patch", url, object, callback);
          },
          
          _doDelete: function (url, object, callback) {
            this._doJsonPostRequest("delete", url, object, callback);
          },
          
          _doJsonPostRequest: function (method, url, object, callback) {
            var data = this._toJsonString(object);
      
            this._doPostRequest(method, url, encodeURIComponent(data), function (status, responseText) {
              if (!responseText) {
                // Request was probably aborted...
                return;
              }
              
              try {
                if (status != 200) {
                  callback(status, null, responseText);
                } else {
                  var responseJson = eval("(" + responseText + ")");
                  callback(status, responseJson, null);
                }
              } catch (e) {
                callback(status, null, e);
              }
            });
          },
      
          _processParameters: function (parameters) {
            var result = '';
            if ((parameters) && (parameters.length > 0)) {
              for (var i = 0, l = parameters.length; i < l; i++) {
                if (i > 0) {
                  result += '&';
                }
                result += encodeURIComponent(parameters[i].name) + '=' + encodeURIComponent(parameters[i].value);  
              }
            }
            
            return result;
          }, 
          
          _doGetRequest: function (url, parameters, callback) {
            var xhr = this._createXMLHttpRequest();
            xhr.open("get", url + ((parameters.length > 0) ? '?' + this._processParameters(parameters) : ''), false);
            xhr.send(null);
            callback(xhr.status, xhr.responseText);
          },
              
          _doPostRequest: function (method, url, data, callback) {
            var xhr = this._createXMLHttpRequest();
            xhr.open(method, url, false);
            xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
            
            if (!CKEDITOR.env.webkit) {
              // WebKit refuses to send these headers as unsafe
              xhr.setRequestHeader("Content-length", data ? data.length : 0);
              xhr.setRequestHeader("Connection", "close");
            }

            xhr.send(data);
            
            callback(xhr.status, xhr.responseText);
          },
          
          _createXMLHttpRequest: function() {
            if ( !CKEDITOR.env.ie || location.protocol != 'file:' )
            try { return new XMLHttpRequest(); } catch(e) {}
            try { return new ActiveXObject( 'Msxml2.XMLHTTP' ); } catch (e) {}
            try { return new ActiveXObject( 'Microsoft.XMLHTTP' ); } catch (e) {}
            return null;
          }
        }
      });
      
      editor.on('CoOPS:BeforeJoin', function(event) {
        event.data.addConnector(new RestConnector(event.editor));
      });

    }
  });
  
}).call(this);