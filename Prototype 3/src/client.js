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
var clientStatus = 'Connecting to the world...';
var babyName;
var matchBabyName;

var memoryTiles = [];
var matchedTiles = [];

var turnPlayer = false;
var turnPointer = false;
var flips = 0;

var highlighted = false;

var isMother = false;

var matchNotificationVar;
var yesButton, noButton;

// Data collection
var joinedAtServerTime;


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

  joinNotification();
});

socket.on('playerReady', function(id){
  for (var i = 0; i < gameObjects.length; i++) {
    if(gameObjects[i].type === "Player" && gameObjects[i].id === id){
      gameObjects[i].justJoined = false;
    }
  }
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
      clientStatus = 'We\'re sorry, but the other player has left the game...';
      rejectMatch(true);
    } 
    else if(id === matchId){
      clientStatus = 'We\'re sorry, but the other player has left the game...';
      endMatch();
    }
  }
  
});

socket.on('message', function (message){
  console.log('Client received message:', message);
  signalingMessageCallback(message);
});

socket.on('announce', function(message){
  am.announce(message);
});

socket.on('newPlayer', function(newPlayerID, shape, color, eyes){
  console.log('New player joined the game with ID: ' +newPlayerID +' color: ' +color +' shape: ' +shape);
  socket.emit('announce', "A new player has joined!");

  randomPosition = new Vector2(randomRange(0, 1080), randomRange(0, 1920));
  //ADDED:
  //color and shape var, these properties decide what the new player looks like
  player = new Player(newPlayerID, randomPosition, shape, color, eyes);
  // Spawn the player in an empty space
  while(checkCollision(player) || checkOutOfBounds(player)){
    player.position = new Vector2(randomRange(0, 1080), randomRange(0, 1920));
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

  // Potential match
  matchAvatar = new Player(potentialMatchId, new Vector2(1920/2+300, 1080/2+150), matchShape, matchColor, matchEyes);
  matchAvatar.state = "AVATAR";
  matchAvatar.isLarge = true;
  matchAvatar.hasCrown = mCrown;
  gameObjects.push(matchAvatar);

  playerAvatar.position = new Vector2(1920/2-300, 1080/2+150);
  playerAvatar.previousPos = playerAvatar.position.clone();

  playerAvatar.closeEmotes();

  clientStatus = 'Do you want to play with this person?';

  if(firstMatch){ firstMatchNotification(); }
  else{ matchNotification(); }

  // acceptButton.isVisible = true;
  // acceptButton.isDisabled = false;

  // rejectButton.isVisible = true;
  // rejectButton.isDisabled = false;
});

socket.on('confirmedMatch', function(p1ID, p2ID, firstTurn, mother){

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
    isMother = mother;
    matchAvatar.showUnmatch = true;

    if(p1ID === playerId){
      matchId = p2ID;
    }
    else if(p2ID === playerId){
      matchId = p1ID;
    }
    clientStatus = 'Find each other and choose a name for your new polygon. You need to enter the same name to create the polygon.';

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

      // Remove potential baby
      if(babyAvatar){babyAvatar.kill(); babyAvatar = false;}

      matchAvatar.kill();

      makeBabyButton.isVisible = false;
      makeBabyButton.isDisabled = true;

      shareButton.isVisible = false;
    shareButton.isDisabled = true;
      isMatched = false;
      matchId = null;
      matchColor = null;
      matchShape = null;
      matchName = null;
      matchEyes = null;
      isMother = false;

      console.log(playerId +' unmatched ' +p2ID);
      clientStatus = 'The match is over.';

      // Set player back
      playerAvatar.position = new Vector2(1920/2, 1080/2+150);
      playerAvatar.previousPos = playerAvatar.position.clone();

      // Set camera back
      camera.setTargetPosition(new Vector2(1920/2, 1080/2));
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
    // acceptButton.isVisible = false;
    // acceptButton.isDisabled = true;

    // rejectButton.isVisible = false;
    // rejectButton.isDisabled = true;

    matchAvatar.kill();
    matchNotificationVar.kill(); 
    yesButton.kill(); 
    noButton.kill();
    endMemory();
    clientStatus = 'The match was no success.';

    // Set player back
    playerAvatar.position = new Vector2(1920/2, 1080/2+150);
    playerAvatar.previousPos = playerAvatar.position.clone();
  }
});

