function openNewFileDialog(event) {
  var target = event.target;
  var contentType = $(target).data('type');
  var dialogId = $(target).data('dialog-id');
  
  function closeDialog() {
    $('#' + $(target).data('dialog-id')).remove();
    $(target).data('dialog-id', null);
  };
  
  if (!dialogId) {
    $.ajax({
      url: "/newfiledialog?contentType=" + contentType,
    }).done(function ( data ) {
      var content = $(data).css({opacity: 0}).appendTo($(document.body));
      var targetOffset = $(target).offset();
      var targetHeight = $(target).outerHeight();
      var marginTop = 8;
      
      content.offset({
        top: targetOffset.top + targetHeight + marginTop,
        left: targetOffset.left
      });
      
      content.css({
        opacity: 1
      }).hide().show("fast");

      var dialogId = content.attr("id");
      $(target).data('dialog-id', dialogId);

      $(document).mousedown(function (event) {
        var target = $(event.target);
        if ((target.closest('.dialog').length == 0)) {
          closeDialog();
        }
      });
      
      $(content).find('input[type="text"]').focus();
      $(content).find('input[name="cancel"]').click(function (event) {
        closeDialog();
      });
      
      $(content).find('input[name="create"]').click(function (event) {
        var name = $(content).find('input[name="name"]').val();
        $.ajax({
          method: 'post',
          url: '/files',
          data: {
            name: name,
            content: '',
            contentType: contentType
          }
        }).done(function ( data ) {
          window.location.reload();
        }).error(function (jqXHR, textStatus, errorThrown) {
          alert(jqXHR.responseText || errorThrown);
        });
      });
    });
  }
};