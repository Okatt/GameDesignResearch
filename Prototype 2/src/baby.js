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
	this.depth = canvas.height-this.position.y;
	this.body = new Sprite(spritesheet_characters_s, Math.floor(randomRange(0, 3.99))*60, 0, 60, 60, new Vector2(30, 60));
	
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

	this.update = function(){
		this.depth = canvas.height-this.position.y;

		if(this.isFollowing){ this.follow(); }
		this.avoidObstacles();
	}

	this.render = function(lagOffset){
		var drawX = this.previousPos.x + ((this.position.x-this.previousPos.x)*lagOffset);
		var drawY = this.previousPos.y + ((this.position.y-this.previousPos.y)*lagOffset);

		// Render
		this.body.draw(ctx, drawX, drawY);
		//drawRectangle(ctx, drawX-this.width/2, drawY-this.height/2, this.width, this.height, true, color.WHITE, 1);
	}
}