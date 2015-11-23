//*****************************************************************************************
//	Graphics
//*****************************************************************************************

// Colors
var color = {BLACK: "#000000", DARK_GREY: "#323232", WHITE: "#FFFFFF", GROUND: "#3FA9AB", SKY: "#CF5D5D",
			 BLUE: "#0090FF", GREEN: "#7AFF2D", PINK: "#F319FF", RED: "#FF0000", YELLOW: "#FFFF00"};
var colorArray = [color.BLACK, color.DARK_GREY, color.WHITE, color.PINK, color.RED, color.YELLOW];


// Camera
function Camera(position){
	this.position = position;
	this.previousPos = this.position.clone();
	this.targetPos = this.position.clone();
	this.width = canvas.width;
	this.height = canvas.height;

	this.timer = 0;
	this.cameraFX = {xOffset: 0, yOffset: 0, shakeIntensity: 0};

	this.shake = function(intensity){
		this.cameraFX.shakeIntensity = intensity;
	};

	this.setTargetPosition = function(position){
		this.targetPos = new Vector2(position.x-this.width/2, position.y-this.height/2);
	};

	// Update
	this.update = function(){
		// Timer
		this.timer -= UPDATE_DURATION/1000;
		if(this.timer < 0){this.timer = 0;}

		// Physics
		this.previousPos = this.position.clone();

		// Camera shake
		if(this.cameraFX.shakeIntensity > 0.02){
			this.cameraFX.xOffset = randomRange(0, this.cameraFX.shakeIntensity);
			this.cameraFX.yOffset = randomRange(0, this.cameraFX.shakeIntensity);
			this.cameraFX.shakeIntensity *= 0.98;
		}else{
			this.cameraFX.shakeIntensity *= 0;
		}

		// Move to target position
		var dist = new Vector2(this.targetPos.x - this.position.x, this.targetPos.y - this.position.y);
		if(dist.length() < 0.1){
			this.position = this.targetPos.clone();
		}else{
			dist.multiply(0.1);
			// Max speed
			if(dist.length() > 50){
				dist.normalize();
				dist.multiply(50);
			}
			this.position.add(dist);
		}
	};

	this.interpolatedPos = function(){
		var lagOffset = lag/UPDATE_DURATION;
		return new Vector2(this.previousPos.x + (this.position.x-this.previousPos.x)*lagOffset + this.cameraFX.xOffset,
						   this.previousPos.y + (this.position.y-this.previousPos.y)*lagOffset + this.cameraFX.yOffset);
	};
}


// Sprite
function Sprite(img, startX, startY, width, height, center, frameCount, fps, loop){
	// Default values
	if(center === undefined){center = new Vector2(width/2, height/2);}
	if(frameCount === undefined){frameCount = 1;}
	if(fps === undefined){fps = 1;}
	if(loop === undefined){loop = false;}

	this.img = img;
	this.sx = startX;
	this.sy = startY;
	this.width = width;
	this.height = height;
	this.center = center;

	this.fps = fps;
	this.frameCount = frameCount;
	this.frameIndex = 0;
	this.loop = loop;
	this.isDone = false;

	this.reset = function(){
		this.frameIndex = 0;
		this.isDone = false;
	};

	this.update = function(){
		// We want to maintain the correct frametime thus we add fps/UPS (updates per second)
		this.frameIndex = (this.frameIndex+(UPDATE_DURATION/1000*this.fps));
		if(this.frameIndex > this.frameCount){
			if(this.loop){
				this.frameIndex = this.frameIndex % this.frameCount;
			}else{
				this.frameIndex = this.frameCount-1; this.isDone = true;
			}
		}
	};

	this.draw = function(ctx, x, y, rotation, alpha){
		if(rotation === undefined){rotation = 0;}
		if(alpha === undefined){alpha = 1;}
		ctx.globalAlpha = alpha;
		// Save the unrotated context of the canvas so we can restore it later.
	    ctx.save();

	    // Translate
	    ctx.translate(x, y);

	    // Rotate the canvas to the specified degrees
	    ctx.rotate(rotation*(Math.PI/180)%360);

	    // Draw the image
	    ctx.drawImage(this.img, this.sx+(Math.floor(this.frameIndex)*this.width), this.sy, this.width, this.height, -this.center.x, -this.center.y, this.width, this.height);

	    // We’re done with the rotating so restore the unrotated context
	    ctx.restore();
	    ctx.globalAlpha = 1;
	};
}

