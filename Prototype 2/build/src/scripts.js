//*****************************************************************************************
//	Baby
//*****************************************************************************************

function Baby(position, targetObject){
	this.type = "Player";
	this.isAlive = true;
	
	// Physics
	this.position = position;
	this.previousPos = this.position.clone();
	this.velocity = new Vector2(0, 0);
	this.width = 20;
	this.height = 20;
	this.drag = 0.99;

	// Graphics
	
	// Data
	this.isFollowing = targetObject;
	this.isSolid = false;
	this.isDynamic = true;

	this.kill = function(){
		this.isAlive = false;
	}

	this.getHitbox = function(){
		return new AABB(this.position.x - this.width/2, this.position.y - this.height/2, this.width, this.height);
	}

	this.update = function(){
		if(this.isFollowing){
			var dis = this.position.getVectorTo(this.isFollowing.position);
			if(dis.length() >= 40){
				dis.multiply(0.1);
				this.velocity.add(dis);
			}
		}
	}

	this.render = function(lagOffset){
		var drawX = this.previousPos.x + ((this.position.x-this.previousPos.x)*lagOffset);
		var drawY = this.previousPos.y + ((this.position.y-this.previousPos.y)*lagOffset);

		// Render
		drawRectangle(ctx, drawX-this.width/2, drawY-this.height/2, this.width, this.height, true, color.BLACK, 1);
	}
}
//*****************************************************************************************
//	Button
//*****************************************************************************************

function TextButton(position, width, height, text, bgColor){
	this.type = "TextButton";
	this.isAlive = true;
	
	// Positioning
	this.position = position;
	this.previousPos = this.position.clone();
	this.width = width;
	this.height = height;

	// Graphics
	this.depth = 0;
	this.bgColor = bgColor;
	this.bgAlpha = 1;
	this.text = text;
	this.textColor = color.BLACK;
	this.textHoverColor = color.BLACK;

	// State
	this.mouseOver = false;
	this.isPressed = false;
	this.isToggled = false;
	this.isDisabled = false;
	this.isVisible = true;

	// Destroys the object (removes it from gameObjects)
	this.kill = function(){
		this.unfocus();
		this.isAlive = false;
	};

	// Returns the hitbox
	this.getHitbox = function(){
		return new AABB(this.position.x-this.width/2, this.position.y-this.height/2, this.width, this.height);
	};

	// Focus	
	this.focus = function(){
		if(!this.isFocused){
			focus(this);
			this.isFocused = true;
		}
	};

	// Remove focus
	this.unfocus = function(){
		if(this.isFocused){
			unfocus(this);
			this.isFocused = false;
		}
	};

	// onClick gets called when the button is pressed (it sets isPressed on true for easier communication with other objects)
	this.onClick = function(){

	};

	// Update
	this.update = function(){
		this.mouseOver = false;
		this.isPressed = false;

		// Check if the button is not disabled
		if(!this.isDisabled){
			// Check if the mouse is hovering over the button
			this.mouseOver = checkPointvsAABB(new Vector2(mouse.x, mouse.y), this.getHitbox());
			
			// Call the onClick function when the button is pressed
			if(this.mouseOver && mouse.buttonState.leftClick && !previousMouse.buttonState.leftClick){
				this.isPressed = true;
				this.onClick();
			}
		}
	};

	// Render
	this.render = function(lagOffset){
		if(this.isVisible){
					var drawX = this.previousPos.x + ((this.position.x-this.previousPos.x)*lagOffset);
		var drawY = this.previousPos.y + ((this.position.y-this.previousPos.y)*lagOffset);

		// Background
		drawRectangle(ctx, drawX-this.width/2, drawY-this.height/2, this.width, this.height, true, this.bgColor, this.bgAlpha);

		// Text
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		if(!this.mouseOver){drawText(ctx, drawX, drawY, this.width, 24, this.text, "Arial", 24, this.textColor, 1);}
		else{drawText(ctx, drawX, drawY, this.width, 24, this.text, "Arial", 24, this.textHoverColor, 1);}
		ctx.textBaseline = "alphabetic";
		}
	};
}
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

socket.on('characterInfo', function(color, shape, name){
  matchColor = color;
  matchShape = shape;
  matchName = name;
});

