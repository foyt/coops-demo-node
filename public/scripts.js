function openNewFileDialog(event) {
  var target = event.target;
  var type = $(target).data('type');
  var dialogId = $(target).data('dialog-id');
  
  function closeDialog() {
    $('#' + $(target).data('dialog-id')).remove();
    $(target).data('dialog-id', null);
  };
  
  if (!dialogId) {
    $.ajax({
      url: "/newfiledialog?type=" + type,
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
        $.ajax({
          method: 'post',
          url: "/files?type=" + type + '&name=' + $(content).find('input[type="text"]').val()
        }).done(function ( data ) {
          window.location.reload();
        });
      });
    });
  }
};