//*****************************************************************************************
//	Server
//*****************************************************************************************

var os = require('os');
var static = require('node-static');
var http = require('http');
var socketIO = require('socket.io');

var fileServer = new(static.Server)();

var port = 2013;
var worldID;

var playerIDArray = [];
var potentialMatchArray = [];

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
    // convenience function to log server messages on the client
    function log(){
		var array = [">>> Message from server:"];
        array.push.apply(array, arguments);
	    socket.emit('log', array);
	}

	socket.on('disconnect', function(){
		for(var i = 0; i < playerIDArray.length; i++){
			if(playerIDArray[i] === socket.id){
				playerIDArray.splice(i, 1);
				break;
			}
		}
		for(var i = 0; i < potentialMatchArray.length; i++){
			if(potentialMatchArray[i] === socket.id){
				potentialMatchArray.splice(i, 1);
				break;
			}
		}
	});

	socket.on('message', function (message) {
		log('Client said:', message);
        // for a real app, would be room only (not broadcast)
		socket.broadcast.emit('message', message);
	});

	socket.on('connect', function (room) {
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
            potentialMatchArray.push(socket.id);
            io.sockets.socket(worldID).emit('newPlayer', socket.id);
		}
	});

	socket.on('attemptMatch', function(playerID){
		if(potentialMatchArray.length > 1){
			log('attempting to match player: ' +playerID);
			for(var i = 0; i < potentialMatchArray.length; i++){
				if(potentialMatchArray[i] !== playerID){
					io.sockets.socket(potentialMatchArray[i]).emit('potentialMatch', playerID);
				}
			}
		}
		else {
			log('not enough users are currently unmatched');
		}
		
	});

	socket.on('confirmedMatch', function(matchID, playerID){
		log('matched ' +matchID +' with ' +playerID);
		for(var i = potentialMatchArray.length-1; i >= 0; i--){
			if(potentialMatchArray[i] === matchID || potentialMatchArray[i] === playerID){
				potentialMatchArray.splice(i, 1);
			}
		}

		//emit the match to the first person
		io.sockets.socket(matchID).emit('confirmedMatch', matchID, playerID);
		//emit the match to the second person
		io.sockets.socket(playerID).emit('confirmedMatch', matchID, playerID);
		//emit the match to the world
		io.sockets.socket(worldID).emit('confirmedMatch', matchID, playerID);
	});

	socket.on('unMatch', function(p1ID, p2ID){
		log('unmatched ' +p1ID +' and ' +p2ID);

		if(!contains(potentialMatchArray, p1ID)){
			potentialMatchArray.push(p1ID);
		}
		if(!contains(potentialMatchArray, p2ID)){
			potentialMatchArray.push(p2ID);
		}

		//emit the unmatch to the first person
		io.sockets.socket(p1ID).emit('unMatch', p1ID, p2ID);
		//emit the unmatch to the second person
		io.sockets.socket(p2ID).emit('unMatch', p1ID, p2ID);
		//emit the unmatch to the world
		io.sockets.socket(worldID).emit('unMatch', p1ID, p2ID);
	});

	//TODO
	//function should take all parameters (shape, color, eyes, feet etc.)
	socket.on('characterInfo', function(matchID, color, shape, name){
		//TODO
		//emit should send all parameters
		io.sockets.socket(matchID).emit('characterInfo', color, shape, name);
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

