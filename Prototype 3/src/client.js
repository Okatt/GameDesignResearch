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
var babyAvatar;

var matchShape;
var matchColor;
var matchName;
var matchEyes;
var matchAvatar;

var link;
var clientStatus = 'Connecting to world';
var babyName;
var matchBabyName;

var memoryTiles = [];
var matchedTiles = [];

var turnPlayer = false;
var turnPointer = false;
var flips = 0;


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
    var hadCrown = false, crownID;
    for(var i = 0; i < gameObjects.length; i++){
      if(gameObjects[i].type === "Player" && gameObjects[i].id === id){
        if(gameObjects[i].hasCrown){console.log('hadCrown'); hadCrown = true; crownID = gameObjects[i].id;}
          gameObjects[i].kill();
      }
    }
    if(hadCrown){
      checkCrown(crownID);
    }
  }//if(isWorld) ends here

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

socket.on('emitBaby', function(shape, color, eyes, crown){
  var pos = matchAvatar.position.clone();
  var offset = new Vector2(0, -60);
  offset.rotate(randomRange(0, 359));
  var baby = new Baby(new Vector2(pos.x+offset.x, pos.y+offset.y), matchAvatar, shape, color, eyes);
  baby.hasCrown = crown;
  matchAvatar.babies.push(baby);
  gameObjects.push(baby);
});


socket.on('matchRequest', function(mID, mShape, mColor, mEyes, mCrown){
  matchColor = mColor;
  matchShape = mShape;
  matchEyes = mEyes;
  potentialMatchId = mID;

  matchAvatar = new Player(potentialMatchId, new Vector2(1920/2+200, 1080/2-150), matchShape, matchColor, matchEyes);
  matchAvatar.state = "AVATAR";
  matchAvatar.hasCrown = mCrown;
  gameObjects.push(matchAvatar);

  clientStatus = 'Wil jij met deze persoon spelen?';

  acceptButton.isVisible = true;
  acceptButton.isDisabled = false;

  rejectButton.isVisible = true;
  rejectButton.isDisabled = false;
});

socket.on('confirmedMatch', function(p1ID, p2ID, firstTurn){

  var turn = firstTurn || false;

  if(isWorld){
    //TODO
    //move both players with p1ID and p2ID together
  }
  else {
    isDeciding = false;
    isSeeking = false;
    isMatched = true;
    potentialMatchId = null;
    console.log(p1ID +' matched with ' +p2ID);

    turnPlayer = turn;

    if(p1ID === playerId){
      matchId = p2ID;
    }
    else if(p2ID === playerId){
      matchId = p1ID;
    }
    clientStatus = 'Zoek elkaar en kies een naam voor jullie creatie. Jullie moeten dezelfde naam invoeren om de creatie te krijgen.';

    //start the memory game
    startMemory();
  }
});

