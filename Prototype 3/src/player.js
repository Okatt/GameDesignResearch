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