socket.on('checkNames', function(playerID, name){
  if(isMother && babyName !== null){
    if(name.toLowerCase() === babyName.toLowerCase()){
      socket.emit('createBaby', matchId, playerId, babyAvatar.shape, babyAvatar.color, babyAvatar.eyes);
      socket.emit('announce', babyName+" was created!");
      babyName = null;
      endMatch();
    }
    else {
      socket.emit('wrongNames', matchId, playerId);
    }
  }
  else{
    socket.emit('enteredName', playerId, matchId, babyName);
  }
});

socket.on('wrongNames', function(){
  babyName = null;
  wrongNameNotification();
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

socket.on('createWorldBaby', function(ID1, ID2, shape, color, eyes){
  for (var i = 0; i < gameObjects.length; i++) {
    if(gameObjects[i].type === "Player"){
      if(gameObjects[i].id === ID1 || gameObjects[i].id === ID2){
        gameObjects[i].addBaby(shape, color, eyes);
      }
    }
  }
  checkCrown();
});

socket.on('createAppBaby', function(ID, shape, color, eyes){
    playerAvatar.addBaby(shape, color, eyes);
    babyName = null;
    if(babyAvatar !== undefined){
      babyAvatar.kill();
    }
    babyAvatar = false;
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

  if(tile1.number >= 8){
    var t1 = new MemoryButton(new Vector2(((canvas.width/2)-186) + ((tile1.number-8)*124), ((canvas.height/2)-250) + 2*124), 100, 100, tile1.index, tile1.value, tile1.number, "#FFFFFF");
  }
  else if(tile1.number >= 4){
    var t1 = new MemoryButton(new Vector2(((canvas.width/2)-186) + ((tile1.number-4)*124), ((canvas.height/2)-250) + 124), 100, 100, tile1.index, tile1.value, tile1.number, "#FFFFFF");
  }
  else {
     var t1 = new MemoryButton(new Vector2(((canvas.width/2)-186) + (tile1.number*124), ((canvas.height/2)-250)), 100, 100, tile1.index, tile1.value, tile1.number, "#FFFFFF");
  }

  if(tile2.number >= 8){
    var t2 = new MemoryButton(new Vector2(((canvas.width/2)-186) + ((tile2.number-8)*124), ((canvas.height/2)-250) + 2*124), 100, 100, tile2.index, tile2.value, tile2.number, "#FFFFFF");
  }
  else if(tile2.number >= 4){
    var t2 = new MemoryButton(new Vector2(((canvas.width/2)-186) + ((tile2.number-4)*124), ((canvas.height/2)-250) + 124), 100, 100, tile2.index, tile2.value, tile2.number, "#FFFFFF");
  }
  else {
     var t2 = new MemoryButton(new Vector2(((canvas.width/2)-186) + (tile2.number*124), ((canvas.height/2)-250)), 100, 100, tile2.index, tile2.value, tile2.number, "#FFFFFF");
  }


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
  babyAvatar = new Baby(new Vector2(1920/2, 340), null, shape, color, eyes);
  babyAvatar.state = "AVATAR";
  babyAvatar.moving = false;
  gameObjects.push(babyAvatar);

  if(firstPolygon){ firstPolygonNotification(); }

  makeBabyButton.isVisible = true;
  makeBabyButton.isDisabled = false;

  shareButton.isVisible = true;
  shareButton.isDisabled = false;
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
  clientStatus = "Waiting for the other player...";

  // acceptButton.isVisible = false;
  // acceptButton.isDisabled = true;

  // rejectButton.isVisible = false;
  // rejectButton.isDisabled = true;

  socket.emit('acceptedMatch', playerId, potentialMatchId);
}

function rejectMatch(otherDC){
  var noChoice = otherDC || false;
  // acceptButton.isVisible = false;
  // acceptButton.isDisabled = true;

  // rejectButton.isVisible = false;
  // rejectButton.isDisabled = true;

  socket.emit('rejectedMatch', playerId, potentialMatchId, noChoice);
}

function confirmCode(){
  babyName = prompt('Choose a name for your polygon:');
  if(babyName !== null){
      socket.emit('enteredName', playerId, matchId, babyName);
  }
}

function share(){
  socket.emit('shared', playerId);
  shareButton.isVisible = false;
  shareButton.isDisabled = true;
  shareNotification();
}

function checkCrown(exclude){
  var excludeID = exclude || null;
  
  var mb = 0;                           // Most babies
  var currentKing, newKing = false;

  // Get the current king (todo: save in variable to increase performance)
  for (var i = 0; i < gameObjects.length; i++) {
    if(gameObjects[i].type === "Player" && gameObjects[i].id !== excludeID){
      // Check if the player is the current king
      if(gameObjects[i].hasCrown){
        currentKing = gameObjects[i];
        mb = currentKing.babies.length;
        break;
      }
    }
  }

  // Check all contenders
  for (var i = 0; i < gameObjects.length; i++) {
    if(gameObjects[i].type === "Player" && gameObjects[i].id !== excludeID){
      // Check which player should be the newKing
      if(gameObjects[i].babies.length > mb){
        newKing = gameObjects[i];
        mb = gameObjects[i].babies.length;
      }else if(gameObjects[i].babies.length === mb){
        if(currentKing && currentKing.id === gameObjects[i].id){ newKing = gameObjects[i]; }
        else{ newKing = false; }
      }
    }
  }

  // Determine who gets the crown
  if(currentKing === newKing){
    // Nothing happends
  }else if(!currentKing && newKing){
    // The new king will get the crown (no one had the crown)
    socket.emit('announce', "There is a new king!");    
    newKing.getCrown();
  }else if(currentKing && !newKing){
    // No one will be the king
      socket.emit('announce', "The king has fallen...");
      currentKing.loseCrown();
  }else if(currentKing && newKing){
      // Since currentKing !== newKing the new king must have more babies thus
      // The new king will steal the crown from the current king
      socket.emit('announce', "The king has been overthrown!");
      currentKing.loseCrown();
      newKing.getCrown();
  }

  // Everyone with the highest baby count
  //  var highestBabyCount = 0;
  //
  // for (var i = 0; i < gameObjects.length; i++) {
  //   if(gameObjects[i].type === "Player" && gameObjects[i].id !== excludeID){
  //     if(highestBabyCount < gameObjects[i].babies.length){
  //        highestBabyCount = gameObjects[i].babies.length;
  //      }
  //   }
  // }
  // for(var i = 0; i < gameObjects.length; i++){
  //   if(gameObjects[i].type === "Player"){
  //     if(gameObjects[i].babies.length === highestBabyCount){
  //       gameObjects[i].getCrown();
  //     }
  //     else if(gameObjects[i].hasCrown){
  //       gameObjects[i].loseCrown();
  //     }
  //   }
  // }
}

function startMemory(){
  clientStatus = "Play a game of memory to create a new polygon.";

  for (var i = 0; i < memoryTiles.length; i++) {
      memoryTiles[i].isVisible = true;
      memoryTiles[i].isDisabled = false;
  }

  // Move camera
  camera.setTargetPosition(new Vector2(1920/2, 300));

  // Create turn pointer
  if(turnPlayer){ turnPointer = new Pointer(playerAvatar); gameObjects.push(turnPointer);}
  else{turnPointer = new Pointer(matchAvatar); gameObjects.push(turnPointer);} 

  if(firstMemory){ firstMemoryNotification(); }
}

function endMemory(){
  clientStatus = "Find eachother to name the new polygon. You both need to enter the same";

  for (var i = 0; i < memoryTiles.length; i++) {
      memoryTiles[i].kill();
  }
  memoryTiles = [];
  for( var i = 0; i < matchedTiles.length; i++){
    matchedTiles[i].mtm = true;
  }
  matchedTiles = [];
  turnPlayer = false;

  if(turnPointer){ turnPointer.kill(); }
  turnPointer = false;
}

function logError(err) {
    console.log(err.toString(), err);
}

function gotRemoteStream(event) {
    console.log('got remote stream');
    remoteVideo.src = window.URL.createObjectURL(event.stream);
}
