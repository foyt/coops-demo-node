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
	        this._pendingPatches = new Array();
          this._contentCooldownTime = 200;
	        this._contentCoolingDown = false;

          editor.on("CoOPS:SessionStart", this._onSessionStart, this);
	      },
	      proto : {
	        
	        _onSessionStart: function (event) {
            this.getEditor().on("contentChange", this._onContentChange, this);
            this.getEditor().on("CoOPS:PatchReceived", this._onPatchReceived, this);
	        },
	        
	        _emitContentPatch: function (oldContent, newContent) {
	          var diff = this._diffMatchPatch.diff_main(oldContent, newContent);
            this._diffMatchPatch.diff_cleanupEfficiency(diff);
            var patch = this._diffMatchPatch.patch_toText(this._diffMatchPatch.patch_make(oldContent, diff));

            this.getEditor().fire("CoOPS:ContentPatch", {
              patch: patch
            });  
	        },
	      
	        _onContentChange: function (event) {
	          if (!this._contentCoolingDown) {
	            this._contentCoolingDown = true;
	            
	            var oldContent = event.data.oldContent;
	            var currentContent = event.data.currentContent;
	            
	            this._emitContentPatch(oldContent, currentContent);

	            CKEDITOR.tools.setTimeout(function() {
	              if (this._pendingOldContent && this._pendingNewContent) {
	                this._emitContentPatch(this._pendingOldContent, this._pendingNewContent);
	                delete this._pendingOldContent;
	                delete this._pendingNewContent;
	              }
	              
	              this._contentCoolingDown = false;
	            }, this._contentCooldownTime, this);
	          } else {
	            if (!this._pendingOldContent) {
	              this._pendingOldContent = event.data.oldContent;
	            }
	            
	            this._pendingNewContent = event.data.currentContent;
	          }
	        },
	        
	        _applyChanges: function (text, newText) {
            // TODO: cross-browser support for document creation
            
	          var newTextChecksum = crc.crc32(newText);
	          
            // Read original and patched texts into html documents
            var document1 = document.implementation.createHTMLDocument('');
            var document2 = document.implementation.createHTMLDocument('');
            document1.documentElement.innerHTML = this.getEditor().dataProcessor.toHtml( text );
            document2.documentElement.innerHTML = this.getEditor().dataProcessor.toHtml( newText );

            // Create delta of two created documents
            var delta = this._fmes.diff(document1, document2);
            
            // And apply delta into a editor
            (new InternalPatch()).apply(this.getEditor().document.$, delta);

            // Calculate checksum of patched editor content
            var patchedData = this.getEditor().getData();
            var patchedDataChecksum = crc.crc32(patchedData);
            
            if (newTextChecksum != patchedDataChecksum) {
              // XmlDiffJs patching did not go well, falling back to setData 
              this.getEditor().setData(newText);
            }
            
            editor.fire("CoOPS:PatchApplied", {
              content : newText
            });
	        },
	        
	        _revertDocument: function (currentContent, localPatch, callback) {
	          var editor = this.getEditor();
	          
	          var _this = this;
            this.getEditor().getCoOps().getRestClient().fileGet(function (status, responseJson, error) {
              if (status != 200) {
                // TODO: Proper error handling
                alert("Failed to revert back");
              } else {
                var revertedContent = responseJson.content;
                var revisionNumber = responseJson.revisionNumber;
                
                if (localPatch) {
                  var localPatchResult = _this._diffMatchPatch.patch_apply(localPatch, revertedContent);
                  if (_this._isPatchApplied(localPatchResult)) {
                    revertedContent = localPatchResult[0];
                  }
                }
                
                try {
                  _this._applyChanges(currentContent, revertedContent);
                } catch (e) {
                  // Change applying of changed crashed, falling back to setData
                  editor.setData(revertedContent);
                }
                
                editor.fire("CoOPS:ContentReverted", {
                  content : revertedContent,
                  revisionNumber: revisionNumber
                });
                
                callback();
              }
            });
	        },
	        
	        _lockEditor: function () {
            var editor = this.getEditor();
            try {
	            editor.getChangeObserver().pause();
              editor.lockSelection();  
            } catch (e) {
            }
	        },
	        
	        _unlockEditor: function () {
	          var editor = this.getEditor();
	          
	          try {
              editor.getChangeObserver().reset();
              editor.getChangeObserver().resume();  
              editor.unlockSelection(true);
	          } catch (e) {
	          }
	        },
	        
	        _isPatchApplied: function (patchResult) {
	          for (var j = 0, jl = patchResult[1].length; j < jl; j++) {
              if (patchResult[1][j] == false) {
                return false;
              }
            }
	          
	          return true;
	        },
	        
	        _applyPatch: function (patch, patchChecksum, callback) {
	          this._coOps.log("Incoming patch");
	          this.getEditor().document.$.normalize();
            var currentContent = this.getEditor().getData();
            var patchBaseContent = this.getEditor().getCoOps().getSavedContent();
            if (patchBaseContent === null) {
              patchBaseContent = currentContent;
              this._coOps.log("Saved content missing. Patching against current content");
            }
            
            var localPatch = null;
            var locallyChanged = this.getEditor().getCoOps().isLocallyChanged();

            if (locallyChanged) {
              var localDiff = this._diffMatchPatch.diff_main(patchBaseContent, this.getEditor().getCoOps().getUnsavedContent());
              this._diffMatchPatch.diff_cleanupEfficiency(localDiff);
              localPatch = this._diffMatchPatch.patch_make(patchBaseContent, localDiff);
            }
            
            var remoteDiff = this._diffMatchPatch.patch_fromText(patch);
            var removePatchResult = this._diffMatchPatch.patch_apply(remoteDiff, patchBaseContent);
            
            if (this._isPatchApplied(removePatchResult)) {
              var remotePatchedText = removePatchResult[0];
              var remotePatchedChecksum = crc.crc32(remotePatchedText);
              
              if (patchChecksum != remotePatchedChecksum) {
                this._coOps.log("Reverting document because checksum did not match");
                this._revertDocument(currentContent, localPatch, CKEDITOR.tools.bind(function () {
                  callback();
                }), this);
              } else {
                if (localPatch) {
                  var localPatchResult = this._diffMatchPatch.patch_apply(localPatch, remotePatchedText);
                  if (this._isPatchApplied(localPatchResult)) {
                    var locallyPatchedText = localPatchResult[0];
                    this._applyChanges(currentContent, locallyPatchedText);
                    callback();
                  }
                } else {
                  this._applyChanges(currentContent, remotePatchedText);
                  callback();
                }
              }
              
            } else {
              this._coOps.log("Reverting document because could not apply the patch");
              this._revertDocument(currentContent, localPatch, CKEDITOR.tools.bind(function () {
                callback();
              }), this);
            }
	        },
	        
	        _applyNextPatch: function () {
	          if (this._pendingPatches.length > 0) {
	            // First we lock the editor, so we can do some magic without 
	            // outside interference
	            
	            this._lockEditor();

	            var pendingPatch = this._pendingPatches.shift();
	            var _this = this;
	            this._applyPatch(pendingPatch.patch, pendingPatch.patchChecksum, function () {
	              _this._applyNextPatch();
	            });
	          } else {
	            this._unlockEditor();
	          }
	        },

	        _onPatchReceived: function (event) {
	          var patch = event.data.patch;
	          var patchChecksum = event.data.checksum;
	          
	          this._pendingPatches.push({
	            patch: patch,
	            patchChecksum: patchChecksum
	          });

	          this._applyNextPatch();
	        }
	      }
	    });
	  
	    var scripts = [
	      editor.plugins['coops-dmp'].path + 'required/diff_match_patch.js', 
	      editor.plugins['coops-dmp'].path + 'required/diffxmljs.js',
	      editor.plugins['coops-dmp'].path + 'required/crc.js',
	    ];
	
	    CKEDITOR.scriptLoader.load(scripts, function () {
	      var differenceAlgorithm = new CKEDITOR.coops.DmpDifferenceAlgorithm(editor);
	    });
	  }
	});

}).call(this);