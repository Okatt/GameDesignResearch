//*****************************************************************************************
//	Utility
//*****************************************************************************************

// Return a random number between min and max
function randomRange(min, max){
	return Math.random()*(max - min)+min;
}

// Converts degrees to radians
function degToRad(degrees){
	return Math.PI/180*degrees;
}

// Converts radians to degrees
function radToDeg(radians){
	return 180/Math.PI*radians;
}

// Clone object
function clone(obj){
    if(obj === null || typeof(obj) !== 'object'){
        return obj;
    }

    var temp = new obj.constructor();
    for(var key in obj){
    	// Justin Case: hasOwnProperty check
    	if(Object.prototype.hasOwnProperty.call(obj, key)){
            temp[key] = clone(obj[key]);
        }
    }
    return temp;
}

// Sorting algorithm to determine the draw order
function sortByDepth(objects){
    var value;
     
    for (var i=0; i < objects.length; i++) {    
        // Store the current value because it may shift later
        value = objects[i];
        
        // Sort the array from back to front (depth 1 to depth -1)
        for (var j=i-1; j > -1 && objects[j].depth < value.depth; j--) {
            objects[j+1] = objects[j];
        }
        objects[j+1] = value;
    }
    return objects;
}
