var map = {
	 "name": "",
	 "children": []
};

var chardeath_links = [],
	charhouse_links = [];

var diameter = 640,
    radius = 940 / 2,
    innerRadius = radius - 270,
	circle = 940;

var cluster = d3.layout.cluster()
    .size([360, innerRadius])
	.sort(function(a, b) {
		var valueA = a.appear * 100;
		var valueB = b.appear * 100;

		var charA = a.name.toLowerCase().charCodeAt(0);
		var charB = b.name.toLowerCase().charCodeAt(0);

		if(a.nodeType == 'char'){
			return d3.descending(valueA, valueB);
		} else {
			return d3.descending(valueB - charB, valueA - charA);
		}
	})
    .value(function(d) { return d.appear; });

var bundle = d3.layout.bundle();

var svg = d3.select("#got-network").append("svg")
    .attr("width", circle)
    .attr("height", diameter+240)
  .append("g")
    .attr("transform", "translate(" + (radius + 75) + "," + (radius - 50) + ")");

var svgDefs = svg.append("svg:defs");

var line = d3.svg.line.radial()
    .interpolate("bundle")
    .tension(.60)
    .radius(function(d) { return d.y; })
    .angle(function(d) { return d.x / 180 * Math.PI; });

var dataSource = 'data/thrones_characters.csv';  // Cleaned GoT chars data

var maxCharToDeath = 0,
	maxDeathToChars = 0,
	maxCharsToHouses = 0,
	maxHousesToChars = 0,
	maxCharDeath = 0,
	maxCharAppear = 0,
	minCharAppear = undefined,
	totalChars = 45;  // Limit to 45 chars

var gradientCounter = 0,
	charStatus = {},
	charAlive = [],
	charDeceased = [],
	charMale = [],
	charFemale = [];

// Main data processing
d3.csv(dataSource, function (error, rows) {
	data = rows;
	processThrones(data);
});

