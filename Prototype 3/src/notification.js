//*****************************************************************************************
//	Notifications
//*****************************************************************************************

// Notification Manager
function NotificationManager(){
	this.type = "NotificationManager";
	this.isAlive = true;

	this.kill = function(){
		this.isAlive = false;
	};

	this.update = function(){

	};

	this.render = function(lagOffset){

	};
}
 
// Notification
function Notification(message){
	this.type = "Notification";
	this.isAlive = true;

	notificationSound.play();

	// Positioning
	this.position = new Vector2(canvas.width/2, 140);
	this.previousPos = this.position.clone();
	this.width = canvas.width-40;
	this.height = 240;

	// Graphics
	this.depth = -2000;
	this.font = "Righteous";
	this.fontSize = 40;

	// Data
	this.message = message;
	this.text = [];
	this.isSolid = false;
	this.isDynamic = false;
	this.isHighlighted = true;

	this.getTextArray = function(){
		var t = message.split("\n");
		console.log(t);
	};
	this.text = this.getTextArray();

	this.kill = function(){
		this.isAlive = false;
	};

	this.update = function(){
		if(this.isHighlighted){
			this.depth = -3001;
		}else{
			this.depth = -2000;
		}
	};

	this.render = function(lagOffset){
		var drawX = this.previousPos.x + ((this.position.x-this.previousPos.x)*lagOffset);
		var drawY = this.previousPos.y + ((this.position.y-this.previousPos.y)*lagOffset);

		// Textbox
		drawRectangle(ctx, drawX-this.width/2+4, drawY-this.height/2+4, this.width, this.height, true, "#000000", 0.3);
		drawRectangle(ctx, drawX-this.width/2, drawY-this.height/2, this.width, this.height, true, "#FFFFFF", 1);

		// Text
		// for (var i = 0; i < this.text.length; i++) {
		// 	ctx.font = this.font;
		// 	ctx.fillStyle = "#FFFFFF";
		// 	ctx.textAlign = "center";
		// 	ctx.fillText(this.message, drawX, drawY);

		// 	ctx.draw(this.text[i]);
		// }
		ctx.textAlign = "center";
		drawText(ctx, drawX, drawY-this.height/2+this.fontSize+10, this.width-40, this.fontSize, this.message, this.font, this.fontSize, color.BLACK, 1);
	};
}

function joinNotification(){
	var joinNotification = new Notification("Welcome! This is your character.");
	gameObjects.push( joinNotification );

	var okButton = new TextButton(new Vector2(canvas.width/2, 200), 240, 80, "OK", "#141414", "#FFFFFF");
	okButton.onClick = function(){justJoined = false; joinNotification.kill(); this.kill(); joinNotification2();};
	gameObjects.push(okButton);

	highlighter.highlight("player");
	joinNotification.isHighlighted = true;
	okButton.isHighlighted = true;
}

function joinNotification2(){
	var joinNotification2 = new Notification("Click on your character.");
	gameObjects.push( joinNotification2 );

	var okButton = new TextButton(new Vector2(canvas.width/2, 200), 240, 80, "OK", "#141414", "#FFFFFF");
	okButton.onClick = function(){joinNotification2.kill(); this.kill(); highlighter.unHighlight(); socket.emit('ready', playerId);};
	gameObjects.push(okButton);

	joinNotification2.isHighlighted = true;
	okButton.isHighlighted = true;

	clientStatus = "Searching for a match...";
}

function firstEmoteNotification(){
	var firstEmoteNotification = new Notification("Click on one of the emotes to express it to the world.");
	gameObjects.push( firstEmoteNotification );

	var okButton = new TextButton(new Vector2(canvas.width/2, 200), 240, 80, "OK", "#141414", "#FFFFFF");
	okButton.onClick = function(){firstEmote = false; firstEmoteNotification.kill(); this.kill(); highlighter.unHighlight();};
	gameObjects.push(okButton);

	highlighter.highlight("emotes");
	firstEmoteNotification.isHighlighted = true;
	okButton.isHighlighted = true;
}

function firstMatchNotification(){
	var firstMatchNotification = new Notification("You will be matched with other players. If both players accept the match, you can play a game together to create a new polygon!");
	gameObjects.push( firstMatchNotification );

	var okButton = new TextButton(new Vector2(canvas.width/2, 200), 240, 80, "OK", "#141414", "#FFFFFF");
	okButton.onClick = function(){firstMatchNotification.kill(); this.kill(); matchNotification();};
	gameObjects.push(okButton);

	highlighter.highlight("match");
	firstMatchNotification.isHighlighted = true;
	okButton.isHighlighted = true;
}

