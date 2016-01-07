//*****************************************************************************************
//	Server
//*****************************************************************************************

var os = require('os');
var static = require('node-static');
var http = require('http');
var socketIO = require('socket.io');
var fs = require('fs'); 

var fileServer = new(static.Server)();

var port = 2013;
var worldID;

var playerIDArray = [];
var hourArray = [];
var minuteArray = [];
var secondArray = [];

var highestPlayerCount = 0;

var expectedAcceptArray = [];

var date;

var shares = 0;
var sharedArray = [];
var players = 0;
var interactions = 0;
var acceptedMatches = 0;
var attemptedMatches = 0;
var rejectedMatches = 0;

var app = http.createServer(function (req, res) {
  fileServer.serve(req, res);
}).listen(port);

var io = socketIO.listen(app);
io.sockets.on('connection', function (socket){
	function contains(a, obj) {
    for (var i = 0; i < a.length; i++) {
        if (a[i] === obj) {
            return true;
        }
    }
    	return false;
	}

	function fillArray(pshape, pcolor, peyes, mshape, mcolor, meyes){
		var tempArray = [];
		for(var j = 0; j < 2; j++){
			for(var i = 0; i < 6; i++){
				tempArray.push(arguments[i]);
			}
		}

		return randomizeArray(tempArray);
	}

	function randomizeArray(array){
		var currentIndex = array.length, temporaryValue, randomIndex;

  		// While there remain elements to shuffle...
  		while (0 !== currentIndex) {

    		// Pick a remaining element...
    		randomIndex = Math.floor(Math.random() * currentIndex);
    		currentIndex -= 1;

    		// And swap it with the current element.
    		temporaryValue = array[currentIndex];
    		array[currentIndex] = array[randomIndex];
   		 	array[randomIndex] = temporaryValue;
  	}

  		return array;
	}

    // convenience function to log server messages on the client
    function log(){
		var array = [">>> Message from server:"];
        array.push.apply(array, arguments);
	    socket.emit('log', array);
	}

	// returns one of the two variables
	function chooseOne(var1, var2){
		var r = Math.random();
		return r > 0.5 ? var1 : var2;
	}

	socket.on('disconnect', function(){
		for(var i = 0; i < playerIDArray.length; i++){
			if(playerIDArray[i] === socket.id){
				date = new Date();
				var dataString = "ID: " +playerIDArray[i] +'\n' +"Time joined: " +hourArray[i] +":"+minuteArray[i] +":"+secondArray[i] +'\n' +"Time left: " +date.getHours() +":"+date.getMinutes()+":"+date.getSeconds() +'\n' +"Current Stats: " +'\n'+'Total number of players: ' +players.toString()+'\n' +"Highest number of players at one time: "+highestPlayerCount.toString()+'\n' +'Number of succesful interactions: ' +interactions.toString()+'\n' +'Number of shares: ' +shares.toString() +'\n' +"Total number of attempted matches: " +attemptedMatches.toString() +'\n' +"Total number of accepted matches: " +acceptedMatches.toString() +'\n' +"Total number of rejected matches: " +rejectedMatches.toString() +'\n' +'\n';
				fs.appendFile("build/res/data/Data.txt", dataString, function(err) {
    				if(err) {
        			return log(err);
    				}
				});

				playerIDArray.splice(i, 1);
				hourArray.splice(i, 1);
				minuteArray.splice(i, 1);
				secondArray.splice(i, 1);
				break;
			}
		}
		socket.broadcast.emit('playerLeft', socket.id);
	});

	socket.on('message', function (message) {
		log('Client said:', message);
        // for a real app, would be room only (not broadcast)
		socket.broadcast.emit('message', message);
	});

	socket.on('connect', function (room, color, shape, eyes) {
        log('Request to create or join room ' + room);

		var numClients = io.sockets.clients(room).length;
		log('Room ' + room + ' has ' + numClients + ' client(s)');

		if (numClients === 0){
			socket.join(room);
			worldID = socket.id;
			socket.emit('created', room, socket.id);

		} else {
			socket.join(room);
            socket.emit('joined', room, socket.id);
            playerIDArray.push(socket.id);
            date = new Date();
            hourArray.push(date.getHours());
            minuteArray.push(date.getMinutes());
            secondArray.push(date.getSeconds());
            if(playerIDArray.length > highestPlayerCount){
            	highestPlayerCount = playerIDArray.length;
            }
            players++;
        }
	});

	socket.on('ready', function(id){
		io.sockets.socket(worldID).emit('playerReady', id);
	});

	socket.on('announce', function(message){
		io.sockets.socket(worldID).emit('announce', message);
	});

	socket.on('newPlayer', function(id, color, shape, eyes){
		io.sockets.socket(worldID).emit('newPlayer', id, shape, color, eyes);
	});

	socket.on('attemptMatch', function(p1id, p1shape, p1color, p1eyes, p2id, p2shape, p2color, p2eyes, p1crown, p2crown){
		io.sockets.socket(p1id).emit('matchRequest', p2id, p2shape, p2color, p2eyes, p2crown);
		io.sockets.socket(p2id).emit('matchRequest', p1id, p1shape, p1color, p1eyes, p1crown);

		var memoryArray = fillArray({index: 0, value: p1shape}, {index: 1, value: p1color}, {index: 2, value: p1eyes}, {index: 0, value: p2shape}, {index: 1, value: p2color}, {index: 2, value: p2eyes});
		for(var i = 0; i < memoryArray.length; i++){
			io.sockets.socket(p1id).emit('memoryCard', memoryArray[i], i);
			io.sockets.socket(p2id).emit('memoryCard', memoryArray[i], i);
		}

		attemptedMatches++;
	});

	socket.on('emitBaby', function(id, shape, color, eyes, hasCrown){
		io.sockets.socket(id).emit('emitBaby', shape, color, eyes, hasCrown);
	});

	socket.on('acceptedMatch', function(playerID, matchID){
		if(contains(expectedAcceptArray, playerID)){

			io.sockets.socket(matchID).emit('confirmedMatch', matchID, playerID);
			io.sockets.socket(playerID).emit('confirmedMatch', matchID, playerID, true);
			io.sockets.socket(worldID).emit('confirmedMatch', matchID, playerID);

			for(var i = expectedAcceptArray.length; i >= 0; i--){
				if(expectedAcceptArray[i] === playerID || expectedAcceptArray[i] === matchID){
					expectedAcceptArray.splice(i, 1);
				}
			}

			acceptedMatches ++;
		}
		else {
			expectedAcceptArray.push(matchID);
		}
	});

	socket.on('rejectedMatch', function(playerID, matchID){
		for(var i = expectedAcceptArray.length; i >= 0; i--){
			if(expectedAcceptArray[i] === playerID || expectedAcceptArray[i] === matchID){
				expectedAcceptArray.splice(i, 1);
			}
		}
		//someone pressed nope, emit matchRejected to the rejected player.
		//emit matchRejected to increment attempt and try finding another match
		io.sockets.socket(matchID).emit('matchRejected', matchID, playerID);
		io.sockets.socket(playerID).emit('matchRejected', matchID, playerID);
		io.sockets.socket(worldID).emit('matchRejected', matchID, playerID);

		rejectedMatches++;
	});

	socket.on('unMatch', function(p1ID, p2ID){
		log('unmatched ' +p1ID +' and ' +p2ID);
		//emit the unmatch to the first person
		io.sockets.socket(p1ID).emit('unMatch', p1ID, p2ID);
		//emit the unmatch to the second person
		io.sockets.socket(p2ID).emit('unMatch', p1ID, p2ID);
		//emit the unmatch to the world
		io.sockets.socket(worldID).emit('unMatch', p1ID, p2ID);
	});

	socket.on('enteredName', function(playerID, matchID, babyName){
		io.sockets.socket(matchID).emit('checkNames', playerID, babyName);
	});

	socket.on('namesMatch', function(playerID){
		io.sockets.socket(playerID).emit('codesExchanged');
	});

	socket.on('pressedEmote', function(emoteID, playerID, matchID){
		log('player ' +playerID +' pressed emote #' +emoteID +' their match is: ' +matchID);
		io.sockets.socket(playerID).emit('displayEmote', emoteID, playerID, matchID);
		io.sockets.socket(worldID).emit('displayEmote', emoteID, playerID, matchID);
		io.sockets.socket(matchID).emit('displayEmote', emoteID, playerID, matchID);

	});

	socket.on('createBaby', function(p1ID, p2ID, shape, color, eyes){
		io.sockets.socket(worldID).emit('createWorldBaby', p1ID, p2ID, shape, color, eyes);
		io.sockets.socket(p1ID).emit('createAppBaby', p1ID, shape, color, eyes);
		io.sockets.socket(p2ID).emit('createAppBaby', p2ID, shape, color, eyes);
		interactions++;
	});

	socket.on('shared', function(playerID){
		if(contains(sharedArray, playerID) === false){
			sharedArray.push(playerID);
			shares++;
		}
	});

	socket.on('loseCrown', function(playerID){
		io.sockets.socket(playerID).emit('loseCrown');
	});

	socket.on('getCrown', function(playerID){
		io.sockets.socket(playerID).emit('getCrown');
	});

	socket.on('matchLostCrown', function(matchID){
		io.sockets.socket(matchID).emit('matchLostCrown');
	});

	socket.on('matchGotCrown', function(matchID){
		io.sockets.socket(matchID).emit('matchGotCrown');
	});

	socket.on('tileFlipped', function(matchID, number){
		io.sockets.socket(matchID).emit('tileFlipped', number);
	});
	socket.on('memoryMatch', function(tile1, tile2, matchID, playerID, index){
		io.sockets.socket(matchID).emit('memoryMatch', tile1, tile2, index);
		io.sockets.socket(playerID).emit('memoryMatch', tile1, tile2, index);
	});

	socket.on('changeTurn', function(playerID, matchID){
		console.log("turn changed");
		io.sockets.socket(matchID).emit('changeTurn', true);
		io.sockets.socket(playerID).emit('changeTurn', false);
	});

	socket.on('delayedUnreveal', function(tileNumber, matchID, playerID){
		io.sockets.socket(matchID).emit('delayedUnreveal', tileNumber);
		io.sockets.socket(playerID).emit('delayedUnreveal', tileNumber);
	});

	socket.on('memoryBaby', function(p1ID, p2ID, shape, color, eyes){
		io.sockets.socket(p1ID).emit('memoryBaby', p1ID, shape, color, eyes);
		io.sockets.socket(p2ID).emit('memoryBaby', p2ID, shape, color, eyes);
	});

    socket.on('ipaddr', function () {
        var ifaces = os.networkInterfaces();
        for (var dev in ifaces) {
            ifaces[dev].forEach(function (details) {
                if (details.family=='IPv4' && details.address != '127.0.0.1') {
                    socket.emit('ipaddr', details.address);
                }
          });
        }
    });

});

