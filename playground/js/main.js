var map = {
	 "name": "",
	 "children": []
};

var gwlinks = [],
	gdlinks = [],
	gtlinks = [];

var diameter = 640,
    radius = 940 / 2,
    innerRadius = radius - 270,
	circlew = 940;


var cluster = d3.layout.cluster()
    .size([360, innerRadius])
	.sort(function(a, b) { 
		
		var valueA = a.size * 100
		var valueB = b.size * 100
		
		var charA = a.name.toLowerCase().charCodeAt(0)
		var charB = b.name.toLowerCase().charCodeAt(0)
		
		if(a.nodeType == 'game'){
			return d3.descending(valueA, valueB);
		} else {
			return d3.descending(valueB - charB, valueA - charA); 
		}
	})
    .value(function(d) { return d.size; });

var bundle = d3.layout.bundle();

var svg = d3.select("#game-network").append("svg")
    .attr("width", circlew)
    .attr("height", diameter+240)
  .append("g")
    .attr("transform", "translate(" + (radius + 75) + "," + (radius - 50) + ")")

var svgDefs = svg.append("svg:defs")  

var line = d3.svg.line.radial()
    .interpolate("bundle")
    .tension(.60)
    .radius(function(d) { return d.y; })
    .angle(function(d) { return d.x / 180 * Math.PI; });


//var dataSource = 'data/games-data.csv';
//var dataSource = 'data/test-games.csv';
var dataSource = 'data/thrones_characters.csv';

d3.csv(dataSource, function (error, rows) {
	data = rows;
	console.log(data);
	//processData(data);
	processThrones(data);
});

var maxGamesToWeapons = 0,
	maxWeaponsToGames = 0,
	maxGamesToTopics = 0,
	maxTopicsToGames = 0,
	maxGameWeapons = 0,
	maxGameSales = 0, 
	minGameSales = undefined,
	totalGames = 45;
var gradientCounter = 0,
	gameRatings = {},
	gameRatingTypes = {}
	gamesWithViolence = [],
	gamesWithoutViolence = [],
	weaponTypes = {},
	gamesWithGuns = [],
	gamesWithoutGuns = []

