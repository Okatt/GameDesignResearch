/****************************************************************************
 * Initial setup
 ****************************************************************************/

var configuration = {'iceServers': [{'url': 'stun:stun.l.google.com:19302'}]},
    photoContextW = 300, photoContextH = 150;

var isWorld;                    // True if it should display the world
var playerId;
var playerIDArray = [];

var room = "lobby";
var playerName;
var isMatched = false;
var matchId;

/****************************************************************************
 * Signaling server 
 ****************************************************************************/

// Connect to the signaling server
var socket = io.connect();

socket.on('created', function (room, clientId) {
  console.log('Created room', room, '- my client ID is', clientId);
  isWorld = true;
  playerId = clientId;
  initializeWorld();
});

socket.on('joined', function (room, clientId) {
  console.log('This peer has joined room', room, 'with client ID', clientId);
  isWorld = false;
  playerId = clientId;
  playerName = prompt('Voer je naam in: ');
  initializePlayer();
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
  //TODO
  //player = new playerObject(newPlayerID, randomPosition);
  //gameObjects.push(player)
});

socket.on('potentialMatch', function(matchedPlayerID){
  console.log('potential match request');
  if(!isMatched){
    socket.emit('confirmedMatch', matchedPlayerID, playerId);
  }
});

socket.on('confirmedMatch', function(p1ID, p2ID){
  if(isWorld){
    //TODO
    //move both players with p1ID and p2ID together
  }
  else {
    if(p1ID === playerId){
      isMatched = true;
      matchId = p2ID;
      console.log(playerId +' matched with ' +p2ID);
    }
    else if(p2ID === playerId){
      isMatched = true;
      matchId = p1ID;
      console.log(playerId +' matched with ' +p1ID);
    }
  }
  
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

function logError(err) {
    console.log(err.toString(), err);
}

function gotRemoteStream(event) {
    console.log('got remote stream');
    remoteVideo.src = window.URL.createObjectURL(event.stream);
}
