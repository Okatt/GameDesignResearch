//*****************************************************************************************
//
//	Game Design Project v.0.1
//	@Author Midas Buitink
//
//*****************************************************************************************

// Prototype 3 before feedback

// Constants
var UPS = 30;						// updates/second
var UPDATE_DURATION = 1000/UPS;		// The duration of a single update in ms

// Logic
var gameObjects = [];

// Manager
var am;

// Graphics
var canvas;
var ctx;
var currentTime = Date.now();
var previousTime = currentTime;
var lag = 0;
var camera;

// Input
var mouse;
var keyboard;
var previousMouse;
var previousKeyboard;
var clicked = false; // Dirty hack, so player can not click muliply buttons in one update

var acceptButton;
var rejectButton;
var makeBabyButton;

// Tutorial
var justJoined = true;
var firstMatch = true;
var firstMemory = true;
var firstPolygon = true;
var firstEmote = true;


// Data collection
var dt = 0;
var time = 0;		// In minutes

/*
var gemSprite;
var gems;
var nodeSpawner;
*/

var highlighter;
var turnTimer = -1;
var notificationSound;

//change dimensions for new crown sprite
var crownSprite = new Sprite(spritesheet_crown, 0, 0, 140, 140);
var crownSpriteSmall = new Sprite(spritesheet_crown_small, 0, 0, 70, 70);
var grassSprite = new Sprite(spritesheet_environment, 0, 400, 2000, 200);

// NOTE
// Copy paste for resource node sprite:
//		 sprite = new Sprite(spritesheet_environment, 1000, 0, 200, 200, new Vector2(100, 100), 5, 0, false);
// Use: (use 0, 1, 2, 3, and 4 to get the different stages)
//		 sprite.frameIndex = 0;

window.onload = function main(){
	//Run
	run();
};

function initialize(){
	// Create the canvas
	canvas = document.createElement("canvas");
	canvas.width = self.innerWidth - 10;
	canvas.height = self.innerHeight - 10;
	ctx = canvas.getContext("2d");
	document.body.appendChild(canvas);

	// Input
	mouse = new Mouse();
	keyboard = new Keyboard();
	initializeInputListeners();
	previousMouse = clone(mouse);
	previousKeyboard = clone(keyboard);	

	// Camera
	if(isWorld){
		camera = new Camera(new Vector2(1920/2, 1080/2-1600));
		camera.shake(4);
	}else{ camera = new Camera(new Vector2(1920/2, 1080/2)); }
	camera.setTargetPosition(new Vector2(1920/2, 1080/2));
}