function matchNotification(){
	var matchNotification;
	if(firstMatch){
		matchNotification = new Notification("You've got a match! Do you want to play with this person? (Please select \"Yep\")");
	}else{
		matchNotification = new Notification("You've got a match! Do you want to play with this person?");
	}
	gameObjects.push( matchNotification );

	var yesButton, noButton;

	yesButton = new TextButton(new Vector2(canvas.width/2-140, 200), 240, 80, "Yep", "#141414", "#FFFFFF");
	yesButton.onClick = function(){acceptMatch(); matchNotification.kill(); noButton.kill(); this.kill(); highlighter.unHighlight("match"); firstMatch = false; /*maybe after both layers accepted*/};
	gameObjects.push(yesButton);

	noButton = new TextButton(new Vector2(canvas.width/2+140, 200), 240, 80, "Nope", "#141414", "#FFFFFF");
	noButton.onClick = function(){rejectMatch(); matchNotification.kill(); yesButton.kill(); this.kill();};
	gameObjects.push(noButton);
	if(firstMatch){ noButton.isDisabled = true; }

	yesButton.isHighlighted = true;
	noButton.isHighlighted = true;
}

function firstMemoryNotification(){
	var firstMemoryNotification = new Notification("You will work together to create a new polygon that will follow you around.");
	gameObjects.push( firstMemoryNotification );

	var okButton = new TextButton(new Vector2(canvas.width/2, 200), 240, 80, "OK", "#141414", "#FFFFFF");
	okButton.onClick = function(){firstMemory = false; firstMemoryNotification.kill(); this.kill(); secondMemoryNotification()};
	gameObjects.push(okButton);

	highlighter.highlight();
	firstMemoryNotification.isHighlighted = true;
	okButton.isHighlighted = true;
}

function secondMemoryNotification(){
	var secondMemoryNotification = new Notification("The titles are determined by the two characters \"DNA\". Both players add their features (shape, color and number of eyes) to the memory game.");
	gameObjects.push( secondMemoryNotification );

	var okButton = new TextButton(new Vector2(canvas.width/2, 200), 240, 80, "OK", "#141414", "#FFFFFF");
	okButton.onClick = function(){firstMemory = false; secondMemoryNotification.kill(); this.kill(); thirdMemoryNotification()};
	gameObjects.push(okButton);

	highlighter.highlight("memory");
	secondMemoryNotification.isHighlighted = true;
	okButton.isHighlighted = true;
}

function thirdMemoryNotification(){
	var thirdMemoryNotification = new Notification("During your turn you can select two tiles. When both tiles match, that feature (colour, shape and the number of eyes) will be used to create a new polygon. Other tiles that effect the same feature will be discarded.");
	gameObjects.push( thirdMemoryNotification );

	var okButton = new TextButton(new Vector2(canvas.width/2, 200), 240, 80, "OK", "#141414", "#FFFFFF");
	okButton.onClick = function(){firstMemory = false; thirdMemoryNotification.kill(); this.kill(); highlighter.unHighlight("memory")};
	gameObjects.push(okButton);

	highlighter.highlight("memory");
	thirdMemoryNotification.isHighlighted = true;
	okButton.isHighlighted = true;
}

function firstPolygonNotification(){
	var firstPolygonNotification = new Notification("You have created your first polygon! Find the other person to name the new polygon. You must enter the same name to finish the creation process.");
	gameObjects.push( firstPolygonNotification );

	var okButton = new TextButton(new Vector2(canvas.width/2, 200), 240, 80, "OK", "#141414", "#FFFFFF");
	okButton.onClick = function(){firstPolygon = false; firstPolygonNotification.kill(); this.kill(); highlighter.unHighlight();};
	gameObjects.push(okButton);

	highlighter.highlight();
	firstPolygonNotification.isHighlighted = true;
	okButton.isHighlighted = true;
}

function wrongNameNotification(){
	var wrongNameNotification = new Notification("The name you entered did not match!");
	gameObjects.push(wrongNameNotification);

	var okButton = new TextButton(new Vector2(canvas.width/2, 200), 240, 80, "OK", "#141414", "#FFFFFF");
	okButton.onClick = function(){wrongNameNotification.kill(); this.kill(); highlighter.unHighlight();};
	gameObjects.push(okButton);

	highlighter.highlight();
	wrongNameNotification.isHighlighted = true;
	okButton.isHighlighted = true;
}