function processThrones(data){

	var gameRootNode = {
		name: 'games',
		children: []
	}
	var weaponRootNode = {
		name: 'games',
		children: []
	}
	var contentRootNode = {
		name: 'games',
		children: []
	}

	var games = {},
		weapons = {},
		topics = {},
		death = {},
		gameNodes = [],
		weaponNodes = [],
		topicNodes = [],
		deathNodes = [];

		for(var d = 0; d < totalGames; d++){
		games[ data[d]['name'] ] = {
			name: data[d]['name'],
			className: getClassName(data[d]['name']),
			children: [],
			size: data[d]['appeared'],
			//size: 100,
			numWeapons: 0,
			weapons: [],
			topics: [],
			numTopics: 0,
			nodeType: 'game',
			image: data[d]['image'],
			connectedNodes: [],
			gameRating: data[d]['rating'],
			seasons: data[d]['season'].split(','),
			violenceLink: '',
			weaponLink: '',
			ratingLink: data[d]['rating'],
			weaponConnections:{'guns': [], 'noguns': []},
			//topicConnections: {'violence': [], 'noviolence': []}
			topicConnections: {'deceased': [], 'alive': []},
			gender: data[d]['gender'],
			portrayed: data[d]['portrayed'],
			culture: data[d]['culture'],
			religion: data[d]['religion']
		}
		
		
		if(gameRatings.hasOwnProperty(data[d]['rating'])){
			gameRatings[data[d]['rating']]['total'] ++
			gameRatings[data[d]['rating']]['data'].push(games[ data[d]['name'] ])
		} else {
			gameRatings[data[d]['rating']] = {
				name: data[d]['rating'],
				total: 1,
				data: [ games[ data[d]['name'] ] ]
			}
		}

		
		if( minGameSales == undefined){
			minGameSales = games[ data[d]['name'] ]['size']
		} else if( minGameSales > games[ data[d]['name'] ]['size'] ){
			minGameSales = games[ data[d]['name'] ]['size']
		}
		
		if( games[ data[d]['name'] ]['size'] > maxGameSales ){
			maxGameSales = games[ data[d]['name'] ]['size'];
		}
		
		
		var weaponTags = ( data[d]['weapons'] != '') ? data[d]['weapons'].split(', '): [];
		var contentTags = ( data[d]['contentdescripters'] != '' ) ? data[d]['contentdescripters'].split(', '): [];	
		
		
		if( weaponTags.length > 0){
			var includeGameWeapon = false;
			games[ data[d]['name'] ]['numWeapons'] = weaponTags.length;
			weaponTags.forEach(function(w){

				if( !weapons[ w ] ){
					weapons[w] = {
						name: w,
						className: getClassName(w),
						children: [],
						size: 0,
						numGames: 0,
						games: [],
						nodeType: 'weapon',
						connectedNodes: [],
						barLinks : {},
						weaponLink: ''						
					}
				}

				gwlinks.push({
					type: 'game-weapon-link',
					source: games[ data[d]['name'] ],
					target: weapons[w]
				})
				weapons[w]['size'] ++;
				weapons[w]['numGames'] ++;
				
				weapons[w]['connectedNodes'].push(games[ data[d]['name'] ]['className']);
				weapons[w]['games'].push(games[ data[d]['name'] ]['name']);
				games[ data[d]['name'] ]['connectedNodes'].push(weapons[w]['className']);
				games[ data[d]['name'] ]['weapons'].push(weapons[w]['name']);
				
				/*if(w!= 'axe' && w!= 'dagger or tomahawk' && w!= 'hammer' && w!= 'sword' && w!= 'short blade'  && w!= 'bow and arrow'  && w!= 'grenade or explosive'  && w!= 'launcher' ){
					includeGameWeapon = true
					weapons[w]['weaponLink'] = weapons[w]['barLinks']['guns'] = 'guns'
					games[ data[d]['name'] ]['weaponConnections']['guns'].push(weapons[w])
				} else {
					weapons[w]['weaponLink'] = weapons[w]['barLinks']['noguns'] = 'noguns'
					games[ data[d]['name'] ]['weaponConnections']['noguns'].push(weapons[w])
				}*/
				if(games[ data[d]['name'] ]['gender'] == 'm'){
					includeGameWeapon = true
					weapons[w]['weaponLink'] = weapons[w]['barLinks']['guns'] = 'guns'
					games[ data[d]['name'] ]['weaponConnections']['guns'].push(weapons[w])
				} else {
					weapons[w]['weaponLink'] = weapons[w]['barLinks']['noguns'] = 'noguns'
					games[ data[d]['name'] ]['weaponConnections']['noguns'].push(weapons[w])
				}
				
			})
	
			if(includeGameWeapon){
				gamesWithGuns.push(games[ data[d]['name'] ])
				games[ data[d]['name'] ]['weaponLink'] = 'guns'
	
			} else {
				gamesWithoutGuns.push(games[ data[d]['name'] ])
				games[ data[d]['name'] ]['weaponLink']  = 'noguns'
			}
			
			
			
		} else {
			gamesWithoutGuns.push(games[ data[d]['name'] ])
			games[ data[d]['name'] ]['weaponLink']  = 'noguns'
		}

		if( contentTags.length > 0){
			var includeGameContent = false;
			
			games[ data[d]['name'] ]['numTopics'] = weaponTags.length;
			contentTags.forEach(function(t){
				
				if( !topics[ t ] ){
					topics[t] = {
						name: t,
						className: getClassName(t),
						children: [],
						size: 0,
						numGames: 0,
						games: [],
						nodeType: 'topic',
						connectedNodes: [],
						barLinks: {},
						violenceLink: ''
					}
				}

				gtlinks.push({
					type: 'game-topic-link',
					source: games[ data[d]['name'] ],
					target: topics[t]
				})
				topics[t]['size'] ++;
				topics[t]['numGames'] ++;
				
				topics[t]['connectedNodes'].push(games[ data[d]['name'] ]['className']);
				topics[t]['games'].push(games[ data[d]['name'] ]['name']);
				games[ data[d]['name'] ]['connectedNodes'].push(topics[t]['className']);		
				games[ data[d]['name'] ]['topics'].push(topics[t]['name']);
				
				if(games[ data[d]['name'] ]['gameRating'] == 'Deceased'){
					includeGameContent = true;
					topics[t]['violenceLink'] = topics[t]['barLinks']['violence'] = 'violence'
					//topics[t]['violenceLink'] = topics[t]['barLinks']['violence'] = 'deceased';
					//games[ data[d]['name'] ]['topicConnections']['violence'].push(topics[t])
					games[ data[d]['name'] ]['topicConnections']['deceased'].push(topics[t]);
				} else {
					topics[t]['violenceLink'] = topics[t]['barLinks']['violence'] = 'noviolence'
					//topics[t]['violenceLink'] = topics[t]['barLinks']['violence'] = 'alive';
					//games[ data[d]['name'] ]['topicConnections']['noviolence'].push(topics[t])
					games[ data[d]['name'] ]['topicConnections']['alive'].push(topics[t])
				}
				
			})
			if(includeGameContent){
				gamesWithViolence.push(games[ data[d]['name'] ]);
				//games[ data[d]['name'] ]['violenceLink'] = 'violence'
				games[ data[d]['name'] ]['violenceLink'] = 'deceased';
				
			} else {
				gamesWithoutViolence.push(games[ data[d]['name'] ]);
				//games[ data[d]['name'] ]['violenceLink'] = 'noviolence'
				games[ data[d]['name'] ]['violenceLink'] = 'alive';
			}
			
		} else {
			//games[ data[d]['name'] ]['violenceLink'] = 'noviolence'
			games[ data[d]['name'] ]['violenceLink'] = 'alive';
		}

		
		
	}

	for(var g in games){
		gameRootNode.children.push(games[g])
		if(games[g]['numTopics'] > maxGamesToTopics){
			maxGamesToTopics = games[g]['numTopics'];
		}
		if(games[g]['numWeapons'] > maxGamesToWeapons){
			maxGamesToWeapons = games[g]['numWeapons'];
		}
		
	}
	for(var w in weapons){
		weaponRootNode.children.push(weapons[w])
		if(weapons[w]['numGames'] > maxWeaponsToGames){
			maxWeaponsToGames = weapons[w]['numGames'];
		}
	}
	for(var t in topics){
		contentRootNode.children.push(topics[t])
		if(topics[t]['numGames'] > maxTopicsToGames){
			maxTopicsToGames = topics[t]['numGames'];
		}
	}
	
	maxGameWeapons = maxGamesToWeapons
	if( maxWeaponsToGames > maxGamesToWeapons){
		maxGameWeapons = maxWeaponsToGames;
	}
	maxGameTopics = maxGamesToTopics
	if( maxTopicsToGames > maxGameTopics){
		maxGameTopics = maxTopicsToGames;
	}
		
	map.children.push(gameRootNode);
	map.children.push(weaponRootNode);
	map.children.push(contentRootNode);
	
	drawChart();
	
	var ratingArray = []
	for(var k in gameRatings){
		gameRatings[k].contentType = 'rating'
		//ratingArray.push(gameRatings[k])
	}
	
	/*ratingArray[0] = gameRatings ['m']
	ratingArray[1] = gameRatings ['t']
	ratingArray[2] = gameRatings ['e10']
	ratingArray[3] = gameRatings ['e']*/
	
	
	//drawSmallChart('chart-game-ratings', ratingArray, 'left', 120);
	
	var gameGunsArray = [
		{
			name: 'Guns',
			total: gamesWithGuns.length,
			contentType: 'guns',
			data: gamesWithGuns
		},
		{
			name: 'No guns',
			total: totalGames - gamesWithGuns.length,
			contentType: 'guns',
			data: gamesWithoutGuns
		},
	
	];

	drawSmallChart('chart-game-weapons', gameGunsArray, 'left', 60);
	
	var gameViolenceArray = [
		{
			name: 'Deceased',
			total: gamesWithViolence.length,
			contentType: 'violence',
			data: gamesWithViolence
		},
		{
			name: 'Alive',
			//name: 'No violence',
			total: totalGames - gamesWithViolence.length,
			contentType: 'violence',
			data: gamesWithoutViolence
		},
	
	]

	//console.log(gameViolenceArray);
	drawSmallChart('chart-game-violence', gameViolenceArray, 'left', 60);

	$('.gia-button').click(function(e){
		if($(this).hasClass('gia-button-selected') == false){	
			currentSelectionText = $(this).text();
			$(this).text('Show all characters')	
			currentSelectionBtn = this;
						
			if($(this).attr('id') == 'btn-guns'){
				showBarConnections( gameGunsArray['0']);

			} else if($(this).attr('id') == 'btn-violence'){
				showBarConnections( gameViolenceArray['0'])
			} else if($(this).attr('id') == 'btn-audience'){
				showBarConnections( ratingArray[0])
			}

		} else {
			hideBarConnections(currentSelection )
		}

	})
}

