/*
* Arkanoid v0.1
*/

// Constructor
function Arkanoid(id) {
	if (Arkanoid.hasOwnProperty("obj")) return Arkanoid.obj;

	this.canvas = document.getElementById(id);
	this.context = this.canvas.getContext("2d");
	
	this.width = this.canvas.width;
	this.height = this.canvas.height;
	this.resolution = this.width / 2880;

	this.am = new AnimationManager();
	this.resolutionObjects = [];
	var help = document.getElementById("help");

	Arkanoid.obj = this;

	var th = this;

	function move(e) {
		var e = e || window.event;
		if (e.keyCode == 32) {
			if (th.gameState.state === "begin") {
				th.gameState.state = "play";
				th.initStage();
				help.classList.add("active");
			}
			else if (th.gameState.state === "lose") {
				th.gameState.state === "begin"
				th.initObjects();
				th.initStage();
			}
			else if (th.gameState.state === "win") {
				th.gameState.state === "begin"
				th.initObjects();
				th.initStage();
			}
			else if (th.gameState.state === "play") {
				if (th.gameState.hold === true) {
					help.classList.remove("active");
					th.objects.balls[0].dy = -th.objects.balls[0].baseSpeed;
					th.objects.balls[0].minSpeed = th.objects.balls[0].baseSpeed;
					th.objects.balls[0].maxSpeed = th.objects.balls[0].baseSpeed * 1.5;
					th.gameState.hold = false;
				}
			}
		}
	};

	window.addEventListener("keydown", move);

	var hdControl = document.getElementById("HD-mode");
	hdControl.onchange = function(e) {
		var scale;
		if (hdControl.checked){
			console.log("High");
			scale = 2880 / th.canvas.width;
			th.canvas.width = 2880;
			th.canvas.height = 1800;
		}
		else {
			scale = 1440 / th.canvas.width;
			console.log("Low");
			th.canvas.width = 1440;
			th.canvas.height = 900;
		}
		th.width = th.canvas.width;
		th.height = th.canvas.height;
		th.resolution = th.width / 2880;
		for (var i = 0; i < th.resolutionObjects.length; i++) {
			th.resolutionObjects[i](th.resolution, scale);
		}
	};
};

Arkanoid.prototype.objects = {
	plates : [],
	balls : [],
	wallsPacks : [],
	targets : [],
	backgrounds : [],
	bonuses : undefined
};