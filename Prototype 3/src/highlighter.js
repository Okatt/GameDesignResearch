function Highlighter(){
	this.type = "Highlighter";
	this.isAlive = true;
	this.isVisible = false;
	this.depth = -3000;

	this.kill = function(){
		this.isAlive = false;
	}

	this.highlight = function(arg){
		if(arg === undefined){
			this.isVisible = true;
			highlighted = true;
			return;
		}

		switch(arg){
			case "player":
				playerAvatar.isHighlighted = true;
				break;
			case "match":
				matchAvatar.isHighlighted = true;
				break;
			case "emotes":
				for(var i = 0; i < playerAvatar.emoteButtons.length; i++){
					playerAvatar.emoteButtons[i].isHighlighted = true;
				}	
				break;
			case "memory":
				for(var i = 0; i < memoryTiles.length; i++){
					memoryTiles[i].isHighlighted = true;
				}
			default:
				console.log("couldnt highlight " +arg);
				break;
		}
		this.isVisible = true;
		highlighted = true;
	}

	this.unHighlight = function(arg){
		if(arg === undefined){
			for (var i = 0; i < gameObjects.length; i++) {
				if(gameObjects[i].isHighlighted !== undefined){
					gameObjects[i].isHighlighted = false;
				}
			}

			this.isVisible = false;
			highlighted = false;
			return;
		}

		switch(arg){
			case "player":
				playerAvatar.isHighlighted = false;
			case "match":
				matchAvatar.isHighlighted = false;
				break;
			case "emotes":
				for(var i = 0; i < playerAvatar.emoteButtons.length; i++){
					playerAvatar.emoteButtons[i].isHighlighted = false;
				}	
				break;
			case "memory":
				for(var i = 0; i < memoryTiles.length; i++){
					memoryTiles[i].isHighlighted = false;
				}
			default:
				console.log("couldnt unhighlight " +arg);
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