// Main function
function processThrones(data){

	var charRootNode = {
		name: 'chars',
		children: []
	}
	var deathRootNode = {
		name: 'chars',
		children: []
	}
	var houseRootNode = {
		name: 'chars',
		children: []
	}

	var chars = {},
		weapons = {},
		houses = {},
		death = {};

	var statusTags,
		houseTags;

	for(var d = 0; d < totalChars; d++){
		chars[ data[d]['name'] ] = {
			name: data[d]['name'],
			className: getClassName(data[d]['name']),
			children: [],
			appear: data[d]['appeared'],
			numDeath: 0,
			weapons: [],
			houses: [],
			numHouse: 0,
			nodeType: 'char',
			image: data[d]['image'],
			connectedNodes: [],
			charStatus: data[d]['status'],
			seasons: data[d]['season'].split(','),
			deathLink: '',
			genderLink: '',
			houseConnections:{'male': [], 'female': []},
			deathConnections: {'deceased': [], 'alive': []},
			gender: data[d]['gender'],
			portrayed: data[d]['portrayed'],
			culture: data[d]['culture'],
			religion: data[d]['religion']
		}

		statusTags = ( data[d]['houseallegiance'] != '' ) ? data[d]['houseallegiance'].split(', ') : [];
		houseTags = ( data[d]['deathcause'] != '' ) ? data[d]['deathcause'].split(', ') : [];

		if(charStatus.hasOwnProperty(data[d]['status'])){
			charStatus[data[d]['status']]['total'] ++;
			charStatus[data[d]['status']]['data'].push(chars[ data[d]['name'] ]);

		} else {
			charStatus[data[d]['status']] = {
				name: data[d]['status'],
				total: 1,
				data: [ chars[ data[d]['name'] ] ]
			}
		}

		if( minCharAppear == undefined){
			minCharAppear = chars[ data[d]['name'] ]['appear'];

		} else if( minCharAppear > chars[ data[d]['name'] ]['appear'] ){
			minCharAppear = chars[ data[d]['name'] ]['appear'];
		}

		if( chars[ data[d]['name'] ]['appear'] > maxCharAppear ){
			maxCharAppear = chars[ data[d]['name'] ]['appear'];
		}

		if( statusTags.length > 0){
			var includeCharDeath = false;
			chars[ data[d]['name'] ]['numDeath'] = statusTags.length;
			statusTags.forEach(function(w){

				if( !weapons[ w ] ){
					weapons[w] = {
						name: w,
						className: getClassName(w),
						children: [],
						appear: 0,
						numChars: 0,
						chars: [],
						nodeType: 'house',
						connectedNodes: [],
						barLinks : {},
						genderLink: ''
					}
				}

				chardeath_links.push({
					type: 'char-death-link',
					source: chars[ data[d]['name'] ],
					target: weapons[w]
				})

				weapons[w]['appear'] ++;
				weapons[w]['numChars'] ++;

				weapons[w]['connectedNodes'].push(chars[ data[d]['name'] ]['className']);
				weapons[w]['chars'].push(chars[ data[d]['name'] ]['name']);

				chars[ data[d]['name'] ]['connectedNodes'].push(weapons[w]['className']);
				chars[ data[d]['name'] ]['weapons'].push(weapons[w]['name']);

				if(chars[ data[d]['name'] ]['gender'] == 'm'){
					includeCharDeath = true
					weapons[w]['genderLink'] = weapons[w]['barLinks']['male'] = 'male'
					chars[ data[d]['name'] ]['houseConnections']['male'].push(weapons[w])

				} else {
					weapons[w]['genderLink'] = weapons[w]['barLinks']['female'] = 'female'
					chars[ data[d]['name'] ]['houseConnections']['female'].push(weapons[w])
				}

			})

			if(includeCharDeath){
				charMale.push(chars[ data[d]['name'] ]);
				chars[ data[d]['name'] ]['genderLink'] = 'male';

			} else {
				charFemale.push(chars[ data[d]['name'] ]);
				chars[ data[d]['name'] ]['genderLink']  = 'female';
			}

		} else {
			charFemale.push(chars[ data[d]['name'] ]);
			chars[ data[d]['name'] ]['genderLink']  = 'female';
		}

		if( houseTags.length > 0){
			var includeCharHouse = false;

			chars[ data[d]['name'] ]['numHouses'] = statusTags.length;

			houseTags.forEach(function(h){

				if( !houses[h] ){
					houses[h] = {
						name: h,
						className: getClassName(h),
						children: [],
						appear: 0,
						numChars: 0,
						chars: [],
						nodeType: 'death',
						connectedNodes: [],
						barLinks: {},
						deathLink: ''
					}
				}

				charhouse_links.push({
					type: 'char-house-link',
					source: chars[ data[d]['name'] ],
					target: houses[h]
				})

				houses[h]['appear'] ++;
				houses[h]['numChars'] ++;

				houses[h]['connectedNodes'].push(chars[ data[d]['name'] ]['className']);
				houses[h]['chars'].push(chars[ data[d]['name'] ]['name']);

				chars[ data[d]['name'] ]['connectedNodes'].push(houses[h]['className']);
				chars[ data[d]['name'] ]['houses'].push(houses[h]['name']);

				if(chars[ data[d]['name'] ]['charStatus'] == 'Deceased'){
					includeCharHouse = true;
					houses[h]['deathLink'] = houses[h]['barLinks']['death'] = 'violence';
					chars[ data[d]['name'] ]['deathConnections']['deceased'].push(houses[h]);

				} else {
					houses[h]['deathLink'] = houses[h]['barLinks']['death'] = 'noviolence';
					chars[ data[d]['name'] ]['deathConnections']['alive'].push(houses[h]);
				}

			})

			if(includeCharHouse){
				charAlive.push(chars[ data[d]['name'] ]);
				chars[ data[d]['name'] ]['deathLink'] = 'deceased';

			} else {
				charDeceased.push(chars[ data[d]['name'] ]);
				chars[ data[d]['name'] ]['deathLink'] = 'alive';
			}

		} else {
			chars[ data[d]['name'] ]['deathLink'] = 'alive';
		}
	}

	for(var c in chars){
		charRootNode.children.push(chars[c]);

		if(chars[c]['numHouses'] > maxCharsToHouses){
			maxCharsToHouses = chars[c]['numHouses'];
		}

		if(chars[c]['numDeath'] > maxCharToDeath){
			maxCharToDeath = chars[c]['numDeath'];
		}

	}

	for(var w in weapons){
		deathRootNode.children.push(weapons[w]);

		if(weapons[w]['numChars'] > maxDeathToChars){
			maxDeathToChars = weapons[w]['numChars'];
		}
	}

	for(var h in houses){
		houseRootNode.children.push(houses[h]);

		if(houses[h]['numChars'] > maxHousesToChars){
			maxHousesToChars = houses[h]['numChars'];
		}
	}

	maxCharDeath = maxCharToDeath;
	if( maxDeathToChars > maxCharToDeath){
		maxCharDeath = maxDeathToChars;
	}

	maxCharHouses = maxCharsToHouses;
	if( maxHousesToChars > maxCharHouses){
		maxCharHouses = maxHousesToChars;
	}

	map.children.push(charRootNode);
	map.children.push(deathRootNode);
	map.children.push(houseRootNode);

	drawChart();

	var statusArray = []
	for(var k in charStatus){
		charStatus[k].contentType = 'status';
	}

	var genderArray = [
		{
			name: 'Male',
			total: charMale.length,
			contentType: 'house',
			data: charMale
		},
		{
			name: 'Female',
			total: totalChars - charMale.length,
			contentType: 'house',
			data: charFemale
		},

	];

	drawSmallChart('chart-char-gender', genderArray, 'left', 60);

	var deathArray = [
		{
			name: 'Deceased',
			total: charAlive.length,
			contentType: 'death',
			data: charAlive
		},
		{
			name: 'Alive',
			total: totalChars - charAlive.length,
			contentType: 'death',
			data: charDeceased
		}
	]

	drawSmallChart('chart-char-death', deathArray, 'left', 60);

	$('.got-button').click(function(e){
		if($(this).hasClass('got-button-selected') == false){
			currentSelectionText = $(this).text();
			$(this).text('Show all characters')
			currentSelectionBtn = this;

			if($(this).attr('id') == 'btn-gender'){
				showBarConnections( genderArray['0']);

			} else if($(this).attr('id') == 'btn-death'){
				showBarConnections( deathArray['0'])
			}

		} else {
			hideBarConnections( currentSelection );
		}

	})
}

