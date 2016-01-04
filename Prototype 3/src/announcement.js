//*****************************************************************************************
//	Announcements
//*****************************************************************************************

// Announcement Manager
function AnnouncementManager(){
	this.isAlive = true;
	this.type = "AnnouncementManager";

	// Positioning
	this.position = new Vector2(canvas.width/2, canvas.height-20);
	this.previousPos = this.position.clone();
	this.width = canvas.width;
	this.height = 40;

	// Graphics
	this.depth = -2000;

	// Data
	this.queue = [];
	this.lastMessage = false;
	this.isSolid = false;
	this.isDynamic = false;

	this.announce = function(message){
		var m = " "+message+" ";
		var separator = "  ·  ";
		this.queue.push(m);
		this.queue.push(separator);
	}

	this.nextMessage = function(){
		if(this.queue.length >= 1){
			this.lastMessage = new Announcement(new Vector2(this.position.x+this.width/2, this.position.y+this.height*0.25), this.queue[0]);
			gameObjects.push(this.lastMessage);

			// Remove the message from the queue
			this.queue.splice(0, 1);
		}	
	}

	this.update = function(){
		if(!this.lastMessage){
			if(this.queue.length === 0){this.announce("JOIN THE PARTY AT  polygonpals.tk");}
			this.nextMessage();
		}else if(this.lastMessage.position.x+this.lastMessage.measureTextWidth() <= canvas.width){
			if(this.queue.length === 0){this.announce("JOIN THE PARTY AT  polygonpals.tk");}
			this.nextMessage();
		}
	}

	this.render = function(lagOffset){
		var drawX = this.previousPos.x + ((this.position.x-this.previousPos.x)*lagOffset);
		var drawY = this.previousPos.y + ((this.position.y-this.previousPos.y)*lagOffset);

		// Text bar
		drawRectangle(ctx, drawX-this.width/2, drawY-this.height/2, this.width, this.height, true, color.BLACK, 0.3);
	}
}

// Announcement
function Announcement(position, message){
	this.isAlive = true;
	this.type = "Announcement";

	// Positioning
	this.position = position;
	this.previousPos = this.position.clone();
	this.velocity = new Vector2(-2, 0);
	
	// Graphics
	this.depth = -2001;
	this.font = "28px Righteous";

	// Measures the text width in pixels
	this.measureTextWidth = function(){
		ctx.font = this.font;
		var metrics = ctx.measureText(this.message);
		return metrics.width;
	};

	// Data
	this.message = message;
	this.isSolid = false;
	this.isDynamic = true;
	this.drag = 1;
	
	this.kill = function(){
		this.isAlive = false;
	}

	this.update = function() {
		if(this.position.x+this.measureTextWidth() <= 0){
			this.kill();
		}
	}

	this.render = function(lagOffset){
		var drawX = this.previousPos.x + ((this.position.x-this.previousPos.x)*lagOffset);
		var drawY = this.previousPos.y + ((this.position.y-this.previousPos.y)*lagOffset);

		ctx.font = this.font;
		ctx.fillStyle = "#FFFFFF";
		ctx.textAlign = "left";
		ctx.fillText(this.message, drawX, drawY);
	}
}