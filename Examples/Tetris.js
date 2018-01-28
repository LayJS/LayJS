// also available at http://codepen.io/amitmulay18/pen/qbrKWw
function Tetris(inttocolor, noofcolors, defcolor, noofcols, nooflines, tetradPointsCalc) {
        
        function _cell(noofcols) {
        	return function(ele) {
        		return ele.row * noofcols + ele.column;
        	}
        }
        var cell = _cell(noofcols);
	function _isBlocked(defcolor, noofcols, noofrows) {
	
		return function(data, points, previouspoints) {

			var blockedpoints = points.filter(function (ele) {
				var intersections = previouspoints.filter(ele1 => ele1.row == ele.row && ele1.column == ele.column);
				return (intersections.length == 0) && (data[cell(ele)] != defcolor);
	
			});
			var outsidebound = points.filter(function (ele) {
				return ((ele.column < 0) 
					|| (ele.row < 0)
					|| (ele.row >= noofrows)
					|| (ele.column >= noofcols)
				);
	
			});
			return (blockedpoints.length > 0) || (outsidebound.length > 0);
			
		}
	}          
          
        var isBlocked =  _isBlocked(defcolor, noofcols, nooflines);
        
        
	LAY.run({
		props: {
			backgroundColor: LAY.rgb(220,210,210)
		},
		"Output": {
			data: {
			    score: 0,
			    finishedtext: ""
          		},
			props:{
				left : LAY.take("/Grid", "left"),
				textLineHeight: 1.4,
				text : LAY.take("Score: %d! %s").format(LAY.take("", "data.score"), LAY.take("", "data.finishedtext"))
			},
		},
		"LeftText": {
			$type: "html",
			props:{
				left : LAY.take("/", "left").add(10),
				width : LAY.take("/", "width").divide(8),
				textLineHeight: 1.4,
				text : LAY.take('', 'row.content')
			},
			many: {
				formation: 'onebelow',
			        fargs: {
			          onebelow: {
			            gap: 1
			          }
			        },
			        rows: [
			          'This example is based on LAY framework!',
			          'Here are few points regarding LAY framework,',
			          '<li>Declarative Style of programming!</li>',
			          '<li>Simple and yet very powerful! <br>(Learning curve of a day! <br>and the example just took an hour or so!)</li>',
			          '<li>LAY.take monad makes it very logical<br>and developer friendly framework rather than magical!<br></li>',
			          '<br>',
			          'The example demonstrates following things',
			          '<li>Minified Tetris game. New shapes can be added easily!</li>',
			          '<li>Responsive! Constraints style makes it so easy!',
			          '<li>Keyboard event processing! <br>Arrow keys for moving and rotating!</li>',
			          '<li>HTML type makes it easy to put static text!</li>',
			          '<li>Constraint and data makes it very nice document/view design<br>(Code for score updation!)</li>',
			          '<li>Many is used for indvidual cell drawing</li>',
			          '<li>Formations! Grid formation made whole implementation so easy!<br>One below for current text itself!</li>'
			        ]
			}

		},
		"Grid": {
			$load: function () {
				var self = this;

				function random(limit) {
					return Math.floor(Math.random() * limit);
				}

	
				function updateGrid() {
					LAY.clog();
					var colordata = self.attr("data.colors");
					var currentrow = self.attr("data.currentrow");
					var currentcolumn = self.attr("data.currentcolumn");
					var rotateangle = self.attr("data.rotateangle");
					var currentshape = self.attr("data.currentshape");
					var currenttetrad = tetradPointsCalc[currentshape].pointsCalc(currentrow, currentcolumn, rotateangle);
					var previoustetrad = self.attr("data.previoustetrad");
					var isblocked = isBlocked(colordata, currenttetrad, previoustetrad);
		    			var currentcolor = self.attr("data.currentcolor");		
		    					
		    			if (currentrow == 0) {
		    				LAY.level("/Output").data("score", colordata.filter(ele => ele > 0).length);
		    			}
					if (isblocked) {
						self.data("currentrow", 0);
						self.data("rotateangle", 0);
						self.data("currentcolumn", noofcols / 2 );
						var currentshape = random(tetradPointsCalc.length);
						self.data("previoustetrad", tetradPointsCalc[currentshape].defaultTetrad);
						var col = random(noofcolors) ;
						self.data("currentcolor", col+1);
						self.data("currentshape", currentshape);
						LAY.level("/Output").data("score", colordata.filter(ele => ele > 0).length);
			    			if (currentrow == 0) {
			    				// This condition is based on very specific assumption making code non generic.
			    				// right now lazy to fix it.
			    				if ((colordata[noofcols / 2] != 0)
			    					|| (colordata[noofcols / 2 + 1] != 0)
			    					|| (colordata[noofcols / 2 + 2] != 0)
			    					) {
			    					LAY.level("/Output").data("finishedtext", "GAME over!!");
			    					self.data("colors", Array.apply(null, Array(noofcols*nooflines)).map(function() {return defcolor;}));
			    				}
			    			}
			    		}
					else {
						LAY.level("/Output").data("finishedtext", "");
						self.data("previoustetrad", currenttetrad);
						var colordata1 = Array.apply(null, Array(colordata.length)).map(function(v, ii) { 
							var exist = previoustetrad.map(ele => cell(ele)).indexOf(ii) != -1;
							if (exist) {
								return defcolor;
							}
							return colordata[ii]; 
						});
						var colordata2 = Array.apply(null, Array(colordata.length)).map(function(v, ii) { 
							var exist = currenttetrad.map(ele => cell(ele)).indexOf(ii) != -1;
							if (exist) {
								return currentcolor;
							}
							return colordata1[ii]; 
						});					
						self.data("colors", colordata2);
						self.data("currentrow", (currentrow+1));
					}
			    		
			    		LAY.unclog();
			  	}
			  	setInterval( updateGrid, 1000 );
			  	//updateGrid();
			},
			props: {
				width: LAY.take("../", "width").divide(5),
				height: LAY.take("../", "height").divide(2),
				centerX: 0,
				centerY: 0,
				backgroundColor:LAY.color("white"),
			},
			data: {
				colors : Array.apply(null, Array(noofcols*nooflines)).map(function() { return defcolor}),
				currentrow : 0,
				currentcolumn : noofcols / 2,
				previoustetrad : tetradPointsCalc[0].defaultTetrad,
				rotateangle : 0,
				currentcolor : 1,
				currentshape : 0
			},
			"Line": {
				many: {
					rows: new Array(noofcols*nooflines),
					formation: "grid",	
					fargs: {
						grid: {
							hgap: 0,
							vgap: 0,
							columns : noofcols,
						}
					}
				},			
				props: {
					width: LAY.take("../", "width").divide(noofcols),
					height: LAY.take("../", "height").divide(nooflines),
					zIndex:"3",
					backgroundColor: LAY.take(function (col) {
							return inttocolor(col);
					}).fn(LAY.take("/Grid", "data.colors").index(LAY.take("", "$i").subtract(1))),
					border: {style:"solid", width: 1, color: LAY.color("grey")},
				}
			},

		},
		when: {
			keyup: function(e) {
				LAY.clog();
				var colordata = LAY.level("/Grid").attr("data.colors");
				var currentrow = LAY.level("/Grid").attr("data.currentrow");
				var currentcolumn = LAY.level("/Grid").attr("data.currentcolumn");
				var rotateangle = LAY.level("/Grid").attr("data.rotateangle");
				var previoustetrad = LAY.level("/Grid").attr("data.previoustetrad");
				var currentshape = LAY.level("/Grid").attr("data.currentshape");
				if (e.keyCode === 39) {
					var currenttetrad = tetradPointsCalc[currentshape].pointsCalc(currentrow, ++currentcolumn, rotateangle);
					var isblocked = isBlocked(colordata, currenttetrad, previoustetrad);
					if (!isblocked) {
						LAY.level("/Grid").data("currentcolumn", currentcolumn);
					}
				}
				else if (e.keyCode === 37) {
					var currenttetrad = tetradPointsCalc[currentshape].pointsCalc(currentrow, --currentcolumn, rotateangle);
					var isblocked = isBlocked(colordata, currenttetrad, previoustetrad);
					if (!isblocked) {
						LAY.level("/Grid").data("currentcolumn", currentcolumn);
					}
				}
				else if (e.keyCode === 38) {
					var currenttetrad = tetradPointsCalc[currentshape].pointsCalc(currentrow, currentcolumn, rotateangle+90);
					var isblocked = isBlocked(colordata, currenttetrad, previoustetrad);
					if (!isblocked) {
						LAY.level("/Grid").data("rotateangle", rotateangle+90);
					}
				}
				else if (e.keyCode === 40) {
					var currenttetrad = tetradPointsCalc[currentshape].pointsCalc(currentrow, currentcolumn, rotateangle-90);
					var isblocked = isBlocked(colordata, currenttetrad, previoustetrad);
					if (!isblocked) {
						LAY.level("/Grid").data("rotateangle", rotateangle-90);
					}
				}	
				LAY.unclog();
			}
		},        
	});
}

