(function() {
  
  CKEDITOR.plugins.add( 'coops-dmp', {
    requires: ['coops'],
	  init: function( editor ) { 
	    CKEDITOR.coops.DmpDifferenceAlgorithm = CKEDITOR.tools.createClass({   
        base: CKEDITOR.coops.DifferenceAlgorithm,
	      $: function(editor) { 
	        this.base(editor);
	        
	        this._diffMatchPatch = new diff_match_patch();
	        this._fmes = new Fmes();
	        this._storedSelectionRanges = null;
	        
          editor.on("CoOPS:SessionStart", this._onSessionStart, this);
	      },
	      proto : {
	        
	        _onSessionStart: function (event) {
            this.getEditor().on("contentChange", this._onContentChange, this);
            this.getEditor().on("CoOPS:PatchReceived", this._onPatchReceived, this);
	        },
	      
	        _onContentChange: function (event) {
	          var oldContent = event.data.oldContent;
	          var currentContent = event.data.currentContent;
	          
	          var diff = this._diffMatchPatch.diff_main(oldContent, currentContent);
	          this._diffMatchPatch.diff_cleanupEfficiency(diff);
	          var patch = this._diffMatchPatch.patch_toText(this._diffMatchPatch.patch_make(oldContent, diff));

	          this.getEditor().fire("CoOPS:ContentPatch", {
	            patch: patch
	          });
	        },
	        _onPatchReceived: function (event) {
	          var patch = event.data.patch;
	          var patchApplied = true;
            
	          // TODO: Is this really wise?
	          this.getEditor().document.$.normalize();
	          
            var text = this.getEditor().getData();
            var patchList = this._diffMatchPatch.patch_fromText(patch);
            var result = this._diffMatchPatch.patch_apply(patchList, text);
            for (var j = 0, jl = result[1].length; j < jl; j++) {
              if (result[1][j] == false) {
                patchApplied = false;
              }
            }
              
            if (patchApplied) {
              this.getEditor().fire("CoOPS:BeforeContentUpdate", {
                content: text
              });
              
              this.getEditor().getChangeObserver().pause();
              this.getEditor().lockSelection();

              try {
                var patchedText = result[0];
                if (this.getEditor().fire("CoOPS:contentUpdate", { content: patchedText })) {
                  try {
                    var document1 = document.implementation.createHTMLDocument('');
                    var document2 = document.implementation.createHTMLDocument('');
                    
                    document1.documentElement.innerHTML = this.getEditor().dataProcessor.toHtml( text );
                    document2.documentElement.innerHTML = this.getEditor().dataProcessor.toHtml( patchedText );

                    var delta = this._fmes.diff(document1, document2);
                    (new InternalPatch()).apply(this.getEditor().document.$, delta);
                    
                  } catch (e) {
                    this.getEditor().setData(patchedText);
                  }
                }
              } finally {
                CKEDITOR.tools.setTimeout( function() {
                  this.getEditor().unlockSelection(true);
                  this.getEditor().getChangeObserver().reset();
                  this.getEditor().getChangeObserver().resume();
                }, 0, this);
              }
              
            } else {
              // TODO: Localize 
              // TODO: Proper error handling
              throw new Error("Conflict: Could not apply patch");
            }
	        }
	      }
	    });
	  
	    var scripts = [
	      editor.plugins['coops-dmp'].path + 'required/diff_match_patch.js', 
	      editor.plugins['coops-dmp'].path + 'required/diffxmljs.js'
	    ];
	
	    CKEDITOR.scriptLoader.load(scripts, function () {
	      var differenceAlgorithm = new CKEDITOR.coops.DmpDifferenceAlgorithm(editor);
	    });
	  }
	});

}).call(this);