(function() {
  "use strict";

  LAY.Many = function ( level, partLson ) {

    this.level = level;
    this.partLson = partLson;

    this.allLevelS = [];
    this.filteredLevelS = [];

    // "stringHashedStates2_cachedAttr2val_"
    // for levels derived from the many
    // Keeping this cache ensures thats
    // each derived level (which could potentially
    // large arbitrary number n) calculates
    // only once.
	  this.levelStringHashedStates2_cachedAttr2val_ = {};

    this.id = level.lson.id || "id";
    this.id2level = {};
    this.id2row = {};
    this.isLoaded = false;

    this.defaultFormationX = undefined;
    this.defaultFormationY = undefined;

  };

  LAY.Many.prototype.init = function () {

    var
      states = this.partLson.states ||
      ( this.partLson.states = {} );

    states.formationDisplayNone =
      LAY.$formationDisplayNoneState;

    LAY.$defaultizePartLson( this.partLson, false );

    LAY.$newManyS.push( this );

    this.defaultFormationX = this.partLson.states.root.props.left;
    this.defaultFormationY = this.partLson.states.root.props.top;

  };

  LAY.Many.prototype.queryRows = function () {
    return new LAY.Query( 
       LAY.$arrayUtils.cloneSingleLevel(
        this.level.attr2attrVal.rows.calcVal ) );
  };

  LAY.Many.prototype.queryFilter = function () {
    return new LAY.Query(
      LAY.$arrayUtils.cloneSingleLevel(
        this.level.attr2attrVal.filter.calcVal ) );
  };

  LAY.Many.prototype.rowsCommit = function ( newRowS ) {

    var rowsAttrVal = this.level.attr2attrVal.rows;

    rowsAttrVal.val = newRowS;
    rowsAttrVal.requestRecalculation();
    LAY.$solve();

  };

  LAY.Many.prototype.rowsMore = function ( newRowS ) {
    var
      rowsAttrVal = this.level.attr2attrVal.rows,
      curRowS = rowsAttrVal.calcVal;

    if ( checkIfRowsIsNotObjectified( newRowS ) ) {
       newRowS = objectifyRows;
    }

    for ( var i = 0; i < newRowS.length; i++ ) {
      curRowS.push( newRowS[ i ] );
    }

    rowsAttrVal.val = rowsAttrVal.calcVal;
    rowsAttrVal.requestRecalculation();
    LAY.$solve();

  };

  LAY.Many.prototype.rowDeleteByID = function ( id ) {
    var
      rowsAttrVal = this.level.attr2attrVal.rows,
      curRowS = rowsAttrVal.calcVal,
      row = this.id2row [ id ];

    if ( row ) {
      LAY.$arrayUtils.remove( 
        curRowS, row );
      rowsAttrVal.val = rowsAttrVal.calcVal;
      rowsAttrVal.requestRecalculation();
      LAY.$solve();

    }
  };

  LAY.Many.prototype.rowsUpdate = function ( key, val, queryRowS ) {

    var rowsAttrVal = this.level.attr2attrVal.rows;

    // If no queriedRowS parameter is supplied then
    // update all the rows
    queryRowS = queryRowS ||
      rowsAttrVal.calcVal || [];

    for ( var i = 0, len = queryRowS.length; i < len; i++ ) {
      var fetchedRow = this.id2row[ queryRowS[ i ][ this.id ] ];
      if ( fetchedRow ) {
        fetchedRow[ key ] = val;
      }
    }

    rowsAttrVal.val = rowsAttrVal.calcVal;
    rowsAttrVal.requestRecalculation();
    LAY.$solve();

  };

  LAY.Many.prototype.rowsDelete = function ( queryRowS ) {
    
    var
      rowsAttrVal = this.level.attr2attrVal.rows,
      curRowS = rowsAttrVal.calcVal;

    // If no queriedRowS parameter is supplied then
    // delete all the rows
    queryRowS = queryRowS ||
      rowsAttrVal.calcVal || [];

    for ( var i = 0, len = queryRowS.length; i < len; i++ ) {
      var fetchedRow = this.id2row[ queryRowS[ i ][ this.id ] ];
      LAY.$arrayUtils.remove( curRowS, fetchedRow );
    }

    rowsAttrVal.val = rowsAttrVal.calcVal;
    rowsAttrVal.requestRecalculation();
    LAY.$solve();

  };



  function checkIfRowsIsNotObjectified ( rowS ) {
    return rowS.length &&
     ( typeof rowS[ 0 ] !== "object" );
  }

  function objectifyRows ( rowS ) {
    var objectifiedRowS = [];
    for ( var i = 0, len = rowS.length; i < len; i++ ) {
      objectifiedRowS.push( { id:i+1, content: rowS[ i ] }); 
    }
    return objectifiedRowS;
  }

  /*
  *	Update the rows by:
  * (1) Creating new levels in accordance to new rows
  * (2) Updating existing levels in accordance to changes in changed rows
  */
  LAY.Many.prototype.updateRows = function () {
    var 
  		rowS = this.level.attr2attrVal.rows.calcVal,
  		row,
  		id,
  		level,
  		parentLevel = this.level.parentLevel,
      updatedAllLevelS = [],
      newLevelS = [],
      id2level = this.id2level,
      id2row = this.id2row,
      rowKey, rowVal, rowAttr,
      rowAttrVal,
      i, len;

    // incase rows is explicity set to undefined
    // (most likely through a Take)
    if ( !rowS ) {
      rowS = [];
    }
    if ( checkIfRowsIsNotObjectified ( rowS ) ) {
      rowS = objectifyRows( rowS );
    }

  	for ( i = 0, len = rowS.length; i < len; i++ ) {
  		row = rowS[ i ];
  		id = row[ this.id ];
      id2row[ id ] = row;
  		level = this.id2level[ id ];
      
      if ( !level ) {
        // create new level with row
        if ( id === undefined ) {
          throw "LAY Error: No id provided for many " + this.pathName;
        }
  			level = new LAY.Level( this.level.pathName + ":" + id,
  			 this.partLson, parentLevel, false, this, row, id );
        level.$init();
        // the level has already been normalized
        // while LAY was parsing the "many" level
        level.isNormalized = true;

  			parentLevel.childLevelS.push( level );
  			id2level[ id ] = level;
        id2row[ id ] = row;

        level.$createAttrVal( "$i", i + 1 );
        level.$createAttrVal( "$f", -1 );

        newLevelS.push( level );

		  } else {
        // update level with new row changes
        level.attr2attrVal.$i.update( i + 1 );

        for ( rowKey in row ) {
          rowVal = row[ rowKey ];
          rowAttr = "row." + rowKey;
          rowAttrVal = level.attr2attrVal[ rowAttr ];
          if ( !rowAttrVal ) {
            level.$createAttrVal( rowAttr, rowVal );
          } else {
            rowAttrVal.update( rowVal );
          }
        }
  		}

      updatedAllLevelS.push( level );

  	}

    // solve as new levels might have been intoduced
    // after "Level.$identifyAndReproduce()"
    LAY.$solve();

    for ( id in id2level ) {
      level = id2level[ id ];
      if ( level &&
          updatedAllLevelS.indexOf( level ) === -1 ) {
        level.$remove();
        this.id2row[ id ] = undefined;
        this.id2level[ id ] = undefined;
      }
    }

    this.allLevelS = updatedAllLevelS;
    LAY.$solve();


  };

  LAY.Many.prototype.updateFilter = function ( ) {
    var  
      allLevelS = this.allLevelS,
      filteredRowS =
        this.level.attr2attrVal.filter.calcVal || [],
      filteredLevelS = [],
      filteredLevel, f = 1;

    for ( 
      var i = 0, len = allLevelS.length;
      i < len; i++ ) {
      allLevelS[ i ].attr2attrVal.$f.update( -1 );
    }

    for ( 
      var i = 0, len = filteredRowS.length;
      i < len; i++ ) {
      filteredLevel = this.id2level[ filteredRowS[ i ].id ];
      if ( filteredLevel ) {
        filteredLevelS.push( filteredLevel );
        filteredLevel.attr2attrVal.$f.update( f++ );
      }
    }


    this.filteredLevelS = filteredLevelS;

    this.updateFilteredPositioning();

  };

  LAY.Many.prototype.updateFilteredPositioning = function () {

    if ( this.isLoaded ) {
      var
        filteredLevelS = this.filteredLevelS,
        formationFn = LAY.$formationName2fn[
          this.level.attr2attrVal.formation.calcVal ],
        firstFilteredLevel = filteredLevelS[ 0 ];

      if ( firstFilteredLevel && firstFilteredLevel.part ) {
        firstFilteredLevel.$setFormationXY(
          undefined, undefined );
      }
      for ( 
        var f = 1, len = filteredLevelS.length, filteredLevel;
        f < len;
        f++
       ) {
        filteredLevel = filteredLevelS[ f ];
        // if the level is not initialized then
        // discontinue the filtered positioning
        if ( !filteredLevel.part ) {
          return;
        }
        formationFn( f + 1, filteredLevelS[ f ], filteredLevelS );
      }

      LAY.$solve();
    }

  };

  

  LAY.Many.prototype.sort = function ( rowS ) {
    var sortAttrPrefix,
      attr2attrVal = this.level.attr2attrVal,
      numSorts = attr2attrVal["$$num.sort"] ?
        attr2attrVal["$$num.sort"].calcVal : 0,
      sortDictS = [];

    for ( var i=0; i<numSorts; i++ ) {
      sortAttrPrefix = "sort." + ( i + 1 ) + ".";
    
      sortDictS.push(
        { key:attr2attrVal[ sortAttrPrefix + "key" ].calcVal,
        ascending:
        attr2attrVal[ sortAttrPrefix + "ascending" ].calcVal  });
    }

    rowS.sort( dynamicSortMultiple( sortDictS ) );

  };

  


 


  // below code is taken from one of the responses
  // to the stackoverflow question:
  // http://stackoverflow.com/questions/1129216/sort-array-of-objects-by-string-property-value-in-javascript
  // source: http://stackoverflow.com/a/4760279

  function dynamicSort( sortDict ) {
    var key = sortDict.key,
      sortOrder = sortDict.ascending ? 1 : -1;

    return function (a,b) {
        var result = (a[key] < b[key]) ? -1 : (a[key] > b[key]) ? 1 : 0;
        return result * sortOrder;
    }
  }

  function dynamicSortMultiple( sortDictS ) {
    
    return function (obj1, obj2) {
        var i = 0, result = 0,
        numberOfProperties = sortDictS.length;
        /* try getting a different result from 0 (equal)
         * as long as we have extra properties to compare
         */
        while(result === 0 && i < numberOfProperties) {
            result = dynamicSort(sortDictS[i])(obj1, obj2);
            i++;
        }
        return result;
    }
  }

})();
