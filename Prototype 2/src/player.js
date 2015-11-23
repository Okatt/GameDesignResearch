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
	this.width = 60;
	this.height = 30;
	this.drag = 0.95;

	// Graphics
	this.depth = canvas.height-this.position.y;
	this.eyes = Math.floor(randomRange(0, 2.99))+1;
	this.body = new Sprite(spritesheet_characters, Math.floor(randomRange(0, 3.99))*120, Math.floor(randomRange(0, 4.99))*120, 120, 120, new Vector2(60, 120));

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
	this.addBaby = function(shapeIndex, colorIndex, eyes){
		var pos = this.position.clone();
		var offset = new Vector2(0, -60);
		offset.rotate(randomRange(0, 359));
		var b = new Baby(new Vector2(pos.x+offset.x, pos.y+offset.y), this, shapeIndex, colorIndex, eyes);

		gameObjects.push(b);
	}

	this.update = function(){
		// Timer
		this.timer -= UPDATE_DURATION/1000;
		if(this.timer < 0){this.timer = 0;}

		this.depth = canvas.height-this.position.y;

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

		// Body
		this.body.draw(ctx, drawX, drawY);

		// Eyes
		if(this.eyes === 1){ drawCircle(ctx, drawX, drawY-50, 25, true, "#FFFFFF", 1); drawCircle(ctx, drawX+randomRange(0, 2), drawY-50+randomRange(0, 2), 22, true, "#323232", 1); }
		else if(this.eyes === 2){ 
			drawCircle(ctx, drawX-22, drawY-50, 20, true, "#FFFFFF", 1); drawCircle(ctx, drawX-22+randomRange(0, 2), drawY-50+randomRange(0, 2), 17, true, "#323232", 1);
			drawCircle(ctx, drawX+22, drawY-50, 20, true, "#FFFFFF", 1); drawCircle(ctx, drawX+22+randomRange(0, 2), drawY-50+randomRange(0, 2), 17, true, "#323232", 1);
		}
		else{
			drawCircle(ctx, drawX, drawY-74, 18, true, "#FFFFFF", 1); drawCircle(ctx, drawX+randomRange(0, 2), drawY-74+randomRange(0, 2), 15, true, "#323232", 1);
			drawCircle(ctx, drawX-22, drawY-38, 18, true, "#FFFFFF", 1); drawCircle(ctx, drawX-22+randomRange(0, 2), drawY-38+randomRange(0, 2), 15, true, "#323232", 1);
			drawCircle(ctx, drawX+22, drawY-38, 18, true, "#FFFFFF", 1); drawCircle(ctx, drawX+22+randomRange(0, 2), drawY-38+randomRange(0, 2), 15, true, "#323232", 1);
		}		

		// Hitbox (debug)
		//var h = this.getHitbox();
		//drawRectangle(ctx, h.x, h.y, h.width, h.height, true, color.GREEN, 0.5);
	}
}