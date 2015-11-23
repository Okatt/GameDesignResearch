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
	// Props
	gameObjects.push( new Prop(new Vector2(200, 370), 90, 40, new Sprite(spritesheet_environment, 0, 0, 400, 400, new Vector2(196, 366))) );
	gameObjects.push( new Prop(new Vector2(560, 340), 90, 40, new Sprite(spritesheet_environment, 400, 0, 400, 400, new Vector2(196, 366))) );
	gameObjects.push( new Prop(new Vector2(canvas.width - 250, 380), 90, 40, new Sprite(spritesheet_environment, 0, 0, 400, 400, new Vector2(196, 366))) );

	//Test players
	for (var i = 0; i < 4; i++) {
		randomPosition = new Vector2(randomRange(0, canvas.width), randomRange(0, canvas.height));
		player = new Player(i, randomPosition, 0, 0);

		// Spawn the player in an empty space
		while(checkCollision(player) || checkOutOfBounds(player)){
			player.position = new Vector2(randomRange(0, canvas.width), randomRange(0, canvas.height));
			player.previousPos = player.position.clone();
		}
 			gameObjects.push(player);
 			player.addBaby();
 			player.addBaby();
 			player.addBaby();
 			player.addBaby();
 			player.addBaby();
 			player.addBaby();
 			player.addBaby();
 			player.addBaby();
 			player.addBaby();
	}
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
		drawRectangle(ctx, 0, 0, canvas.width, canvas.height, true, color.SKY, 1);
		drawRectangle(ctx, 0, canvas.height*0.3, canvas.width, canvas.height*0.7, true, color.GROUND, 1);

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
