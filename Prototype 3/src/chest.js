//*****************************************************************************************
//	Chest with accessories the player can buy and wear
//*****************************************************************************************

// Inventory chest
function Chest(position){
	this.type = "Chest";
	this.isAlive = true;
	
	// Physics
	this.position = position;
	this.previousPos = this.position.clone();
	this.width = 200;
	this.height = 200;

	// Graphics
	this.depth = canvas.height-this.position.y;
	this.sprite = new Sprite(spritesheet_environment, 1000, 200, 200, 200, new Vector2(100, 100), 2, 0, false);

	// Data
	this.isSolid = true;
	this.isDynamic = false;
	this.isOpen = false;

	this.itemButtons = [];

	this.kill = function(){
		this.isAlive = false;
	};

	this.getHitbox = function(){
		return new AABB(this.position.x - this.width/2, this.position.y - this.height/2, this.width, this.height);
	}

	this.open = function(){
		this.sprite.frameIndex = 1;
		this.isOpen = true;

		var items = 6;
		var nextPos;
		for (var i = 0; i < items; i++) {

			nextPos = new Vector2(0, -140);
			var r = i*(360/items);							
			nextPos.rotate(r);

			var b = new BubbleButton(new Vector2(this.position.x+nextPos.x, this.position.y+nextPos.y), 60, "#FFFFFF", new Sprite(spritesheet_emotes, i*150, 0, 150, 225));
			this.itemButtons.push(b);
			gameObjects.push(b);
		}
	};

	this.close = function(){
		this.sprite.frameIndex = 0;
		this.isOpen = false;

		for (var i = 0; i < this.itemButtons.length; i++) {
			this.itemButtons[i].kill();
		}
		this.itemButtons = [];
	};

	this.update = function(){
		var hitbox = this.getHitbox(); // Hitbox for click detection, adjust later when the final art is implemented
		if(checkPointvsAABB(new Vector2(mouse.x+camera.position.x, mouse.y+camera.position.y), hitbox) && mouse.buttonState.leftClick && !previousMouse.buttonState.leftClick){
			console.log("chest pressed");
			if(this.isOpen){ this.close(); }
			else{ this.open(); }
		}

		for (var i = 0; i < this.itemButtons.length; i++) {
			if(this.itemButtons[i].isPressed){
				// buy/wear item
			}
		}
	};

	this.render = function(lagOffset){
		var drawX = this.previousPos.x + ((this.position.x-this.previousPos.x)*lagOffset) - camera.interpolatedPos().x;
		var drawY = this.previousPos.y + ((this.position.y-this.previousPos.y)*lagOffset) - camera.interpolatedPos().y;

		// Image
		this.sprite.draw(ctx, drawX, drawY);

		// Hitbox (debug)
		var h = this.getHitbox();
		drawRectangle(ctx, h.x - camera.interpolatedPos().x, h.y - camera.interpolatedPos().y, h.width, h.height, true, color.GREEN, 0.5);
	};
}