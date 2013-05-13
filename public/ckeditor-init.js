$(document).ready(function() {
  var location = window.document.location;
  var path = location.pathname.split('/');
  var fileId = path[2];
  var serverUrl = location.protocol + '//' + location.host + '/' + path[1] + '/' + fileId + '';

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
  
  function addNewCollaborator(id, name) {
    var roleSelect = $('<select>');
    roleSelect.data('id', id);
    
    var roleGroup = $('<optgroup label="Role">')
    var removeGroup = $('<optgroup label="Remove"><option value="REMOVE">Remove</option></optgroup>')
    
    $.each([['Writer', 'WRITER'], ['Reader', 'READER']], function(index, value) {
      roleGroup.append($('<option>').html(value[0]).val(value[1]));
    });

    roleGroup.appendTo(roleSelect);
    removeGroup.appendTo(roleSelect);

    var collaboratorsTable = $('#collaborators-container table');
    var row = $('<tr>');
    row.append($('<td>' + name + '</td>'));
    row.append($('<td>').append(roleSelect));
    
    collaboratorsTable.append(row);
  };
  
  $( "#collaborators-select" ).autocomplete({
  	source: function( request, response ) {
    	$.ajax({
    		url: '/users/search?email=' + request.term,
    		dataType: 'json',
        accepts: {
          'json' : 'application/json'
        }
      }).success(function (data, textStatus, jqXHR) {
        response(data);
      });
  	},
  	select: function( event, ui ) {
  	  event.preventDefault();
  	  
  	  var item = ui.item;
  	  
  	  $(this).val('');
  	  
  	  addNewCollaborator(item.value, item.label);
  	}
  });
  
  $('input[name=save]').click(function (event) {
    var saveButton = event.target;
    var selects = $($(saveButton).parent().find('select'));
    
    var data = new Array();
    $.each(selects, function (index, selectElement) {
      if (!$(selectElement).is(':disabled')) {
        var userId = $(selectElement).data('id');
        var role = $(selectElement).val();
        data.push({
          userId: userId,
          role: role
        });
      }
    });
    
    $.ajax({
      type: 'POST',
      url: '/files/' + fileId + '/users',
      dataType: 'json',
      accepts: {
        'json' : 'application/json'
      },
      data: JSON.stringify(data),
      contentType: 'application/json; charset=utf-8'
    });
  });
  
  $('.collaborators-button').click(function (event) {
    $('#collaborators-container').toggle();
  });
  
});