function initializeWorld(){
	initialize();

	// Trees
	gameObjects.push( new Prop(new Vector2(50, 446), 90, 40, new Sprite(spritesheet_environment, 0, 0, 400, 400, new Vector2(196, 366))) );
	gameObjects.push( new Prop(new Vector2(314, 370), 90, 40, new Sprite(spritesheet_environment, 0, 0, 400, 400, new Vector2(196, 366))) );
	gameObjects.push( new Prop(new Vector2(640, 340), 90, 40, new Sprite(spritesheet_environment, 400, 0, 400, 400, new Vector2(196, 366))) );
	gameObjects.push( new Prop(new Vector2(1530, 380), 90, 40, new Sprite(spritesheet_environment, 0, 0, 400, 400, new Vector2(196, 366))) );
	gameObjects.push( new Prop(new Vector2(1900, 446), 90, 40, new Sprite(spritesheet_environment, 0, 0, 400, 400, new Vector2(196, 366))) );

	// Bushes
	gameObjects.push( new Prop(new Vector2(780, 335), 80, 20, new Sprite(spritesheet_environment, 800, 0, 200, 200, new Vector2(100, 140))) );
	gameObjects.push( new Prop(new Vector2(284, 400), 80, 20, new Sprite(spritesheet_environment, 800, 0, 200, 200, new Vector2(100, 140))) );
	gameObjects.push( new Prop(new Vector2(90, 470), 80, 20, new Sprite(spritesheet_environment, 800, 0, 200, 200, new Vector2(100, 140))) );
	gameObjects.push( new Prop(new Vector2(70, 780), 80, 20, new Sprite(spritesheet_environment, 800, 0, 200, 200, new Vector2(100, 140))) );
	gameObjects.push( new Prop(new Vector2(130, 850), 80, 20, new Sprite(spritesheet_environment, 800, 0, 200, 200, new Vector2(100, 140))) );
	gameObjects.push( new Prop(new Vector2(100, 970), 80, 20, new Sprite(spritesheet_environment, 800, 0, 200, 200, new Vector2(100, 140))) );
	gameObjects.push( new Prop(new Vector2(340, 1030), 80, 20, new Sprite(spritesheet_environment, 800, 0, 200, 200, new Vector2(100, 140))) );
	gameObjects.push( new Prop(new Vector2(700, 800), 80, 20, new Sprite(spritesheet_environment, 800, 0, 200, 200, new Vector2(100, 140))) );
	gameObjects.push( new Prop(new Vector2(1800, 940), 80, 20, new Sprite(spritesheet_environment, 800, 0, 200, 200, new Vector2(100, 140))) );
	gameObjects.push( new Prop(new Vector2(1720, 980), 80, 20, new Sprite(spritesheet_environment, 800, 0, 200, 200, new Vector2(100, 140))) );
	gameObjects.push( new Prop(new Vector2(1830, 740), 80, 20, new Sprite(spritesheet_environment, 800, 0, 200, 200, new Vector2(100, 140))) );
	gameObjects.push( new Prop(new Vector2(1645, 470), 80, 20, new Sprite(spritesheet_environment, 800, 0, 200, 200, new Vector2(100, 140))) );
	gameObjects.push( new Prop(new Vector2(1720, 510), 80, 20, new Sprite(spritesheet_environment, 800, 0, 200, 200, new Vector2(100, 140))) );

	// Stones
	gameObjects.push( new Prop(new Vector2(800, 780), 150, 20, new Sprite(spritesheet_environment, 800, 200, 200, 200, new Vector2(100, 150))) );
	gameObjects.push( new Prop(new Vector2(1750, 450), 150, 20, new Sprite(spritesheet_environment, 800, 200, 200, 200, new Vector2(100, 150))) );
	gameObjects.push( new Prop(new Vector2(1700, 920), 150, 20, new Sprite(spritesheet_environment, 800, 200, 200, 200, new Vector2(100, 150))) );

	// Announcements
	am = new AnnouncementManager();
	gameObjects.push(am);

	// Data collection
	startLog();

	// Sprite testing
	// var p = new Player(12345, new Vector2(500, 500), Math.floor(randomRange(0, 3.99)), 3, 1);
	// p.addBaby(0, 0, 3);
	// p.addBaby(1, 0, 3);
	// p.addBaby(2, 0, 3);
	// p.addBaby(3, 0, 3);
	// p.getCrown();
	// gameObjects.push(p);

	// Even niet..
	//backgroundMusic = background_music;

	// backgroundMusic.addEventListener('ended', function() {
 	// 	  this.currentTime = 0;
 	//    this.play();
	// }, false);

	//backgroundMusic.play();
}

