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
	this.isSolid = true;
	this.isDynamic = false;

	this.kill = function(){
		this.isAlive = false;
	}

	this.getHitbox = function(){
		return new AABB(this.position.x - this.width/2, this.position.y - this.height/2, this.width, this.height);
	}

	this.update = function(){

	}

	this.render = function(lagOffset){
		var drawX = this.previousPos.x + ((this.position.x-this.previousPos.x)*lagOffset);
		var drawY = this.previousPos.y + ((this.position.y-this.previousPos.y)*lagOffset);

		// Render
		this.sprite.draw(ctx, drawX, drawY);

		// Hitbox (debug)
		var h = this.getHitbox();
		drawRectangle(ctx, h.x, h.y, h.width, h.height, true, color.GREEN, 0.5);
	}
}