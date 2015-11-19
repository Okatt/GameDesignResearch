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
