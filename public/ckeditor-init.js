$(document).ready(function() {
  var location = window.document.location;
  var path = location.pathname.split('/');
  var serverUrl = location.protocol + '//' + location.host + '/' + path[1] + '/' + path[2] + '';
  
  CKEDITOR.plugins.addExternal('change', '/ckplugins/change/');
  CKEDITOR.plugins.addExternal('coops', '/ckplugins/coops/');
  CKEDITOR.plugins.addExternal('coops-dmp', '/ckplugins/coops-dmp/');
  CKEDITOR.plugins.addExternal('coops-ws', '/ckplugins/coops-ws/');
  CKEDITOR.plugins.addExternal('mrmonkey', '/ckplugins/mrmonkey/');
  
  CKEDITOR.appendTo( 'ckcontainer', { 
    skin: 'moono',
    extraPlugins: 'coops-ws,coops-dmp,coops,mrmonkey',
    coops: {
      serverUrl: serverUrl,
      websocket: {
        cursorsVisible: true,
        cursorAlpha: 0.9,
        cursorBlinks: true,
        cursorBlinkInterval: 1.2
      }
    },
    mrmonkey: {
      typeRandom: true,
      // typeRandomInterval: 
      // typeRandomKeyCodes: null
      // typeRandomMaxKeyStrokesAtOnce: 10
      // typeRandomMaxKeyStrokeInterval: 10
      
      pasteLoremIpsum: false,
      // pasteLoremIpsumText
      // pasteLoremIpsumInterval:
      pasteLoremIpsumBlockSize: 10,
      
      selectionChange: false,
      selectionChangeInterval: 10000
      
    }
  }, 'Content loading...');
  
});