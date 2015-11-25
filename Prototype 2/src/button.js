//*****************************************************************************************
//	Button
//*****************************************************************************************

function TextButton(position, width, height, text, bgColor){
	this.type = "TextButton";
	this.isAlive = true;
	
	// Positioning
	this.position = position;
	this.previousPos = this.position.clone();
	this.width = width;
	this.height = height;

	// Graphics
	this.depth = 0;
	this.bgColor = bgColor;
	this.bgAlpha = 1;
	this.text = text;
	this.textColor = color.BLACK;
	this.textHoverColor = color.BLACK;

	// State
	this.mouseOver = false;
	this.isPressed = false;
	this.isToggled = false;
	this.isDisabled = false;
	this.isVisible = true;

	// Destroys the object (removes it from gameObjects)
	this.kill = function(){
		this.unfocus();
		this.isAlive = false;
	};

	// Returns the hitbox
	this.getHitbox = function(){
		return new AABB(this.position.x-this.width/2, this.position.y-this.height/2, this.width, this.height);
	};

	// Focus	
	this.focus = function(){
		if(!this.isFocused){
			focus(this);
			this.isFocused = true;
		}
	};

	// Remove focus
	this.unfocus = function(){
		if(this.isFocused){
			unfocus(this);
			this.isFocused = false;
		}
	};

	// onClick gets called when the button is pressed (it sets isPressed on true for easier communication with other objects)
	this.onClick = function(){

	};

	// Update
	this.update = function(){
		this.mouseOver = false;
		this.isPressed = false;

		// Check if the button is not disabled
		if(!this.isDisabled){
			// Check if the mouse is hovering over the button
			//this.mouseOver = checkPointvsAABB(new Vector2(mouse.x, mouse.y), this.getHitbox());
			
			// Call the onClick function when the button is pressed
			if(checkPointvsAABB(new Vector2(mouse.x, mouse.y), this.getHitbox()) && mouse.buttonState.leftClick && !previousMouse.buttonState.leftClick){
				console.log("Pressed");
				this.isPressed = true;
				this.onClick();
			}
		}
	};

	// Render
	this.render = function(lagOffset){
		if(this.isVisible){
					var drawX = this.previousPos.x + ((this.position.x-this.previousPos.x)*lagOffset);
		var drawY = this.previousPos.y + ((this.position.y-this.previousPos.y)*lagOffset);

		// Background
		drawRectangle(ctx, drawX-this.width/2, drawY-this.height/2, this.width, this.height, true, this.bgColor, this.bgAlpha);

		// Text
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		if(!this.mouseOver){drawText(ctx, drawX, drawY, this.width, 24, this.text, "Arial", 24, this.textColor, 1);}
		else{drawText(ctx, drawX, drawY, this.width, 24, this.text, "Arial", 24, this.textHoverColor, 1);}
		ctx.textBaseline = "alphabetic";
		}
	};
}