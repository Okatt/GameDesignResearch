//*****************************************************************************************
//	Data collection
//*****************************************************************************************

// Logs a label to identify the test results
function startLog(){
	var dataString = "#### New data Log ####";
	socket.emit('logData', dataString);
}

// Logs data with a timestamp label
function logData(){
	socket.emit('setServerTime', getTimeString(time));

	var dataString = "Time: "+getTimeString(time)+" - Players online: "+getPlayersOnline();
	socket.emit('logData', dataString);
}

// Get the amount of players currently playing
function getPlayersOnline(){
	var c = 0;
	for (var i = 0; i < gameObjects.length; i++){
		if(gameObjects[i].type === "Player"){
			c++;
		}
	}
	return c;
}

function getTimeString(seconds){
	var t, h, m, s;
	var ts = "";

	// Get the hours, minutes and seconds
	t = time;
	h = Math.floor(t/3600); t -= h*3600;
	m = Math.floor(t/60); t -= m*60;
	s = t;

	if(h < 10){ ts += "0"+h; }else{ ts += h; } ts += ":";
	if(m < 10){ ts += "0"+m; }else{ ts += m; } ts += ":";
	if(s < 10){ ts += "0"+s; }else{ ts += s; }
	return ts;
}