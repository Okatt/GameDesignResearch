//*****************************************************************************************
//	Player
//*****************************************************************************************

function Player(id, position){
	this.type = "Player";
	this.isAlive = true;
	this.matched = false;

	// Physics
	this.position = position;
	this.previousPos = this.position.clone();

	// Data
	this.id = id;

	this.kill = function(){
		this.isAlive = false;
	}

	this.update = function(){
		this.previousPos = this.position.clone();
	}

	this.render = function(lagOffset){
		var drawX = this.previousPos.x + ((this.position.x-this.previousPos.x)*lagOffset);
		var drawY = this.previousPos.y + ((this.position.y-this.previousPos.y)*lagOffset);

		// Render
		
	}
}