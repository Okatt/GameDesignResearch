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
var isSeeking = false;

var playerColor = Math.floor(randomRange(0, 4.99));
var playerShape = Math.floor(randomRange(0, 3.99));
var playerEyes = Math.floor(randomRange(0, 2.99))+1;

var matchShape;
var matchColor;
var matchName;
var matchEyes;


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
    if(gameObjects[i].id !== undefined && gameObjects[i].id === id){
      gameObjects[i].kill();
    }
  }
});

socket.on('message', function (message){
  console.log('Client received message:', message);
  signalingMessageCallback(message);
});

socket.on('newPlayer', function(newPlayerID, shape, color, eyes){
  console.log('New player joined the game with ID: ' +newPlayerID +' color: ' +color +' shape: ' +shape);
  randomPosition = new Vector2(randomRange(0, canvas.width), randomRange(0, canvas.height));
  //ADDED:
  //color and shape var, these properties decide what the new player looks like
  player = new Player(newPlayerID, randomPosition, shape, color, eyes);
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
  if(!isMatched && !isDeciding && !isSeeking){
    //show accept and reject buttons
    potentialMatchId = matchedPlayerID;
    isDeciding = true;
    acceptButton.isVisible = true;
    acceptButton.isDisabled = false;

    rejectButton.isVisible = true;
    rejectButton.isDisabled = false;
    //
  }
  else {
    console.log('already matched, seeking or deciding')
    socket.emit('rejectedMatch', matchedPlayerID);
  }
});

socket.on('confirmedMatch', function(p1ID, p2ID){
  if(isWorld){
    //TODO
    //move both players with p1ID and p2ID together
  }
  else {
    makeBabyButton.isVisible = true;
    makeBabyButton.isDisabled = false;
    isDeciding = false;
    isSeeking = false;
    isMatched = true;
    console.log(p1ID +' matched with ' +p2ID);

    if(p1ID === playerId){
      matchId = p2ID;
    }
    else if(p2ID === playerId){
      matchId = p1ID;
    }

    sendCharacterInfo();
  }
});

socket.on('unMatch', function(p1ID, p2ID){
  if(isWorld){
    //TODO
    //move both players with p1ID and p2ID away from eachother
  }
  else if(p1ID === playerId || p2ID === playerId){
      makeBabyButton.isVisible = false;
      makeBabyButton.isDisabled = true;
      isMatched = false;
      matchId = null;
      matchColor = null;
      matchShape = null;
      matchName = null;
      matchEyes = null;
      console.log(playerId +' unmatched ' +p2ID);
  }
});

socket.on('matchRejected', function(){
  isSeeking = false;
  attempts++;
  seekMatch();
});

socket.on('noMatchFound', function(){
  //TODO
  //called when no unmatched players found or all unmatched players have been tried
  //seekMatch();
  console.log('no match found');
  isSeeking = false;
  attempts = 0;
});

socket.on('codesExchanged', function(){
    socket.emit('createBaby', matchId, playerId, matchColor, matchShape, playerColor, playerShape, matchEyes, playerEyes);
    endMatch();
});

socket.on('characterInfo', function(color, shape, name, eyes){
  matchColor = color;
  matchShape = shape;
  matchName = name;
  matchEyes = eyes;
});

socket.on('createBaby', function(ID, shape, color, eyes){
  for (var i = 0; i < gameObjects.length; i++) {
    if(gameObjects[i].type = "Player" && gameObjects[i].id === ID){
      gameObjects[i].addBaby(shape, color, eyes);
    }
  };   
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
socket.emit('connect', room, playerColor, playerShape, playerEyes);

if(location.hostname.match(/localhost|127\.0\.0/)){socket.emit('ipaddr');}

//**************************************************************************** 
// Aux functions, mostly UI-related
//****************************************************************************
function seekMatch(){
  //TODO
  //call this function whenever a match should be sought and keep calling it until a match is found (while ismatched === false >)
  if(!isMatched && !isDeciding && !isSeeking){
      isSeeking = true;
      socket.emit('attemptMatch', playerId, attempts);
  }
}

function endMatch(){
  //TODO
  //function should be called after confirm code is done maybe instead of on a button basis.
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
  socket.emit('characterInfo', matchId, playerColor, playerShape, playerName, playerEyes);
}

function confirmCode(){
  var input;
  input = prompt('Ga naar de deur en voer de speler naam van je partner in: ');
  //TODO
  //change to socket.emit and check if both entered the correct code maybe?
  if(input === matchName){
    console.log('correct name entered');
    socket.emit('confirmedCode', playerId, matchId);
  }
  else {
    console.log('wrong name');
  }
}

function logError(err) {
    console.log(err.toString(), err);
}

function gotRemoteStream(event) {
    console.log('got remote stream');
    remoteVideo.src = window.URL.createObjectURL(event.stream);
}