var smallVis = {};

function drawSmallChart(location, data, align, height){
    var h = height,
        w = 200,
        barH = 25;

    var startX = 0;
    var startY = 1;

    smallVis[data[0]['contentType']] = vis = d3.select("#" + location).append('svg')
            .attr({
                'height': h + 'px',
                'width': w + 'px'
            });

    w = 150;

    var bars = vis.selectAll(".bar")
            .data(data)
          .enter()
            .append('g')
            .attr('class', 'bar-group')
            .attr('id', function(d){
                    return 'bargroup-' + d.name.toLowerCase().replace(' ', '')
            });

    bars.append('rect')
        .attr("x", function(d,i){
            if(align == 'right'){
                return w -barW(d.total) -30  //+ barX(data,i)
            } else {
                return startX +30 //+ barX(data,i)
            }
        })
        .attr("y", function (d,i){
            return startY + (barH + 1) * i
        })
        .attr("width", function(d){
            return barW(d.total)
        })
        .attr("height", barH)
        .attr('id', function(d){
            return 'bar-' + d.name.toLowerCase().replace(' ', '')
        })
        .attr('class', 'bar')
        .style('fill', function(d){

            if(d.contentType == 'status'){
                    return '#5265AE'
            } else if(d.contentType == 'house'){
                    return '#5E843A';
            } else if(d.contentType == 'death'){
                    return '#CC2F27'
            }
        })
        .on("mouseover", function(d){

            $('.got-button').removeClass('got-button-selected')
            $(currentSelectionBtn).text(currentSelectionText)
            currentSelectionText = ''
            currentSelectionBtn = undefined;
            showBarConnections(d);
            console.log(d);

        })
        .on("mouseout", hideBarConnections);

    bars.append('text')
        .attr("class",'bar-label')
        .attr("y", function(d,i){
            var yPos = startY + ((barH + 1) * i) + 16
            return yPos;
        })
        .attr("x", function(d,i){
            if(align == 'right'){
                    return w - barW(d.total) -35;
            } else {
                    return barW(d.total) +35;
            }
        })
        .attr("text-anchor",function(d){
            if(align == 'right'){
                return 'end';
            } else {
                return 'start';
            }
        })
        .text(function(d) {
            var text = '';

            if(d.contentType == 'house'){
                if (d.name == 'Male') {
                	text = 'Male';
                } else {
                	text = 'Female';
                }
            } else if(d.contentType == 'death'){
            	text = d.name;
            }
            return text;
        });

    bars.append('text')
        .attr("class",'bar-label-pct')
        .attr("y", function(d,i){
            var yPos = startY + ((barH + 1) * i) + 16
            return yPos;
        })
        .attr("x", function(d,i){
            if(align == 'right'){
                    return w
            } else {
                    return startX
            }
        })
        .attr("text-anchor",function(d){
            if(align == 'right'){
                    return 'end'
            } else {
                    return 'start'
            }
        })
        .text(function(d) {
            var text = Math.round(d.total/totalChars * 100).toFixed(0) + '%'
            return text;
        });

    function barX (data, pos){
        var xPos = startX + barW(data[pos].total) + 5;
        return xPos;
    }

    function barW(v){
        return v/totalChars * w;
    }
}