socket.on('unMatch', function(p1ID, p2ID){
  if(isWorld){
     for (var ob = 0; ob < gameObjects.length; ob++){
      if(gameObjects[ob].type === "Player" && (gameObjects[ob].id === p1ID || gameObjects[ob].id === p2ID)){
        gameObjects[ob].matched = false;
        gameObjects[ob].withoutMatchTime = 0;
      }
    }
  }
  else if(p1ID === playerId || p2ID === playerId){
      //remove the memory board if the match ended early or something
      endMemory();

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
        gameObjects[ob].withoutMatchTime = 0;
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
    socket.emit('createBaby', matchId, playerId, babyAvatar.shape, babyAvatar.color, babyAvatar.eyes);
    endMatch();
});

socket.on('displayEmote', function(emoteID, playerID, matchID){
  if(isWorld){
    for (var i = 0; i < gameObjects.length; i++) {
      if(gameObjects[i].type === "Player" && gameObjects[i].id === playerID){
        gameObjects[i].displayEmote(emoteID);
      }
    }
  }
  else if(playerID === playerId) {
    playerAvatar.displayEmote(emoteID);
  }
  else if(matchID === playerId){
    matchAvatar.displayEmote(emoteID);
  }
});


socket.on('createBaby', function(ID, shape, color, eyes){
  if(isWorld){
    var highestBabyCount = 0;

    for (var i = 0; i < gameObjects.length; i++) {
      if(gameObjects[i].type === "Player"){
        if(gameObjects[i].id === ID){
          gameObjects[i].addBaby(shape, color, eyes);
        }
      }
    }
    checkCrown();
  }
  else {
    playerAvatar.addBaby(shape, color, eyes);
    babyName = null;
    babyAvatar.kill();
  }

});

socket.on('loseCrown', function(){
  playerAvatar.loseCrown();
});

socket.on('getCrown', function(){
  playerAvatar.getCrown();
});

socket.on('matchLostCrown', function(){
  matchAvatar.loseCrown();
});

socket.on('matchGotCrown', function(){
  matchAvatar.getCrown();
});

socket.on('tileFlipped', function(number){
  for (var i = 0; i < memoryTiles.length; i++) {
      if(memoryTiles[i].number === number){
        memoryTiles[i].reveal();
      }
    }
});

socket.on('memoryCard', function(memoryTile, buttonID){
    if(buttonID >= 8){
      var b = new MemoryButton(new Vector2(((canvas.width/2)-186) + ((buttonID-8)*124), ((canvas.height/2)-250) + 2*124), 100, 100, memoryTile.index, memoryTile.value, buttonID, "#FFFFFF");
    }
    else if(buttonID >= 4){
      var b = new MemoryButton(new Vector2(((canvas.width/2)-186) + ((buttonID-4)*124), ((canvas.height/2)-250) + 124), 100, 100, memoryTile.index, memoryTile.value, buttonID, "#FFFFFF");
    }
    else {
      var b = new MemoryButton(new Vector2(((canvas.width/2)-186) + (buttonID*124), ((canvas.height/2)-250)), 100, 100, memoryTile.index, memoryTile.value, buttonID, "#FFFFFF");
    }
    
    b.isVisible = false;
    b.isDisabled = true;       
    memoryTiles.push(b);
    gameObjects.push(b);
});

socket.on('memoryMatch', function(tile1, tile2, index){
  var t1, t2;

  t1 = new MemoryButton(new Vector2(tile1.position.x, tile1.position.y), 100, 100, tile1.index, tile1.value, tile1.number, "#FFFFFF");
  t2 = new MemoryButton(new Vector2(tile2.position.x, tile2.position.y), 100, 100, tile2.index, tile2.value, tile2.number, "#FFFFFF");

  t1.isRevealed = true;
  t2.isRevealed = true;    
  matchedTiles.push(t1, t2);
  gameObjects.push(t1, t2);


  for(var i = memoryTiles.length; i >= 0; i--){
    if(memoryTiles[i] !== undefined && (memoryTiles[i].number === tile1.number || memoryTiles[i].number === tile2.number)){
      memoryTiles[i].kill();
      memoryTiles.splice(i, 1);
    }
    else if(memoryTiles[i] !== undefined && memoryTiles[i].index === index){
      memoryTiles[i].kill();
      memoryTiles.splice(i, 1);
    }
  }

  if(matchedTiles.length === 6 && turnPlayer){
    var shape, color, eyes;
    for(var i = 0; i < matchedTiles.length; i++){
      if(matchedTiles[i].index === 0){
        shape = matchedTiles[i].value;
      }
      if(matchedTiles[i].index === 1){
        color = matchedTiles[i].value;
      }
      if(matchedTiles[i].index === 2){
        eyes = matchedTiles[i].value;
      }
    }
    socket.emit('memoryBaby', matchId, playerId, shape, color, eyes);
  }
});

socket.on('changeTurn', function(tp){
  turnPlayer = tp;
  if(turnPlayer){turnPointer.changeTarget(playerAvatar);}
  else{turnPointer.changeTarget(matchAvatar);}
});

socket.on('delayedUnreveal', function(tileNumber){
  for(var i = memoryTiles.length; i >= 0; i--){
    if(memoryTiles[i] !== undefined && memoryTiles[i].number === tileNumber){
      memoryTiles[i].delayedUnreveal();
    }
  }
});

socket.on('memoryBaby', function(id, shape, color, eyes){
  endMemory();
  babyAvatar = new Baby(new Vector2(canvas.width/2, canvas.height/2), null, shape, color, eyes);
  babyAvatar.moving = false;
  gameObjects.push(babyAvatar);

  makeBabyButton.isVisible = true;
  makeBabyButton.isDisabled = false;

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
// Convert array to object
function worldSeekMatch(p1, p2){
  //p1 and p2 should be game objects!!
  //emit the ids and attributes of the players so the server can match them
  socket.emit('attemptMatch', p1.id, p1.shape, p1.color, p1.eyes, p2.id, p2.shape, p2.color, p2.eyes, p1.hasCrown, p2.hasCrown);

  for(var i = 0; i < p1.babies.length; i++){
    socket.emit('emitBaby', p2.id, p1.babies[i].shape, p1.babies[i].color, p1.babies[i].eyes, p1.babies[i].hasCrown);
  }
  for(var i = 0; i < p2.babies.length; i++){
    socket.emit('emitBaby', p1.id, p2.babies[i].shape, p2.babies[i].color, p2.babies[i].eyes, p2.babies[i].hasCrown);
  }

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
  clientStatus = "Waiting for other player...";

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

function confirmCode(){
  babyName = prompt('Kies een naam voor jullie creatie: ');
  socket.emit('enteredName', playerId, matchId, babyName);
}

function share(){
  socket.emit('shared', playerId);
}

function checkCrown(exclude){

  var excludeID = exclude || null;
  var highestBabyCount = 0;

  for (var i = 0; i < gameObjects.length; i++) {
    if(gameObjects[i].type === "Player" && gameObjects[i].id !== excludeID){
      if(highestBabyCount < gameObjects[i].babies.length){
         highestBabyCount = gameObjects[i].babies.length;
       }
    }
  }
  for(var i = 0; i < gameObjects.length; i++){
    if(gameObjects[i].type === "Player"){
      if(gameObjects[i].babies.length === highestBabyCount){
        gameObjects[i].getCrown();
      }
      else if(gameObjects[i].hasCrown){
        gameObjects[i].loseCrown();
      }
    }
  }
}

function startMemory(){
  for (var i = 0; i < memoryTiles.length; i++) {
      memoryTiles[i].isVisible = true;
      memoryTiles[i].isDisabled = false;
  }

  // Move camera
  camera.setTargetPosition(new Vector2(1920/2, 100));

  // Create turn pointer
  if(turnPlayer){ turnPointer = new Pointer(playerAvatar); gameObjects.push(turnPointer);}
  else{turnPointer = new Pointer(matchAvatar); gameObjects.push(turnPointer);}   
}

function endMemory(){
  for (var i = 0; i < memoryTiles.length; i++) {
      memoryTiles[i].kill();
  }
  memoryTiles = [];
  console.log(matchedTiles);
  for( var i = 0; i < matchedTiles.length; i++){
    matchedTiles[i].mtm = true;
  }
  matchedTiles = [];
  turnPlayer = false;
  turnPointer.kill();
  turnPointer = false;
}

function logError(err) {
    console.log(err.toString(), err);
}

function gotRemoteStream(event) {
    console.log('got remote stream');
    remoteVideo.src = window.URL.createObjectURL(event.stream);
}