// Draws a rectangle
function drawRectangle(ctx, x, y, w, h, fill, color, alpha){
	if(alpha === undefined){alpha = 1;}
	ctx.fillStyle = color;
	ctx.strokeStyle = color;
	ctx.globalAlpha = alpha;
	ctx.beginPath();
	ctx.rect(x, y, w, h);
	ctx.closePath();
	if(fill){ ctx.fill(); }else{ ctx.stroke(); }
	ctx.globalAlpha = 1;
}

// Draws a rectangle with rounded corners
function drawRoundRect(ctx, x, y, width, height, radius, fill, color, alpha) {
	if(alpha === undefined){alpha = 1;}
	ctx.fillStyle = color;
	ctx.strokeStyle = color;
	ctx.globalAlpha = alpha;
	ctx.beginPath();
	ctx.moveTo(x + radius, y);
	ctx.lineTo(x + width - radius, y);
	ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
	ctx.lineTo(x + width, y + height - radius);
	ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
	ctx.lineTo(x + radius, y + height);
	ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
	ctx.lineTo(x, y + radius);
	ctx.quadraticCurveTo(x, y, x + radius, y);
	ctx.closePath();
 	if(fill){ ctx.fill(); }else{ ctx.stroke(); } 
 	ctx.globalAlpha = 1; 
}

// Draws a circle
function drawCircle (ctx, x, y, radius, fill, color, alpha){
	if(alpha === undefined){alpha = 1;}
	ctx.fillStyle = color;
	ctx.strokeStyle = color;
	ctx.globalAlpha = alpha;
	ctx.beginPath();
	ctx.arc(x, y, radius, 0, 2*Math.PI);
	ctx.closePath();
	if(fill){ ctx.fill(); }else{ ctx.stroke(); }
	ctx.globalAlpha = 1;
}

// Draws an ellipse
function drawEllipse(ctx, x, y, w, h, fill, color, alpha){
	if(alpha === undefined){alpha = 1;}
	var kappa = 0.5522848,	
      ox = (w / 2) * kappa, // control point offset horizontal
      oy = (h / 2) * kappa, // control point offset vertical
      xe = x + w,           // x-end
      ye = y + h,           // y-end
      xm = x + w / 2,       // x-middle
      ym = y + h / 2;       // y-middle

     ctx.fillStyle = color;
	ctx.strokeStyle = color;
	ctx.globalAlpha = alpha;
	ctx.beginPath();
	ctx.moveTo(x, ym);
	ctx.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y);
	ctx.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym);
	ctx.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
	ctx.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym);
	ctx.closePath();
	if(fill){ ctx.fill(); }else{ ctx.stroke(); }
	ctx.globalAlpha = 1;
}

// TODO improve
function drawText(ctx, x, y, maxLineWidth, lineHeight, text, font, size, color, alpha){
	if(alpha === undefined){alpha = 1;}
	ctx.font = size+"px "+font;
	ctx.fillStyle = color;
	ctx.globalAlpha = alpha;

	var lines = text.split("\n");
    for (var i = 0; i < lines.length; i++) {
        var words = lines[i].split(' ');
        var line = '';

        for (var n = 0; n < words.length; n++) {
            var testLine = line + words[n] + ' ';
            var lineWidth = ctx.measureText(testLine).width;
            if (lineWidth > maxLineWidth && n > 0) {
                ctx.fillText(line, x, y);
                line = words[n] + ' ';
                y += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, x, y);
        y += lineHeight;
    }
	
	//ctx.fillText(text, x, y);
	ctx.globalAlpha = 1;
}