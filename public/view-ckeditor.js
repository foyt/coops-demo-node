$(document).ready(function() {
  var location = window.document.location;
  var path = location.pathname.split('/');
  var serverUrl = location.protocol + '//' + location.host + '/' + path[1] + '/' + path[2] + '';

  CKEDITOR.plugins.addExternal('change', '/ckplugins/change/');
  CKEDITOR.plugins.addExternal('coops', '/ckplugins/coops/');
  CKEDITOR.plugins.addExternal('coops-dmp', '/ckplugins/coops-dmp/');
  CKEDITOR.plugins.addExternal('coops-ws', '/ckplugins/coops-ws/');
  
  var editor = CKEDITOR.appendTo( 'ckcontainer', { 
    skin: 'moono',
    extraPlugins: 'coops-ws,coops-dmp,coops',
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
  
  editor.on( 'instanceReady', function(event) {
    editor.setReadOnly(true);
  });

});