socket.on('createBaby', function(ID, color, shape){
    //TODO
    //create gameobject that follows the player object with the given ID 
    //baby should have the color and shape that is given etc.
    
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
  socket.emit('characterInfo', matchId, playerColor, playerShape, playerName);
}

function confirmCode(){
  var input;
  input = prompt('Ga naar de deur en voer de speler naam van je partner in: ');
  //TODO
  //change to socket.emit and check if both entered the correct code maybe?
  if(input === matchName){
    console.log('baby made');
    socket.emit('createBaby', matchId, playerId, matchColor, matchShape, playerColor, playerShape);
    //endMatch();
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

//*****************************************************************************************
//	Graphics
//*****************************************************************************************

// Colors
var color = {BLACK: "#000000", DARK_GREY: "#323232", WHITE: "#FFFFFF", BLUE: "#0090FF", GREEN: "#7AFF2D", PINK: "#F319FF", RED: "#FF0000", YELLOW: "#FFFF00"};
var colorArray = [color.BLACK, color.DARK_GREY, color.WHITE, color.PINK, color.RED, color.YELLOW];


// Camera
function Camera(position){
	this.position = position;
	this.previousPos = this.position.clone();
	this.targetPos = this.position.clone();
	this.width = canvas.width;
	this.height = canvas.height;

	this.timer = 0;
	this.cameraFX = {xOffset: 0, yOffset: 0, shakeIntensity: 0};

	this.shake = function(intensity){
		this.cameraFX.shakeIntensity = intensity;
	};

	this.setTargetPosition = function(position){
		this.targetPos = new Vector2(position.x-this.width/2, position.y-this.height/2);
	};

	// Update
	this.update = function(){
		// Timer
		this.timer -= UPDATE_DURATION/1000;
		if(this.timer < 0){this.timer = 0;}

		// Physics
		this.previousPos = this.position.clone();

		// Camera shake
		if(this.cameraFX.shakeIntensity > 0.02){
			this.cameraFX.xOffset = randomRange(0, this.cameraFX.shakeIntensity);
			this.cameraFX.yOffset = randomRange(0, this.cameraFX.shakeIntensity);
			this.cameraFX.shakeIntensity *= 0.98;
		}else{
			this.cameraFX.shakeIntensity *= 0;
		}

		// Move to target position
		var dist = new Vector2(this.targetPos.x - this.position.x, this.targetPos.y - this.position.y);
		if(dist.length() < 0.1){
			this.position = this.targetPos.clone();
		}else{
			dist.multiply(0.1);
			// Max speed
			if(dist.length() > 50){
				dist.normalize();
				dist.multiply(50);
			}
			this.position.add(dist);
		}
	};

	this.interpolatedPos = function(){
		var lagOffset = lag/UPDATE_DURATION;
		return new Vector2(this.previousPos.x + (this.position.x-this.previousPos.x)*lagOffset + this.cameraFX.xOffset,
						   this.previousPos.y + (this.position.y-this.previousPos.y)*lagOffset + this.cameraFX.yOffset);
	};
}


// Sprite
function Sprite(img, startX, startY, width, height, center, frameCount, fps, loop){
	// Default values
	if(center === undefined){center = new Vector2(width/2, height/2);}
	if(frameCount === undefined){frameCount = 1;}
	if(fps === undefined){fps = 1;}
	if(loop === undefined){loop = false;}

	this.img = img;
	this.sx = startX;
	this.sy = startY;
	this.width = width;
	this.height = height;
	this.center = center;

	this.fps = fps;
	this.frameCount = frameCount;
	this.frameIndex = 0;
	this.loop = loop;
	this.isDone = false;

	this.reset = function(){
		this.frameIndex = 0;
		this.isDone = false;
	};

	this.update = function(){
		// We want to maintain the correct frametime thus we add fps/UPS (updates per second)
		this.frameIndex = (this.frameIndex+(UPDATE_DURATION/1000*this.fps));
		if(this.frameIndex > this.frameCount){
			if(this.loop){
				this.frameIndex = this.frameIndex % this.frameCount;
			}else{
				this.frameIndex = this.frameCount-1; this.isDone = true;
			}
		}
	};

	this.draw = function(ctx, x, y, rotation, alpha){
		if(rotation === undefined){rotation = 0;}
		if(alpha === undefined){alpha = 1;}
		ctx.globalAlpha = alpha;
		// Save the unrotated context of the canvas so we can restore it later.
	    ctx.save();

	    // Translate
	    ctx.translate(x, y);

	    // Rotate the canvas to the specified degrees
	    ctx.rotate(rotation*(Math.PI/180)%360);

	    // Draw the image
	    ctx.drawImage(this.img, this.sx+(Math.floor(this.frameIndex)*this.width), this.sy, this.width, this.height, -this.center.x, -this.center.y, this.width, this.height);

	    // We’re done with the rotating so restore the unrotated context
	    ctx.restore();
	    ctx.globalAlpha = 1;
	};
}

// Draws a rectangle
function drawRectangle(ctx, x, y, w, h, fill, color, alpha){
	if(alpha === undefined){alpha = 1;}
	ctx.fillStyle = color;
	ctx.strokeStyle = color;
	ctx.globalAlpha = alpha;
	ctx.beginPath();
	ctx.rect(x, y, w, h);
	ctx.closePath();
	if(fill){ ctx.fill(); }else{ ctx.stroke(); }
	ctx.globalAlpha = 1;
}

// Draws a rectangle with rounded corners
function drawRoundRect(ctx, x, y, width, height, radius, fill, color, alpha) {
	if(alpha === undefined){alpha = 1;}
	ctx.fillStyle = color;
	ctx.strokeStyle = color;
	ctx.globalAlpha = alpha;
	ctx.beginPath();
	ctx.moveTo(x + radius, y);
	ctx.lineTo(x + width - radius, y);
	ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
	ctx.lineTo(x + width, y + height - radius);
	ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
	ctx.lineTo(x + radius, y + height);
	ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
	ctx.lineTo(x, y + radius);
	ctx.quadraticCurveTo(x, y, x + radius, y);
	ctx.closePath();
 	if(fill){ ctx.fill(); }else{ ctx.stroke(); } 
 	ctx.globalAlpha = 1; 
}

// Draws a circle
function drawCircle (ctx, x, y, radius, fill, color, alpha){
	if(alpha === undefined){alpha = 1;}
	ctx.fillStyle = color;
	ctx.strokeStyle = color;
	ctx.globalAlpha = alpha;
	ctx.beginPath();
	ctx.arc(x, y, radius, 0, 2*Math.PI);
	ctx.closePath();
	if(fill){ ctx.fill(); }else{ ctx.stroke(); }
	ctx.globalAlpha = 1;
}

// Draws an ellipse
function drawEllipse(ctx, x, y, w, h, fill, color, alpha){
	if(alpha === undefined){alpha = 1;}
	var kappa = 0.5522848,	
      ox = (w / 2) * kappa, // control point offset horizontal
      oy = (h / 2) * kappa, // control point offset vertical
      xe = x + w,           // x-end
      ye = y + h,           // y-end
      xm = x + w / 2,       // x-middle
      ym = y + h / 2;       // y-middle

     ctx.fillStyle = color;
	ctx.strokeStyle = color;
	ctx.globalAlpha = alpha;
	ctx.beginPath();
	ctx.moveTo(x, ym);
	ctx.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y);
	ctx.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym);
	ctx.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
	ctx.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym);
	ctx.closePath();
	if(fill){ ctx.fill(); }else{ ctx.stroke(); }
	ctx.globalAlpha = 1;
}

