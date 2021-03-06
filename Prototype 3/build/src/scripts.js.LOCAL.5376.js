//*****************************************************************************************
//	Announcements
//*****************************************************************************************

// Announcement Manager
function AnnouncementManager(){
	this.isAlive = true;
	this.type = "AnnouncementManager";

	// Positioning
	this.position = new Vector2(canvas.width/2, canvas.height-20);
	this.previousPos = this.position.clone();
	this.width = canvas.width;
	this.height = 40;

	// Graphics
	this.depth = -2000;
	this.fontSize = 28;

	// Data
	this.queue = [];
	this.lastMessage = false;
	this.defaultMessage = "JOIN THE PARTY AT  polygonpals.tk";
	this.scrollSpeed = 5;
	this.isSolid = false;
	this.isDynamic = false;

	this.announce = function(message){
		var m = " "+message+" ";
		var separator = "  ·  ";
		this.queue.push(m);
		this.queue.push(separator);
	}

	this.nextMessage = function(){
		if(this.queue.length >= 1){
			this.lastMessage = new Announcement(new Vector2(this.position.x+this.width/2, this.position.y+10), this.scrollSpeed, this.fontSize, this.queue[0]);
			gameObjects.push(this.lastMessage);

			// Remove the message from the queue
			this.queue.splice(0, 1);
		}	
	}

	this.update = function(){
		if(!this.lastMessage){
			if(this.queue.length === 0){this.announce(this.defaultMessage);}
			this.nextMessage();
		}else if(this.lastMessage.position.x+this.lastMessage.measureTextWidth() <= canvas.width){
			if(this.queue.length === 0){this.announce(this.defaultMessage);}
			this.nextMessage();
		}
	}

	this.render = function(lagOffset){
		var drawX = this.previousPos.x + ((this.position.x-this.previousPos.x)*lagOffset);
		var drawY = this.previousPos.y + ((this.position.y-this.previousPos.y)*lagOffset);

		// Text bar
		drawRectangle(ctx, drawX-this.width/2, drawY-this.height/2, this.width, this.height, true, color.BLACK, 0.3);
	}
}

// Announcement
function Announcement(position, speed, fontSize, message){
	this.isAlive = true;
	this.type = "Announcement";

	// Positioning
	this.position = position;
	this.previousPos = this.position.clone();
	this.velocity = new Vector2(-speed, 0);
	
	// Graphics
	this.depth = -2001;
	this.font = fontSize+"px Righteous";

	// Measures the text width in pixels
	this.measureTextWidth = function(){
		ctx.font = this.font;
		var metrics = ctx.measureText(this.message);
		return metrics.width;
	};

	// Data
	this.message = message;
	this.isSolid = false;
	this.isDynamic = true;
	this.drag = 1;
	
	this.kill = function(){
		this.isAlive = false;
	}

	this.update = function() {
		if(this.position.x+this.measureTextWidth() <= 0){
			this.kill();
		}
	}

	this.render = function(lagOffset){
		var drawX = this.previousPos.x + ((this.position.x-this.previousPos.x)*lagOffset);
		var drawY = this.previousPos.y + ((this.position.y-this.previousPos.y)*lagOffset);

		ctx.font = this.font;
		ctx.fillStyle = "#FFFFFF";
		ctx.textAlign = "left";
		ctx.fillText(this.message, drawX, drawY);
	}
}
//*****************************************************************************************
//	Baby
//*****************************************************************************************

