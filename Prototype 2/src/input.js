//*****************************************************************************************
//	Input
//*****************************************************************************************

// Mouse
function Mouse(){
	this.x = 0;
	this.y = 0;
	this.buttonState = {leftClick: false, rightClick: false};

	// Returns the position relative to the game world (you need the camera object)
	this.getWorldPosition = function(){
		return new Vector2(this.x + camera.position.x, this.y + camera.position.y);
	};
}

// Keyboard
function Keyboard(){
	this.keyState = {SPACE: false};
}

// Input listeners
function initializeInputListeners(){
	// Mouse event listeners
	canvas.addEventListener('mousedown', function(e){
		switch(e.button){
			case 0:
				mouse.buttonState.leftClick = true;
				//console.log("Left click at x: "+mouse.x+" y: "+mouse.y);
				break;
			case 2:
				mouse.buttonState.rightClick = true;
				//console.log("Right click at x: "+mouse.x+" y: "+mouse.y);
				break;
			default:
				console.log("Err - (mousedown) Mouse button "+e.button+" is not defined");
				break;
		}		
	}, false);

	document.addEventListener('mouseup', function(e){
		switch(e.button){
			case 0:
				//console.log("Mouse up at x: "+mouse.x+" y: "+mouse.y);
				mouse.buttonState.leftClick = false;
				break;
			case 2:
				//console.log("Mouse up at x: "+mouse.x+" y: "+mouse.y);
				mouse.buttonState.rightClick = false;
				break;
			default:
				console.log("Err - (mousedown) Mouse button "+e.button+" is not defined");
				break;
		}
	}, false);

	document.addEventListener('mousemove', function(e){
		var rect = canvas.getBoundingClientRect();
		var x = e.clientX || e.pageX;
    	var y = e.clientY || e.pageY;
    	mouse.x = x-rect.left-4; // 4px border
    	mouse.y = y-rect.top-4;
	}, false);

	// document.addEventListener('touchstart', function(e){
	//     var t = e.changedTouches[0] // reference first touch point (ie: first finger)
	//     var x = parseInt(t.clientX);
	//     var y = parseInt(t.clientY);
	//     e.preventDefault();
	//     mouse.touchX = x; // 4px border
	//    	mouse.touchY = y;
	//    	mouse.touched = true;

	//    	console.log("touched at "+x+"   "+y);
	//  }, false)

	// Keyboard event listeners
	document.addEventListener('keydown', function(e){
		// e.keyCode
		switch(e.keyCode){
			case 32:
				keyboard.keyState.SPACE = true;
				break;
			default:
				break;
		}
	}, false);

	document.addEventListener('keyup', function(e){
		// e.keyCode
		switch(e.keyCode){
			case 32:
				keyboard.keyState.SPACE = false;
				break;
			default:
				break;
		}
	}, false);
}
