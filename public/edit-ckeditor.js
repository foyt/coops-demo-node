$(document).ready(function() {
  var location = window.document.location;
  var path = location.pathname.split('/');
  var fileId = path[2];
  var serverUrl = location.protocol + '//' + location.host + '/' + path[1] + '/' + fileId + '';

  CKEDITOR.plugins.addExternal('change', '/ckplugins/change/');
  CKEDITOR.plugins.addExternal('coops', '/ckplugins/coops/');
  CKEDITOR.plugins.addExternal('coops-rest', '/ckplugins/coops-rest/');
  CKEDITOR.plugins.addExternal('coops-dmp', '/ckplugins/coops-dmp/');
  CKEDITOR.plugins.addExternal('coops-ws', '/ckplugins/coops-ws/');
  CKEDITOR.plugins.addExternal('mrmonkey', '/ckplugins/mrmonkey/');
  
  var editor = CKEDITOR.appendTo( 'ckcontainer', { 
    skin: 'moono',
    extraPlugins: 'coops,coops-rest,coops-ws,coops-dmp,mrmonkey',
    readOnly: true,
    height: 500,
    coops: {
      serverUrl: serverUrl,
      websocket: {
        cursorsVisible: true,
        cursorAlpha: 0.9,
        cursorBlinks: true,
        cursorBlinkInterval: 1.2
      }
    }
  }, 'Content loading...');
  
});