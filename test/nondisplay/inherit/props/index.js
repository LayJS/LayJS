var
  externalDimension = 10,
  internalDimension = 20,
  noneDimension = 30,
  stateDimension = 40,
  externalColor = LAY.rgba(10,10,10),
  internalColor = LAY.rgba(20,20,20),
  noneColor = LAY.rgba(30,30,30),
  stateColor = LAY.rgba(30,30,30);
  


var externalInherit = {
  props: {
    width: externalDimension,
    height: externalDimension,
    rotateZ: externalDimension,
    border: {
      width: externalDimension
    },
    boxShadows: [
      {x: externalDimension, y:externalDimension,
        blur: externalDimension, color: externalColor}
    ]
  }
};


LAY.run({
  children:{
    "Body": {
      children: {
        "Content": {
            children: {
              "InternalInherit": {
                props: {
                  width: internalDimension,
                  height: internalDimension,
                  borderTopWidth: internalDimension,
                  borderRightWidth: internalDimension,
                  boxShadows: [
                    {x: internalDimension, y:internalDimension,
                      color: internalColor}
                  ]
                }
              },
              "Box": {
                $inherit: [externalInherit, "../InternalInherit" ],
                data: {
                  state: false
                },
                props: {
                  width: noneDimension,
                  borderTopWidth: noneDimension,
                  boxShadows1X: noneDimension
                },
                
                states: {
                  "state": {
                    onlyif:LAY.take("", "data.state"),
                    props: {
                      width: stateDimension,
                      borderRightWidth: stateDimension,
                      boxShadows: [{y:stateDimension}],
                      boxShadows1Color: stateColor,
                      z: stateDimension
                    }
                  },
                }
              }
            }
          }
        }
      }
    }
  });




QUnit.test( "LSON.inherit", function( assert ) {


  var lvl = LAY.level("/Body/Content/Box");
  var noneLvl = lvl.level("None");
  var mixedLvl = lvl.level("Mixed");
  var internalLvl = lvl.level("Internal");
  var externalLvl = lvl.level("External");


  // without state

  assert.strictEqual(lvl.attr("width"), noneDimension);
  assert.strictEqual(lvl.attr("height"), internalDimension);
  assert.strictEqual(lvl.attr("rotateZ"), externalDimension);
  assert.strictEqual(lvl.attr("borderTopWidth"), noneDimension );
  assert.strictEqual(lvl.attr("borderRightWidth"), internalDimension );
  assert.strictEqual(lvl.attr("borderBottomWidth"), externalDimension );
  assert.strictEqual(lvl.attr("boxShadows1X"), noneDimension );
  assert.strictEqual(lvl.attr("boxShadows1Y"), internalDimension );
  assert.strictEqual(lvl.attr("boxShadows1Color"), internalColor );
  assert.strictEqual(lvl.attr("boxShadows1Blur"), externalDimension );


  // with state
  lvl.data("state", true);

  assert.strictEqual(lvl.attr("width"), stateDimension);
  assert.strictEqual(lvl.attr("height"), internalDimension);
  assert.strictEqual(lvl.attr("rotateZ"), externalDimension);
  assert.strictEqual(lvl.attr("borderTopWidth"), noneDimension );
  assert.strictEqual(lvl.attr("borderRightWidth"), stateDimension );
  assert.strictEqual(lvl.attr("borderBottomWidth"), externalDimension );
  assert.strictEqual(lvl.attr("boxShadows1X"), noneDimension );
  assert.strictEqual(lvl.attr("boxShadows1Y"), stateDimension );
  assert.strictEqual(lvl.attr("boxShadows1Color"), stateColor );
  assert.strictEqual(lvl.attr("z"), stateDimension);

  

});


