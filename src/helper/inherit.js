
(function () {
  "use strict";

  // Inheritance allows modifications to the
  // `intoLson` object, but disallows modifications
  // to `fromLson`



  /*
  * Inherit the root, state, or many LSON from `from` into `into`.
  */
  LAY.$inherit = function ( into, from, isStateInheritance, isMany, isMainLson ) {

    if ( !isStateInheritance ) {
      for ( var key in from ) {
        if ( from[ key ] ) {
          if ( key2fnInherit[ key ] ) {
            key2fnInherit[ key ]( into, from, isMany );
          } else {
            into[ key ] = from[ key ];
          }
        }
      }
    } else {

      if ( !isMainLson ) {
        into.onlyif = from.onlyif || into.onlyif;
        into.install = from.install || into.install;
        into.uninstall = from.uninstall || into.uninstall;
      }

      if ( isMany ) {
        into.formation = from.formation || into.formation;
        into.filter = from.filter || into.filter;
        key2fnInherit.fargs( into, from );
        into.sort = from.sort || into.sort;

      } else {
        if ( from.props !== undefined ) {
          key2fnInherit.props( into, from );
        }
        if ( from.when !== undefined ) {
          key2fnInherit.when( into, from );
        }
        if ( from.transition !== undefined ) {
          key2fnInherit.transition( into, from );
        }
        if ( from.$$max !== undefined ) {
          key2fnInherit.$$max( into, from );
        }
      }
    }
  };

  function inheritTransitionProp ( intoTransition, fromTransition,
    intoTransitionProp, fromTransitionProp ) {


      var
        fromTransitionDirective = fromTransition[ fromTransitionProp ],
        intoTransitionDirective = intoTransition[ intoTransitionProp ],
        fromTransitionArgKey2val,  intoTransitionArgKey2val,
        fromTransitionArgKey;


      if ( fromTransitionDirective !== undefined ) {

        if ( intoTransitionDirective === undefined ) {
          intoTransitionDirective =
            intoTransition[ intoTransitionProp ] = {};
        }

        intoTransitionDirective.type = fromTransitionDirective.type ||
          intoTransitionDirective.type;

        intoTransitionDirective.duration = fromTransitionDirective.duration ||
          intoTransitionDirective.duration;

        intoTransitionDirective.delay = fromTransitionDirective.delay ||
          intoTransitionDirective.delay;

        intoTransitionDirective.done = fromTransitionDirective.done ||
          intoTransitionDirective.done;

        fromTransitionArgKey2val = fromTransitionDirective.args;
        intoTransitionArgKey2val = intoTransitionDirective.args;


        if ( fromTransitionArgKey2val !== undefined ) {

          if ( intoTransitionArgKey2val === undefined ) {
            intoTransitionArgKey2val =
            intoTransitionDirective.args = {};
          }

          for ( fromTransitionArgKey in fromTransitionArgKey2val ) {

            intoTransitionArgKey2val[ fromTransitionArgKey ] =
              fromTransitionArgKey2val[ fromTransitionArgKey ];
          }
        }
      }
    }

    function checkIsMutable ( val ) {
      return ( typeof val === "object" );
    }

    function inheritSingleLevelObject( intoObject, fromObject, key, isDuplicateOn ) {

      var fromKey2value, intoKey2value, fromKey, fromKeyValue;
      fromKey2value = fromObject[ key ];
      intoKey2value = intoObject[ key ];


      if ( intoKey2value === undefined ) {

        intoKey2value = intoObject[ key ] = {};

      }

      for ( fromKey in fromKey2value ) {

        fromKeyValue = fromKey2value[ fromKey ];
        intoKey2value[ fromKey ] = ( isDuplicateOn &&
            checkIsMutable( fromKeyValue ) ) ?
          LAY.$clone( fromKeyValue ) :
          fromKeyValue;
      }
    }



    // Precondition: `into<Scope>.key (eg: intoLAY.key)` is already defined
    var key2fnInherit = {

      $load: function( intoLson, fromLson ) {
        var
          intoLoadFnS = intoLson.$load,
          fromLoadFnS = fromLson.$load;

        if ( fromLoadFnS ) {
          if ( !intoLoadFnS ) {
            intoLoadFnS = intoLson.$load = [];
          }
          intoLoadFnS.concat( fromLoadFnS );
        }
      },

      data: function( intoLson, fromLson ) {
        inheritSingleLevelObject( intoLson, fromLson, "data" );
      },


      props: function( intoLson, fromLson ) {
        inheritSingleLevelObject( intoLson, fromLson, "props" );
      },


      transition: function ( intoLson, fromLson ) {

        var
          fromTransition = fromLson.transition,
          intoTransition = intoLson.transition,
          fromTransitionProp,
          intoTransitionProp,
          i, len,
          tmpTransition = {};


        if ( ( intoTransition === undefined ) ) {
          intoTransition = intoLson.transition = {};
        }


        // "all" prop overwrite stage
        //
        // Eg: "rotateX" partially/completely overwritten
        // by "all" where "rotateX" is present
        // within "into"LSON and "all" is present
        // within "from"LSON

        if ( fromTransition.all ) {
          for ( intoTransitionProp in intoTransition ) {
            if ( intoTransition !== "all" ) {
              inheritTransitionProp( intoTransition, fromTransition,
                 intoTransitionProp, "all" );
            }
          }
        }

        // General inheritance of props of exact
        // names across from and into LSON
        for ( fromTransitionProp in fromTransition ) {
          inheritTransitionProp( intoTransition, fromTransition,
             fromTransitionProp, fromTransitionProp );
        }

        // flatten stage
        //
        // This is akin to a self-inheritance stafe whereby
        // prop transition directives are stacked
        // below the "all" transition direction
        //
        // Eg: a shorthand property such as "rotateX"
        // would inherit values from "all"
        //
        if ( intoTransition.all ) {
          for ( intoTransitionProp in intoTransition ) {

            if ( intoTransitionProp !== "all" ) {
              tmpTransition[ intoTransitionProp ] = {};
              inheritTransitionProp(
                tmpTransition, intoTransition,
                intoTransitionProp, "all" );
              inheritTransitionProp(
                tmpTransition, intoTransition,
                intoTransitionProp, intoTransitionProp );
              intoTransition[ intoTransitionProp ] =
                tmpTransition[ intoTransitionProp ];
            }
          }
        }
      },



      many: function( intoLson, fromLson ) {

        if ( intoLson.many === undefined ) {
          intoLson.many = {};
        }

        LAY.$inherit( intoLson.many, fromLson.many,
          false, true, false );

      },

      rows: function( intoLson, fromLson ) {

        var
          intoLsonRowS = intoLson.rows,
          fromLsonRowS = fromLson.rows,
          fromLsonRow;

        if ( fromLsonRowS ) {
          if ( fromLsonRowS instanceof LAY.Take ) {
            intoLson.rows = fromLsonRowS;
          } else {
            intoLson.rows = new Array( fromLsonRowS.length );
            intoLsonRowS = intoLson.rows;
            for ( var i = 0, len = fromLsonRowS.length; i < len; i++ ) {

              fromLsonRow = fromLsonRowS[i];
              intoLsonRowS[i] = checkIsMutable( fromLsonRow ) ?
                LAY.$clone( fromLsonRow ) : fromLsonRow;

            }
          }
        }

      },

      fargs: function ( intoLson, fromLson ) {

        var
          formationFarg,
          intoFargs = intoLson.fargs,
          fromFargs = fromLson.fargs;

        if ( fromFargs ) {
          if ( !intoFargs ) {
            intoFargs = intoLson.fargs = {};
          }
          for ( formationFarg in fromFargs ) {
            if ( !intoFargs[ formationFarg  ] ) {
              intoFargs[ formationFarg ] = {};
            }
            inheritSingleLevelObject(
              intoFargs, fromFargs, formationFarg );

          }
        }
      },


      children: function( intoLson, fromLson ) {
        var fromChildName2lson, intoChildName2lson;
        fromChildName2lson = fromLson.children;
        intoChildName2lson = intoLson.children;

        if ( intoChildName2lson === undefined ) {
          intoChildName2lson = intoLson.children = {};
        }

        for ( var name in fromChildName2lson ) {
          if ( intoChildName2lson[ name ] === undefined ) { // inexistent child
            intoChildName2lson[ name ] = {};

          }
          LAY.$inherit( intoChildName2lson[ name ], fromChildName2lson[ name ],
             false, false, false );

        }
      },

      states: function( intoLson, fromLson, isMany ) {

        var
          fromStateName2state = fromLson.states,
          intoStateName2state = intoLson.states,
          inheritFromState, inheritIntoState;

        if ( intoStateName2state === undefined ) {
          intoStateName2state = intoLson.states = {};
        }

        for ( var name in fromStateName2state ) {

          if ( !intoStateName2state[ name ] ) { //inexistent state

            intoStateName2state[ name ] = {};

          }

          LAY.$inherit( intoStateName2state[ name ],
           fromStateName2state[ name ], true, isMany, false );

        }
      },

      when: function( intoLson, fromLson ) {

        var
          fromEventType2_fnEventHandlerS_ = fromLson.when,
          intoEventType2_fnEventHandlerS_ = intoLson.when,
          fnFromEventHandlerS, fnIntoEventHandlerS, fromEventType;


        if ( intoEventType2_fnEventHandlerS_ === undefined ) {
          intoEventType2_fnEventHandlerS_ = intoLson.when = {};
        }

        for ( fromEventType in fromEventType2_fnEventHandlerS_ ) {

          fnFromEventHandlerS = fromEventType2_fnEventHandlerS_[ fromEventType ];
          fnIntoEventHandlerS = intoEventType2_fnEventHandlerS_[ fromEventType ];

          if ( fnIntoEventHandlerS === undefined ) {

            intoEventType2_fnEventHandlerS_[ fromEventType ] = LAY.$arrayUtils.cloneSingleLevel( fnFromEventHandlerS );

          } else {

            intoEventType2_fnEventHandlerS_[ fromEventType ] = fnIntoEventHandlerS.concat( fnFromEventHandlerS );
          }

          LAY.$meta.set( intoLson, "num", "when." + fromEventType,
          ( intoEventType2_fnEventHandlerS_[ fromEventType ] ).length );

        }
      },

      $$max: function ( intoLson, fromLson ) {
        LAY.$meta.inherit.$$max( intoLson, fromLson );
      }

    };

  })();
