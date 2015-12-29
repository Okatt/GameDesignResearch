//*****************************************************************************************
//
//	Game Design Project v.0.1
//	@Author Midas Buitink
//
//*****************************************************************************************

// Constants
var UPS = 30;						// updates/second
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

//change dimensions for new crown sprite
var crownSprite = new Sprite(spritesheet_crown, 0, 0, 75, 56);
var crownSpriteSmall = new Sprite(spritesheet_crown_small, 0, 0, 38, 28);

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
	camera = new Camera(new Vector2(-canvas.width/2, -canvas.height/2));
}

function initializeWorld(){
	initialize();

	// Props
	gameObjects.push( new Prop(new Vector2(200, 370), 90, 40, new Sprite(spritesheet_environment, 0, 0, 400, 400, new Vector2(196, 366))) );
	gameObjects.push( new Prop(new Vector2(560, 340), 90, 40, new Sprite(spritesheet_environment, 400, 0, 400, 400, new Vector2(196, 366))) );
	gameObjects.push( new Prop(new Vector2(canvas.width - 250, 380), 90, 40, new Sprite(spritesheet_environment, 0, 0, 400, 400, new Vector2(196, 366))) );
	
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

	playerAvatar = new Player(playerId, new Vector2(canvas.width/3, canvas.height/2), playerShape, playerColor, playerEyes);
	playerAvatar.state = "AVATAR";
	gameObjects.push(playerAvatar);

	acceptButton = new TextButton(new Vector2(canvas.width/3, 175), 300, 100, "Yep", color.GREEN);
	acceptButton.onClick = function(){acceptMatch()};
	gameObjects.push(acceptButton);
	acceptButton.isVisible = false;
	acceptButton.isDisabled = true;

	rejectButton = new TextButton(new Vector2(2*(canvas.width/3), 175), 300, 100, "Nope", color.RED);
	rejectButton.onClick = function(){rejectMatch()};
	gameObjects.push(rejectButton);
	rejectButton.isVisible = false;
	rejectButton.isDisabled = true;

	makeBabyButton = new TextButton(new Vector2(canvas.width/2, canvas.height-150), 300, 100, "BENOEM DE CREATIE", color.DARK_GREY);
	makeBabyButton.onClick = function(){confirmCode()};
	gameObjects.push(makeBabyButton);
	makeBabyButton.isVisible = false;
	makeBabyButton.isDisabled = true;

	shareButton = new TextButton(new Vector2(canvas.width/2, canvas.height - 50), 100, 50, "SHARE", color.BLUE);
	shareButton.onClick = function(){share()};
	gameObjects.push(shareButton);
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
		drawRectangle(ctx, 0, 0, canvas.width, canvas.height, true, color.SKY, 1);
		drawRectangle(ctx, 0, canvas.height*0.3, canvas.width, canvas.height*0.7, true, color.GROUND, 1);

		// link
		ctx.font = "28px Arial";
		ctx.fillStyle = "#FFFFFF";
		ctx.textAlign = "center";
		ctx.fillText("JOIN THE PARTY AT", canvas.width/2, 30);
		ctx.font = "36px Arial";
		ctx.fillStyle = "#FFFFFF";
		ctx.textAlign = "center";
		ctx.fillText("polygonpals.tk", canvas.width/2, 66);

		// Render all game objects
		for (var ob = 0; ob < gameObjects.length; ob++){
			gameObjects[ob].render(lagOffset);
		}
	//draw for clients
	}else{
		// Background
		drawRectangle(ctx, 0, 0, canvas.width, canvas.height, true, color.GROUND, 1);

		// Name
		ctx.font = "36px Arial";
		ctx.fillStyle = "#000000";
		ctx.textAlign = "center";
		ctx.fillText(clientStatus, canvas.width/2, 100);

		// Render all game objects
		for(var ob = 0; ob < gameObjects.length; ob++){
			gameObjects[ob].render(lagOffset);
		}
	}	
}
