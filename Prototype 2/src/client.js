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

var attempts = 0;
var potentialMatchId;
var isDeciding = false;

var playerColor = Math.round(randomRange(0, 5));
var playerShape = Math.round(randomRange(0, 5));

var matchShape;
var matchColor;
var matchName;


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

socket.on('playerLeft', function(id){
  for(var i = 0; i < gameObjects.length; i++){
    if(gameObjects[i].type === "Player" && gameObjects[i].id === id){
      gameObjects[i].kill();
    }
  }
});

socket.on('message', function (message){
  console.log('Client received message:', message);
  signalingMessageCallback(message);
});

socket.on('newPlayer', function(newPlayerID, color, shape){
  console.log('New player joined the game with ID: ' +newPlayerID +' color: ' +color +' shape: ' +shape);
  randomPosition = new Vector2(randomRange(0, canvas.width), randomRange(0, canvas.height));
  //ADDED:
  //color and shape var, these properties decide what the new player looks like
  player = new Player(newPlayerID, randomPosition, color, shape);
  // Spawn the player in an empty space
  while(checkCollision(player) || checkOutOfBounds(player)){
    player.position = new Vector2(randomRange(0, canvas.width), randomRange(0, canvas.height));
    player.previousPos = player.position.clone();
  }
  gameObjects.push(player);
});

socket.on('potentialMatch', function(matchedPlayerID){
  //TODO
  //only 1 potential match should end up matching
  console.log('potential match request');
  potentialMatchId = matchedPlayerID;
  if(!isMatched && !isDeciding){
    //show accept and reject buttons
    isDeciding = true;
    acceptButton.isVisible = true;
    acceptButton.isDisabled = false;

    rejectButton.isVisible = true;
    rejectButton.isDisabled = false;
    //
  }
  else {
    socket.emit('rejectedMatch', potentialMatchId);
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
      sendCharacterInfo()
    }
    else if(p2ID === playerId){
      isMatched = true;
      matchId = p1ID;
      console.log(playerId +' matched with ' +p1ID);
      sendCharacterInfo()
    }
  }
});

socket.on('unMatch', function(p1ID, p2ID){
  if(isWorld){
    //TODO
    //move both players with p1ID and p2ID away from eachother
  }
  else if(p1ID === playerId || p2ID === playerId){
      isMatched = false;
      matchId = null;
      matchColor = null;
      matchShape = null;
      matchName = null;
      console.log(playerId +' unmatched ' +p2ID);
  }
});

socket.on('matchRejected', function(){
  attempts++;
  seekMatch();
});

socket.on('noMatchFound', function(){
  //TODO
  //called when no unmatched players found or all unmatched players have been tried
  //seekMatch();
  attempts = 0;
});

socket.on('characterInfo', function(color, shape, name){
  matchColor = color;
  matchShape = shape;
  matchName = name;
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
socket.emit('connect', room, playerColor, playerShape);

if(location.hostname.match(/localhost|127\.0\.0/)){socket.emit('ipaddr');}

//**************************************************************************** 
// Aux functions, mostly UI-related
//****************************************************************************
function seekMatch(){
  //TODO
  //call this function whenever a match should be sought and keep calling it until a match is found (while ismatched === false >)
  if(!isMatched && !isDeciding){
      socket.emit('attemptMatch', playerId, attempts);
  }
}

function endMatch(){
  //TODO
  //only 1 player should call this function OR the server needs to check the potentialMatchArray if it doesnt already contain the IDs
  if(isMatched){
    socket.emit('unMatch', playerId, matchId);
  }
}

function acceptMatch(){
  acceptButton.isVisible = false;
  acceptButton.isDisabled = true;

  rejectButton.isVisible = false;
  rejectButton.isDisabled = true;
  isDeciding = false;
  socket.emit('confirmedMatch', potentialMatchId, playerId);
}

function rejectMatch(){
  acceptButton.isVisible = false;
  acceptButton.isDisabled = true;

  rejectButton.isVisible = false;
  rejectButton.isDisabled = true;
  isDeciding = false;
  socket.emit('rejectedMatch', potentialMatchId);
}

function sendCharacterInfo(){
  //TODO
  //emit all the variables (color, shape, eyes, feet etc.)
  socket.emit('characterInfo', matchId, playerColor, playerShape, playerName);
}

function confirmCode(){
  var input;
  input = prompt('Ga naar de deur en voer de speler naam van je partner in: ');
  //TODO
  //change to socket.emit and check if both entered the correct code maybe?
  if(input === matchName){
    return true;
  }
  else {
    return false;
  }
}

function logError(err) {
    console.log(err.toString(), err);
}

function gotRemoteStream(event) {
    console.log('got remote stream');
    remoteVideo.src = window.URL.createObjectURL(event.stream);
}