function color(val){
	var color;
	if(val == 1){
		color= '#eee'
	} else if (val == 2){
		color = '#ccc'
	} else if (val == 3){
		color = '#333'
	} else if (val == 4){
		color = '#666'
	}
	return color
}

function drawChart(){

	var barScale = d3.scale.linear()
	    .domain([0,10])
	    .range([0,50]);

	var gameBarScale = d3.scale.linear()
	    .domain([0,maxCharAppear])
	    .range([0,10]);

	var nodes = cluster.nodes(map)

	svg.selectAll(".node-dot")
	      .data(nodes.filter(function(n) { return n.depth == 2; }))
	    .enter().append("g")
	      .attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")"; })
	    .append("rect")
		  .attr('class', function(d){
			return 'node-dot ' + 'nodedot-' + d.className})
		  .attr('y', -5)
	      .attr('height', 12)
	      .attr('width', function(d){
			if(d.nodeType == 'char'){
				return gameBarScale(d.appear)
			} else {
				return barScale(d.appear)
			}})
		  .style('fill', function(d){
			 	return getColor(d.nodeType, d.appear)
	   	   })
		  .on("mouseover", showConnections)
	      .on("mouseout", hideConnections);

	svg.selectAll(".node")
	      .data(nodes.filter(function(n) { return n.depth == 2; }))
	    .enter().append("g")
		  .attr("class", 'node')
	      .attr("transform", function(d) {

			var translatevalue = d.y + 5
			if(d.nodeType == 'char'){
				translatevalue += gameBarScale(d.appear)
			} else {
				translatevalue += barScale(d.appear)
			}

			return "rotate(" + (d.x - 90) + ")translate(" + translatevalue + ")"; })

	    .append("text")
	      .attr("dx", function(d) { return d.x < 180 ? 0 : 0; })
	      .attr("dy", "5")
	      .attr("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
	      .attr("transform", function(d) { return d.x < 180 ? null : "rotate(180)"; })
	      .text(function(d) { return d.name; })
	      .attr("id", function(d){
				return 'nodetext-' + d.className;
		   })
		  .attr("class", function(d){
				var bClass ="circle-text"

				if(d.nodeType == 'char'){
					bClass += ' btext-' + d.genderLink + ' btext-' + d.deathLink;
				} else if(d.nodeType == 'house'){
					bClass += ' btext-' + d.genderLink;
				} else {
					bClass += ' btext-' + d.deathLink;
				}

				return bClass;
	      })
		  .style('fill', function(d){
		  			if(d.nodeType == 'char'){
						return '#394B9F';
					} else if(d.nodeType == 'house' ) {
						return '#3C602E';
					} else if( d.nodeType == 'death'){
						return '#CC2F27';
					}
		  	   })
	      .on("mouseover", showConnections)
	      .on("mouseout", hideConnections);

	$('.node').mousemove(setPopupPosition);
	$('.node-dot').mousemove(setPopupPosition);

	charDeathColor = d3.interpolateRgb("#ccc", '#2C3878');

	charDeathScale = d3.scale.linear()
	    				.domain([0,maxCharDeath])
	    				.range([0,1]);

	charHouseColor = d3.interpolateRgb("#ccc", '#3C602E');

	charHouseScale = d3.scale.linear()
	    				.domain([0,maxCharHouses])
	    				.range([0,1]);

	var mergedLinks = chardeath_links.concat(charhouse_links);

	svg.selectAll(".links")
		.data(bundle(mergedLinks))
	  .enter().append("path")
		.attr("class", function(d){
			var linkClass = 'links link-' + d[4]['className'] + ' link-' + d[0]['className']
			var node = (d[4]['nodeType'] == 'char')? d[4] : d[0];

			var gLink = (d[4]['nodeType'] == 'char')? d[4] : d[0];
			var oLink = (d[4]['nodeType'] == 'char')? d[0] : d[4];

			linkClass += ' barlink-' + gLink['className'] + oLink['className']

			linkClass += ' barlink-' + node['charStatus']

			return linkClass;
		})
		.attr("id", function(d){
			return 'link-' + d[4]['className'] + '-' + d[0]['className']
		})
		.attr("d", line)
		.style("stroke", function(d){
			var gradient;

			if(d[4]['nodeType'] == 'death' && d[0]['nodeType'] == 'char' ){
				return 'url(#' + getGradient(d[4]['numChars'], d[0]['appear'], 'death', 'char') +')'

			} else if(d[4]['nodeType'] == 'house' && d[0]['nodeType'] == 'char'){
				return 'url(#' + getGradient(d[4]['numChars'], d[0]['appear'], 'house', 'char') +')'
			}

			return 'url(#' + gradient +')';
		});
}