function inttocolor(i) {
	if (i == 1) return LAY.color("red");
	if (i == 2) return LAY.color("green");
	if (i == 3) return LAY.color("blue");
	return LAY.color("white");
}

function getLineTetrad() {
	function Points(currentrow, startcol, rotateangle) {
		var rotate = Math.abs(rotateangle % 360);
		if ((rotate == 0) || (rotate == 180)) {
			return [{row : currentrow, column : startcol}, 
				{row : currentrow, column : startcol + 1}, 
				{row : currentrow, column : startcol + 2}
			];
			
		}
	
		if ((rotate == 90) || (rotate == 270)) {
			return [{row : currentrow-1, column : startcol+1}, 
				{row : currentrow, column : startcol + 1}, 
				{row : currentrow+1, column : startcol + 1}
			];
					
		}

	}
	return {pointsCalc : Points, defaultTetrad : []};
}

function getCrossTetrad() {
	function Points(currentrow, startcol, rotateangle) {
		return [{row : currentrow, column : startcol}, 
			{row : currentrow+1, column : startcol - 1}, 
			{row : currentrow+1, column : startcol}, 
			{row : currentrow+1, column : startcol+1}, 
			{row : currentrow+2, column : startcol}
		];
			
	}
	return {pointsCalc : Points, defaultTetrad : []};
}

function getBlockTetrad() {
	function Points(currentrow, startcol, rotateangle) {
		return [{row : currentrow, column : startcol},
			{row : currentrow, column : startcol+1},
			{row : currentrow+1, column : startcol}, 
			{row : currentrow+1, column : startcol+1}, 
		];
			
	}
	return {pointsCalc : Points, defaultTetrad : []};
}

Tetris(inttocolor, 3, 0, 16, 10, [getLineTetrad(), getCrossTetrad(), getBlockTetrad()]);
