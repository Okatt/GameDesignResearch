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


function BubbleButton(position, radius, emoteIndex, bgColor){
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

	this.emoteIndex = emoteIndex;
	this.emote = new Sprite(spritesheet_emotes, this.emoteIndex*200, 0, 200, 300);

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
	this.onClick = function(){
		socket.emit('pressedEmote', this.emoteIndex, playerId, matchId);
	};

	// Update
	this.update = function(){
		this.mouseOver = false;
		this.isPressed = false;

		// Check if the button is not disabled
		if(!this.isDisabled){
			// Check if the mouse is hovering over the button
			//this.mouseOver = checkPointvsAABB(new Vector2(mouse.x, mouse.y), this.getHitbox());
			
			// Call the onClick function when the button is pressed
			if(checkPointvsCC(new Vector2(mouse.x, mouse.y), this.getHitbox()) && mouse.buttonState.leftClick && !previousMouse.buttonState.leftClick){
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

		//emote
		this.emote.draw(ctx, drawX, drawY);
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
			if(memoryTiles[i].isRevealed && memoryTiles[i].number !== this.number && memoryTiles[i].index === this.index && memoryTiles[i].value === this.value){
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
		socket.emit('changeTurn', playerId, matchId);
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

		//TODO if mtm = true, tile should ease to the middle of the screen and then call kill() when it arrives
		if(this.mtm){
			var d = this.position.getVectorTo(new Vector2(canvas.width/2, canvas.height/2));

			if(d.length() >= 0.5){
				d.multiply(0.1);
				this.position.add(d);
			}else{ this.kill(); }
		}		

		// Check if the button is not disabled
		if(!this.isDisabled && !this.isRevealed && turnPlayer){
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