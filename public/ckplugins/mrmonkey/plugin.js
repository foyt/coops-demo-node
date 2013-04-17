/**
 Icon: http://openclipart.org/detail/175261/monkey-head-by-antti.leppa-175261
**/

CKEDITOR.plugins.add( 'mrmonkey', { 
  icons: 'togglemrmonkey',
  init: function( editor ) {  
    
    function getSetting(editor, name, defaultValue) {
      return editor.config.mrmonkey[name]||defaultValue;
    }
    
    function scheduleLoremIpsum(editor) {
      CKEDITOR.tools.setTimeout(function() {
        if (editor._mrmonkey.running) {
          editor.fire('mrmonkey:pasteLoremIpsum');
        }
      }, getSetting(editor, 'pasteLoremIpsumInterval', 1000 * 2));
    }

    function scheduleRandomTyping(editor) {
      CKEDITOR.tools.setTimeout(function() {
        if (editor._mrmonkey.running) {
          editor.fire('mrmonkey:randomTyping');
        }
      }, getSetting(editor, 'typeRandomInterval', 1000 * 2));
    }
    
    function scheduleSelectionChange(editor) {
      CKEDITOR.tools.setTimeout(function() {
        if (editor._mrmonkey.running) {
          editor.fire('mrmonkey:changeSelection');
        }
      }, getSetting(editor, 'selectionChangeInterval', 1000 * 2));
    }
    
    editor.on('mrmonkey:toggle', function (event) {
      var editor = event.editor;
    
      editor._mrmonkey.running = !editor._mrmonkey.running;
      if (event.editor._mrmonkey.running) {
	    if (getSetting(editor, 'pasteLoremIpsum', false)) {
	      scheduleLoremIpsum(editor);
	    }
	    
	    if (getSetting(editor, 'typeRandom', false)) {
	      scheduleRandomTyping(editor);
	    }
	        
	    if (getSetting(editor, 'selectionChange', false)) {
	      scheduleSelectionChange(editor);
	    }  
      }
    });

    editor.on('mrmonkey:randomTyping', function (event) {
      var characters = Math.round(Math.random() * getSetting(editor, 'typeRandomMaxKeyStrokesAtOnce', 10));
      while (characters >= 0) {
        var keypressInterval = Math.round(Math.random() * getSetting(editor, 'typeRandomMaxKeyStrokeInterval', 1000)); 
        CKEDITOR.tools.setTimeout(function() {
          var codes = editor._mrmonkey.typeRandomKeyCodes.length - 1;
          var index = Math.round(Math.random() * codes);
          var keyCode = editor._mrmonkey.typeRandomKeyCodes[index];

          // Simulate key event        
          editor.fire('key', {
            keyCode: keyCode
          });
        
          // Add character into the editor
          editor.insertHtml(String.fromCharCode(keyCode));
        }, keypressInterval);
        
        characters--;
      }
      
      scheduleRandomTyping(event.editor);
    });
      
    editor.on('mrmonkey:pasteLoremIpsum', function (event) {
      // Get random data
      var loremIpsumLength = editor._mrmonkey.loremIpsum.length;
      var blockSize = getSetting(editor, 'pasteLoremIpsumBlockSize', 200);
      var characters = Math.round((Math.random() * blockSize) + 1);
      var offset = Math.round(Math.random() * (loremIpsumLength - characters) - 1);
      var data = editor._mrmonkey.loremIpsum.substring(offset, characters);
      
      // Simulate beforepaste event
      editor.fire( 'beforePaste', {
        type: 'auto' 
      });
      
      // Simulate paste event
      editor.fire( 'paste', {
        type: 'auto',
        dataValue: data
      });
      
      // Schedule new lorem paste      
      scheduleLoremIpsum(event.editor);
    });
    
    editor.on('mrmonkey:changeSelection', function (event) {

      function getRandomChild(element) {
        var children = element.getChildren();
        if (children.count() == 0) {
          return element;
        } else {
          var child = children.getItem(Math.round(Math.random() * (children.count() - 1)));
          if (child.type == CKEDITOR.NODE_ELEMENT) {
            return getRandomChild(child); 
          } else {
            return child;    
          }
        }
      }

      var selectRanges = (getSetting(editor, 'selectRanges', false));
      var selection = editor.getSelection();
      var range = new CKEDITOR.dom.range(editor.document);
      var selected = getRandomChild(editor.document.getBody());
      if (selected.type == CKEDITOR.NODE_TEXT) {
        var selectedContentLength = selected.getLength();
        var index = Math.round(Math.random() * (selectedContentLength - 1));
        range.setStart( selected, index );
        range.setEnd( selected, index);
      } else {
        range.selectNodeContents(selected);
      }
      
      selection.selectRanges([range]);

      // Schedule new selection change      
      scheduleSelectionChange(event.editor);
    });
    
    editor._mrmonkey = {
      running: false
    };

    editor.ui.addButton( 'ToggleMrMonkey', {
      label: 'Toggle MrMonkey',
      command: 'toggleMrMonkey',
      toolbar: 'insert'
    });
    
    var toggleCommand = new CKEDITOR.command( editor, {
      exec: function( editor ) {
        this.setState(editor._mrmonkey.running == true ? CKEDITOR.TRISTATE_OFF : CKEDITOR.TRISTATE_ON);
        editor.fire('mrmonkey:toggle');
      }
    });
    
    editor.addCommand( "toggleMrMonkey", toggleCommand);

    if (getSetting(editor, 'pasteLoremIpsum', false)) {
      editor._mrmonkey.loremIpsum = getSetting(editor, 'pasteLoremIpsumText', 
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. In vel scelerisque nunc. Integer condimentum quam ut velit lobortis at tincidunt felis viverr' + 
        'a. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Pellentesque auctor mauris sed urna dictum fringilla. Donec' + 
        ' vel egestas quam. Maecenas faucibus pulvinar ante vitae imperdiet. Sed a augue ac nisl volutpat mattis eu a nisl. Mauris consectetur suscipit neque, ' + 
        'eu fermentum elit sollicitudin eu.\n' + 
        'Proin porttitor fermentum tincidunt. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Donec sapien ipsum, f' + 
        'eugiat eget ornare ac, facilisis et nulla. Donec vel ante diam. Ut dui est, consequat eu placerat ut, varius et tortor. Vivamus dictum eros ac ante al' + 
        'iquet ut bibendum libero egestas. Vivamus accumsan dignissim accumsan.\n' + 
        'Pellentesque consectetur tellus quis orci ultrices vitae lacinia risus lacinia. Vestibulum gravida mi rhoncus dolor porta aliquet. Phasellus nec vulpu' + 
        'tate dolor. Sed in massa ac massa blandit imperdiet. Vestibulum mollis rhoncus rhoncus. Integer turpis ligula, condimentum venenatis rhoncus non, vest' + 
        'ibulum a velit. Pellentesque nulla ipsum, convallis at cursus non, pharetra eget dolor. Proin suscipit urna tempus erat eleifend non consequat augue f' + 
        'ringilla. Nam at imperdiet neque. Donec vulputate, leo quis posuere varius, est ipsum congue mi, in suscipit urna nulla sit amet tellus. Donec ut libe' + 
        'ro velit. Ut et massa lectus. Integer pretium commodo nulla a mollis.');
    }
    
    if (getSetting(editor, 'typeRandom', false)) {
      editor._mrmonkey.typeRandomKeyCodes = getSetting(editor, 'typeRandomKeyCodes', [13,32,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122]);
    }
  }
});