var smallVis = {}

function drawSmallChart(location, data, align, height){
        
        var h = height,
                w = 200,
                barH = 25;
        
        var startX = 0
        var startY = 1

        
        
        smallVis [data[0]['contentType']] = vis = d3.select("#" + location).append('svg')
                .attr({
                        'height': h + 'px',
                        'width': w + 'px'
                })
        
        w = 150;
        

        var bars = vis.selectAll(".bar")  
                .data(data)
                .enter()
                        .append('g')
                        .attr('class', 'bar-group')
                        .attr('id', function(d){
                                return 'bargroup-' + d.name.toLowerCase().replace(' ', '')
                        })
                        
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
                                
                                if(d.contentType == 'rating'){
                                        return '#5265AE'
                                } else if(d.contentType == 'guns'){
                                        return '#5E843A';
                                } else if(d.contentType == 'violence'){
                                        return '#CC2F27'
                                }
                        
                                
                        })
                    .on("mouseover", function(d){
								
                                $('.gia-button').removeClass('gia-button-selected')
                                $(currentSelectionBtn).text(currentSelectionText)
                                currentSelectionText = ''
                                currentSelectionBtn = undefined;
                                // if (d.contentType == 'violence') {
                                // 	showBarConnections(d, 'btn-violence');
                                // } else if (d.contentType == 'guns') {	
                                // 	showBarConnections(d, 'btn-guns');
                                // } else {
                                // 	showBarConnections(d);
                                // }
                                showBarConnections(d);
                                console.log(d);
                                
                        })
                .on("mouseout", hideBarConnections)
                        
                        bars.append('text')
                        .attr("class",'bar-label')
                        .attr("y", function(d,i){
                                var yPos = startY + ((barH + 1) * i) + 16 
                                return yPos;
                        })
                        .attr("x", function(d,i){
                                        if(align == 'right'){
                                                return w - barW(d.total) -35
                                        } else {
                                                return barW(d.total) +35
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
                                var text = '';

                                if(d.contentType == 'rating'){
                                        
                                        if(d.name == 'e'){
                                                text = 'Everyone (E)'
                                        } else if(d.name == 'e10'){
                                                text = 'Ages 10+ (E10)'
                                        } else if(d.name == 't'){
                                                text = 'Ages 13+ (T)'
                                        } else if(d.name == 'm'){
                                                text = 'Ages 17+ (M)'
                                        }
                                } else if(d.contentType == 'guns'){
                                    if (d.name == 'Guns') {
                                    	text = 'Male';
                                    } else {
                                    	text = 'Female';
                                    }
                                } else if(d.contentType == 'violence'){
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
                                var text = Math.round(d.total/totalGames * 100).toFixed(0) + '%'
                                return text; 
                        
                        });
                        
						


                function barX (data, pos){
                        var xPos = startX + barW(data[pos].total) + 5
                        
                        return xPos
                }

                function barW(v){
                        return v/totalGames * w;
                        
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
	    .domain([0,maxGameSales])
	    .range([0,10]);
	
	
	var nodes = cluster.nodes(map)

	svg.selectAll(".node-dot")
      .data(nodes.filter(function(n) { return n.depth == 2; }))
    .enter().append("g")
      .attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")"; })
    .append("rect")
	  .attr('class', function(d){
		return 'node-dot ' + 'nodedot-' + d.className 
	})
	  .attr('y', -5)
      .attr('height', 12)
      .attr('width', function(d){
		if(d.nodeType == 'game'){
			return gameBarScale(d.size)
		} else {
			return barScale(d.size)
		}
		
		 
	})
	
	// this is the bars (text excluded)

      //.attr("transform", function(d) { return d.x < 180 ? null : "rotate(180)"; })
	  .style('fill', function(d){
		 	return getColor(d.nodeType, d.size)
   	   })
	  .on("mouseover", showConnections)
      .on("mouseout", hideConnections)
	
	svg.selectAll(".node")
      .data(nodes.filter(function(n) { return n.depth == 2; }))
    .enter().append("g")
	  .attr("class", 'node')
      .attr("transform", function(d) { 
	
		var translatevalue = d.y + 5
		if(d.nodeType == 'game'){
			translatevalue += gameBarScale(d.size)
		} else {
			translatevalue += barScale(d.size)
		}
		
		return "rotate(" + (d.x - 90) + ")translate(" + translatevalue + ")"; })

    .append("text")
      .attr("dx", function(d) { return d.x < 180 ? 0 : 0; })
      .attr("dy", "5")
      .attr("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
      .attr("transform", function(d) { return d.x < 180 ? null : "rotate(180)"; })
      .text(function(d) { return d.name; })
      .attr("id", function(d){
			return 'nodetext-' + d.className
	   })
	  .attr("class", function(d){
			var bClass ="circle-text"
			
			if(d.nodeType == 'game'){
				bClass += ' btext-' + d.weaponLink + ' btext-' + d.violenceLink + ' btext-' + d.ratingLink
			} else if(d.nodeType == 'weapon'){
				bClass += ' btext-' + d.weaponLink 
			} else {
				bClass += ' btext-' + d.violenceLink 
			}	

			return bClass;
      })
	  .style('fill', function(d){
	  			if(d.nodeType == 'game'){
					return '#394B9F';
				} else if(d.nodeType == 'weapon' ) {
					return '#3C602E';
				} else if( d.nodeType == 'topic'){
					return '#CC2F27';
				}
	
	  	   })
      .on("mouseover", showConnections)
      .on("mouseout", hideConnections)

	$('.node').mousemove(setPopupPosition);
	$('.node-dot').mousemove(setPopupPosition);

	gameWeaponsColor = d3.interpolateRgb("#ccc", '#2C3878');


	gameWeaponsScale = d3.scale.linear()
	    				.domain([0,maxGameWeapons])
	    				.range([0,1]);
	
	
	gameTopicsColor = d3.interpolateRgb("#ccc", '#3C602E');


	gameTopicsScale = d3.scale.linear()
	    				.domain([0,maxGameTopics])
	    				.range([0,1]);
		
	var mergedLinks = gwlinks.concat(gtlinks)
	
	svg.selectAll(".links")
		.data(bundle(mergedLinks))
	.enter().append("path")
		.attr("class", function(d){
			var linkClass = 'links link-' + d[4]['className'] + ' link-' + d[0]['className']
			var node = (d[4]['nodeType'] == 'game')? d[4] : d[0];
			
			var gLink = (d[4]['nodeType'] == 'game')? d[4] : d[0];
			var oLink = (d[4]['nodeType'] == 'game')? d[0] : d[4];
			
			linkClass += ' barlink-' + gLink['className'] + oLink['className']

			linkClass += ' barlink-' + node['gameRating']
			
			return linkClass
		})
		.attr("id", function(d){
			return 'link-' + d[4]['className'] + '-' + d[0]['className']
		})
		.attr("d", line)
		.style("stroke", function(d){
			var gradient;
			if(d[4]['nodeType'] == 'topic' && d[0]['nodeType'] == 'game' ){
				return 'url(#' + getGradient(d[4]['numGames'], d[0]['size'], 'topic', 'game') +')'
			} else if(d[4]['nodeType'] == 'weapon' && d[0]['nodeType'] == 'game'){
				return 'url(#' + getGradient(d[4]['numGames'], d[0]['size'], 'weapon', 'game') +')'
			}
			
			return'url(#' + gradient +')'
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
	mouseX = e.pageX //- $('#gia-interactive').offset().left
	mouseY = e.pageY
	
	
	if(mouseY < $('#game-network').offset().top + $('#game-network').outerHeight()/2){
		//bottom 
		mouseY -= $('#node-info').outerHeight() + 10
	} else {
		//top 
		 mouseY += 10	
	}
	
	
	if(mouseX < $('#game-network').offset().left + $('#game-network').outerWidth()/2 ){
		//left side
		mouseX -= $('#node-info').outerWidth() + 10
		
		if(mouseX  < 0){
			mouseX = 10
		}
		
	} else {
		//right side
		mouseX += 10
		
		if(mouseX + $("#node-info").outerWidth() > $(window).width() - 20){
			mouseX = $(window).width() - 10 - $("#node-info").outerWidth()
		}	
	}
	
	if(e.pageY + $('#node-info').outerHeight() + 20 > $(document).height() ){
		mouseY = e.pageY - 20 - $('#node-info').outerHeight()
	}
	
	
		

	$('.gia-popup').css({
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
	$(currentSelectionBtn).addClass('gia-button-selected')
	$(currentSelectionBtn).text('Show all characters')
	
	
	// smallVis[d['contentType']].node().appendChild( this )
	//smallVis[d['contentType']].append('#bargroup-' + d.name.toLowerCase().replace(' ', ''))

	for(var s in smallVis){
		smallVis[s].selectAll('.bar')
			.style('fill', '#eee')
	}
	

	smallVis[d['contentType']].select('#bar-' + d.name.toLowerCase().replace(' ', ''))
		.style('fill', function(d){
			if(d.contentType == 'rating'){
				return '#5265AE';
			} else if(d.contentType == 'guns'){
				return '#5E843A';
			} else if(d.contentType == 'violence'){
				return '#CC2F27';
			}
			
		})
	//this.classed('bar-highlight', true)

	svg.selectAll('.circle-text')
		.classed('circle-text-dim', true);	
	svg.selectAll('path.links')
		.style("stroke-opacity", .01)
	
	if (d.name == 'Deceased') {
		svg.selectAll('.btext-violence')
			.classed('highlight', true)
			.classed('circle-text-dim', false);
	} else {
		svg.selectAll('.btext-' + d.name.toLowerCase().replace(' ', '')) //#######################
			.classed('highlight', true)
			.classed('circle-text-dim', false);
		if (d.contentType != 'violence') {
			if (d.name == 'Guns') {
			var hArray = ['stark', 'tyrell', 'freefolk'];
			hArray.forEach(function (h) {
				svg.selectAll('#nodetext-' + h)
					.classed('highlight', true)
					.classed('circle-text-dim', false);
			});
			} else if (d.name = 'No guns') {
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
		.style('opacity', .01)
	
	
	d.data.forEach(function(game){
		svg.select('#nodetext-' + game.className)
			.classed('highlight', true)
			.classed('circle-text-dim', false);
			
			svg.select('.nodedot-' + game.className)
				.style('opacity', 1)
			
			if(d.contentType == 'guns' ){
				var wArray = game.weaponConnections[ d.name.toLowerCase().replace(' ', '') ]		
				wArray.forEach(function(node){
					svg.select('.nodedot-' + node['className'])
						.style('opacity', 1)
					
					svg.select('.barlink-' + game.className + node['className'])
						.style("stroke-opacity", 1)
				})
			} else if( d.contentType == 'violence'){

				var tArray = game.topicConnections[ d.name.toLowerCase().replace(' ', '') ]
				//console.log(d.name.toLowerCase().replace(' ', '') );
				//console.log(tArray);

				tArray.forEach(function(node){
					
					svg.select('.nodedot-' +node['className'])
						.style('opacity', 1)
					
					svg.select('.barlink-' + game.className + node['className'])
						.style("stroke-opacity", 1)

					console.log(game.className);
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
	$('.gia-button').removeClass('gia-button-selected')
	$(currentSelectionBtn).text(currentSelectionText)
	
	for(var s in smallVis){
		
		smallVis[s].selectAll('.bar')
			.style('fill', function(d){
				if(d.contentType == 'rating'){
					return '#5265AE'
				} else if(d.contentType == 'guns'){
					return '#5E843A';
				} else if(d.contentType == 'violence'){
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
	currentSelection = ''
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
	
	$("#node-info").empty()

	if(d.nodeType == 'game'){
		/*$("#gameTemplate").tmpl( {
			name: d.name,
			sales: roundSales(d.size),
			rating: getRating(d.gameRating),
			color: getColor(d.nodeType, d.size),
			weaponCount: d.weapons.length,
			topicCount: d.topics.length		
		}).appendTo( "#node-info" );*/
		
		$("#gameTemplate").tmpl( {
			name: d.name,
			color: getStatusColor(d.gameRating),
			imagesrc: d.image,
			//image: d.image,
			//color: getColor(d.nodeType, d.size),
			episodes: d.size,
			status: d.gameRating,
			season: d.seasons,
			religion: d.religion,
			culture: d.culture,
			portrayed: d.portrayed
		}).appendTo( "#node-info" );
		//console.log(d.image);
		var weapons = (d.weapons.length > 0)? d.weapons: ['None'];
		$.each(weapons, function(i, w){
			$("#listTemplate").tmpl( {item: w}).appendTo( "#node-weapon-references .node-data" );
		})
		
		var topics = (d.topics.length > 0)? d.topics: ['N/A'];
		$.each(topics, function(i, t){
			$("#listTemplate").tmpl( {item: t}).appendTo( "#node-topic-references .node-data" );
		})

		var seasons = (d.seasons.length > 0)? d.seasons: ['None'];
		$.each(seasons, function(i, s){
			$("#listTemplate").tmpl( {item: s}).appendTo( "#node-season-references .node-data" );
		})
	} else if(d.nodeType == 'weapon' ){
		$("#weaponTemplate").tmpl( {
			name: d.name,
			color: getColor(d.nodeType, d.size),
			count: addCommas(d.numGames)			
		}).appendTo( "#node-info" );		
	} else if( d.nodeType == 'topic'){
		$("#weaponTopicTemplate").tmpl( {
			//name: (d.name.toLowerCase().search('use') >= 0)? 'the ' + d.name.toLowerCase() : d.name.toLowerCase(),
			name: (d.name.toLowerCase() == 'other')? 'wild board attack, throat slit or burned ' : d.name.toLowerCase(),
			color: getColor(d.nodeType, d.size),
			count: (d.numGames > 1) ? addCommas(d.numGames)	+ ' major characters are': addCommas(d.numGames)	+ ' major character is' 	
		}).appendTo( "#node-info" );		
	}
	$("#node-info").show()
	
}


function getRating(rating){
		var text = 'None'
		if(rating == 'e'){
			text = 'E (everyone)'
		} else if(rating == 'e10'){
			text = 'E10 (ages 10+)'
		} else if(rating == 't'){
			text = 'T (ages 13+)'
		} else if(rating == 'm'){
			text = 'M (ages 17+)'
		}
		return text;
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


function getGradient(startValue, endValue, topic1, topic2){

	var gradientId = "gradient" + gradientCounter;

	var gradient = svgDefs.append("svg:linearGradient")
		.attr("id", gradientId)
		//.attr("spreadMethod", "pad");
	
	gradient.append("svg:stop")
	    .attr("offset", "10%")
	    .attr("stop-color", getColor( topic1,startValue))

	gradient.append("svg:stop")
	    .attr("offset", "90%")
	    .attr("stop-color", getColor(topic2, endValue))

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

function getColor(topic, value){
	var color = '#ccc'
	if(topic == 'game'){
		//color = '#D7DEF7';
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
	
	}else if(topic == 'weapon'){

		/*if( value <= 1){
			color = '#FFE2DB';
		} else if( value > 1 && value <= 5){
			color = '#E88B78';
		} else if( value > 5 && value <= 10){
			color = '#CC2F27';
		} else if( value > 10 && value <= 15){
			color = '#871D1B';
		} else if( value > 15 ){
			color = '#5E0202';
		}*/

		// CEDBB4 
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
	} else if(topic == 'topic'){
		
		/*if( value <= 1){
			color = '#CEDBB4';
		} else if( value == 2){
			color = '#9DB270';
		} else if( value > 2){
			color = '#5E843A';
		}*/
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

function roundSales (n){
	var newN = n/100000;
	newN = Math.round(newN)/10
	
	
	return newN.toFixed(1) + ' m';
}



function addCommas(nStr)
{
	nStr += '';
	x = nStr.split('.');
	x1 = x[0];
	x2 = x.length > 1 ? '.' + x[1] : '';
	var rgx = /(\d+)(\d{3})/;
	while (rgx.test(x1)) {
		x1 = x1.replace(rgx, '$1' + ',' + '$2');
	}
	return x1 + x2;
}


