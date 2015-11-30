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
var playerAvatar;

var matchShape;
var matchColor;
var matchName;
var matchEyes;
var matchAvatar;

var link;
var clientStatus = 'Connecting to world';
var babyName;
var matchBabyName;


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
  socket.emit('newPlayer', playerId, playerColor, playerShape, playerEyes);
  //TODO client status
  clientStatus = 'Welcome to the game!';
  initializePlayer();
});

socket.on('full', function (room) {
  alert('Room "' + room + '" is full. We will create a new room for you.');
  clientStatus = 'Sorry, the game is full!';
  window.location.hash = '';
  window.location.reload();
});

socket.on('log', function (array) {
  console.log.apply(console, array);
});

socket.on('playerLeft', function(id){
  if(isWorld){
    for(var i = 0; i < gameObjects.length; i++){
      if(gameObjects[i].id !== undefined && gameObjects[i].id === id){
        gameObjects[i].kill();
      }
    }
  }
  else {
    if(id === potentialMatchId){
      clientStatus = 'De andere speler heeft het spel verlaten';
      rejectMatch();
    } 
    else if(id === matchId){
      clientStatus = 'De andere speler heeft het spel verlaten';
      endMatch();
    }
  }
  
});

socket.on('message', function (message){
  console.log('Client received message:', message);
  signalingMessageCallback(message);
});

socket.on('newPlayer', function(newPlayerID, shape, color, eyes){
  //TODO REMOVE THIS CODE!!!
  var p2 = undefined;

  for(var i = 0; i < gameObjects.length; i++){
    if(gameObjects[i].type === "Player" && gameObjects[i].matched === false){
      p2 = gameObjects[i];
    }
  }


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


  //TODO REMOVE THIS CODE!!
  if(p2 !== undefined){
      worldSeekMatch(player, p2);
  }
});

socket.on('matchRequest', function(mID, mShape, mColor, mEyes){
  matchColor = mColor;
  matchShape = mShape;
  matchEyes = mEyes;
  potentialMatchId = mID;

  matchAvatar = new Player(potentialMatchId, new Vector2(500, canvas.height/2), matchShape, matchColor, matchEyes);
  matchAvatar.state = "AVATAR";
  gameObjects.push(matchAvatar);

  clientStatus = 'Wil jij met deze persoon spelen?';

  acceptButton.isVisible = true;
  acceptButton.isDisabled = false;

  rejectButton.isVisible = true;
  rejectButton.isDisabled = false;
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
    clientStatus = 'De match is gemaakt!';
    sendCharacterInfo();
  }
});

socket.on('unMatch', function(p1ID, p2ID){
  if(isWorld){
     for (var ob = 0; ob < gameObjects.length; ob++){
      if(gameObjects[ob].type === "Player" && (gameObjects[ob].id === p1ID || gameObjects[ob].id === p2ID)){
        gameObjects[ob].matched = false;
      }
    }
  }
  else if(p1ID === playerId || p2ID === playerId){
      matchAvatar.kill();

      makeBabyButton.isVisible = false;
      makeBabyButton.isDisabled = true;
      isMatched = false;
      matchId = null;
      matchColor = null;
      matchShape = null;
      matchName = null;
      matchEyes = null;
      console.log(playerId +' unmatched ' +p2ID);
      clientStatus = 'De match is klaar';
  }
});

socket.on('matchRejected', function(rejectedID, playerID){
  if(isWorld){
    for (var ob = 0; ob < gameObjects.length; ob++){
      if(gameObjects[ob].type === "Player" && (gameObjects[ob].id === rejectedID || gameObjects[ob].id === playerID)){
        gameObjects[ob].matched = false;
      }
    }
  }
  else {
    acceptButton.isVisible = false;
    acceptButton.isDisabled = true;

    rejectButton.isVisible = false;
    rejectButton.isDisabled = true;

    matchAvatar.kill();
    clientStatus = 'De match was geen success';
  }
});

socket.on('checkNames', function(playerID, name){
  if(name.toLowerCase() === babyName.toLowerCase()){
    socket.emit('namesMatch', playerID);
  }
});

socket.on('codesExchanged', function(){
    socket.emit('createBaby', matchId, playerId, matchColor, matchShape, playerColor, playerShape, matchEyes, playerEyes);
    endMatch(); 
});

socket.on('createBaby', function(ID, shape, color, eyes){
  if(isWorld){
    for (var i = 0; i < gameObjects.length; i++) {
      if(gameObjects[i].type = "Player" && gameObjects[i].id === ID){
        gameObjects[i].addBaby(shape, color, eyes);
      }
    }
  }
  else {
    playerAvatar.addBaby(shape, color, eyes);
  }

});

socket.on('ipaddr', function(ip){
  link = ip;
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

function worldSeekMatch(p1, p2){
  //p1 and p2 should be game objects!!
  //emit the ids and attributes of the players so the server can match them
  socket.emit('attemptMatch', p1.id, p1.shape, p1.color, p1.eyes, p2.id, p2.shape, p2.color, p2.eyes);

  //set them to matched temporarily so they dont get matched again while deciding
  p1.matched = true;
  p2.matched = true;

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

  socket.emit('acceptedMatch', playerId, potentialMatchId);
}

function rejectMatch(){
  acceptButton.isVisible = false;
  acceptButton.isDisabled = true;

  rejectButton.isVisible = false;
  rejectButton.isDisabled = true;

  socket.emit('rejectedMatch', playerId, potentialMatchId);
}

function sendCharacterInfo(){
  //TODO
  //emit all the variables (color, shape, eyes, feet etc.)
  socket.emit('characterInfo', matchId, playerColor, playerShape, playerName, playerEyes);
}

function confirmCode(){
  clientStatus = 'Zoek elkaar in het echt en kies een naam voor jullie creatie, pas als jullie samen een naam weten is die af!';
  babyName = prompt('Kies een naam voor jullie creatie: ');
  socket.emit('enteredName', playerId, matchId, babyName);
}

function logError(err) {
    console.log(err.toString(), err);
}

function gotRemoteStream(event) {
    console.log('got remote stream');
    remoteVideo.src = window.URL.createObjectURL(event.stream);
}
