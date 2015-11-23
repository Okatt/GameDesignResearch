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

	this.update = function(){
		if(this.isFollowing){
			var dis = this.position.getVectorTo(this.isFollowing.position);
			if(dis.length() >= 40){
				dis.multiply(0.1);
				this.velocity.add(dis);
			}
		}
	}

	this.render = function(lagOffset){
		var drawX = this.previousPos.x + ((this.position.x-this.previousPos.x)*lagOffset);
		var drawY = this.previousPos.y + ((this.position.y-this.previousPos.y)*lagOffset);

		// Render
		drawRectangle(ctx, drawX-this.width/2, drawY-this.height/2, this.width, this.height, true, color.BLACK, 1);
	}
}