function Baby(position, player, shapeIndex, colorIndex, eyes){
	this.type = "Baby";
	this.isAlive = true;
	
	// Physics
	this.position = position;
	this.previousPos = this.position.clone();
	this.velocity = new Vector2(0, 0);
	this.width = 20;
	this.height = 20;
	this.drag = 0.99;

	// Graphics
	this.depth = canvas.height-this.position.y;
	this.eyes = eyes;
	this.shape = shapeIndex;
	this.color = colorIndex;
	this.body = new Sprite(spritesheet_characters_s, shapeIndex*60, colorIndex*60, 60, 60, new Vector2(30, 60));
	
	// Data
	this.state = "";
	this.isFollowing = player;
	this.isSolid = false;
	this.isDynamic = true;

	this.eyeTimer = 0;

	this.drawEmote = false;
	this.emoteTimer = 0;
	this.emoteIndex;
	this.emoteSprite;

	this.moving = true;

	if(player !== null){
		this.hasCrown = player.hasCrown;
	}
	else {
		this.hasCrown = false;
	}
	

	this.kill = function(){
		this.isAlive = false;
	}

	this.getHitbox = function(){
		return new AABB(this.position.x - this.width/2, this.position.y - this.height/2, this.width, this.height);
	}

	// Adds extra velocity to avoid obstacles
	this.avoidObstacles = function(){
		var v = new Vector2(0, 0);
		for (var i = 0; i < gameObjects.length; i++) {
			if(this !== gameObjects[i] && gameObjects[i].position !== undefined){
				var dist = this.position.getVectorTo(gameObjects[i].position);
				var dl = dist.length();
				if(dl < 30){
					// If the obstacle is closer it has more inpact on the extra velocity
					v.x -= dist.x*(30/dl); 
					v.y -= dist.y*(30/dl);

					v.normalize();
					v.multiply(0.25);
					this.velocity.add(v);
				}
			}
		}		
	};

	this.follow = function(){
		var dist = this.position.getVectorTo(this.isFollowing.position);
		if(dist.length() <= 20){
			dist.normalize();
			this.velocity.x += -dist.x*0.4;
			this.velocity.y += -dist.y*0.2;
		}else if(dist.length() >= 60){
			dist.normalize();
			this.velocity.x += dist.x*0.4;
			this.velocity.y += dist.y*0.2;
		}else{
			if(Math.abs(this.isFollowing.position.x - this.position.x) < 100)this.velocity.x -= Math.sign(dist.x)*0.2;
			if(Math.abs(this.isFollowing.position.y - this.position.y) > 100){this.velocity.y += Math.sign(dist.y)*0.2;}
		}
	}

	this.displayEmote = function(emoteID){
		this.emoteTimer = 2;
		this.emoteIndex = emoteID;
		//change emoteindex * 125 to new width of spritesheet/6
		this.emoteSprite = new Sprite(spritesheet_emotes_small, this.emoteIndex*100, 0, 100, 150);
		this.drawEmote = true;
	}

	this.update = function(){
		this.eyeTimer -= UPDATE_DURATION/1000;

		if(this.eyeTimer < 0){this.eyeTimer = 0;}

		if(this.eyeTimer === 0){
			this.eyeTimer = randomRange(3, 8);
		}
		if(this.moving){
			if(this.drawEmote){this.emoteTimer -= UPDATE_DURATION/1000;}
			if(this.emoteTimer < 0){this.drawEmote = false;}

			this.depth = canvas.height-this.position.y;

			if(this.isFollowing){ this.follow(); }
			this.avoidObstacles();
		}
	}

	this.render = function(lagOffset){
		var drawX = this.previousPos.x + ((this.position.x-this.previousPos.x)*lagOffset) - camera.interpolatedPos().x;
		var drawY = this.previousPos.y + ((this.position.y-this.previousPos.y)*lagOffset) - camera.interpolatedPos().y;
		
		// If avatar
		if(this.state === "AVATAR"){
			if(babyName !== undefined && babyName !== null){
				ctx.font = "40px Righteous";
				ctx.fillStyle = "#FFFFFF";
				ctx.textAlign = "center";
				ctx.fillText(babyName, drawX, drawY-this.height-40);
			}
		}

		// Body
		this.body.draw(ctx, drawX, drawY);

		if(this.eyeTimer >= 0.1){
			if(this.eyes === 1){ drawCircle(ctx, drawX, drawY-26, 14, true, "#FFFFFF", 1); drawCircle(ctx, drawX+randomRange(0, 2), drawY-26+randomRange(0, 2), 11, true, "#323232", 1); }
			else if(this.eyes === 2){ 
				drawCircle(ctx, drawX-10, drawY-24, 10, true, "#FFFFFF", 1); drawCircle(ctx, drawX-10+randomRange(0, 2), drawY-24+randomRange(0, 2), 7, true, "#323232", 1);
				drawCircle(ctx, drawX+10, drawY-24, 10, true, "#FFFFFF", 1); drawCircle(ctx, drawX+10+randomRange(0, 2), drawY-24+randomRange(0, 2), 7, true, "#323232", 1);
			}
			else{
				drawCircle(ctx, drawX, drawY-38, 8, true, "#FFFFFF", 1); drawCircle(ctx, drawX+randomRange(0, 2), drawY-38+randomRange(0, 2), 5, true, "#323232", 1);
				drawCircle(ctx, drawX-10, drawY-20, 8, true, "#FFFFFF", 1); drawCircle(ctx, drawX-10+randomRange(0, 2), drawY-20+randomRange(0, 2), 5, true, "#323232", 1);
				drawCircle(ctx, drawX+10, drawY-20, 8, true, "#FFFFFF", 1); drawCircle(ctx, drawX+10+randomRange(0, 2), drawY-20+randomRange(0, 2), 5, true, "#323232", 1);
			}
		}

		if(this.hasCrown){
			if(this.eyes === 1){
				crownSpriteSmall.draw(ctx, drawX, drawY-55);
			}
			else if(this.eyes === 2){
				crownSpriteSmall.draw(ctx, drawX, drawY-55);
			}
			else {
				crownSpriteSmall.draw(ctx, drawX, drawY-65);
			}
		}

		if(this.drawEmote){
			this.emoteSprite.draw(ctx, drawX, drawY-100);
		}
	}
}
//*****************************************************************************************
//	Button
//*****************************************************************************************

function TextButton(position, width, height, text, bgColor, textColor){
	this.type = "TextButton";
	this.isAlive = true;
	
	// Positioning
	this.position = position;
	this.previousPos = this.position.clone();
	this.width = width;
	this.height = height;

	// Graphics
	this.depth = -2001;
	this.bgColor = bgColor;
	this.bgAlpha = 1;
	this.text = text;
	this.textColor = textColor;
	this.textHoverColor = color.BLACK;

	// State
	this.mouseOver = false;
	this.isPressed = false;
	this.isToggled = false;
	this.isDisabled = false;
	this.isVisible = true;
	this.isHighlighted = false;

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

		if(this.isHighlighted){
			this.depth = highlighter.depth-3;
		}
		else {
			this.depth = -2001;
		}

		// Check if the button is not disabled
		if(!this.isDisabled && (!highlighted || this.isHighlighted) ){
			// Check if the mouse is hovering over the button
			//this.mouseOver = checkPointvsAABB(new Vector2(mouse.x, mouse.y), this.getHitbox());
			
			// Call the onClick function when the button is pressed
			if(checkPointvsAABB(new Vector2(mouse.x, mouse.y), this.getHitbox()) && mouse.buttonState.leftClick && !previousMouse.buttonState.leftClick && !clicked){
				console.log("Pressed");
				this.isPressed = true;
				clicked = true;
				this.onClick();
			}
		}
	};

	// Render
	this.render = function(lagOffset){
		if(this.isVisible){
		var drawX = this.previousPos.x + ((this.position.x-this.previousPos.x)*lagOffset);
		var drawY = this.previousPos.y + ((this.position.y-this.previousPos.y)*lagOffset);

		// Shadow
		drawRectangle(ctx, drawX-this.width/2+4, drawY-this.height/2+4, this.width, this.height, true, color.BLACK, 0.3);

		// Background
		if(this.isDisabled){
			drawRectangle(ctx, drawX-this.width/2, drawY-this.height/2, this.width, this.height, true, color.DARK_GREY, this.bgAlpha);
		}else{
			drawRectangle(ctx, drawX-this.width/2, drawY-this.height/2, this.width, this.height, true, this.bgColor, this.bgAlpha);
		}

		// Text
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		if(!this.mouseOver){drawText(ctx, drawX, drawY-this.height/2+40, this.width, 40, this.text, "Righteous", 40, this.textColor, 1);}
		else{drawText(ctx, drawX, drawY-this.height/2+40, this.width, 40, this.text, "Righteous", 40, this.textHoverColor, 1);} // Super diry hack for good text positioning on button TODO: revise later
		ctx.textBaseline = "alphabetic";
		}
	};
}


