$(document).ready(function() {
  
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

    var collaboratorsTable = $('#collaborators-dialog .collaborators-dialog-users-container table');
    var row = $('<tr>');
    row.append($('<td>' + name + '</td>'));
    row.append($('<td>').append(roleSelect));
    
    collaboratorsTable.append(row);
  };
  
  $('.collaborators-button').click(function (event) {
    $("#collaborators-dialog").dialog({
      width: 550,
      height: 350,
      modal: true,
      buttons: {
        "Save": function () {
          var selects = $("#collaborators-dialog select");
          var location = window.document.location;
          var path = location.pathname.split('/');
          var fileId = path[2];
          
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
            contentType: 'application/json; charset=utf-8',
            success: function (data, textStatus, jqXHR) {
              window.location.reload();
            }
          });
        },
        "Cancel": function () {
          $( this ).dialog( "close" );
        }
      },
      open: function (event, ui) {
        $( "#collaborators-select" ).autocomplete({
          source: function( request, response ) {
            $.ajax({
              url: '/users/search?email=' + request.term,
              dataType: 'json',
              accepts: {
                'json' : 'application/json'
              }
            }).success(function (data, textStatus, jqXHR) {
              var values = new Array(); 
              
              $.each(data, function (index, item) {
                var existingUserIds = new Array();
                
                $('#collaborators-dialog .collaborators-dialog-users-container table select').each(function (index, selectElement) {
                  existingUserIds.push($(selectElement).data('id'));
                });

                if (existingUserIds.indexOf(item.value) == -1) {
                  values.push(item);
                }
              });
              
              response(values);
            });
          },
          select: function( event, ui ) {
            event.preventDefault();
            
            var item = ui.item;
            
            $(this).val('');
            
            addNewCollaborator(item.value, item.label);
          }
        });
      }
    });
  });
  
});