function getClassName(title){
	var name = title.replace(/ /g,'')
	name = name.replace(/\'/g,'')
	name = name.replace(/\//g,'')
	name = name.replace(/&/g,'')
	name = name.replace(/\./g,'')
	name = name.replace(/-/,'')
	name = name.replace(/!/g,'')
	name = name.replace(/:/g,'').toLowerCase()
	return name;
}

function setPopupPosition(e){
	e = jQuery.event.fix(e);
	mouseX = e.pageX;
	mouseY = e.pageY;

	if(mouseY < $('#got-network').offset().top + $('#got-network').outerHeight()/2){
		//bottom
		mouseY -= $('#node-info').outerHeight() + 10;
	} else {
		//top
		 mouseY += 10;
	}

	if(mouseX < $('#got-network').offset().left + $('#got-network').outerWidth()/2 ){
		//left side
		mouseX -= $('#node-info').outerWidth() + 10;

		if(mouseX  < 0){
			mouseX = 10;
		}

	} else {
		//right side
		mouseX += 10;

		if(mouseX + $("#node-info").outerWidth() > $(window).width() - 20){
			mouseX = $(window).width() - 10 - $("#node-info").outerWidth();
		}
	}

	if(e.pageY + $('#node-info').outerHeight() + 20 > $(document).height() ){
		mouseY = e.pageY - 20 - $('#node-info').outerHeight();
	}

	$('.got-popup').css({
		top: mouseY,
		left: mouseX
	})
}

var currentSelection = undefined;
var currentSelectionBtn = undefined;
var currentSelectionText = '';

function showBarConnections(d) {
	if(currentSelection){
		hideBarConnections(currentSelection )
	}

	currentSelection = d;
	$(currentSelectionBtn).addClass('got-button-selected')
	$(currentSelectionBtn).text('Show all characters')

	for(var s in smallVis){
		smallVis[s].selectAll('.bar')
			.style('fill', '#eee')
	}

	smallVis[d['contentType']].select('#bar-' + d.name.toLowerCase().replace(' ', ''))
		.style('fill', function(d){
			if(d.contentType == 'status'){
				return '#5265AE';
			} else if(d.contentType == 'house'){
				return '#5E843A';
			} else if(d.contentType == 'death'){
				return '#CC2F27';
			}
		})

	svg.selectAll('.circle-text')
		.classed('circle-text-dim', true);
	svg.selectAll('path.links')
		.style("stroke-opacity", .01)

	if (d.name == 'Deceased') {
		svg.selectAll('.btext-violence')
			.classed('highlight', true)
			.classed('circle-text-dim', false);
	} else {
		svg.selectAll('.btext-' + d.name.toLowerCase().replace(' ', ''))
			.classed('highlight', true)
			.classed('circle-text-dim', false);
		if (d.contentType != 'death') {
			if (d.name == 'Male') {
			var hArray = ['stark', 'tyrell', 'freefolk'];
			hArray.forEach(function (h) {
				svg.selectAll('#nodetext-' + h)
					.classed('highlight', true)
					.classed('circle-text-dim', false);
			});
			} else if (d.name = 'Female') {
				var hArray = ['baratheon', 'lannister', 'kingsguard', 'targaryen', 'freefolk', 'self', 'baelish'];
				hArray.forEach(function (h) {
					svg.selectAll('#nodetext-' + h)
						.classed('highlight', true)
						.classed('circle-text-dim', false);
				});
			}
		}
	}

	svg.selectAll('.node-dot')
		.style('opacity', .01);

	d.data.forEach(function(game){
		svg.select('#nodetext-' + game.className)
			.classed('highlight', true)
			.classed('circle-text-dim', false);

			svg.select('.nodedot-' + game.className)
				.style('opacity', 1)

			if(d.contentType == 'house' ){
				var wArray = game.houseConnections[ d.name.toLowerCase().replace(' ', '') ]
				wArray.forEach(function(node){
					svg.select('.nodedot-' + node['className'])
						.style('opacity', 1)

					svg.select('.barlink-' + game.className + node['className'])
						.style("stroke-opacity", 1)
				})
			} else if( d.contentType == 'death'){

				var tArray = game.deathConnections[ d.name.toLowerCase().replace(' ', '') ]

				tArray.forEach(function(node){

					svg.select('.nodedot-' +node['className'])
						.style('opacity', 1)

					svg.select('.barlink-' + game.className + node['className'])
						.style("stroke-opacity", 1)
				})
			}  else {

				game.connectedNodes.forEach(function(node){

					svg.select('.nodedot-' +node)
						.style('opacity', 1)

					svg.select('#nodetext-' + node)
						.classed('highlight', true)
						.classed('circle-text-dim', false);
				})
			}
	})

}

function hideBarConnections(d) {
	$('.got-button').removeClass('got-button-selected')
	$(currentSelectionBtn).text(currentSelectionText)

	for(var s in smallVis){

		smallVis[s].selectAll('.bar')
			.style('fill', function(d){
				if(d.contentType == 'status'){
					return '#5265AE'
				} else if(d.contentType == 'house'){
					return '#5E843A';
				} else if(d.contentType == 'death'){
					return '#CC2F27';
				}

			})
	}

	svg.selectAll('.node-dot')
		.style('opacity', 1)

	smallVis[d['contentType']].select('#bar-' + d.name.toLowerCase().replace(' ', ''))
		.classed('bar-highlight', false)

	svg.selectAll('.circle-text')
		.classed('highlight', false)
		.classed('circle-text-dim', false);
	svg.selectAll('path.links')
		.style("stroke-opacity", 1)

	currentSelection = undefined;
	currentSelectionBar = undefined;
	currentSelection = '';
}

function showConnections(d) {

	svg.selectAll('.circle-text')
		.classed('circle-text-dim', true);

	svg.select('#nodetext-' + d.className)
		.classed('highlight', true)
		.classed('circle-text-dim', false);

	svg.selectAll('.node-dot')
		.style("opacity", .01)

	svg.selectAll('path.links')
		.style("stroke-opacity", .01)

	svg.selectAll('path.link-' + d.className)
		.style("stroke-opacity",1)

	svg.selectAll('.nodedot-' + d.className)
		.style("opacity",1)

	d.connectedNodes.forEach(function(n){
		svg.select('#nodetext-' + n)
			.classed('highlight', true)
			.classed('circle-text-dim', false);

		svg.selectAll('.nodedot-' + n)
			.style("opacity", 1)
	})

	$("#node-info").empty();

	if(d.nodeType == 'char'){
		$("#charTemplate").tmpl( {
			name: d.name,
			color: getStatusColor(d.charStatus),
			imagesrc: d.image,
			episodes: d.appear,
			status: d.charStatus,
			season: d.seasons,
			religion: d.religion,
			culture: d.culture,
			portrayed: d.portrayed
		}).appendTo( "#node-info" );

		var weapons = (d.weapons.length > 0)? d.weapons: ['None'];
		$.each(weapons, function(i, w){
			$("#listTemplate").tmpl( {item: w}).appendTo( "#node-death-references .node-data" );
		})

		var houses = (d.houses.length > 0)? d.houses: ['N/A'];
		$.each(houses, function(i, t){
			$("#listTemplate").tmpl( {item: t}).appendTo( "#node-house-references .node-data" );
		})

		var seasons = (d.seasons.length > 0)? d.seasons: ['None'];
		$.each(seasons, function(i, s){
			$("#listTemplate").tmpl( {item: s}).appendTo( "#node-season-references .node-data" );
		})
	} else if(d.nodeType == 'house' ){
		$("#allegianceTemplate").tmpl( {
			name: d.name,
			color: getColor(d.nodeType, d.appear),
			count: d.numChars
		}).appendTo( "#node-info" );
	} else if( d.nodeType == 'death'){
		$("#deathTemplate").tmpl( {
			//name: (d.name.toLowerCase().search('use') >= 0)? 'the ' + d.name.toLowerCase() : d.name.toLowerCase(),
			name: (d.name.toLowerCase() == 'other')? 'wild board attack, throat slit or burned ' : d.name.toLowerCase(),
			color: getColor(d.nodeType, d.appear),
			count: (d.numChars > 1) ? d.numChars	+ ' major characters are': d.numChars	+ ' major character is'
		}).appendTo( "#node-info" );
	}
	$("#node-info").show();
}

function hideConnections(d) {
	$("#node-info").hide()
	svg.selectAll('path.links')
		.style("stroke-opacity", 1);

	svg.selectAll('.circle-text')
		.classed('circle-text-dim', false)
		.classed('highlight', false);

	svg.selectAll('.node-dot')
		.style("opacity", 1)

	if(currentSelection){
		showBarConnections(currentSelection )
	}
}

function getGradient(startValue, endValue, node1, node2){

	var gradientId = "gradient" + gradientCounter;

	var gradient = svgDefs.append("svg:linearGradient")
		.attr("id", gradientId);

	gradient.append("svg:stop")
	    .attr("offset", "10%")
	    .attr("stop-color", getColor( node1,startValue))

	gradient.append("svg:stop")
	    .attr("offset", "90%")
	    .attr("stop-color", getColor(node2, endValue))

	gradientCounter++;

	return gradientId;
}

function getStatusColor(status){
	if (status == 'Alive') {
		color = '#7EFF2B';
	} else {
		color = '#00302B';
	}
	return color;
}

function getColor(type, value){
	var color = '#ccc'
	if(type == 'char'){
		if( value <= 10){
			color = '#8B9BD9'
		} else if( value > 10 && value <= 15){
			color = '#5265AE'
		} else if( value > 15 && value <= 25){
			color = '#394B9F'
		} else if( value > 25 && value <= 35){
			color = '#2C3878'
		} else if( value > 35 ){
			color = '#162252'
		}
	} else if(type == 'house'){
		if( value <= 1){
			color = '#9DB270';
		} else if( value > 1 && value <= 5){
			color = '#5E843A';
		} else if( value > 5 && value <= 10){
			color = '#3C602E';
		} else if( value > 10 && value <= 15){
			color = '#1E3B13';
		} else if( value > 15 ){
			color = '#2F4F2F';
		}
	} else if(type == 'death'){
		if( value <= 1){
			color = '#E88B78';
		} else if( value == 2){
			color = '#CC2F27';
		} else if( value > 2){
			color = '#871D1B';
		}
	}
	return color;
}
