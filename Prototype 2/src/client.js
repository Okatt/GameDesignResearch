/****************************************************************************
 * Initial setup
 ****************************************************************************/

var configuration = {'iceServers': [{'url': 'stun:stun.l.google.com:19302'}]},
    photoContextW = 300, photoContextH = 150;

var isWorld;                    // True if it should display the world
var playerId;
var playerIDArray = [];
var promtArray = ['cats', 'dogs', 'playstation', 'xbox', 'coke', 'pepsi', 'pirates', 'ninjas'];
var promtString;

//TODO this should be a function
var temp1, temp2:
temp1 = promtArray.shift();
temp2 = promtArray.shift();
promtString = temp1 +' or ' +temp2 +'?';
promtArray.push(temp1, temp2);

var room = "lobby";

/****************************************************************************
 * Signaling server 
 ****************************************************************************/

// Connect to the signaling server
var socket = io.connect();

socket.on('created', function (room, clientId) {
  console.log('Created room', room, '- my client ID is', clientId);
  isWorld = true;
  playerId = clientId;
});

socket.on('joined', function (room, clientId) {
  console.log('This peer has joined room', room, 'with client ID', clientId);
  isWorld = false;
  playerId = clientId;
});

socket.on('full', function (room) {
  alert('Room "' + room + '" is full. We will create a new room for you.');
  window.location.hash = '';
  window.location.reload();
});

socket.on('log', function (array) {
  console.log.apply(console, array);
});

socket.on('message', function (message){
  console.log('Client received message:', message);
  signalingMessageCallback(message);
});

socket.on('newPlayer', function(newPlayerID){
  console.log('New player joined the game with ID: ' +newPlayerID);
  //player = new playerObject(newPlayerID);
});

socket.on('newPrompt', function(px, py){
  console.log('New promt added to queue: ' +px +' or ' +py +'?');
  promtArray.push(px, py);
});

// Send message to signaling server
function sendMessage(message){
    console.log('Client sending message: ', message);
    socket.emit('message', message);
}

//**************************************************************************** 
// Connect
//****************************************************************************

// Join a room
socket.emit('connect', room);

if(location.hostname.match(/localhost|127\.0\.0/)){socket.emit('ipaddr');}

//**************************************************************************** 
// Aux functions, mostly UI-related
//****************************************************************************
function submitNewPromt(px, py){
  socket.emit('newPrompt', px, py);
}

function logError(err) {
    console.log(err.toString(), err);
}

function gotRemoteStream(event) {
    console.log('got remote stream');
    remoteVideo.src = window.URL.createObjectURL(event.stream);
}