// TODO improve
function drawText(ctx, x, y, maxLineWidth, lineHeight, text, font, size, color, alpha){
	if(alpha === undefined){alpha = 1;}
	ctx.font = size+"px "+font;
	ctx.fillStyle = color;
	ctx.globalAlpha = alpha;

	var lines = text.split("\n");
    for (var i = 0; i < lines.length; i++) {
        var words = lines[i].split(' ');
        var line = '';

        for (var n = 0; n < words.length; n++) {
            var testLine = line + words[n] + ' ';
            var lineWidth = ctx.measureText(testLine).width;
            if (lineWidth > maxLineWidth && n > 0) {
                ctx.fillText(line, x, y);
                line = words[n] + ' ';
                y += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, x, y);
        y += lineHeight;
    }
	
	//ctx.fillText(text, x, y);
	ctx.globalAlpha = 1;
}
//*****************************************************************************************
//	Input
//*****************************************************************************************

// Mouse
function Mouse(){
	this.x = 0;
	this.y = 0;
	this.buttonState = {leftClick: false, rightClick: false};

	// Returns the position relative to the game world (you need the camera object)
	this.getWorldPosition = function(){
		return new Vector2(this.x + camera.position.x, this.y + camera.position.y);
	};
}

// Keyboard
function Keyboard(){
	this.keyState = {SPACE: false};
}

// Input listeners
function initializeInputListeners(){
	// Mouse event listeners
	canvas.addEventListener('mousedown', function(e){
		switch(e.button){
			case 0:
				mouse.buttonState.leftClick = true;
				//console.log("Left click at x: "+mouse.x+" y: "+mouse.y);
				break;
			case 2:
				mouse.buttonState.rightClick = true;
				//console.log("Right click at x: "+mouse.x+" y: "+mouse.y);
				break;
			default:
				console.log("Err - (mousedown) Mouse button "+e.button+" is not defined");
				break;
		}		
	}, false);

	document.addEventListener('mouseup', function(e){
		switch(e.button){
			case 0:
				//console.log("Mouse up at x: "+mouse.x+" y: "+mouse.y);
				mouse.buttonState.leftClick = false;
				break;
			case 2:
				//console.log("Mouse up at x: "+mouse.x+" y: "+mouse.y);
				mouse.buttonState.rightClick = false;
				break;
			default:
				console.log("Err - (mousedown) Mouse button "+e.button+" is not defined");
				break;
		}
	}, false);

	document.addEventListener('mousemove', function(e){
		var rect = canvas.getBoundingClientRect();
		var x = e.clientX || e.pageX;
    	var y = e.clientY || e.pageY;
    	mouse.x = x-rect.left-4; // 4px border
    	mouse.y = y-rect.top-4;
	}, false);

	// Keyboard event listeners
	document.addEventListener('keydown', function(e){
		// e.keyCode
		switch(e.keyCode){
			case 32:
				keyboard.keyState.SPACE = true;
				break;
			default:
				break;
		}
	}, false);

	document.addEventListener('keyup', function(e){
		// e.keyCode
		switch(e.keyCode){
			case 32:
				keyboard.keyState.SPACE = false;
				break;
			default:
				break;
		}
	}, false);
}

//*****************************************************************************************
//
//	Game Design Project v.0.1
//	@Author Midas Buitink
//
//*****************************************************************************************

// Constants
var UPS = 60;						// updates/second
var UPDATE_DURATION = 1000/UPS;		// The duration of a single update in ms

// Logic
var gameObjects = [];

// Graphics
var canvas;
var ctx;
var currentTime = Date.now();
var previousTime = currentTime;
var lag = 0;

// Input
var mouse;
var keyboard;
var previousMouse;
var previousKeyboard;


var acceptButton;
var rejectButton;
var makeBabyButton;

window.onload = function main(){
	// Create the canvas
	canvas = document.createElement("canvas");
	canvas.width = self.innerWidth - 10;
	canvas.height = self.innerHeight - 10;
	ctx = canvas.getContext("2d");
	document.body.appendChild(canvas);

	// Initialize
	initialize();

	//Run
	run();
};

function initialize(){
	// Input
	mouse = new Mouse();
	keyboard = new Keyboard();
	initializeInputListeners();
	previousMouse = clone(mouse);
	previousKeyboard = clone(keyboard);	

	// Camera
	camera = new Camera(new Vector2(-canvas.width/2, -canvas.height/2));
}

function initializeWorld(){
	// Test players
	// for (var i = 0; i < 20; i++) {
	// 	randomPosition = new Vector2(randomRange(0, canvas.width), randomRange(0, canvas.height));
	// 	player = new Player(i, randomPosition, 0, 0);
	// 	// Spawn the player in an empty space
	// 	while(checkCollision(player) || checkOutOfBounds(player)){
	// 		player.position = new Vector2(randomRange(0, canvas.width), randomRange(0, canvas.height));
	// 		player.previousPos = player.position.clone();
	// 	}
 // 			gameObjects.push(player);
 // 			console.log("player");
 // 			player.addBaby();
 // 			player.addBaby();
 // 			player.addBaby();
 // 			player.addBaby();
 // 			player.addBaby();
 // 			player.addBaby();
 // 			//console.log("baby");

	// }
}

function initializePlayer(){
	acceptButton = new TextButton(new Vector2(500, 100), 300, 100, "Yep", color.GREEN);
	acceptButton.onClick = function(){acceptMatch()};
	gameObjects.push(acceptButton);
	acceptButton.isVisible = false;
	acceptButton.isDisabled = true;

	rejectButton = new TextButton(new Vector2(500, 300), 300, 100, "Nope", color.RED);
	rejectButton.onClick = function(){rejectMatch()};
	gameObjects.push(rejectButton);
	rejectButton.isVisible = false;
	rejectButton.isDisabled = true;

	makeBabyButton = new TextButton(new Vector2(300, 450), 300, 100, "COMBINE DNA", color.DARK_GREY);
	makeBabyButton.onClick = function(){confirmCode()};
	gameObjects.push(makeBabyButton);
	makeBabyButton.isVisible = false;
	makeBabyButton.isDisabled = true;

	var b = new TextButton(new Vector2(100, 100), 300, 100, "Zoek een Match", color.BLUE);
	b.onClick = function(){seekMatch()};
	gameObjects.push(b);
	var d = new TextButton(new Vector2(100, 300), 300, 100, "Stop de Match", color.BLUE);
	d.onClick = function(){endMatch()};
	gameObjects.push(d);
}

function run(){
	// Game loop
	var tick = function(){
		window.requestAnimationFrame(tick);

		currentTime = Date.now();
		elapsedTime = (currentTime - previousTime);
		lag += elapsedTime;
		
		// Correct any huge (1sec) unexpected lag
		if(lag >= 1000){
			lag = UPDATE_DURATION;
			console.log("unexpected lag!");
		}

		// Fixed time step
		while(lag >= UPDATE_DURATION){
			update();
			lag -= UPDATE_DURATION;
		}

		// Pass lag/UPDATE_DURATION for interpolation
		render(lag/UPDATE_DURATION);

		// Prepare for next tick
		previousTime = currentTime;
	};
	window.requestAnimationFrame(tick);
}

function update(){
	// Apply physics
	applyPhysics();

	// Update all game objects
	for (var ob = 0; ob < gameObjects.length; ob++){
		if(!gameObjects[ob].isAlive){
			gameObjects.splice(ob, 1);
			ob--;
			if(gameObjects.length === 0){break;}
		}else{
			gameObjects[ob].update();
		}
	}

	// Camera
	camera.update();

	// Set the draw order
	sortByDepth(gameObjects);

	// Save previous mouse and keyboard state
	previousMouse = clone(mouse);
	previousKeyboard = clone(keyboard);
}

function render(lagOffset){
	// Clear canvas
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	//draw for server
	if(isWorld){
		// Background
		drawRectangle(ctx, 0, 0, canvas.width, canvas.height, true, color.BLUE, 1);
		//drawRectangle(ctx, 0, canvas.height/2, canvas.width, canvas.height/2, true, color.GREEN, 1);

		// Render all game objects
		for (var ob = 0; ob < gameObjects.length; ob++){
			gameObjects[ob].render(lagOffset);
		}
	//draw for clients
	}else{
		// Background
		drawRectangle(ctx, 0, 0, canvas.width, canvas.height, true, color.WHITE, 1);

		// Render all game objects
		for(var ob = 0; ob < gameObjects.length; ob++){
			gameObjects[ob].render(lagOffset);
		}
	}	
}

//*****************************************************************************************
//	Physics
//*****************************************************************************************

// Vector 2D
function Vector2(x, y){
	this.x = x;
	this.y = y;

	this.add = function(vector2){
		this.x += vector2.x;
		this.y += vector2.y;
	};

	this.substract = function(vector2){
		this.x -= vector2.x;
		this.y -= vector2.y;
	};

	this.multiply = function(val){
		this.x *= val;
		this.y *= val;
	};

	this.devide = function(val){
		if(val !== 0){
			this.x /= val;
			this.y /= val;
		}
	};

	this.normalize = function(){
		if(this.length() !== 0){
			this.devide(this.length());
		}
	};

	this.getN = function(){
		if(this.length() !== 0){
			var v = this.clone();
			v.devide(v.length());
			return v;
		}
		return new Vector2(0, 0);
	};

	this.length = function(){
		return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
	};

	this.getVectorTo = function(vector2){
		return new Vector2(vector2.x - this.x, vector2.y - this.y);
	};

	this.rotate = function(angle){
		var theta = degToRad(angle);
		var cs = Math.cos(theta);
		var sn = Math.sin(theta);

		var newX = this.x * cs - this.y * sn;
		var newY = this.x * sn + this.y * cs;

		this.x = newX;
		this.y = newY;
	};

	this.getRotation = function(){
		var dot = 0*this.x + (1*this.y);     				// dot product
		var det = 0*this.y - (1*this.x);     				// determinant
		var angle = radToDeg(Math.atan2(det, dot))+180;		// atan2(y, x) or atan2(sin, cos)
		return angle;
	};

	this.clone = function(){
		return new Vector2(this.x, this.y);
	};
}

// Physics
function applyPhysics(){
	// Apply velocity and check for collisions
	for (var i = 0; i < gameObjects.length; i++){
		if(gameObjects[i].isDynamic){
			var ob = gameObjects[i];
			// Before we apply physics we save the previous position (for better rendering)
			ob.previousPos = ob.position.clone();

			// Check horizontal movement
			if( checkCollision(ob, new Vector2(ob.velocity.x, 0)) || checkOutOfBounds(ob, new Vector2(ob.velocity.x, 0)) ){
				while( !checkCollision(ob, new Vector2(Math.sign(ob.velocity.x), 0)) && !checkOutOfBounds(ob, new Vector2(Math.sign(ob.velocity.x), 0)) ){
					ob.position.x += Math.sign(ob.velocity.x);
				}
				ob.velocity.x = 0;
			}else{ob.position.x += ob.velocity.x;}

			// Check vertical movement
			if( checkCollision(ob, new Vector2(0, ob.velocity.y)) || checkOutOfBounds(ob, new Vector2(0, ob.velocity.y)) ){
				while( !checkCollision(ob, new Vector2(0, Math.sign(ob.velocity.y))) && !checkOutOfBounds(ob, new Vector2(0, Math.sign(ob.velocity.y))) ){
					ob.position.y += Math.sign(ob.velocity.y);
				}
				ob.velocity.y = 0;
			}else{ob.position.y += ob.velocity.y;}

			// Apply drag
			ob.velocity.multiply(ob.drag);
		}
	}
}

// Checks collsion with all other objects
function checkCollision(object, offset){
	if(!object.isSolid){ return false;}
	if(offset === undefined){offset = new Vector2(0, 0);}

	// Create a hitbox that includes the offset
	var hitbox = new AABB(object.position.x + offset.x - object.width/2, object.position.y + offset.y - object.height/2, object.width, object.height);

	// Check if the new hitbox is colliding with another object
	for (var i = 0; i < gameObjects.length; i++){
		// Avoid comparing to itself
		if(object !== gameObjects[i]){
			if(gameObjects[i].isSolid){
				if(checkAABBvsAABB(hitbox, gameObjects[i].getHitbox())){return gameObjects[i];}
			}
		}
	}	
}

// Checks if the object is within the bounding box
function checkOutOfBounds(object, offset){
	if(offset === undefined){offset = new Vector2(0, 0);}

	// Create a hitbox that includes the offset
	var hitbox = new AABB(object.position.x + offset.x - object.width/2, object.position.y + offset.y - object.height/2, object.width, object.height);

	// Check if the new hitbox is within the bounds
	return (hitbox.x < 0 || hitbox.x + hitbox.width > canvas.width || hitbox.y < 0 || hitbox.y + hitbox.height > canvas.height);
}

// Collision Circle
function CC(x, y, radius){
	this.x = x;
	this.y = y;
	this.radius = radius;
}

// Returns true is the point is inside the circle
function checkPointvsCC(point, circle){
	var dist = new Vector2(point.x - circle.x, point.y - circle.y);
	return dist.length() < circle.radius;
}

// Axis-Aligned Bounding Box
function AABB(x, y, width, height){
	this.x = x;
	this.y = y;
	this.width = width;
	this.height = height;
}

// Returns true if the two hitboxes overlap
function checkAABBvsAABB(rect1, rect2){
	return !(rect1.x > rect2.x + rect2.width ||
	   		rect1.x + rect1.width < rect2.x  ||
	   		rect1.y > rect2.y + rect2.height ||
	   		rect1.height + rect1.y < rect2.y);
}

// Return true if the point is inside the hitbox
function checkPointvsAABB(point, rect){
	return !(point.x < rect.x || point.x > rect.x + rect.width ||
			point.y < rect.y || point.y > rect.y + rect.height);
}

//*****************************************************************************************
//	Player
//*****************************************************************************************

function Player(id, position, color, shape){
	this.type = "Player";
	this.isAlive = true;
	
	// Physics
	this.position = position;
	this.previousPos = this.position.clone();
	this.velocity = new Vector2(0, 0);
	this.width = 40;
	this.height = 40;
	this.drag = 0.95;

	// Graphics
	this.color = color;
	this.shape = shape;
	
	// Data
	this.id = id;
	this.matched = false;
	this.isSolid = true;
	this.isDynamic = true;
	this.state = "IDLE"; // IDLE, MOVING

	this.timer = 0;

	this.kill = function(){
		this.isAlive = false;
	}

	this.getHitbox = function(){
		return new AABB(this.position.x - this.width/2, this.position.y - this.height/2, this.width, this.height);
	}

	// TODO clean up
	this.addBaby = function(){
		var pos = this.position.clone();
		var offset = new Vector2(0, -60);
		offset.rotate(randomRange(0, 359));
		var b = new Baby(new Vector2(pos.x+offset.x, pos.y+offset.y), this);

		gameObjects.push(b);
	}

	this.update = function(){
		// Timer
		this.timer -= UPDATE_DURATION/1000;
		if(this.timer < 0){this.timer = 0;}

		switch(this.state){
			case "IDLE":
				// Switch state
				if(this.timer === 0){
					var dir = new Vector2(0, -1);
					dir.rotate(randomRange(0, 359));
					
					this.velocity.add(dir);

					this.state = "MOVING";
					this.timer = randomRange(1, 3);
				}
				break;
			case "MOVING":
				// Switch state
				if(this.timer === 0){
					this.state = "IDLE";
					this.timer = randomRange(2, 8);
				}

				// Determine velocity
				var d = this.velocity.clone(); d.normalize();
				var r = Math.random() > 0.5 ? randomRange(0, 10) : -randomRange(0, 10); d.rotate(r);
				this.velocity.add(d);

				// Limit velocity
				if(this.velocity.length() > 3){this.velocity.normalize(); this.velocity.multiply(3);}

				break;
			default:
				console.log("Err - State evaluation error: "+this.state+" is not a valid state. Reference: "+this);
				break;
		}
	}

	this.render = function(lagOffset){
		var drawX = this.previousPos.x + ((this.position.x-this.previousPos.x)*lagOffset);
		var drawY = this.previousPos.y + ((this.position.y-this.previousPos.y)*lagOffset);

		// Render
		drawRectangle(ctx, drawX-this.width/2, drawY-this.height/2, this.width, this.height, true, colorArray[this.color], 1);
	}
}
//*****************************************************************************************
//	Utility
//*****************************************************************************************

// Return a random number between min and max
function randomRange(min, max){
	return Math.random()*(max - min)+min;
}

// Converts degrees to radians
function degToRad(degrees){
	return Math.PI/180*degrees;
}

// Converts radians to degrees
function radToDeg(radians){
	return 180/Math.PI*radians;
}

// Clone object
function clone(obj){
    if(obj === null || typeof(obj) !== 'object'){
        return obj;
    }

    var temp = new obj.constructor();
    for(var key in obj){
    	// Justin Case: hasOwnProperty check
    	if(Object.prototype.hasOwnProperty.call(obj, key)){
            temp[key] = clone(obj[key]);
        }
    }
    return temp;
}

// Sorting algorithm to determine the draw order
function sortByDepth(objects){
    var value;
     
    for (var i=0; i < objects.length; i++) {    
        // Store the current value because it may shift later
        value = objects[i];
        
        // Sort the array from back to front (depth 1 to depth -1)
        for (var j=i-1; j > -1 && objects[j].depth < value.depth; j--) {
            objects[j+1] = objects[j];
        }
        objects[j+1] = value;
    }
    return objects;
}
