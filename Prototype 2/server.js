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

var app = http.createServer(function (req, res) {
  fileServer.serve(req, res);
}).listen(port);

var io = socketIO.listen(app);
io.sockets.on('connection', function (socket){

    // convenience function to log server messages on the client
    function log(){
		var array = [">>> Message from server:"];
        array.push.apply(array, arguments);
	    socket.emit('log', array);
	}

	socket.on('disconnect', function(){
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
            io.sockets.socket(worldID).emit('newPlayer', socket.id);
		}
	});

	socket.on('newPrompt', function(px, py){
		io.sockets.socket(worldID).emit(px, py);
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

