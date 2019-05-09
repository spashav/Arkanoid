/*
* Dynamic
*/

Arkanoid.prototype.dynamic = new Object();

Arkanoid.prototype.dynamic.render = function() {

	var gameState = Arkanoid.obj.gameState
	var c = Arkanoid.obj.context;
	var resolution = Arkanoid.obj.resolution;
	var fontSize = 60 * resolution;

	function printGameState() {
		c.save();
		c.font = fontSize + "px Jaldi sans-serif";
		c.fillStyle = "#D8FFB8";
		c.textAlign = "right";
		c.textBaseline = "hanging";
		c.fillText("score: " + gameState.score, 0.995 * Arkanoid.obj.width - fontSize / 2, 0.005 * Arkanoid.obj.height + fontSize / 2);
		c.textAlign = "left";
		c.fillText("lives: " + gameState.live, 0.005 * Arkanoid.obj.width + fontSize / 2, 0.005 * Arkanoid.obj.height + fontSize / 2);
		for (var i = 0; i < gameState.addScore.length; i++) {
			if (gameState.addScore[i].opacity <= 0.2) {
				gameState.addScore = gameState.addScore.filter(function(x, j) { return j !== i; });
				i--;
			}
			else {
				c.globalAlpha = gameState.addScore[i].opacity;
				c.font = "italic " + fontSize + "px Jaldi sans-serif ";
				c.fillStyle = "#D8FFB8";
				c.textAlign = "center";
				c.fillText("+" + gameState.addScore[i].value, gameState.addScore[i].x, gameState.addScore[i].y - 60 * resolution);
				gameState.addScore[i].opacity -= 0.02;
			}
		}
		c.restore();
	}

	Arkanoid.obj.context.clearRect(0, 0, Arkanoid.obj.canvas.width, Arkanoid.obj.canvas.height);

   	Arkanoid.obj.objects.backgrounds[0].print();
   	Arkanoid.obj.context.globalAlpha = 1;
	Arkanoid.obj.objects.balls[0].print();
	Arkanoid.obj.objects.targets[0].print();
	Arkanoid.obj.objects.bonuses.print();
	Arkanoid.obj.objects.plates[0].print();
	Arkanoid.obj.objects.wallsPacks[0].print();
	printGameState();

	if (gameState.live <= 0) {
		gameState.state = "lose";
		Arkanoid.obj.initStage();
		return;
	}

	if (gameState.state === "win") {
		Arkanoid.obj.initStage();
		return;
	}
};