function BubbleButton(position, radius, bgColor, sprite){
	this.type = "BubbleButton";
	this.isAlive = true;
	
	// Positioning
	this.position = position;
	this.previousPos = this.position.clone();
	this.radius = radius;

	// Graphics
	this.depth = 0;
	this.bgColor = bgColor;
	this.bgAlpha = 1;
	this.sprite = sprite;

	// State
	this.mouseOver = false;
	this.isPressed = false;
	this.isToggled = false;
	this.isDisabled = false;
	this.isVisible = true;
	this.isHighlighted = false;

	// Destroys the object (removes it from gameObjects)
	this.kill = function(){
		this.unfocus();
		this.isAlive = false;
	};

	// Returns the hitbox
	this.getHitbox = function(){
		return new CC(this.position.x, this.position.y, this.radius);
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
	this.onClick = function(){};

	// Update
	this.update = function(){
		this.mouseOver = false;
		this.isPressed = false;

		if(this.isHighlighted){
			this.depth = highlighter.depth-3;
		}
		else {
			this.depth = -2001;
		}

		// Check if the button is not disabled
		if(!this.isDisabled && highlighted === false){
			// Check if the mouse is hovering over the button
			//this.mouseOver = checkPointvsAABB(new Vector2(mouse.x, mouse.y), this.getHitbox());
			
			// Call the onClick function when the button is pressed
			if(checkPointvsCC(new Vector2(mouse.x+camera.position.x, mouse.y+camera.position.y), this.getHitbox()) && mouse.buttonState.leftClick && !previousMouse.buttonState.leftClick){
				console.log("Pressed");
				this.isPressed = true;
				this.onClick();
			}
		}
	};

	// Render
	this.render = function(lagOffset){
		if(this.isVisible){
		var drawX = this.previousPos.x + ((this.position.x-this.previousPos.x)*lagOffset) - camera.interpolatedPos().x;
		var drawY = this.previousPos.y + ((this.position.y-this.previousPos.y)*lagOffset) - camera.interpolatedPos().y;

		// Background
		drawCircle(ctx, drawX, drawY, this.radius, true, this.bgColor, this.bgAlpha);

		// Sprite
		this.sprite.draw(ctx, drawX, drawY);
		}
	};
}

function MemoryButton(position, width, height, index, value, number, bgColor){
	this.type = "MemoryButton";
	this.isAlive = true;
	
	// Positioning
	this.position = position;
	this.previousPos = this.position.clone();
	this.width = width;
	this.height = height;

	//variables
	this.index = index;
	this.value = value;
	this.number = number;

	// Graphics
	this.depth = 0;
	this.bgColor = bgColor;
	this.bgAlpha = 1;

	// State
	this.mouseOver = false;
	this.isPressed = false;
	this.isToggled = false;
	this.isDisabled = false;
	this.isVisible = true;
	this.isRevealed = false;
	this.startURtimer = false;
	this.unrevealTimer = 0;
	this.mtm = false;
	this.isHighlighted = false;

	//sprite
	this.card = new Sprite(memory_cards, 100*this.value, 100*this.index, 100, 100);
	this.cardBack = new Sprite(memory_cards, 0, 100*2, 100, 100);

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
		this.isRevealed = true;
		socket.emit('tileFlipped', matchId, this.number);
		flips++;
		if(flips >= 2){
			this.checkMatch();
		}
	};

	this.reveal = function(){
		this.isRevealed = true;
	};

	this.unReveal = function(){
		this.isRevealed = false;
	};

	this.delayedUnreveal = function(){
		this.startURtimer = true;
		this.unrevealTimer = 1;
	};

	this.checkMatch = function(){
		for(var i = 0; i < memoryTiles.length; i++){
			if(memoryTiles[i].startURtimer === false && memoryTiles[i].isRevealed && memoryTiles[i].number !== this.number && memoryTiles[i].index === this.index && memoryTiles[i].value === this.value){
				socket.emit('memoryMatch', memoryTiles[i], this, matchId, playerId, this.index);
				flips = 0;
				return;
			}
		}
		flips = 0;
		for(var i = 0; i < memoryTiles.length; i++){
			if(memoryTiles[i].isRevealed){
				socket.emit('delayedUnreveal', memoryTiles[i].number, matchId, playerId);
			}
		}
		if(turnPlayer){
			turnTimer = 1;
		}
		turnPlayer = false;
	};

	// Update
	this.update = function(){
		// Needed for interpolation
		this.previousPos = this.position.clone();

		this.mouseOver = false;
		this.isPressed = false;

		if(this.startURtimer){this.unrevealTimer -= UPDATE_DURATION/1000;
		if(this.unrevealTimer < 0){this.startURtimer = false; this.unReveal();}
		}

		if(this.isHighlighted){
			this.depth = highlighter.depth-1;
		}
		else {
			this.depth = -2001;
		}

		//TODO if mtm = true, tile should ease to the middle of the screen and then call kill() when it arrives
		if(this.mtm){
			var d = this.position.getVectorTo(new Vector2(canvas.width/2, canvas.height/2));

			if(d.length() >= 0.5){
				d.multiply(0.1);
				this.position.add(d);
			}else{ this.kill(); }
		}		
		// Check if the button is not disabled (hack this.isHighlighted must be false so the player can not interact with the tiles during the tuttorial)
		if(!highlighted && !this.isHighlighted && !this.isDisabled && !this.isRevealed && turnPlayer){
			// Check if the mouse is hovering over the button
			//this.mouseOver = checkPointvsAABB(new Vector2(mouse.x, mouse.y), this.getHitbox());
			
			// Call the onClick function when the button is pressed
			if(checkPointvsAABB(new Vector2(mouse.x, mouse.y), this.getHitbox()) && mouse.buttonState.leftClick && !previousMouse.buttonState.leftClick){
				console.log("Pressed");
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

			if(!this.mtm){drawRectangle(ctx, drawX-this.width/2+5, drawY-this.height/2+5, this.width, this.height, true, color.BLACK, 0.3);}

			if(this.isRevealed){
				this.card.draw(ctx, drawX, drawY);
			}
			else {
				this.cardBack.draw(ctx, drawX, drawY);
			}
		}
	};
}
//*****************************************************************************************
//	Chest with accessories the player can buy and wear
//*****************************************************************************************

// Inventory chest
function Chest(position){
	this.type = "Chest";
	this.isAlive = true;
	
	// Physics
	this.position = position;
	this.previousPos = this.position.clone();
	this.width = 200;
	this.height = 200;

	// Graphics
	this.depth = canvas.height-this.position.y;
	this.sprite = new Sprite(spritesheet_environment, 1000, 200, 200, 200, new Vector2(100, 100), 2, 0, false);

	// Data
	this.isSolid = true;
	this.isDynamic = false;
	this.isOpen = false;

	this.itemButtons = [];

	this.kill = function(){
		this.isAlive = false;
	};

	this.getHitbox = function(){
		return new AABB(this.position.x - this.width/2, this.position.y - this.height/2, this.width, this.height);
	}

	this.open = function(){
		this.sprite.frameIndex = 1;
		this.isOpen = true;

		var items = 6;
		var nextPos;
		for (var i = 0; i < items; i++) {

			nextPos = new Vector2(0, -140);
			var r = i*(360/items);							
			nextPos.rotate(r);

			var b = new BubbleButton(new Vector2(this.position.x+nextPos.x, this.position.y+nextPos.y), 60, "#FFFFFF", new Sprite(spritesheet_emotes, i*150, 0, 150, 225));
			this.itemButtons.push(b);
			gameObjects.push(b);
		}
	};

	this.close = function(){
		this.sprite.frameIndex = 0;
		this.isOpen = false;

		for (var i = 0; i < this.itemButtons.length; i++) {
			this.itemButtons[i].kill();
		}
		this.itemButtons = [];
	};

	this.update = function(){
		var hitbox = this.getHitbox(); // Hitbox for click detection, adjust later when the final art is implemented
		if(checkPointvsAABB(new Vector2(mouse.x+camera.position.x, mouse.y+camera.position.y), hitbox) && mouse.buttonState.leftClick && !previousMouse.buttonState.leftClick){
			console.log("chest pressed");
			if(this.isOpen){ this.close(); }
			else{ this.open(); }
		}

		for (var i = 0; i < this.itemButtons.length; i++) {
			if(this.itemButtons[i].isPressed){
				// buy/wear item
			}
		}
	};

	this.render = function(lagOffset){
		var drawX = this.previousPos.x + ((this.position.x-this.previousPos.x)*lagOffset) - camera.interpolatedPos().x;
		var drawY = this.previousPos.y + ((this.position.y-this.previousPos.y)*lagOffset) - camera.interpolatedPos().y;

		// Image
		this.sprite.draw(ctx, drawX, drawY);

		// Hitbox (debug)
		var h = this.getHitbox();
		drawRectangle(ctx, h.x - camera.interpolatedPos().x, h.y - camera.interpolatedPos().y, h.width, h.height, true, color.GREEN, 0.5);
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
      rejectMatch();
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

function rejectMatch(){
  // acceptButton.isVisible = false;
  // acceptButton.isDisabled = true;

  // rejectButton.isVisible = false;
  // rejectButton.isDisabled = true;

  socket.emit('rejectedMatch', playerId, potentialMatchId);
}

function confirmCode(){
  babyName = prompt('Choose a name for your polygon:');
  if(babyName !== null){
      socket.emit('enteredName', playerId, matchId, babyName);
  }
}

function share(){
  socket.emit('shared', playerId);
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

//*****************************************************************************************
//	Data collection
//*****************************************************************************************

// Logs a label to identify the test results
function startLog(){
	var dataString = "#### New data Log ####";
	socket.emit('logData', dataString);
}

// Logs data with a timestamp label
function logData(){
	socket.emit('setServerTime', getTimeString(time));

	var dataString = "Time: "+getTimeString(time)+" - Players online: "+getPlayersOnline();
	socket.emit('logData', dataString);
}

// Get the amount of players currently playing
function getPlayersOnline(){
	var c = 0;
	for (var i = 0; i < gameObjects.length; i++){
		if(gameObjects[i].type === "Player"){
			c++;
		}
	}
	return c;
}

function getTimeString(seconds){
	var t, h, m, s;
	var ts = "";

	// Get the hours, minutes and seconds
	t = time;
	h = Math.floor(t/3600); t -= h*3600;
	m = Math.floor(t/60); t -= m*60;
	s = t;

	if(h < 10){ ts += "0"+h; }else{ ts += h; } ts += ":";
	if(m < 10){ ts += "0"+m; }else{ ts += m; } ts += ":";
	if(s < 10){ ts += "0"+s; }else{ ts += s; }
	return ts;
}
//*****************************************************************************************
//	Graphics
//*****************************************************************************************

// Colors
var color = {BLACK: "#000000", DARK_GREY: "#323232", WHITE: "#FFFFFF", GROUND: "#669D6B", SKY: "#4C3C37", BLUE: "#0090FF", GREEN: "#7AFF2D", PINK: "#F319FF", RED: "#FF0000", YELLOW: "#FFFF00"};
var colorArray = [color.BLACK, color.DARK_GREY, color.WHITE, color.PINK, color.RED, color.YELLOW];


// Camera
function Camera(position){
	this.position = new Vector2(position.x-canvas.width/2, position.y-canvas.height/2);
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
	this.isPaused = false;

	this.reset = function(){
		this.frameIndex = 0;
		this.isDone = false;
	};

	this.play = function(){
		this.isPaused = false;
	};

	this.pause = function(){
		this.isPaused = true;
	};

	this.update = function(){
		if(!this.isPaused){
			// We want to maintain the correct frametime thus we add fps/UPS (updates per second)
			this.frameIndex = (this.frameIndex+(UPDATE_DURATION/1000*this.fps));
			if(this.frameIndex > this.frameCount){
				if(this.loop){
					this.frameIndex = this.frameIndex % this.frameCount;
				}else{
					this.frameIndex = this.frameCount-1; this.isDone = true;
				}
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

function Highlighter(){
	this.type = "Highlighter";
	this.isAlive = true;
	this.isVisible = false;
	this.depth = -3000;

	this.kill = function(){
		this.isAlive = false;
	}

	this.highlight = function(arg){
		if(arg === undefined){
			this.isVisible = true;
			highlighted = true;
			return;
		}

		switch(arg){
			case "player":
				playerAvatar.isHighlighted = true;
				break;
			case "match":
				matchAvatar.isHighlighted = true;
				break;
			case "emotes":
				for(var i = 0; i < playerAvatar.emoteButtons.length; i++){
					playerAvatar.emoteButtons[i].isHighlighted = true;
				}	
				break;
			case "memory":
				for(var i = 0; i < memoryTiles.length; i++){
					memoryTiles[i].isHighlighted = true;
				}
			default:
				console.log("couldnt highlight " +arg);
				break;
		}
		this.isVisible = true;
		highlighted = true;
	}

	this.unHighlight = function(arg){
		if(arg === undefined){
			for (var i = 0; i < gameObjects.length; i++) {
				if(gameObjects[i].isHighlighted !== undefined){
					gameObjects[i].isHighlighted = false;
				}
			}

			this.isVisible = false;
			highlighted = false;
			return;
		}

		switch(arg){
			case "player":
				playerAvatar.isHighlighted = false;
			case "match":
				matchAvatar.isHighlighted = false;
				break;
			case "emotes":
				for(var i = 0; i < playerAvatar.emoteButtons.length; i++){
					playerAvatar.emoteButtons[i].isHighlighted = false;
				}	
				break;
			case "memory":
				for(var i = 0; i < memoryTiles.length; i++){
					memoryTiles[i].isHighlighted = false;
				}
			default:
				console.log("couldnt unhighlight " +arg);
				break;
		}
		this.isVisible = false;
		highlighted = false;
	}

	this.update = function(){
	}

	this.render = function(lagOffset){
		if(this.isVisible){
			drawRectangle(ctx, 0, 0, canvas.width, canvas.height, true, color.BLACK, 0.5);
		}
	}
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

	canvas.addEventListener('mouseup', function(e){
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
    	mouse.x = x-rect.left;
    	mouse.y = y-rect.top;
	}, false);

	canvas.addEventListener('touchstart', function(e){
	    var t = e.changedTouches[0] // reference first touch point (ie: first finger)
	    var x = parseInt(t.clientX);
	    var y = parseInt(t.clientY);
	    e.preventDefault();
	    mouse.x = x; // 4px border
	   	mouse.y = y;
	   	mouse.buttonState.leftClick = true;

	   	console.log("touched at "+x+"   "+y);
	 }, false);

	canvas.addEventListener('touchend', function(e){
	    mouse.buttonState.leftClick = false;
	    e.preventDefault();
	    console.log("release touch");
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

	// shareButton = new TextButton(new Vector2(canvas.width/2, canvas.height-100), 100, 50, "SHARE", "#3C5899", "#FFFFFF");
	// shareButton.onClick = function(){share()};
	// gameObjects.push(shareButton);

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
	if(!object.isSolid){ return false; }
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
	if(!object.isSolid){ return false; }
	if(offset === undefined){offset = new Vector2(0, 0);}

	// Create a hitbox that includes the offset
	var hitbox = new AABB(object.position.x + offset.x - object.width/2, object.position.y + offset.y - object.height/2, object.width, object.height);

	// Check if the new hitbox is within the bounds
	return (hitbox.x < 0 || hitbox.x + hitbox.width > 1920 || hitbox.y < 1080-310 || hitbox.y + hitbox.height > 1080);
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

function Player(id, position, shape, color, eyes){
	this.type = "Player";
	this.isAlive = true;
	
	// Physics
	this.position = position;
	this.previousPos = this.position.clone();
	this.velocity = new Vector2(0, 0);
	this.width = 60;
	this.height = 30;
	this.drag = 0.95;

	// Graphics
	this.depth = canvas.height-this.position.y;
	this.body = new Sprite(spritesheet_characters, shape*120, color*120, 120, 120, new Vector2(60, 120));
	this.bodyLarge = new Sprite(spritesheet_characters_l, shape*300, color*300, 300, 300, new Vector2(150, 300));
	this.eyes = eyes;

	this.color = color;
	this.shape = shape;
	
	// Data
	this.justJoined = true;

	this.id = id;
	this.matched = false;
	this.withoutMatchTime = 0;	// the time that has elapsed since the last match, in seconds. (used for match making)
	this.isSolid = true;
	this.isDynamic = true;
	this.state = "IDLE"; // IDLE, MOVING
	this.isLarge = false;
	this.babies = [];

	this.emoteButtons = [];
	this.drawEmote = false;
	this.emoteTimer = 0;
	this.emoteIndex;
	this.emoteSprite;

	this.timer = 0;
	this.eyeTimer = 0;

	this.hasCrown = false;

	this.isHighlighted = false;

		this.unMatchButton =  new TextButton(this.position.clone(), 200, 60, "Unmatch?", "#FFFFFF", "#141414");
		gameObjects.push(this.unMatchButton);
		this.unMatchButton.onClick = function(){endMatch(); this.isVisible = false; this.isDisabled = true;};
		this.unMatchButton.isVisible = false;
		this.unMatchButton.isDisabled = true;

		this.showUnmatch = false;

	this.kill = function(){
		this.isAlive = false;
		for (var i = 0; i < this.babies.length; i++) {
			this.babies[i].kill();
		}
		this.unMatchButton.kill();
	}

	this.getHitbox = function(){
		return new AABB(this.position.x - this.width/2, this.position.y - this.height/2, this.width, this.height);
	}

	// Open the emotes menu
	this.openEmotes = function(){
		var emotes = 6;
		var nextPos;
		for (var i = 0; i < emotes; i++) {

			if(this.isLarge){ nextPos = new Vector2(0, -200);}
			else{nextPos = new Vector2(0, -140);}

			var r = i*(360/emotes);							
			nextPos.rotate(r);

			var b = new BubbleButton(new Vector2(this.position.x+nextPos.x, this.position.y-150+nextPos.y), 60, "#FFFFFF", new Sprite(spritesheet_emotes, i*150, 0, 150, 225));
			this.emoteButtons.push(b);
			gameObjects.push(b);
		}
		if(firstEmote){ firstEmoteNotification(); }
	}

	// Close the emotes menu
	this.closeEmotes = function(){
		for (var i = 0; i < this.emoteButtons.length; i++) {
			this.emoteButtons[i].kill();
		}
		this.emoteButtons = [];
	}

	this.displayEmote = function(emoteID){
		this.emoteTimer = 2;
		this.emoteIndex = emoteID;
		this.emoteSprite = new Sprite(spritesheet_emotes, this.emoteIndex*150, 0, 150, 225);
		this.drawEmote = true;
		this.closeEmotes();
		for (var i = 0; i < this.babies.length; i++) {
			this.babies[i].displayEmote(emoteID);
		}
	}

	this.getCrown = function(){
		if(this.state !== "AVATAR"){
			socket.emit('getCrown', this.id);
			if(matchId !== null){
				socket.emit('matchGotCrown', this.id);
			}
			else if(potentialMatchId !== null){
				socket.emit('matchGotCrown', this.id);
			}
		}
		this.hasCrown = true;
		for (var i = 0; i < this.babies.length; i++) {
			this.babies[i].hasCrown = true;
		}
	}

	this.loseCrown = function(){
		if(this.state !== "AVATAR"){
			socket.emit('loseCrown', this.id);
			if(matchId !== null){
				socket.emit('matchLostCrown', this.id);
			}
			else if(potentialMatchId !== null){
				socket.emit('matchLostCrown', this.id);
			}
		}
		this.hasCrown = false;
		for (var i = 0; i < this.babies.length; i++) {
			this.babies[i].hasCrown = false;
		}
	}

	// TODO clean up
	this.addBaby = function(shapeIndex, colorIndex, eyes){
		var pos = this.position.clone();
		var offset = new Vector2(0, -60);
		offset.rotate(randomRange(0, 359));
		var b = new Baby(new Vector2(pos.x+offset.x, pos.y+offset.y), this, shapeIndex, colorIndex, eyes);

		this.babies.push(b);
		gameObjects.push(b);
	}

	this.findMatch = function(){
		var bestMatch = false;
		for (var i = 0; i < gameObjects.length; i++) {
			if(gameObjects[i].type === "Player" && !gameObjects[i].justJoined && gameObjects[i].id !== this.id && !gameObjects[i].matched){
				if(!bestMatch){ bestMatch = gameObjects[i];	}
				else if(gameObjects[i].withoutMatchTime > bestMatch.withoutMatchTime){ bestMatch = gameObjects[i]; }
			}
		}
		if(bestMatch){ worldSeekMatch(this, bestMatch); }
	}

	this.openUnmatch = function(){
		this.unMatchButton.isVisible = !this.unMatchButton.isVisible;
		this.unMatchButton.isDisabled = !this.unMatchButton.isDisabled;
	}

	this.update = function(){
		// Timer
		this.timer -= UPDATE_DURATION/1000;
		if(this.timer < 0){this.timer = 0;}

		this.eyeTimer -= UPDATE_DURATION/1000;
		if(this.eyeTimer < 0){this.eyeTimer = 0;}

		if(this.eyeTimer === 0){
			this.eyeTimer = randomRange(3, 8);
		}

		if(this.drawEmote){this.emoteTimer -= UPDATE_DURATION/1000;}
		if(this.emoteTimer < 0){this.drawEmote = false;}

		if(isWorld){
			// Update the time since the last match up.
			if(!this.justJoined){ this.withoutMatchTime += UPDATE_DURATION/1000; }
			if(!this.matched && this.withoutMatchTime > 8){
				if(!this.justJoined){this.findMatch();}
			}
		}		

		if(this.isHighlighted){
			this.depth = highlighter.depth-1;
		}
		else {
			this.depth = canvas.height-this.position.y;
		}

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
			case "AVATAR":
			// TODO
				if(highlighted === false){
					if(this.id === playerId){
					var hitbox;

					if(this.isLarge){ hitbox = new AABB(this.position.x-150, this.position.y-300, 300, 300); }
					else{ hitbox = new AABB(this.position.x-60, this.position.y-120, 120, 120); /*Hitbox for click detection*/ }
					

					if(checkPointvsAABB(new Vector2(mouse.x+camera.position.x, mouse.y+camera.position.y), hitbox) && mouse.buttonState.leftClick && !previousMouse.buttonState.leftClick){
						console.log("player pressed");
						if(this.emoteButtons.length === 0){ this.openEmotes(); }
						else{ this.closeEmotes(); }
					}
					}
					else if(this.showUnmatch){
						var hitbox;

						if(this.isLarge){ hitbox = new AABB(this.position.x-150, this.position.y-300, 300, 300); }
						else{ hitbox = new AABB(this.position.x-60, this.position.y-120, 120, 120); /*Hitbox for click detection*/ }
					

						if(checkPointvsAABB(new Vector2(mouse.x+camera.position.x, mouse.y+camera.position.y), hitbox) && mouse.buttonState.leftClick && !previousMouse.buttonState.leftClick){
							console.log("match pressed");
							this.unMatchButton.position.x = this.position.x - camera.interpolatedPos().x;
							this.unMatchButton.position.y = this.position.y - camera.interpolatedPos().y + this.unMatchButton.height/2;
							this.unMatchButton.previousPos = this.unMatchButton.position.clone();
							this.openUnmatch();
						}	
					}

					for (var i = 0; i < this.emoteButtons.length; i++) {
						if(this.emoteButtons[i].isPressed){
							socket.emit('pressedEmote', i, playerId, matchId);
						}
					}	
				}
				break;
			default:
				console.log("Err - State evaluation error: "+this.state+" is not a valid state. Reference: "+this);
				break;
		}
	}

	this.render = function(lagOffset){
		var drawX = this.previousPos.x + ((this.position.x-this.previousPos.x)*lagOffset) - camera.interpolatedPos().x;
		var drawY = this.previousPos.y + ((this.position.y-this.previousPos.y)*lagOffset) - camera.interpolatedPos().y;

		// Body
		if(this.state === "AVATAR"){ this.bodyLarge.draw(ctx, drawX, drawY); }
		else{ this.body.draw(ctx, drawX, drawY); }

		// Debug
		// ctx.textAlign = "center";
		// ctx.textBaseline = "middle";
		// drawText(ctx, drawX, drawY-200, this.width, 24, this.withoutMatchTime+" sec", "Arial", 24, "#323232", 1);
		// ctx.textBaseline = "alphabetic";

		// Eyes
		if(this.eyeTimer >= 0.1){
			if(this.isLarge){
				// if(this.eyes === 1){ drawCircle(ctx, drawX, drawY+(4*2.5), (25*2.5), true, "#FFFFFF", 1); drawCircle(ctx, drawX+randomRange(0, 2), drawY+(4*2.5)+randomRange(0, 2), (22*2.5), true, "#323232", 1); }
				// else if(this.eyes === 2){ 
				// 	drawCircle(ctx, drawX-(22*2.5), drawY+(4*2.5), (20*2.5), true, "#FFFFFF", 1); drawCircle(ctx, drawX-(22*2.5)+randomRange(0, 2), drawY+(4*2.5)+randomRange(0, 2), (17*2.5), true, "#323232", 1);
				// 	drawCircle(ctx, drawX+(22*2.5), drawY+(4*2.5), (20*2.5), true, "#FFFFFF", 1); drawCircle(ctx, drawX+(22*2.5)+randomRange(0, 2), drawY+(4*2.5)+randomRange(0, 2), (17*2.5), true, "#323232", 1);
				// }else{
				// 	drawCircle(ctx, drawX, drawY-(14*2.5), (18*2.5), true, "#FFFFFF", 1); drawCircle(ctx, drawX+randomRange(0, 2), drawY-(14*2.5)+randomRange(0, 2), (15*2.5), true, "#323232", 1);
				// 	drawCircle(ctx, drawX-(22*2.5), drawY+(18*2.5), (18*2.5), true, "#FFFFFF", 1); drawCircle(ctx, drawX-(22*2.5)+randomRange(0, 2), drawY+(18*2.5)+randomRange(0, 2), (15*2.5), true, "#323232", 1);
				// 	drawCircle(ctx, drawX+(22*2.5), drawY+(18*2.5), (18*2.5), true, "#FFFFFF", 1); drawCircle(ctx, drawX+(22*2.5)+randomRange(0, 2), drawY+(18*2.5)+randomRange(0, 2), (15*2.5), true, "#323232", 1);
				// }
				if(this.eyes === 1){ drawCircle(ctx, drawX, drawY-(50*2.5), (25*2.5), true, "#FFFFFF", 1); drawCircle(ctx, drawX+randomRange(0, 2), drawY-(50*2.5)+randomRange(0, 2), (22*2.5), true, "#323232", 1); }
				else if(this.eyes === 2){ 
					drawCircle(ctx, drawX-(22*2.5), drawY-(50*2.5), (20*2.5), true, "#FFFFFF", 1); drawCircle(ctx, drawX-(22*2.5)+randomRange(0, 2), drawY-(50*2.5)+randomRange(0, 2), (17*2.5), true, "#323232", 1);
					drawCircle(ctx, drawX+(22*2.5), drawY-(50*2.5), (20*2.5), true, "#FFFFFF", 1); drawCircle(ctx, drawX+(22*2.5)+randomRange(0, 2), drawY-(50*2.5)+randomRange(0, 2), (17*2.5), true, "#323232", 1);
				}else{
					drawCircle(ctx, drawX, drawY-(74*2.5), (18*2.5), true, "#FFFFFF", 1); drawCircle(ctx, drawX+randomRange(0, 2), drawY-(74*2.5)+randomRange(0, 2), (15*2.5), true, "#323232", 1);
					drawCircle(ctx, drawX-(22*2.5), drawY-(38*2.5), (18*2.5), true, "#FFFFFF", 1); drawCircle(ctx, drawX-(22*2.5)+randomRange(0, 2), drawY-(38*2.5)+randomRange(0, 2), (15*2.5), true, "#323232", 1);
					drawCircle(ctx, drawX+(22*2.5), drawY-(38*2.5), (18*2.5), true, "#FFFFFF", 1); drawCircle(ctx, drawX+(22*2.5)+randomRange(0, 2), drawY-(38*2.5)+randomRange(0, 2), (15*2.5), true, "#323232", 1);
				}
			}else{
				if(this.eyes === 1){ drawCircle(ctx, drawX, drawY-50, 25, true, "#FFFFFF", 1); drawCircle(ctx, drawX+randomRange(0, 2), drawY-50+randomRange(0, 2), 22, true, "#323232", 1); }
				else if(this.eyes === 2){ 
					drawCircle(ctx, drawX-22, drawY-50, 20, true, "#FFFFFF", 1); drawCircle(ctx, drawX-22+randomRange(0, 2), drawY-50+randomRange(0, 2), 17, true, "#323232", 1);
					drawCircle(ctx, drawX+22, drawY-50, 20, true, "#FFFFFF", 1); drawCircle(ctx, drawX+22+randomRange(0, 2), drawY-50+randomRange(0, 2), 17, true, "#323232", 1);
				}else{
					drawCircle(ctx, drawX, drawY-74, 18, true, "#FFFFFF", 1); drawCircle(ctx, drawX+randomRange(0, 2), drawY-74+randomRange(0, 2), 15, true, "#323232", 1);
					drawCircle(ctx, drawX-22, drawY-38, 18, true, "#FFFFFF", 1); drawCircle(ctx, drawX-22+randomRange(0, 2), drawY-38+randomRange(0, 2), 15, true, "#323232", 1);
					drawCircle(ctx, drawX+22, drawY-38, 18, true, "#FFFFFF", 1); drawCircle(ctx, drawX+22+randomRange(0, 2), drawY-38+randomRange(0, 2), 15, true, "#323232", 1);
				}
			}
		}

		if(this.hasCrown){
			var om;
			om = this.isLarge ? 2.5 : 1;

			if(this.eyes === 1){
				crownSprite.draw(ctx, drawX+2, drawY-120*om);
			}
			else if(this.eyes === 2){
				crownSprite.draw(ctx, drawX+2, drawY-120*om);
			}
			else {
				crownSprite.draw(ctx, drawX+2, drawY-130*om);
			}
		}

		if(this.drawEmote){
			var om;
			om = this.isLarge ? 2.5 : 1;

			this.emoteSprite.draw(ctx, drawX, drawY-160*om);
		}

		// Hitbox (debug)
		//var h = this.getHitbox();
		//drawRectangle(ctx, h.x - camera.interpolatedPos().x, h.y - camera.interpolatedPos().y, h.width, h.height, true, color.GREEN, 0.5);
	}
}


function Pointer(target) {
	this.type = "Pointer";
	this.isAlive = true;
	
	// Physics
	this.target = target;
	this.position = this.target.position.clone();
	this.previousPos = this.position.clone();
	this.velocity = new Vector2(0, 0);
	this.offset = -350;
	this.min = this.offset;
	this.max = this.offset+10; // -130
	this.dir = 1;
	this.speed = 1;
	this.drag = 1;

	// Graphics
	this.depth = target.depth-0.1;
	this.sprite = new Sprite(memory_cards, 405, 205, 90, 90);

	// Data
	this.isSolid = false;
	this.isDynamic = true;

	console.log("pointer created");

	this.kill = function(){
		this.isAlive = false;	
	}

	this.changeTarget = function(newTarget){
		this.target = newTarget;
	}

	this.update = function(){
		this.depth = target.depth-0.1;

		if(this.target === undefined || !this.target.isAlive){this.kill();}

		// Velocity
		var d = this.position.getVectorTo(this.target.position);
		if(d.length() >= 1){
			this.velocity = new Vector2( d.x*0.1, d.y*0.1 );
		}else{ this.position = this.target.position.clone(); }

		// Animation
		if(this.dir === 1 && this.offset >= this.max){this.offset = this.max; this.dir = -1; this.speed = 0;}
		else if(this.dir === -1 && this.offset <= this.min){this.offset = this.min; this.dir = 1; this.speed = 1;}

		if(this.dir === 1){
			this.offset += this.speed;
			this.speed *= 1.2;
		}else{
			this.offset += ((this.min-0.5)-this.offset)*0.1;
		}
	}

	this.render = function(lagOffset){
		var drawX = this.previousPos.x + ((this.position.x-this.previousPos.x)*lagOffset) - camera.interpolatedPos().x;
		var drawY = this.previousPos.y + ((this.position.y-this.previousPos.y)*lagOffset) - camera.interpolatedPos().y;

		// Image
		this.sprite.draw(ctx, drawX, drawY+this.offset);
	}
}

//*****************************************************************************************
//	Environment
//*****************************************************************************************

function Prop(position, width, height, sprite){
	this.type = "Prop";
	this.isAlive = true;
	
	// Physics
	this.position = position;
	this.previousPos = this.position.clone();
	this.width = width;
	this.height = height;

	// Graphics
	this.depth = canvas.height-this.position.y;
	this.sprite = sprite;
	
	// Data
	if(this.width > 0 && this.height > 0){ this.isSolid = true;}
	else{this.isSolid = false;}	
	this.isDynamic = false;

	this.kill = function(){
		this.isAlive = false;
	}

	this.getHitbox = function(){
		return new AABB(this.position.x - this.width/2, this.position.y - this.height/2, this.width, this.height);
	}

	this.update = function(){
		this.previousPos = this.position.clone();
	}

	this.render = function(lagOffset){
		var drawX = this.previousPos.x + ((this.position.x-this.previousPos.x)*lagOffset) - camera.interpolatedPos().x;
		var drawY = this.previousPos.y + ((this.position.y-this.previousPos.y)*lagOffset) - camera.interpolatedPos().y;

		// Render
		this.sprite.draw(ctx, drawX, drawY);

		// Hitbox (debug)
		//var h = this.getHitbox();
		//drawRectangle(ctx, h.x - camera.interpolatedPos().x, h.y - camera.interpolatedPos().y, h.width, h.height, true, color.GREEN, 0.5);
	}
}
//*****************************************************************************************
//	Resources gathering objects/functions
//*****************************************************************************************

// ResourceNodeManager
function NodeSpawner(){
	this.type = "NodeSpawner";
	this.isAlive = true;

	this.nodes = [];

	this.kill = function(){
		this.isAlive = false;
	}

	this.spawnNew = function(){
		var n = new ResourceNode(new Vector2(canvas.width/2, canvas.height/2), this, 4, 1);

		this.nodes.push(n);
		gameObjects.push(n);
	}

	this.update = function(){
	}

	this.render = function(lagOffset){
	}
}
 
// ResourceNode
function ResourceNode(position, spawner, health, value){
	this.type = "ResourceNode";
	this.isAlive = true;
	
	// Physics
	this.position = position;
	this.previousPos = this.position.clone();
	this.width = 200;
	this.height = 200;

	// Graphics
	this.depth = canvas.height-this.position.y;
	this.body = new Sprite(spritesheet_environment, 1000, 0, 200, 200, new Vector2(100, 100), 5, 0, false);
	this.body.frameIndex = 0;

	this.isSolid = true;
	this.isDynamic = false;

	this.hits = 0;
	this.spawner = spawner;
	this.health = health;
	this.value = value;

	this.kill = function(){
		gems += this.value;
		this.spawner.spawnNew();
		this.isAlive = false;
	}

	this.getHitbox = function(){
		return new AABB(this.position.x - this.width/2, this.position.y - this.height/2, this.width, this.height);
	}

	this.damage = function(){
		if(this.hits < this.health){ this.hits++; this.body.frameIndex = this.hits;}
		else{ this.kill(); }
	}

	this.update = function(){
		this.depth = canvas.height-this.position.y;

		var hitbox = this.getHitbox() // Hitbox for click detection
			if(checkPointvsAABB(new Vector2(mouse.x+camera.position.x, mouse.y+camera.position.y), hitbox) && mouse.buttonState.leftClick && !previousMouse.buttonState.leftClick){
				this.damage();
		}
	}

	this.render = function(lagOffset){
		var drawX = this.previousPos.x + ((this.position.x-this.previousPos.x)*lagOffset) - camera.interpolatedPos().x;
		var drawY = this.previousPos.y + ((this.position.y-this.previousPos.y)*lagOffset) - camera.interpolatedPos().y;

		// Body
		this.body.draw(ctx, drawX, drawY);

		// Hitbox (debug)
		var h = this.getHitbox();
		drawRectangle(ctx, h.x - camera.interpolatedPos().x, h.y - camera.interpolatedPos().y, h.width, h.height, true, color.GREEN, 0.5);
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
