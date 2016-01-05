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