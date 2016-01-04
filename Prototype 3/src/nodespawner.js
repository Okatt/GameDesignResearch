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