//*****************************************************************************************
//	Notifications
//*****************************************************************************************

// Notification Manager
function NotificationManager(){
	this.type = "NotificationManager";
	this.isAlive = true;

	this.kill = function(){
		this.isAlive = false;
	};

	this.update = function(){

	};

	this.render = function(lagOffset){

	};
}
 
// Notification
function Notification(message){
	this.type = "Notification";
	this.isAlive = true;

	// Positioning
	this.position = new Vector2(canvas.width/2, 120);
	this.previousPos = this.position.clone();
	this.width = canvas.width-40;
	this.height = 200;

	// Graphics
	this.depth = -2000;
	this.font = "Righteous";
	this.fontSize = 40;

	// Data
	this.message = message;
	this.text = [];
	this.isSolid = false;
	this.isDynamic = false;

	this.getTextArray = function(){
		var t = message.split("\n");
		console.log(t);
	};
	this.text = this.getTextArray();

	this.kill = function(){
		this.isAlive = false;
	};

	this.update = function(){

	};

	this.render = function(lagOffset){
		var drawX = this.previousPos.x + ((this.position.x-this.previousPos.x)*lagOffset);
		var drawY = this.previousPos.y + ((this.position.y-this.previousPos.y)*lagOffset);

		// Textbox
		drawRectangle(ctx, drawX-this.width/2+4, drawY-this.height/2+4, this.width, this.height, true, "#000000", 0.3);
		drawRectangle(ctx, drawX-this.width/2, drawY-this.height/2, this.width, this.height, true, "#FFFFFF", 1);

		// Text
		// for (var i = 0; i < this.text.length; i++) {
		// 	ctx.font = this.font;
		// 	ctx.fillStyle = "#FFFFFF";
		// 	ctx.textAlign = "center";
		// 	ctx.fillText(this.message, drawX, drawY);

		// 	ctx.draw(this.text[i]);
		// }
		ctx.textAlign = "center";
		drawText(ctx, drawX, drawY-this.height/2+this.fontSize+10, this.width-40, this.fontSize, this.message, this.font, this.fontSize, color.BLACK, 1);
	};
}