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
	this.isFollowing = player;
	this.isSolid = false;
	this.isDynamic = true;

	this.eyeTimer = 0;

	this.drawEmote = false;
	this.emoteTimer = 0;
	this.emoteIndex;
	this.emoteSprite;

	this.hasCrown = false;

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
			if(this !== gameObjects[i]){
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

		if(this.drawEmote){this.emoteTimer -= UPDATE_DURATION/1000;}
		if(this.emoteTimer < 0){this.drawEmote = false;}

		this.depth = canvas.height-this.position.y;

		if(this.isFollowing){ this.follow(); }
		this.avoidObstacles();
	}

	this.render = function(lagOffset){
		var drawX = this.previousPos.x + ((this.position.x-this.previousPos.x)*lagOffset);
		var drawY = this.previousPos.y + ((this.position.y-this.previousPos.y)*lagOffset);

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

		if(this.drawEmote){
			this.emoteSprite.draw(ctx, drawX, drawY-70);
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
	}
}