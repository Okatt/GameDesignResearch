function Highlighter(){
	this.type = "Highlighter";
	this.isAlive = true;
	this.isVisible = false;
	this.depth = -50;

	this.kill = function(){
		this.isAlive = false;
	}

	this.highlight = function(arg){
		switch(arg){
			case 'player':
				playerAvatar.isHighlighted = true;
				break;
			case 'match':
				matchAvatar.isHighlighted = true;
				break;
			case 'emotes':
				for(var i = 0; i < playerAvatar.emoteButtons.length; i++){
					playerAvatar.emoteButtons[i].depth = -100;
				}	
				break;
			case 'memory':
				for(var i = 0; i < memoryTiles.length; i++){
					memoryTiles[i].depth = -100;
				}
			default:
				console.log('couldnt highlight ' +arg);
				break;
		}
		this.isVisible = true;
		highlighted = true;
	}

	this.unHighlight = function(arg){
		switch(arg){
			case 'player':
				playerAvatar.isHighlighted = false;
			case 'match':
				matchAvatar.isHighlighted = false;
				break;
			case 'emotes':
				for(var i = 0; i < playerAvatar.emoteButtons.length; i++){
					playerAvatar.emoteButtons[i].depth = 0;
				}	
				break;
			case 'memory':
				for(var i = 0; i < memoryTiles.length; i++){
					memoryTiles[i].depth = 0;
				}
			default:
				console.log('couldnt unhighlight ' +arg);
				break;
		}
		this.isVisible = false;
		highlighted = false;
	}

	this.update = function(){
	}

	this.render = function(lagOffset){
		if(this.isVisible){
			drawRectangle(ctx, 0, 0, canvas.width, canvas.height, true, color.BLACK, 0.5);
		}
	}
}