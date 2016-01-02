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
	return (hitbox.x < 0 || hitbox.x + hitbox.width > canvas.width || hitbox.y < 1080-310 || hitbox.y + hitbox.height > canvas.height);
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
