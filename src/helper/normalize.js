(function () {
  "use strict";

  var
    fnCenterToPos,
    fnOppEdgeToPos,
    takeWidth,
    takeHeight,
    takeParentWidth,
    takeParentHeight,
    takeZeroCenterX,
    takeZeroCenterY,
    key2fnNormalize;

  fnCenterToPos = function( center, dim, parentDim ) {
    return ( parentDim / 2 ) +  ( center - ( dim / 2 ) );
  };

  fnOppEdgeToPos = function( edge, dim, parentDim ) {
    return parentDim - ( edge + dim );
  };


  takeWidth = new LAY.Take( "", "width" );
  takeHeight = new LAY.Take( "", "height" );

  takeParentWidth = new LAY.take( "../", "width");
  takeParentHeight = new LAY.take( "../", "height");

  takeZeroCenterX = ( new LAY.take("../", "width")).half().minus(
    ( new LAY.take("", "width") ).half() );

  takeZeroCenterY = ( new LAY.take("../", "height")).half().minus(
    ( new LAY.take("", "height") ).half() );


  LAY.$normalize = function (lson) {

    if ( !lson.$$normalized ) {

      if ( !lson.states ) {
        lson.states = {};
      }

      if ( lson.states.root ) {
        LAY.$error("State name 'root' is reserved.");
      }


      checkForInconsistentReadonlyKeys(lson);
      normalizeLazyChildren(lson);

      lson.states.root = {
        props: lson.props,
        when: lson.when,
        transition: lson.transition
      };

      for ( var lsonKey in lson ) {
        if ( lson[ lsonKey ] && lsonKey !== "$$max" ) {
          if ( !key2fnNormalize[ lsonKey ] ) {
            LAY.$error("LSON key: '" + lsonKey  + "' not found");
          }
          key2fnNormalize[ lsonKey ](lson);
        }
      }

      lson.props = undefined;
      lson.when = undefined;
      lson.transition = undefined;
      lson.$$normalized = true;

    }
  }

  /*
  * Checks for common naming mistakes with
  * readonly keys (i.e beginning with "$")
  */
  function checkForInconsistentReadonlyKeys(lson) {
    var errorReadonly = "";
    if ( lson.inherits || lson.$inherits ) {
      LAY.$error("Did you mean '$inherit'?");
    } else if ( lson.load ) {
      errorReadonly = "load";
    } else if ( lson.inherit ) {
      errorReadonly = "inherit";
    } else if ( lson.gpu ) {
      errorReadonly = "gpu";
    } else if ( lson.obdurate ) {
      errorReadonly = "obdurate";
    } else if ( lson.type ) {
      errorReadonly = "type"
    } else if ( lson.view ) {
      errorReadonly = "view";
    } else if ( lson.extfonts ) {
      errorReadonly = "extfonts";
    }
    if ( errorReadonly ) {
      LAY.$error("Prefix readonly '" +
        errorReadonly + "' with '$'");
    }
  }

  function normalizeLazyChildren(lson) {
    lson.children = lson.children || {};
    for ( var key in lson ) {
      if ( !key2fnNormalize[ key ]) {
        lson.children[ key ] = lson[ key ];
        lson[ key ] = undefined;
      }
    }
  }

  function checkAndThrowErrorAttrAsTake ( name, val ) {
    if ( val instanceof LAY.Take ) {
      LAY.$error("takes for special/expander props such as '" +
        name  + "' are not permitted." );
    }
  }

  /*
  * Recursively flatten the prop if object or array typed
  */
  function flattenProp( props, obj, key, prefix ) {

    var val, type, flattenedProp;
    val = obj[ key ];
    type = LAY.$type( val );
    if ( type === "array" && key !== "input" ) {
      for ( var i = 0, len = val.length; i < len; i++ ) {
        flattenedProp = prefix + ( i + 1 );
        flattenProp( props, val, i, flattenedProp );
      }
      obj[ key ] = undefined;

    } else if ( type === "object" ) {
      for ( var subKey in val ) {
        flattenedProp = prefix + LAY.$capitalize( subKey );
        flattenProp( props, val, subKey, flattenedProp );
        obj[ key ] = undefined;
      }
    } else {
      if ( LAY.$checkIsValidUtils.checkIsPropAttrExpandable( prefix ) ) {
        checkAndThrowErrorAttrAsTake( prefix, val );
      }
      props[ prefix ] = val;
    }
  }

  key2fnNormalize = {
    /*type: function (lson) {

      checkAndThrowErrorAttrAsTake( "type", lson.type );

      if ( lson.type === undefined ) {
        // check if text type
        var isTextType = false;
        if ( lson.props.text !== undefined ) {
          isTextType = true;
        }
        lson.type = isTextType ? "text" : "none";
      }
      var type = lson.type;
      if ( ( type === "text" ) && ( lson.children !== undefined ) ) {
        LAY.$error( "Text type Level with child Levels found" );
      }
      if ( type.startsWith( "input" ) ) {
        lson.type = "input";
        lson.inputType = type.slice( ( "input:" ).length );
      }

    },*/


    $type: function (lson) {
      checkAndThrowErrorAttrAsTake( "$type", lson.$type );
    },

    $view: function (lson) {
      checkAndThrowErrorAttrAsTake( "$view", lson.$view );
    },

    $page: function (lson) {
      checkAndThrowErrorAttrAsTake( "$page", lson.$page );
    },

    $extfonts: function (lson) {
      checkAndThrowErrorAttrAsTake( "$extfonts", lson.$extfonts );
    },

    $inherit: function (lson) {

      if ( !( lson.$inherit instanceof Array ) ) {
        lson.$inherit = [ lson.$inherit ];
      }
      checkAndThrowErrorAttrAsTake( "$inherit", lson.$inherit );
      if ( ( lson.$inherit !== undefined ) &&
        LAY.$type( lson.$inherit ) !== "array" ) {
          lson.$inherit = [ lson.$inherit ];
        }
    },

    $obdurate: function (lson) {
      checkAndThrowErrorAttrAsTake( "$obdurate", lson.$obdurate );
    },

    $load: function (lson) {
      checkAndThrowErrorAttrAsTake( "$load", lson.$load );
      if (!(lson.$load instanceof Array)) {
        lson.$load = [ lson.$load ];
      }
    },

    $gpu: function (lson) {
      checkAndThrowErrorAttrAsTake( "$gpu", lson.$gpu );
    },

    data: function (lson) {
      checkAndThrowErrorAttrAsTake( "data", lson.data );
    },

    exist: function (lson) {
    },

    css: function (lson) {
    },

    /*
    * normalize the `lson`
    */
    props: function(lson) {

      var
        prop2val = lson.props,
        prop, val,
        longhandPropS, longhandProp, shorthandVal,
        multipleTypePropMatchDetails,curMultipleMax,
        i, len;


      if ( lson.props === undefined ) {

        prop2val = lson.props = {};

      }

      checkAndThrowErrorAttrAsTake( "props", lson.props );


      if ( prop2val.centerX !== undefined ) {
        if ( prop2val.centerX === 0 ) { //optimization
          prop2val.left = takeZeroCenterX;
        } else {
          prop2val.left = ( new LAY.Take( fnCenterToPos ) ).fn(
            prop2val.centerX, takeWidth, takeParentWidth );
        }
        prop2val.centerX = undefined;
      }

      if ( prop2val.right !== undefined ) {
        prop2val.left = ( new LAY.Take( fnOppEdgeToPos ) ).fn(
          prop2val.right, takeWidth, takeParentWidth );
        prop2val.right = undefined;
      }

      if ( prop2val.centerY !== undefined ) {
        if ( prop2val.centerY === 0 ) { //optimization
          prop2val.top = takeZeroCenterY;
        } else {
          prop2val.top = ( new LAY.Take( fnCenterToPos ) ).fn(
            prop2val.centerY, takeHeight, takeParentHeight );
        }
        prop2val.centerY = undefined;
      }

      if ( prop2val.bottom !== undefined ) {
        prop2val.top = ( new LAY.Take( fnOppEdgeToPos ) ).fn(
           prop2val.bottom, takeHeight, takeParentHeight );
        prop2val.bottom = undefined;
      }



      for ( prop in prop2val ) {
        flattenProp( prop2val, prop2val, prop, prop );
      }

      for ( prop in prop2val ) {
        longhandPropS = LAY.$shorthandPropsUtils.
          getLonghandPropsDecenteralized( prop );
        if ( longhandPropS !== undefined ) {
          shorthandVal = prop2val[ prop ];
          for ( i = 0, len = longhandPropS.length; i < len; i++ ) {
            longhandProp = longhandPropS[i];
            // Write the longhand value only if
            // the longhand prop has not been mentioned
            // i.e the longhand prop is undefined
            prop2val[longhandProp] =
              prop2val[longhandProp] !== undefined ?
              prop2val[longhandProp] : shorthandVal;

          }
        }
      }

      for ( prop in prop2val ) {
        if ( prop.lastIndexOf("Color") !== -1 ) {
          if ( typeof prop2val[ prop ] === "string" ) {
            LAY.$error(prop +
              "' must be LAY.color()/LAY.rgb()/LAY.rgba()/LAY.hsl()/LAY.hsla()");
          }
        }
        multipleTypePropMatchDetails =
          LAY.$findMultipleTypePropMatchDetails( prop );
        if ( multipleTypePropMatchDetails !== null ) {
          curMultipleMax =
            LAY.$meta.get( lson, "max", multipleTypePropMatchDetails[ 1 ] );
          if ( ( curMultipleMax === undefined ) ||
            ( curMultipleMax < parseInt( multipleTypePropMatchDetails[ 2 ] ))) {
            LAY.$meta.set( lson, "max", multipleTypePropMatchDetails[ 1 ],
              parseInt( multipleTypePropMatchDetails[ 2 ] ) );
          }
        }
      }
    },

  when: function (lson) {

    if ( lson.when === undefined ) {
      lson.when = {};
    } else {
      checkAndThrowErrorAttrAsTake( "when", lson.when );

      var eventType2_fnCallbackS_ = lson.when;

      for ( var eventType in eventType2_fnCallbackS_ ) {
        var fnCallbackS = eventType2_fnCallbackS_[ eventType ];

        if ( !( fnCallbackS instanceof Array ) ) {
          fnCallbackS =
            eventType2_fnCallbackS_[ eventType ] =
              [ fnCallbackS ];
        }
        checkAndThrowErrorAttrAsTake( "when." + eventType,
          fnCallbackS );
      }
    }
  },

  transition: function(lson) {

    if ( lson.transition === undefined ) {
      lson.transition = {};
    } else {
      var transitionProp, transitionDirective,
      transitionArgKey2val, transitionArgKey, transitionArgKeyS,
      transition = lson.transition,
      defaulterProp, defaultedPropS, defaultedProp, i, len;

      if ( transition !== undefined ) {
        checkAndThrowErrorAttrAsTake( "transition", lson.transition );

        if ( transition.centerX !== undefined ) {
          transition.left = transition.centerX;
        }
        if ( transition.right !== undefined ) {
          transition.left = transition.right;
        }
        if ( transition.centerY !== undefined ) {
          transition.top = transition.centerY;
        }
        if ( transition.bottom !== undefined ) {
          transition.top = transition.bottom;
        }

        for ( transitionProp in transition ) {
          // Check if multiple props are specified for transition.
          if ( transitionProp.indexOf(",") !== -1 ) {
            // Split the transitions
            var splitPropS = transitionProp.split(",");
            for ( var i=0, len=splitPropS.length; i<len; i++ ) {
              var splitProp = splitPropS[i].trim();
              transition[ splitProp ] = transition[ transitionProp ];
            }
            // remove the main transition
            transition[ transitionProp ] = undefined;
          }
        }

        for ( transitionProp in transition ) {

          if ( LAY.$checkIsValidUtils.checkIsPropAttrExpandable(
              transitionProp ) ) {
             LAY.$error(
               "Transitions for special/expander props such as '" +
                name  + "' are not permitted." );
          }
          transitionDirective = transition[ transitionProp ];
          checkAndThrowErrorAttrAsTake( "transition." + transitionProp,
          transitionDirective  );

          transitionArgKey2val = transitionDirective.args;
          if ( transitionArgKey2val !== undefined ) {
            checkAndThrowErrorAttrAsTake( "transition." + transitionProp +
              ".args",
            transitionArgKey2val  );

          }
        }
      }
    }
  },

  states: function( lson, isMany ) {

    if ( lson.states !== undefined ) {

      var stateName2state = lson.states, state;
      checkAndThrowErrorAttrAsTake( "states",  stateName2state );

      for ( var stateName in stateName2state ) {

        if ( !LAY.$checkIsValidUtils.stateName( stateName ) ) {
          LAY.$error( "Invalid state name: " + stateName );
        }

        state = stateName2state[ stateName ];

        checkAndThrowErrorAttrAsTake( "states." + stateName, state );

        if ( !isMany ) {
          key2fnNormalize.props( state );
          key2fnNormalize.when( state );
          key2fnNormalize.transition( state );
        } else {
          key2fnNormalize.fargs( state );
          key2fnNormalize.sort( state );
        }

      }
    }
  },


  children: function(lson) {

    if ( lson.children !== undefined ) {

      var childName2childLson = lson.children;
      checkAndThrowErrorAttrAsTake( "children",  childName2childLson );

      for ( var childName in childName2childLson ) {

        LAY.$normalize( childName2childLson[ childName ] );

      }
    }
  },

  many: function (lson)  {

    if ( lson.many !== undefined ) {

      var many = lson.many;

      checkAndThrowErrorAttrAsTake( "many", many );

      if ( !many.states ) {
        many.states = {};
      }

      many.states.root = {
        formation: many.formation,
        sort: many.sort,
        filter: many.filter,
        fargs: many.fargs
      };

      many.formation = undefined;
      many.sort = undefined;
      many.filter = undefined;
      many.fargs = undefined;

      key2fnNormalize.states( many, true );

      if (many.$load) {
        key2fnNormalize.$load(many);
      }

    }
  },

  // formation args (Many)
  fargs: function (lson) {
    if ( lson.fargs ) {
      var
        fargs = lson.fargs,
        formationArg;

      checkAndThrowErrorAttrAsTake( "fargs", fargs );

      for ( formationArg in fargs ) {
        checkAndThrowErrorAttrAsTake( "fargs." + formationArg,
          fargs[ formationArg ] );
      }


    }
  },

  sort: function (lson) {
    if ( lson.sort ) {
      var
        sortS = lson.sort,
        i, len;

      checkAndThrowErrorAttrAsTake( "sort", sortS );

      for ( i = 0, len = sortS.length; i < len; i++ ) {
        checkAndThrowErrorAttrAsTake( "sort." + i,
          sortS[i] );
        if ( sortS[i].ascending === undefined ) {
          sortS[i].ascending = true;
        }

      }
    }
  }

};

}());