function initializePlayer(){
	initialize();

	playerAvatar = new Player(playerId, new Vector2(1920/2, 1080/2+150), playerShape, playerColor, playerEyes);
	playerAvatar.state = "AVATAR";
	playerAvatar.isLarge = true;
	gameObjects.push(playerAvatar);

	// Announcements
	am = new AnnouncementManager();
	am.defaultMessage = "This is the player app!";
	am.height = 80;
	am.fontSize = 40;
	gameObjects.push(am);

	// acceptButton = new TextButton(new Vector2(canvas.width/2-110, 150), 200, 60, "Yep", "#141414", "#FFFFFF");
	// acceptButton.onClick = function(){acceptMatch()};
	// gameObjects.push(acceptButton);
	// acceptButton.isVisible = false;
	// acceptButton.isDisabled = true;

	// rejectButton = new TextButton(new Vector2(canvas.width/2+110, 150), 200, 60, "Nope", "#141414", "#FFFFFF");
	// rejectButton.onClick = function(){rejectMatch()};
	// gameObjects.push(rejectButton);
	// rejectButton.isVisible = false;
	// rejectButton.isDisabled = true;

	makeBabyButton = new TextButton(new Vector2(canvas.width/2, canvas.height/2+120), 380, 120, "Click here to name the polygon", "#141414", "#FFFFFF");
	makeBabyButton.onClick = function(){confirmCode()};
	gameObjects.push(makeBabyButton);
	makeBabyButton.isVisible = false;
	makeBabyButton.isDisabled = true;

	shareButton = new TextButton(new Vector2(canvas.width/2, canvas.height-100), 380, 90, "SHARE THIS POLYGON?", "#3C5899", "#FFFFFF");
	shareButton.onClick = function(){share()};
	gameObjects.push(shareButton);
	shareButton.isVisible = false;
	shareButton.isDisabled = true;

	/*
	gameObjects.push( new Chest(new Vector2(1920/2-340, 1080/2+120)) );

	gems = 0;
	gemSprite = new Sprite(spritesheet_gem, 0, 0, 100, 100);

	nodeSpawner = new NodeSpawner();
	gameObjects.push(nodeSpawner);
	nodeSpawner.spawnNew();
	*/

	//highlighter (only highlights 1 object, puts dark overlay over the rest)
	highlighter = new Highlighter();
	gameObjects.push(highlighter);

	//highlighter usage:
	//highlighter.highlight('player');
	//highlighter.highlight('match');
	//highlighter.highlight('emotes');
	//highlighter.highlight('memory');

	//notifcation sound
	notificationSound = notification_sound;

	//notification sound usage:
	//notificationSound.play();
	
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
	// World time
	if(isWorld){
		dt += UPDATE_DURATION/1000;
		if(dt >= 10){dt -= 10; time += 10; logData();}
	}	

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

	// Turn timer
	if(turnTimer >= 0){ turnTimer -= UPDATE_DURATION/1000; }
	else if(turnTimer < 0 && turnTimer !== -1){ turnTimer = -1; socket.emit('changeTurn', playerId, matchId); }

	// Camera
	camera.update();

	// Player announcements
	if(!isWorld){
		am.defaultMessage = clientStatus;
		;
	}

	// Set the draw order
	sortByDepth(gameObjects);

	// Save previous mouse and keyboard state
	previousMouse = clone(mouse);
	previousKeyboard = clone(keyboard);
	clicked = false;
}

function render(lagOffset){
	// Clear canvas
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	//draw for server
	if(isWorld){
		// Background
		drawRectangle(ctx, 0, 0, canvas.width, canvas.height, true, color.SKY, 1);
		drawRectangle(ctx, -camera.interpolatedPos().x, 300-camera.interpolatedPos().y, 2000, 1000, true, color.GROUND, 1);
		grassSprite.draw(ctx, 1920/2 -camera.interpolatedPos().x, 300-camera.interpolatedPos().y);

		// Render all game objects
		for (var ob = 0; ob < gameObjects.length; ob++){
			gameObjects[ob].render(lagOffset);
		}
	//draw for clients
	}else{
		// Background
		drawRectangle(ctx, 0, 0, canvas.width, canvas.height, true, color.GROUND, 1);
		//drawRectangle(ctx, -camera.interpolatedPos().x, 300-camera.interpolatedPos().y, 2000, 1000, true, color.GROUND, 1);
		//grassSprite.draw(ctx, 1920/2 -camera.interpolatedPos().x, 300-camera.interpolatedPos().y);

		// Name
		// ctx.font = "40px Righteous";
		// ctx.fillStyle = "#000000";
		// ctx.textAlign = "center";
		// ctx.fillText(clientStatus, canvas.width/2, 60);

		// Render all game objects
		for(var ob = 0; ob < gameObjects.length; ob++){
			gameObjects[ob].render(lagOffset);
		}
		/*
		// Gem counter
		gemSprite.draw(ctx, 100, canvas.height-100);
		ctx.font = "48px Righteous";
		ctx.fillStyle = "#3CD15D";
		ctx.textAlign = "left";
		ctx.fillText(gems.toString(), 164, canvas.height-85);
		*/
	}	
}