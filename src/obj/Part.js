( function () {
  "use strict";



  var cssPrefix, allStyles,
    defaultCss, defaultTextCss,
    hiddenCss,
    textDimensionCalculateNodeCss,
    inputType2tag, nonInputType2tag,
    textSizeMeasureNode,
    imageSizeMeasureNode,
    supportedInputTypeS,
    audioWidth, audioHeight,
    INPUT_FILE_WIDTH = 240;


  // source: http://davidwalsh.name/vendor-prefix
  if ( window.getComputedStyle ) {
    cssPrefix = (Array.prototype.slice
      .call(window.getComputedStyle(document.body, null))
      .join('')
      .match(/(-moz-|-webkit-|-ms-)/)
    )[1];
  } else {
    cssPrefix = "-ms-";
  }


   // source: xicooc (http://stackoverflow.com/a/29837441)
  LAY.$isBelowIE9 = (/MSIE\s/.test(navigator.userAgent) &&
    parseFloat(navigator.appVersion.split("MSIE")[1]) < 10);

  allStyles = document.body.style;


  // check for matrix 3d support
  // source: https://gist.github.com/webinista/3626934
  // http://tiffanybbrown.com/2012/09/04/testing-for-css-3d-transforms-support/
  allStyles[ (cssPrefix + "transform" ) ] =
    'matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)';
  if ( window.getComputedStyle ) {
    LAY.$isGpuAccelerated =
      Boolean(
        window.getComputedStyle(
          document.body, null ).getPropertyValue(
            ( cssPrefix + "transform" ) ) ) &&
        !LAY.$isBelowIE9;
  } else {
    LAY.$isGpuAccelerated = false;
  }

  allStyles = undefined;

  defaultCss = "position:absolute;display:block;visibility:inherit;" +
    "margin:0;padding:0;" +
    "backface-visibility:hidden;" +
    "contain:style;" +
    "-webkit-backface-visibility: hidden;" +
    "box-sizing:border-box;-moz-box-sizing:border-box;" +
    "transform-style:preserve-3d;-webkit-transform-style:preserve-3d;" +
    "-webkit-overflow-scrolling:touch;" +
    "white-space:nowrap;" +
    "outline:none;border:none;";

  // Most CSS text(/font) properties
  // match the defaults of LAY, however
  // for ones which do not match the
  // below list contains their default css
  defaultTextCss = defaultCss +
    "font-size:15px;" +
    "font-family:sans-serif;color:black;" +
    "text-decoration:none;" +
    "text-align:left;direction:ltr;line-height:1.3em;" +
    "-webkit-font-smoothing:antialiased;";

  hiddenCss = "left:-9999px;top:-9999px;visibility:hidden;";

  textDimensionCalculateNodeCss =
    defaultTextCss +
    hiddenCss +
    "height:auto;" +
    "border:0px solid transparent;" +
    "word-wrap:normal;";

  inputType2tag = {
    lines: "textarea",
    option: "select",
    options: "select"
  };

  nonInputType2tag = {
    none: "div",
    text: "div",
    html: "div",
    iframe: "iframe",
    canvas: "canvas",
    image: "img",
    video: "video",
    audio: "audio"
  };

  supportedInputTypeS = [
    "line", "lines", "password", "option",
    "options", "file", "files" ];


  var audioElement = document.createElement("audio");
  audioElement.controls = true;
  document.body.appendChild(audioElement);
  audioWidth = audioElement.offsetWidth;
  audioHeight = audioElement.offsetHeight;
  document.body.removeChild(audioElement);
  audioElement = undefined;


  function stringifyPlusPx ( val ) {
    return val + "px";
  }

  function setText ( node, text ) {
    if ( LAY.$isBelowIE9 ) {
      node.innerText = text;
    } else {
      node.textContent = text;
    }
  }

  function generateSelectOptionsHTML( optionS ) {
    var option, html = "";
    for ( var i=0, len=optionS.length; i<len; i++ ) {
      option = optionS[i];
      html += "<option value='" + option.value + "'" +
        ( option.selected ? " selected='true'" : "" ) +
        ( option.disabled ? " disabled='true'" : "" ) +
        ">" + option.content + "</option>";
    }
    return html;
  }

  textSizeMeasureNode = document.createElement("div");
  textSizeMeasureNode.style.cssText =
    textDimensionCalculateNodeCss;
  document.body.appendChild( textSizeMeasureNode );

  imageSizeMeasureNode = document.createElement("img");
  imageSizeMeasureNode.style.cssText = defaultCss + hiddenCss;

  document.body.appendChild( imageSizeMeasureNode );


  LAY.Part = function (level) {

    this.level = level;
    this.node = undefined;
    this.type = undefined;
    this.inputType = undefined;
    this.isText = undefined;
    this.isInitiallyRendered = false;

    this.normalRenderDirtyAttrValS = [];
    this.travelRenderDirtyAttrValS = [];

    this.whenEventType2fnMainHandler = {};

    this.isImageLoaded = false;
    this.isVideoLoaded = false;
    // If the element tag is not "div", then
    // the link is created by wrapping an "a"
    // tag around the element (for instance
    // a lson $type "image" or "canvas" )
    this.isWrappedLink = false;
    // acting node will be the same as this.node
    // is this.isWrappedLink is false,
    // however in the case of this.isWrappedLink
    // being true, actingNode will be the inner node
    this.actingNode = undefined;

    // for many derived levels
    this.formationX = undefined;
    this.formationY = undefined;

    this.init();
  };

  function getInputType ( type ) {
    return type.startsWith( "input:" ) &&
      type.slice( "input:".length );
  }

  LAY.Part.prototype.init = function () {

    var inputTag, parentNode, inputType;
    inputType = this.inputType = getInputType(
        this.level.lson.$type );
    this.type = this.inputType ? "input" :
     this.level.lson.$type;
    if ( inputType && supportedInputTypeS.indexOf(
        inputType ) === -1 ) {
      LAY.$error("Unsupported $type: input:" + inputType);
    }
    if ( this.level.pathName === "/" ) {
      this.node = document.body;
    } else if ( this.inputType ) {
      inputTag = inputType2tag[ this.inputType ];
      if ( inputTag ) {
        this.node = document.createElement( inputTag );
        if ( inputType === "options" ) {
          this.node.multiple = true;
        }
      } else {
        this.node = document.createElement( "input" );
        this.node.type = this.inputType === "line" ?
          "text" : ( this.inputType === "files" ? "file" : this.inputType );

        if ( inputType === "password" ) {
          // we wil treat password as a line
          // for logic purposes, as we we will
          // not alter the input[type] during
          // runtime
          this.inputType = "line";
        } else if ( inputType === "files" ) {
          this.node.multiple = true;
        }
      }

    } else {
      var tag = nonInputType2tag[this.type];
      if (this.level.lson.states.root.props.link !== undefined ) {
        this.node = document.createElement("a");
        if (tag !== "div" ) {
          this.isWrappedLink = true;
          this.actingNode =  document.createElement(tag);
          this.actingNode.style.cssText = defaultCss;
          this.node.appendChild(this.actingNode);
        }
      } else {
        this.node = document.createElement(tag);
      }
    }
    if (!this.isWrappedLink) {
      this.actingNode = this.node;
    }

    this.isText = this.type === "input" ||
      this.type === "text" ||
      this.type === "html";

    if ( this.isText ) {
      this.node.style.cssText = defaultTextCss;
    } else {
      this.node.style.cssText = defaultCss;
    }

    if ( this.type === "input" && this.inputType === "lines" ) {
      this.node.style.whiteSpace = "pre-wrap";
      this.node.style.resize = "none";
    }


    if ( this.type === "image" ) {
      var part = this;
      LAY.$eventUtils.add( this.actingNode, "load", function() {
        part.isImageLoaded = true;
        part.updateNaturalWidth();
        part.updateNaturalHeight();
        LAY.$isNoTransition = true;
        LAY.$solve();
      });
    } else if ( this.type === "video" ) {
      var part = this;
      LAY.$eventUtils.add( this.actingNode, "loadedmetadata", function() {
        part.isVideoLoaded = true;
        part.updateNaturalWidth();
        part.updateNaturalHeight();
        LAY.$isNoTransition = true;
        LAY.$solve();
      });
    }

  };

  // Precondition: not called on "/" level
  LAY.Part.prototype.remove = function () {
    if ( this.level.pathName !== "/" ) {
      var parentPart = this.level.parentLevel.part;
      parentPart.updateNaturalWidth();
      parentPart.updateNaturalHeight();
      // If the level is inexistent from the start
      // then the node will not have been attached
      if ( this.node.parentNode === parentPart.node ) {
        parentPart.node.removeChild( this.node );
      }
      LAY.$arrayUtils.remove(
        LAY.$naturalWidthDirtyPartS, this );
      LAY.$arrayUtils.remove(
        LAY.$naturalHeightDirtyPartS, this );
      LAY.$arrayUtils.remove(
        LAY.$renderDirtyPartS, this );
    }
  };

  LAY.Part.prototype.add = function () {
    if ( this.level.pathName !== "/" ) {
      var parentPart = this.level.parentLevel.part;
      parentPart.updateNaturalWidth();
      parentPart.updateNaturalHeight();
      this.level.parentLevel.part.node.appendChild( this.node );
    }
  };


  function checkIfLevelIsDisplayed ( level ) {
    var attrValDisplay = level.attr2attrVal.display;
    return !attrValDisplay || attrValDisplay.calcVal;
  }

  LAY.Part.prototype.findChildMaxOfAttr =
   function ( attr ) {
    var
       curMaxVal = 0,
       childLevel, childLevelAttrVal;

    for ( var i = 0,
         childLevelS = this.level.childLevelS,
        len = childLevelS.length;
         i < len; i++ ) {
      childLevel = childLevelS[i];
      if ( childLevel.isPart && !childLevel.isHelper &&
        childLevel.isExist ) {
        if ( checkIfLevelIsDisplayed( childLevel ) ) {
          childLevelAttrVal = childLevel.attr2attrVal[attr];

          if (
              ( childLevelAttrVal !== undefined ) &&
              ( childLevelAttrVal.calcVal )
            ) {
            if ( childLevelAttrVal.calcVal > curMaxVal ) {
              curMaxVal = childLevelAttrVal.calcVal;
            }
          }
        }
      }
    }

    return curMaxVal;
  };


  LAY.Part.prototype.getImmidiateReadonlyVal = function ( attr ) {

    switch ( attr ) {
      case "$naturalWidth":
        return this.calculateNaturalWidth();
      case "$naturalHeight":
        return this.calculateNaturalHeight();
      case "$scrolledX":
        return this.node.scrollLeft;
      case "$scrolledY":
        return this.node.scrollTop;
      case "$focused":
        return this.node === document.activeElement;
      case "$hash":
        return document.location.hash.substr(1);
      case "$pathname":
        return document.location.pathname;
      case "$href":
        return document.location.href;
      case "$host":
        return document.location.host;
      case "$input":
        if ( this.inputType.startsWith("option") ) {
          var optionS =
            this.isInitiallyRendered ?
            this.node.options :
            ( // input might not be calculated
              // as yet, thus OR with the empty array
            this.level.attr2attrVal.input.calcVal || [] );

          var valS = [];
          for ( var i = 0, len = optionS.length;
            i < len; i++ ) {
            if ( optionS[i].selected ) {
              valS.push( optionS[i].value )
            }
          }
          // Select the first option if none is selected
          // as that will be the default
          if ( optionS.length && !valS.length &&
              this.inputType === "option" ) {
            valS.push(optionS[ 0 ].value );
          }
          return this.inputType === "option" ?
            valS[ 0 ] : valS ;

        } else if ( this.inputType.startsWith("file") ) {
          return this.inputType === "file" ?
            this.node.files[ 0 ] : this.node.files;
        } else {
          return this.node.value;
        }

    }
  };


  LAY.Part.prototype.updateNaturalWidth = function () {

    var naturalWidthAttrVal = this.level.$getAttrVal("$naturalWidth");
    if ( naturalWidthAttrVal ) {
      LAY.$arrayUtils.pushUnique(
        LAY.$naturalWidthDirtyPartS,
        this );
    }
  };

  LAY.Part.prototype.updateNaturalHeight = function () {
    var naturalHeightAttrVal = this.level.$getAttrVal("$naturalHeight");
    if ( naturalHeightAttrVal ) {
      LAY.$arrayUtils.pushUnique(
        LAY.$naturalHeightDirtyPartS,
        this );
    }
  };

  LAY.Part.prototype.calculateNaturalWidth = function () {
    var attr2attrVal = this.level.attr2attrVal;
    if ( this.isText ) {
      return this.calculateTextNaturalDimesion( true );
    } else if ( this.type === "image" ) {
      return this.calculateImageNaturalDimesion( true );
    } else if ( this.type === "video" ) {
      return this.calculateVideoNaturalDimesion( true );
    } else if ( this.type === "audio" ) {
      return this.calculateTextNaturalDimesion( true );
    } else {
      return this.findChildMaxOfAttr( "right" );
    }
  };


  LAY.Part.prototype.calculateNaturalHeight = function () {
    var attr2attrVal = this.level.attr2attrVal;
    if ( this.isText ) {
      return this.calculateTextNaturalDimesion( false );
    } else if ( this.type === "image" ) {
      return this.calculateImageNaturalDimesion( false );
    } else if ( this.type === "video" ) {
      return this.calculateVideoNaturalDimesion( false );
    } else if ( this.type === "audio" ) {
      return this.calculateTextNaturalDimesion( false );
    } else {
      return this.findChildMaxOfAttr( "bottom" );
    }
  };

  LAY.Part.prototype.calculateImageNaturalDimesion = function ( isWidth ) {
    if ( !this.isImageLoaded ) {
      return 0;
    } else {
      imageSizeMeasureNode.src =
        this.level.attr2attrVal.image.calcVal;
      imageSizeMeasureNode.style.width = "auto";
      imageSizeMeasureNode.style.height = "auto";

      var otherDim = isWidth ? "height" : "width",
        otherDimAttrVal = this.level.attr2attrVal[
        otherDim ],
        otherDimVal = otherDimAttrVal ?
          ( otherDimAttrVal.calcVal !== undefined ?
          otherDimAttrVal.calcVal : undefined ) : undefined;


      if ( isWidth ) {
        if ( typeof otherDimVal !== "number" ||
          otherDimVal === 0 ) {
          return imageSizeMeasureNode.width;
        } else {
          return imageSizeMeasureNode.width *
            ( otherDimVal / imageSizeMeasureNode.height );
        }
      } else {
        if ( typeof otherDimVal !== "number" ||
        otherDimVal === 0 ) {
          return imageSizeMeasureNode.height;
        } else {
          return imageSizeMeasureNode.height *
            ( otherDimVal / imageSizeMeasureNode.width );
        }
      }
    }
  };

  LAY.Part.prototype.calculateVideoNaturalDimesion = function ( isWidth ) {
    if ( !this.isVideoLoaded ) {
      return 0;
    } else {
      var node = this.actingNode;
      node.style.visibility = "hidden";

      var otherDim = isWidth ? "height" : "width",
        otherDimAttrVal = this.level.attr2attrVal[
        otherDim ],
        otherDimVal = otherDimAttrVal ?
          ( otherDimAttrVal.calcVal !== undefined ?
          otherDimAttrVal.calcVal : "auto" ) : "auto";

      node.height = "auto";
      node.width = "auto";
      if ( isWidth ) {
        node.height = otherDimVal;
        node.style.visibility = "visible";
        return node.offsetWidth;
      } else {
        node.width = otherDimVal;
        node.style.visibility = "visible";
        return node.videoHeight;
      }
    }
  };

  LAY.Part.prototype.calculateAudioNaturalDimesion = function ( isWidth ) {
    var isAudioController =
      this.level.attr2attrVal.audioController &&
      this.level.attr2attrVal.audioController.calcVal;

    if ( isWidth ) {
      return isAudioController ? audioWidth : 0;
    } else {
      return isAudioController ? audioHeight : 0;
    }

  };


  /*
  * ( Height occupied naturally by text can be estimated
  * without creating a DOM node and checking ".offsetHeight"
  * if the text does not wrap, or it does wrap however with
  * extremely high probability does not span more than 1 line )
  * If the height can be estimated without using a DOM node
  * then return the estimated height, else return -1;
  */
  LAY.Part.prototype.estimateTextNaturalHeight = function ( text ) {
    if ( [ "file", "files" ].indexOf( this.type ) !== -1 ||
      ( this.type === "html" &&
        checkIfTextMayHaveHTML ( text ) ) ) {
      return -1;
    } else {
      var heightAttr2default = {
        "textSize": 15,
        "textWrap": "nowrap",
        "textPaddingTop": 0,
        "textPaddingBottom": 0,
        "borderTopWidth": 0,
        "borderBottomWidth": 0,
        "textLineHeight": 1.3,
        "textLetterSpacing": 1,
        "textWordSpacing": 1,
        "width": null
      };

      var heightAttr2val = {};

      for ( var heightAttr in heightAttr2default ) {
        var attrVal = this.level.attr2attrVal[ heightAttr ];
        heightAttr2val[ heightAttr ] = ( attrVal === undefined ||
          attrVal.calcVal === undefined ) ?
          heightAttr2default[ heightAttr ] : attrVal.calcVal;
      }

      if (text === "") {
        heightAttr2val.textSize = 0;
      }

      // Do not turn the below statement into a ternary as
      // it will end up being unreadable
      var isEstimatePossible = false;
      if (heightAttr2val.textWrap === "nowrap") {
        isEstimatePossible = true;
      } else if (
          LAY.$isOkayToEstimateWhitespaceHeight &&
          ( heightAttr2val.textWrap === "normal" ||
          text.indexOf( "\\" ) === -1 ) && //escape characters can
          // contain whitespace characters such as line breaks and/or tabs
          heightAttr2val.textLetterSpacing ===  1 &&
          heightAttr2val.textWordSpacing === 1 &&
          heightAttr2val.width !== null ) {
        if (heightAttr2val.textSize === 0 ||
            text.length < ( 0.7 *
            (heightAttr2val.width/heightAttr2val.textSize))) {
          isEstimatePossible = true;
        }
      }

      if ( isEstimatePossible ) {
        return ( heightAttr2val.textSize * heightAttr2val.textLineHeight ) +
          heightAttr2val.textPaddingTop +
          heightAttr2val.textPaddingBottom +
          heightAttr2val.borderTopWidth +
          heightAttr2val.borderBottomWidth;
      } else {
        return -1;
      }
    }
  };

  function checkIfTextMayHaveHTML( text ) {
    return text.indexOf( "<" ) !== -1 && text.indexOf( ">" ) !== -1;
  };
  LAY.Part.prototype.calculateTextNaturalDimesion = function ( isWidth ) {

    var dimensionAlteringAttr2fnStyle = {
      textSize: stringifyPxOrString,
      textFamily: null,
      textWeight: null,
      textAlign: null,
      textStyle: null,
      textDirection: null,
      textTransform: null,
      textVariant: null,
      textLetterSpacing: stringifyPxOrStringOrNormal,
      textWordSpacing: stringifyPxOrStringOrNormal,
      textLineHeight: stringifyEmOrString,
      textOverflow: null,
      textIndent: stringifyPlusPx,
      textWrap: null,

      textWordBreak: null,
      textWordWrap: null,
      textRendering: null,

      textPaddingTop: stringifyPlusPx,
      textPaddingRight: stringifyPlusPx,
      textPaddingBottom: stringifyPlusPx,
      textPaddingLeft: stringifyPlusPx,
      borderTopWidth: stringifyPlusPx,
      borderRightWidth: stringifyPlusPx,
      borderBottomWidth: stringifyPlusPx,
      borderLeftWidth: stringifyPlusPx
    };

    var dimensionAlteringAttr2cssProp = {
      textSize: "font-size",
      textFamily: "font-family",
      textWeight: "font-weight",
      textAlign: "text-align",
      textStyle: "font-style",
      textDirection: "direction",
      textTransform: "text-transform",
      textVariant: "font-variant",
      textLetterSpacing: "letter-spacing",
      textWordSpacing: "word-spacing",
      textLineHeight: "line-height",
      textOverflow: "text-overflow",
      textIndent: "text-indent",
      textWrap: "white-space",
      textWordBreak: "word-break",
      textWordWrap: "word-wrap",
      textRendering: "text-rendering",
      textPaddingTop: "padding-top",
      textPaddingRight: "padding-right",
      textPaddingBottom: "padding-bottom",
      textPaddingLeft: "padding-left",
      borderTopWidth: "border-top-width",
      borderRightWidth: "border-right-width",
      borderBottomWidth: "border-bottom-width",
      borderLeftWidth: "border-left-width"
    };

    var
      attr2attrVal = this.level.attr2attrVal,
      dimensionAlteringAttr, fnStyle,
      textRelatedAttrVal,
      content, ret,
      cssText = textDimensionCalculateNodeCss,
      isTextarea = (this.type === "input" && this.inputType === "lines"),
      sizeMeasureNode = textSizeMeasureNode;

    if (isTextarea) {
      cssText += "white-space:pre-wrap;word-wrap:break-word;";
    }

    if ( this.type === "input" ) {
      if ( this.inputType.startsWith("option") ) {
        if ( attr2attrVal.input.isRecalculateRequired ) {
          return 0;
        }
        content = "<select" +
          ( this.inputType === "multiple" ?
          " multiple='true' " : "" ) +  ">" +
          generateSelectOptionsHTML(
            attr2attrVal.input.calcVal
           ) + "</select>";
      } else if ( this.inputType.startsWith("file") ) {
        if ( isWidth ) {
          return INPUT_FILE_WIDTH;
        } else {
          content = "<input type='file' " +
            ( this.inputType === "multiple" ?
            " multiple='true' " : "" ) +  "/>";
        }
      } else if (this.inputType === "line") {
        // letter "a" is a random letter
        // used as a placeholder
        content = attr2attrVal.$input ?
          ( attr2attrVal.$input.calcVal || "a" ) : "a";
      } else {
        content = attr2attrVal.$input.calcVal;
      }
    } else if ( this.type === "html" ) {
      if ( attr2attrVal.html.isRecalculateRequired ) {
        return 0;
      }
      content = attr2attrVal.html.calcVal;
    } else {
      if ( attr2attrVal.text.isRecalculateRequired ) {
        return 0;
      }
      content = attr2attrVal.text.calcVal;
    }

    if ( typeof content !== "string" ) {
      content = content.toString();
    }

    if ( !isWidth && !isTextarea) {
      var estimatedHeight = this.estimateTextNaturalHeight(content);
      if ( estimatedHeight !== -1 ) {
        return estimatedHeight;
      }
    }

    for ( dimensionAlteringAttr in
       dimensionAlteringAttr2fnStyle ) {
      textRelatedAttrVal = attr2attrVal[
        dimensionAlteringAttr ];
      if ( textRelatedAttrVal &&
        textRelatedAttrVal.calcVal !== undefined ) {
        fnStyle = dimensionAlteringAttr2fnStyle[
            dimensionAlteringAttr ];
        cssText +=
          dimensionAlteringAttr2cssProp[
          dimensionAlteringAttr ] + ":" +
          ( (fnStyle === null) ?
          textRelatedAttrVal.calcVal :
          fnStyle( textRelatedAttrVal.calcVal ) ) + ";";
      }
    }

    if (isTextarea) {
      content += "\r\n"
    }

    if ( isWidth ) {
      cssText += "display:inline;width:auto;";
    } else {
      cssText += "width:" +
        ( attr2attrVal.width.calcVal || 0 ) + "px;";
    }
    sizeMeasureNode.style.cssText = cssText;

    if ( this.type === "html" ) {
      sizeMeasureNode.innerHTML = content;
    } else {
      setText(textSizeMeasureNode, content);
    }

    return isWidth ? sizeMeasureNode.offsetWidth :
      sizeMeasureNode.offsetHeight;

  };



  LAY.Part.prototype.addNormalRenderDirtyAttrVal = function ( attrVal ) {

    LAY.$arrayUtils.remove( this.travelRenderDirtyAttrValS, attrVal );
    LAY.$arrayUtils.pushUnique( this.normalRenderDirtyAttrValS, attrVal );
    LAY.$arrayUtils.pushUnique( LAY.$renderDirtyPartS, this );

  };

  LAY.Part.prototype.addTravelRenderDirtyAttrVal = function ( attrVal ) {

    LAY.$arrayUtils.remove( this.normalRenderDirtyAttrValS, attrVal );
    LAY.$arrayUtils.pushUnique( this.travelRenderDirtyAttrValS, attrVal );
    LAY.$arrayUtils.pushUnique( LAY.$renderDirtyPartS, this );

  };

  LAY.Part.prototype.updateWhenEventType = function ( eventType ) {

    var
      numFnHandlersForEventType =
        this.level.attr2attrVal[ "$$num.when." + eventType ].val,
      fnMainHandler,
      thisLevel = this.level,
      node = this.node;


    if ( LAY.$checkIsWindowEvent( eventType ) &&
      this.level.pathName === "/" ) {
      node = window;
    }

    if ( this.whenEventType2fnMainHandler[ eventType ] !== undefined ) {
      LAY.$eventUtils.remove(
        node, eventType,
          this.whenEventType2fnMainHandler[ eventType ] );
    }

    if ( numFnHandlersForEventType !== 0 ) {

      fnMainHandler = function ( e ) {
        var i, len, attrValForFnHandler;
        for ( i = 0; i < numFnHandlersForEventType; i++ ) {
          attrValForFnHandler =
          thisLevel.attr2attrVal[ "when." + eventType + "." + ( i + 1 ) ];
          if ( attrValForFnHandler !== undefined ) {
            attrValForFnHandler.calcVal.call( thisLevel, e );
          }
        }
      };

      LAY.$eventUtils.add( node, eventType, fnMainHandler );
      this.whenEventType2fnMainHandler[ eventType ] = fnMainHandler;

    } else {
      this.whenEventType2fnMainHandler[ eventType ] = undefined;
    }

  };

  LAY.Part.prototype.checkIsPropInTransition = function ( prop ) {
    return ( this.level.attr2attrVal[ "transition." + prop  + ".type" ] !==
      undefined )  ||
      ( this.level.attr2attrVal[ "transition." + prop  + ".delay" ] !==
        undefined );
  };

  LAY.Part.prototype.updateTransitionProp = function (transitionProp) {

    if (this.isInitiallyRendered && !LAY.$isNoTransition) {
      var
        attr2attrVal = this.level.attr2attrVal,
        attr, attrVal,
        transitionPrefix,
        transitionType, transitionDuration, transitionDelay, transitionDone,
        transitionArgS, transitionArg2val = {},
        transitionObj,
        i, len,
        allAffectedProp, // (eg: when `top` changes but transition
        //is provided by `positional`)
        affectedPropAttrVal;

      // TODO: change the below to a helper function
      if ( ( [ "centerX", "right", "centerY", "bottom" ] ).indexOf(
         transitionProp ) !== -1  ) {
        return;
      }

      if ( !this.checkIsPropInTransition( transitionProp ) ) {
        if ( this.checkIsPropInTransition( "all" ) ) {
          allAffectedProp = transitionProp;
          transitionProp = "all";
        } else {
          return;
        }
      }

      transitionPrefix = "transition." + transitionProp + ".";

      transitionType =
        attr2attrVal[ transitionPrefix + "type" ] ?
        attr2attrVal[ transitionPrefix + "type" ].calcVal :
        "linear";

      transitionDuration =
        ( attr2attrVal[ transitionPrefix + "duration" ] ?
        attr2attrVal[ transitionPrefix + "duration" ].calcVal :
        0 );
      transitionDelay =
        ( attr2attrVal[ transitionPrefix + "delay" ] ?
        attr2attrVal[ transitionPrefix + "delay" ].calcVal :
        0 );
      transitionDone =
        ( attr2attrVal[ transitionPrefix + "done" ] ?
        attr2attrVal[ transitionPrefix + "done" ].calcVal :
        undefined );
      transitionArgS = LAY.$transitionType2args[ transitionType ] ?
        LAY.$transitionType2args[ transitionType ] : [];


      for ( i=0, len=transitionArgS.length; i<len; i++ ) {

        transitionArg2val[ transitionArgS[i] ] = (
           attr2attrVal[ transitionPrefix + "args." +
            transitionArgS[i] ] ?
           attr2attrVal[ transitionPrefix + "args." +
            transitionArgS[i] ].calcVal : undefined );
      }

      if ( !allAffectedProp && ( transitionProp === "all" )) {
        for ( attr in attr2attrVal ) {
          attrVal = attr2attrVal[attr];
          // Only invoke a transition if:
          // (1) The prop is renderable (i.e has a render call)
          // (2) The prop doesn't have a transition of its
          //     own. For instance if "left" already has
          //     a transition then we will not want to override
          //     its transition with the lower priority "all" transition
          if ( attrVal.renderCall &&
              !this.checkIsPropInTransition( attrVal.attr ) ) {
            this.updateTransitionAttrVal(
              attrVal,
               transitionType, transitionDelay, transitionDuration,
               transitionArg2val, transitionDone
             );
          }
        }
      } else {
        this.updateTransitionAttrVal(
           attr2attrVal[ allAffectedProp || transitionProp ],
           transitionType, transitionDelay, transitionDuration,
           transitionArg2val, transitionDone
        );
      }
    }
  };

  LAY.Part.prototype.updateTransitionAttrVal = function ( attrVal,
    transitionType, transitionDelay, transitionDuration,
    transitionArg2val, transitionDone  ) {

    if (attrVal === undefined) {
      return;
    }
    // First check if the transition information is complete
    if (!attrVal.isDeltaTransitionable &&
      (transitionDelay || transitionDone)) {
      attrVal.startCalcVal =  attrVal.transCalcVal;
      attrVal.transition = new LAY.Transition(
        "none",
        transitionDelay,
        0,
        {},
        transitionDone
      );
    } else if (
          transitionType &&
        ( transitionDuration !== undefined ) &&
        ( transitionDelay !== undefined ) &&
        ( attrVal !== undefined ) &&
        ( attrVal.isTransitionable )
        ) {
      attrVal.startCalcVal =  attrVal.transCalcVal;
        attrVal.transition = new LAY.Transition(
          transitionType,
          transitionDelay,
          transitionDuration, transitionArg2val,
          transitionDone );
    } else if ( attrVal !== undefined ) { // else delete the transition
      attrVal.transition = undefined;
    }
  }

  function stringifyPxOrString( val, defaultVal ) {
    return ( val === undefined ) ?
        defaultVal : ( typeof val === "number" ?
        ( val + "px" ) : val );
  }

  function stringifyPxOrStringOrNormal( val, defaultVal ) {
    if ( val === 0 ) {
      return "normal";
    } else {
      return stringifyPlusPx( val, defaultVal );
    }
  }

  function stringifyEmOrString( val, defaultVal ) {
    return ( val === undefined ) ?
        defaultVal : ( typeof val === "number" ?
        ( val + "em" ) : val );
  }

  function computePxOrString( attrVal, defaultVal ) {

    return stringifyPxOrString(
      attrVal && attrVal.transCalcVal,
      defaultVal );

  }

  function computePxOrStringOrNormal( attrVal, defaultVal ) {

    return stringifyPxOrStringOrNormal(
      attrVal && attrVal.transCalcVal,
      defaultVal );

  }

  function computeEmOrString( attrVal, defaultVal ) {
    return stringifyEmOrString(
      attrVal && attrVal.transCalcVal,
      defaultVal );
  }

  function computeColorOrString( attrVal, defaultVal ) {
    var transCalcVal =
      attrVal && attrVal.transCalcVal;
    return ( transCalcVal === undefined ) ?
        defaultVal : ( transCalcVal instanceof LAY.Color ?
        transCalcVal.stringify() : transCalcVal );
  }

  LAY.Part.prototype.render = function ( renderCall ) {
    var
      attr2attrVal = this.level.attr2attrVal,
      isWrappedLink = this.isWrappedLink,
      node = this.actingNode,
      wrappedLinkNode = isWrappedLink && this.node,
      linkNode = this.node;

    switch ( renderCall ) {
      case "x":
        var x = ( attr2attrVal.left.transCalcVal +
          ( attr2attrVal.shiftX !== undefined ?
            attr2attrVal.shiftX.transCalcVal : 0 ) ) +
            "px";
        if ( isWrappedLink ) {
          wrappedLinkNode.style.left = x;
        } else {
          node.style.left = x;
        }
        break;
      case "y":
        var y = ( attr2attrVal.top.transCalcVal +
            ( attr2attrVal.shiftY !== undefined ?
              attr2attrVal.shiftY.transCalcVal : 0 ) ) +
              "px";
        if ( isWrappedLink ) {
          wrappedLinkNode.style.top = y;
        } else {
          node.style.top = y;
        }
        break;
      case "positionAndTransform":
        var prop = (cssPrefix === "-moz-" ? "" : cssPrefix) +
          "transform";
        var val = "translate(" +
          ( ( attr2attrVal.left.transCalcVal +
            ( attr2attrVal.shiftX !== undefined ?
              attr2attrVal.shiftX.transCalcVal : 0 ) ) + "px, " ) +
          ( ( attr2attrVal.top.transCalcVal +
            ( attr2attrVal.shiftY !== undefined ?
              attr2attrVal.shiftY.transCalcVal : 0 ) ) + "px) " ) +
          ( attr2attrVal.z !== undefined ?
            "translateZ(" + attr2attrVal.z.transCalcVal + "px) " : "" ) +
          ( attr2attrVal.scaleX !== undefined ?
            "scaleX(" + attr2attrVal.scaleX.transCalcVal + ") " : "" ) +
          ( attr2attrVal.scaleY !== undefined ?
            "scaleY(" + attr2attrVal.scaleY.transCalcVal + ") " : "" ) +
          ( attr2attrVal.scaleZ !== undefined ?
            "scaleZ(" + attr2attrVal.scaleZ.transCalcVal + ") " : "" ) +
          ( attr2attrVal.skewX !== undefined ?
            "skewX(" + attr2attrVal.skewX.transCalcVal + "deg) " : "" ) +
          ( attr2attrVal.skewY !== undefined ?
            "skewY(" + attr2attrVal.skewY.transCalcVal + "deg) " : "" ) +
          ( attr2attrVal.rotateX !== undefined ?
            "rotateX(" + attr2attrVal.rotateX.transCalcVal + "deg) " : "" ) +
          ( attr2attrVal.rotateY !== undefined ?
            "rotateY(" + attr2attrVal.rotateY.transCalcVal + "deg) " : "" ) +
          ( attr2attrVal.rotateZ !== undefined ?
            "rotateZ(" + attr2attrVal.rotateZ.transCalcVal + "deg)" : "" );
        if ( isWrappedLink ) {
          wrappedLinkNode.style[prop] = val;
        } else {
          node.style[prop] = val;
        }
        break;
      case "transform":
        var prop = (cssPrefix === "-moz-" ? "" : cssPrefix) +
          "transform";
        var val = ( attr2attrVal.scaleX !== undefined ?
            "scaleX(" + attr2attrVal.scaleX.transCalcVal + ") " : "" ) +
          ( attr2attrVal.scaleY !== undefined ?
            "scaleY(" + attr2attrVal.scaleY.transCalcVal + ") " : "" ) +
          ( attr2attrVal.scaleZ !== undefined ?
            "scaleZ(" + attr2attrVal.scaleZ.transCalcVal + ") " : "" ) +
          ( attr2attrVal.skewX !== undefined ?
            "skewX(" + attr2attrVal.skewX.transCalcVal + "deg) " : "" ) +
          ( attr2attrVal.skewY !== undefined ?
            "skewY(" + attr2attrVal.skewY.transCalcVal + "deg) " : "" ) +
          ( attr2attrVal.rotateX !== undefined ?
            "rotateX(" + attr2attrVal.rotateX.transCalcVal + "deg) " : "" ) +
          ( attr2attrVal.rotateY !== undefined ?
            "rotateY(" + attr2attrVal.rotateY.transCalcVal + "deg) " : "" ) +
          ( attr2attrVal.rotateZ !== undefined ?
            "rotateZ(" + attr2attrVal.rotateZ.transCalcVal + "deg)" : "" );
        if ( isWrappedLink ) {
          wrappedLinkNode.style[prop] = val;
        } else {
          node.style[prop] = val;
        }
        break;
      case "width":
        if ( !(this.type === "video" && !this.isVideoLoaded ) ) {
          node.style.width =
            attr2attrVal.width.transCalcVal + "px";
          if (isWrappedLink) {
            wrappedLinkNode.style.width =
              attr2attrVal.width.transCalcVal + "px";
          }
          if ( [ "canvas", "video", "image","iframe" ].indexOf(
              this.type ) !== -1 ) {
            node.width =
              attr2attrVal.width.transCalcVal;
          }
        }
        break;
      case "height":
        if ( !(this.type === "video" && !this.isVideoLoaded ) ) {
          node.style.height =
            attr2attrVal.height.transCalcVal + "px";
          if (isWrappedLink) {
            wrappedLinkNode.style.height =
              attr2attrVal.height.transCalcVal + "px";
          }
          if ( [ "canvas", "video", "image","iframe" ].indexOf(
                this.type ) !== -1 ) {
            node.height =
              attr2attrVal.height.transCalcVal;
          }
        }
        break;
      case "origin":
        var prop = cssPrefix + "transform-origin";
        var val = ( ( attr2attrVal.originX !== undefined ?
            attr2attrVal.originX.transCalcVal : 0.5 ) * 100 ) + "% " +
          ( ( attr2attrVal.originY !== undefined ?
            attr2attrVal.originY.transCalcVal : 0.5 ) * 100 ) + "% " +
          ( attr2attrVal.originZ !== undefined ?
            attr2attrVal.originZ.transCalcVal : 0  ) + "px";
        if (isWrappedLink) {
          wrappedLinkNode.style[prop] = val;
        } else {
          node.style[prop] = val;
        }
        break;
      case "perspective":
        if (isWrappedLink) {
          wrappedLinkNode.style[ cssPrefix + "perspective" ] =
            attr2attrVal.perspective.transCalcVal + "px";
        } else {
          node.style[ cssPrefix + "perspective" ] =
            attr2attrVal.perspective.transCalcVal + "px";
        }

        break;
      case "perspectiveOrigin":
        var prop = cssPrefix + "perspective-origin";
        var val = ( attr2attrVal.perspectiveOriginX ?
           ( attr2attrVal.perspectiveOriginX.transCalcVal * 100 )
            : 0 ) + "% " +
          ( attr2attrVal.perspectiveOriginY ?
           ( attr2attrVal.perspectiveOriginY.transCalcVal * 100 )
            : 0 ) + "%";
        if (isWrappedLink) {
          wrappedLinkNode.style[prop] = val;
        } else {
          node.style[prop] = val;
        }
        break;
      case "backfaceVisibility":
        if (isWrappedLink) {
          wrappedLinkNode.style[ cssPrefix + "backface-visibility" ] =
            attr2attrVal.backfaceVisibility.transCalcVal;
        } else {
          node.style[ cssPrefix + "backface-visibility" ] =
            attr2attrVal.backfaceVisibility.transCalcVal;
          }
        break;
      case "opacity":
        if (isWrappedLink) {
          wrappedLinkNode.style.opacity = attr2attrVal.opacity.transCalcVal;
        } else {
          node.style.opacity = attr2attrVal.opacity.transCalcVal;
        }
        break;
      case "display":
        if (isWrappedLink) {
          wrappedLinkNode.style.display =
            attr2attrVal.display.transCalcVal ? "block" : "none";
        } else {
          node.style.display =
            attr2attrVal.display.transCalcVal ? "block" : "none";
        }
        break;
      case "visible":
        if (isWrappedLink) {
          wrappedLinkNode.style.visibility =
            attr2attrVal.visible.transCalcVal ?
            "inherit" : "hidden";
        } else {
          node.style.visibility =
            attr2attrVal.visible.transCalcVal ?
            "inherit" : "hidden";
        }
        break;
      case "zIndex":
        if (isWrappedLink) {
          wrappedLinkNode.style.zIndex =
            attr2attrVal.zIndex.transCalcVal || "auto";
        } else {
          node.style.zIndex =
            attr2attrVal.zIndex.transCalcVal || "auto";
        }

        break;
      case "focus":
        if ( attr2attrVal.focus.transCalcVal ) {
          node.focus();
        } else if ( document.activeElement === node ) {
          document.body.focus();
        }
        break;
      case "scrollX":
        node.scrollLeft =
         attr2attrVal.scrollX.transCalcVal;
        break;
      case "scrollY":
        node.scrollTop =
         attr2attrVal.scrollY.transCalcVal;
        break;
      case "scrollElastic":
        node["-webkit-overflow-scrolling"] =
          attr2attrVal.scrollElastic.transCalcVal ?
          "touch" : "auto";
        break;
      case "overflowX":
        node.style.overflowX =
          attr2attrVal.overflowX.transCalcVal;
        break;
      case "overflowY":
        node.style.overflowY =
          attr2attrVal.overflowY.transCalcVal;
        break;
      case "cursor":
        node.style.cursor = attr2attrVal.
          cursor.transCalcVal;
        break;
      case "userSelect":
        if ( this.type !== "input" ) {
          node.style[ cssPrefix + "user-select" ] =
            attr2attrVal.userSelect.transCalcVal;
        }
        break;
      case "title":
        node.title = attr2attrVal.title.transCalcVal;
        break;
      case "id":
        node.id = attr2attrVal.id.transCalcVal;
      case "tabindex":
        node.tabindex = attr2attrVal.tabindex.transCalcVal;
        break;
      case "backgroundColor":
        node.style.backgroundColor =
          attr2attrVal.backgroundColor.transCalcVal.stringify();
        break;
      case "backgroundImage":
        node.style.backgroundImage =
          attr2attrVal.backgroundImage.transCalcVal;
        break;
      case "backgroundAttachment":
        node.style.backgroundAttachment =
          attr2attrVal.backgroundAttachment.transCalcVal;
        break;
      case "backgroundRepeat":
        node.style.backgroundRepeat =
          attr2attrVal.backgroundRepeat.transCalcVal;
        break;
      case "backgroundSize":
        node.style.backgroundSize =
          computePxOrString(
            attr2attrVal.backgroundSizeX, "auto" ) +
          " " +
          computePxOrString(
            attr2attrVal.backgroundSizeY, "auto" );
        break;
      case "backgroundPosition":
        node.style.backgroundPosition =
          computePxOrString(
            attr2attrVal.backgroundPositionX, "0px" ) +
             " " +
          computePxOrString(
            attr2attrVal.backgroundPositionX, "0px" );
        break;
      case "boxShadows":
        if ( !LAY.$isBelowIE9 ) {
          var s = "";
          for ( var i = 1, len = attr2attrVal[ "$$max.boxShadows" ].calcVal;
          i <= len; i++ ) {
            s +=
            ( ( attr2attrVal["boxShadows" + i + "Inset" ] !== undefined ?
             attr2attrVal["boxShadows" + i + "Inset" ].transCalcVal :
              false ) ? "inset " : "" ) +
            ( attr2attrVal["boxShadows" + i + "X" ].transCalcVal + "px " ) +
            ( attr2attrVal["boxShadows" + i + "Y" ].transCalcVal + "px " ) +
            ( ( attr2attrVal["boxShadows" + i + "Blur" ] !== undefined ?
              attr2attrVal["boxShadows" + i + "Blur" ].transCalcVal : 0 )
              + "px " ) +
            ( ( attr2attrVal["boxShadows" + i + "Spread" ] !== undefined ?
             attr2attrVal["boxShadows" + i + "Spread" ].transCalcVal : 0 )
              + "px " ) +
            ( attr2attrVal["boxShadows" + i + "Color" ].
              transCalcVal.stringify() );

            if ( i !== len ) {
              s += ",";
            }
          }
          node.style.boxShadow = s;
        }
        break;
      case "filters":
        var s = "";
        for ( var i = 1, len = attr2attrVal[ "$$max.filters" ].calcVal;
          i <= len; i++ ) {
          var filterType = attr2attrVal[ "filters" + i + "Type" ].calcVal;
          var filterValue = attr2attrVal[ "filters" + i + "Value" ] &&
            attr2attrVal[ "filters" + i + "Value" ].transCalcVal;
          switch ( filterType ) {
            case "dropShadow":
              s +=  "drop-shadow(" +
              ( attr2attrVal["filters" + i + "X" ].transCalcVal + "px " ) +
              (  attr2attrVal["filters" + i + "Y" ].transCalcVal  + "px " ) +
              ( ( attr2attrVal["filters" + i + "Blur" ] ?
                attr2attrVal["filters" + i + "Blur" ].transCalcVal : 0 ) +
                "px " ) +
        //      ( ( attr2attrVal["filters" + i + "Spread" ] !== undefined ?
  // attr2attrVal[ "filters" + i + "Spread" ].transCalcVal : 0 ) + "px " ) +
              (  attr2attrVal["filters" + i + "Color" ].
              transCalcVal.stringify() ) +
              ") ";
              break;
            case "blur":
              s += "blur(" + filterValue + "px) ";
              break;
            case "hueRotate":
              s += "hue-rotate(" + filterValue + "deg) ";
              break;
            case "url":
              s += "url(" + filterValue + ") ";
              break;
            default:
              s += filterType + "(" + ( filterValue  * 100 ) + "%) ";

          }
        }
        node.style[ cssPrefix + "filter" ] = s;
        break;
      case "cornerRadiusTopLeft":
        node.style.borderTopLeftRadius =
          attr2attrVal.cornerRadiusTopLeft.transCalcVal + "px";
        break;
      case "cornerRadiusTopRight":
        node.style.borderTopRightRadius =
          attr2attrVal.cornerRadiusTopRight.transCalcVal + "px";
        break;
      case "cornerRadiusBottomRight":
        node.style.borderBottomRightRadius =
          attr2attrVal.cornerRadiusBottomRight.transCalcVal + "px";
        break;
      case "cornerRadiusBottomLeft":
        node.style.borderBottomLeftRadius =
          attr2attrVal.cornerRadiusBottomLeft.transCalcVal + "px";
        break;
      case "borderTopStyle":
        node.style.borderTopStyle =
          attr2attrVal.borderTopStyle.transCalcVal;
        break;
      case "borderRightStyle":
        node.style.borderRightStyle =
          attr2attrVal.borderRightStyle.transCalcVal;
        break;
      case "borderBottomStyle":
        node.style.borderBottomStyle =
          attr2attrVal.borderBottomStyle.transCalcVal;
        break;
      case "borderLeftStyle":
        node.style.borderLeftStyle =
          attr2attrVal.borderLeftStyle.transCalcVal;
        break;
      case "borderTopColor":
        node.style.borderTopColor =
          attr2attrVal.borderTopColor.transCalcVal.stringify();
        break;
      case "borderRightColor":
        node.style.borderRightColor =
          attr2attrVal.borderRightColor.transCalcVal.stringify();
        break;
      case "borderBottomColor":
        node.style.borderBottomColor =
          attr2attrVal.borderBottomColor.transCalcVal.stringify();
        break;
      case "borderLeftColor":
        node.style.borderLeftColor =
          attr2attrVal.borderLeftColor.transCalcVal.stringify();
        break;
      case "borderTopWidth":
        node.style.borderTopWidth =
          attr2attrVal.borderTopWidth.transCalcVal + "px";
        break;
      case "borderRightWidth":
        node.style.borderRightWidth =
          attr2attrVal.borderRightWidth.transCalcVal + "px";
        break;
      case "borderBottomWidth":
        node.style.borderBottomWidth =
          attr2attrVal.borderBottomWidth.transCalcVal + "px";
        break;
      case "borderLeftWidth":
        node.style.borderLeftWidth =
          attr2attrVal.borderLeftWidth.transCalcVal + "px";
        break;
      case "html":
        node.innerHTML = attr2attrVal.html.transCalcVal;
        break;
      case "text":
        setText( node, attr2attrVal.text.transCalcVal );
        break;
      case "textSize":
        node.style.fontSize =
          computePxOrString( attr2attrVal.textSize );
        break;
      case "textFamily":
        node.style.fontFamily =
          attr2attrVal.textFamily.transCalcVal;
        break;
      case "textWeight":
        node.style.fontWeight =
          attr2attrVal.textWeight.transCalcVal;
        break;
      case "textColor":
        node.style.color =
          computeColorOrString(
            attr2attrVal.textColor );
        break;
      case "textVariant":
        node.style.fontVariant =
          attr2attrVal.textVariant.transCalcVal;
        break;
      case "textTransform":
        node.style.textTransform =
          attr2attrVal.textTransform.transCalcVal;
        break;
      case "textStyle":
        node.style.fontStyle =
          attr2attrVal.textStyle.transCalcVal;
        break;
      case "textDecoration":
        node.style.textDecoration =
          attr2attrVal.textDecoration.transCalcVal;
        break;
      case "textLetterSpacing":
        node.style.letterSpacing = computePxOrStringOrNormal(
          attr2attrVal.textLetterSpacing );
        break;
      case "textWordSpacing":
        node.style.wordSpacing = computePxOrStringOrNormal(
          attr2attrVal.textWordSpacing );
        break;
      case "textAlign":
        node.style.textAlign = attr2attrVal.textAlign.transCalcVal;
        break;
      case "textDirection":
        node.style.direction = attr2attrVal.textDirection.transCalcVal;
        break;
      case "textLineHeight":
        node.style.lineHeight = computeEmOrString(
          attr2attrVal.textLineHeight );
        break;
      case "textOverflow":
        node.style.textOverflow =
          attr2attrVal.textOverflow.transCalcVal;
        break;
      case "textIndent":
        node.style.textIndent =
          attr2attrVal.textIndent.transCalcVal + "px";
        break;
      case "textWrap":
        node.style.whiteSpace = attr2attrVal.textWrap.transCalcVal;
        break;
      case "textWordBreak":
        node.style.wordBreak = attr2attrVal.textWordBreak.transCalcVal;
        break;
      case "textWordWrap":
        node.style.wordWrap = attr2attrVal.textWordWrap.transCalcVal;
        break;
      case "textSmoothing":
        node.style[ cssPrefix + "font-smoothing" ] =
          attr2attrVal.textSmoothing.transCalcVal;
        break;
      case "textRendering":
        node.style.textRendering = attr2attrVal.textRendering.transCalcVal;
        break;
      case "textPaddingTop":
        node.style.paddingTop =
          attr2attrVal.textPaddingTop.transCalcVal + "px";
        break;
      case "textPaddingRight":
        node.style.paddingRight =
          attr2attrVal.textPaddingRight.transCalcVal + "px";
        break;
      case "textPaddingBottom":
      node.style.paddingBottom =
        attr2attrVal.textPaddingBottom.transCalcVal + "px";
        break;
      case "textPaddingLeft":
        node.style.paddingLeft =
          attr2attrVal.textPaddingLeft.transCalcVal + "px";
        break;
      case "textShadows":
        var s = "";
        for ( var i = 1, len = attr2attrVal[ "$$max.textShadows" ].calcVal;
          i <= len; i++ ) {
          s +=
          (  attr2attrVal["textShadows" + i + "Color" ].
            transCalcVal.stringify() ) + " " +
          ( attr2attrVal["textShadows" + i + "X" ].transCalcVal + "px " ) +
          ( attr2attrVal["textShadows" + i + "Y" ].transCalcVal + "px " ) +
          ( attr2attrVal["textShadows" + i + "Blur" ].transCalcVal  + "px" );

          if ( i !== len ) {
            s += ",";
          }

        }
        node.style.textShadow = s;
        break;
      case "input":
        var inputVal = attr2attrVal.input.transCalcVal;
        if ( this.inputType === "option" || this.inputType === "options" ) {
          node.innerHTML = generateSelectOptionsHTML( inputVal );
        } else {
          node.value = inputVal;
        }
        break;
      case "inputLabel":
        node.label = attr2attrVal.inputLabel.transCalcVal;
        break;
      case "inputAccept":
        node.accept = attr2attrVal.inputAccept.transCalcVal;
        break;
      case "inputPlaceholder":
        node.placeholder = attr2attrVal.inputPlaceholder.transCalcVal;
        break;
      case "inputAutocomplete":
        node.autocomplete = attr2attrVal.inputAutocomplete.transCalcVal;
        break;
      case "inputAutocorrect":
        node.autocorrect = attr2attrVal.inputAutocorrect.transCalcVal;
        break;
      case "inputDisabled":
        node.disabled = attr2attrVal.inputDisabled.transCalcVal;
        break;
      case "link":
        linkNode.href = attr2attrVal.link.transCalcVal;
        break;
      case "linkRel":
        linkNode.rel = attr2attrVal.linkRel.transCalcVal;
        break;
      case "linkDownload":
        linkNode.download = attr2attrVal.linkDownload.transCalcVal;
        break;
      case "linkTarget":
        linkNode.target = attr2attrVal.linkTarget.transCalcVal;
        break;
      case "image":
        node.src = attr2attrVal.image.transCalcVal;
        break;
      case "imageAlt":
        node.alt = attr2attrVal.imageAlt.transCalcVal;
        break;
      case "audio":
        node.src = attr2attrVal.audio.transCalcVal;
        break;
      case "audios":
        var
          documentFragment = document.createDocumentFragment(),
          childNodes = node.childNodes,
          childNode;
        // first remove the current audio sources
        for ( var i = 0, len = childNodes.length; i <= len; i++ ) {
          childNode = childNodes[i];
          if ( childNode.tagName === "SOURCE" ) {
            childNode.parentNode.removeChild( childNode );
          }
        }
        for ( var i = 1, len = attr2attrVal[ "$$max.audios" ].calcVal;
          i <= len; i++ ) {
          childNode = document.createElement( "source" );
          childNode.type =
            attr2attrVal[ "audios" + i + "Type" ].transCalcVal;
          childNode.src =
            attr2attrVal[ "audios" + i + "Src" ].transCalcVal;
          documentFragment.appendChild( childNode );
        }
        node.appendChild( documentFragment );
        break;
      case "audioTracks":
        var
          documentFragment = document.createDocumentFragment(),
          childNodes = node.childNodes,
          childNode;
        // first remove the current audio tracks
        for ( var i = 0, len = childNodes.length; i <= len; i++ ) {
          childNode = childNodes[i];
          if ( childNode.tagName === "TRACK" ) {
            childNode.parentNode.removeChild( childNode );
          }
        }
        for ( var i = 1, len = attr2attrVal[ "$$max.audioTracks" ].calcVal;
          i <= len; i++ ) {
          childNode = document.createElement( "track" );
          childNode.type =
            attr2attrVal[ "audioTracks" + i + "Type" ].transCalcVal;
          childNode.src =
            attr2attrVal[ "audioTracks" + i + "Src" ].transCalcVal;
          documentFragment.appendChild( childNode );
        }
        node.appendChild( documentFragment );
        break;
      case "audioVolume":
        node.volume = attr2attrVal.audioVolume.transCalcVal;
        break;
      case "audioController":
        node.controls = attr2attrVal.audioController.transCalcVal;
        break;
      case "audioLoop":
        node.loop = attr2attrVal.audioLoop.transCalcVal;
        break;
      case "audioMuted":
        node.muted = attr2attrVal.audioMuted.transCalcVal;
        break;
      case "audioPreload":
        node.preload = attr2attrVal.audioPreload.transCalcVal;
        break;
      case "video":
        node.src = attr2attrVal.video.transCalcVal;
        break;
      case "videos":
        var
          documentFragment = document.createDocumentFragment(),
          childNodes = node.childNodes,
          childNode;
        // first remove the current video sources
        for ( var i = 0, len = childNodes.length; i <= len; i++ ) {
          childNode = childNodes[i];
          if ( childNode.tagName === "SOURCE" ) {
            childNode.parentNode.removeChild( childNode );
          }
        }
        for ( var i = 1, len = attr2attrVal[ "$$max.videos" ].calcVal;
          i <= len; i++ ) {
          childNode = document.createElement( "source" );
          childNode.type =
            attr2attrVal[ "videos" + i + "Type" ].transCalcVal;
          childNode.src =
            attr2attrVal[ "videos" + i + "Src" ].transCalcVal;
          documentFragment.appendChild( childNode );
        }
        node.appendChild( documentFragment );
        break;
      case "videoTracks":
        var
          documentFragment = document.createDocumentFragment(),
          childNodes = node.childNodes,
          childNode;
        // first remove the current video tracks
        for ( var i = 0, len = childNodes.length; i <= len; i++ ) {
          childNode = childNodes[i];
          if ( childNode.tagName === "TRACK" ) {
            childNode.parentNode.removeChild( childNode );
          }
        }
        for ( var i = 1, len = attr2attrVal[ "$$max.videoTracks" ].calcVal;
          i <= len; i++ ) {
          childNode = document.createElement( "track" );
          childNode.type =
            attr2attrVal[ "videoTracks" + i + "Type" ].transCalcVal;
          childNode.src =
            attr2attrVal[ "videoTracks" + i + "Src" ].transCalcVal;
          documentFragment.appendChild( childNode );
        }
        node.appendChild( documentFragment );
        break;
      case "videoAutoplay":
        node.autoplay = attr2attrVal.videoAutoplay.transCalcVal;
        break;
      case "videoController":
        node.controls = attr2attrVal.videoController.transCalcVal;
        break;
      case "videoCrossorigin":
        node.crossorigin = attr2attrVal.videoCrossorigin.transCalcVal;
        break;
      case "videoLoop":
        node.loop = attr2attrVal.videoLoop.transCalcVal;
        break;
      case "videoMuted":
        node.muted = attr2attrVal.videoMuted.transCalcVal;
        break;
      case "videoPreload":
        node.preload = attr2attrVal.videoPreload.transCalcVal;
        break;
      case "videoPoster":
        node.poster = attr2attrVal.videoPoster.transCalcVal;
        break;
      case "iframe":
        node.src = attr2attrVal.iframe.transCalcVal;
        break;
      default:
        LAY.$error("Inexistent prop: '" + renderCall + "'");

    }
  };




})();
