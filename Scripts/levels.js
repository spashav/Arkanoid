/*
* Stages
*/

Arkanoid.prototype.initStage = function() {
	var objects = this.objects;
	var gameState = this.gameState
	var c = this.context;
	var particlePositions = [];
	this.am.animations = [];

	function calculateParticleFromObjects() {
		var x, y;

		//plate
		x = objects.plates[0].x;
		y = objects.plates[0].y;

		while (true) {
			x += 5;
			if (x > objects.plates[0].x + objects.plates[0].width) {
				y += 5;
				x = objects.plates[0].x;
			}
			if (y > objects.plates[0].y + objects.plates[0].height) break;
			particlePositions.push({
				"x" : x,
				"y" : y
			});
		}

		//targets
		for (var i = 0; i < objects.targets[0].targets.length; i++){
			x = objects.targets[0].targets[i].x;
			y = objects.targets[0].targets[i].y;

			while (true) {
				x += 5;
				if (x > objects.targets[0].targets[i].x + objects.targets[0].targets[i].width) {
					y += 5;
					x = objects.targets[0].targets[i].x;
				}
				if (y > objects.targets[0].targets[i].y + objects.targets[0].targets[i].height) break;
				particlePositions.push({
					"x" : x,
					"y" : y
				});
			}
		}

		//walls
		for (var i = 0; i < objects.wallsPacks[0].elements.length; i++){
			x = objects.wallsPacks[0].elements[i].x;
			y = objects.wallsPacks[0].elements[i].y;

			while (true) {
				x += 5;
				if (x > objects.wallsPacks[0].elements[i].x + objects.wallsPacks[0].elements[i].width) {
					y += 5;
					x = objects.wallsPacks[0].elements[i].x;
				}
				if (y > objects.wallsPacks[0].elements[i].y + objects.wallsPacks[0].elements[i].height) break;
				particlePositions.push({
					"x" : x,
					"y" : y
				});
			}
		}

		//ball
		x = - objects.balls[0].r;
		y = - objects.balls[0].r;

		while (true) {
			x += 5;
			if (x > objects.balls[0].r) {
				y += 5;
				x = - objects.balls[0].r;
			}
			if (y > objects.balls[0].r) break;
			if (x * x + y * y <= objects.balls[0].r * objects.balls[0].r) 
				particlePositions.push({
					"x" : x + objects.balls[0].x,
					"y" : y + objects.balls[0].y
				});
		}
	}

	if (gameState.state === "begin") {
		if (this.p) {
			for (var i = 0; i < this.p.p.length; i++) {
				particlePositions.push({
					x : this.p.p[i].x,
					y : this.p.p[i].y
				});
			}
			this.p = undefined;
		}
		else 
			particlePositions = undefined;
		this.initStartMenu(this.words.begin, particlePositions);
	} 
	else if (gameState.state === "play") {
		this.canvas.width = this.canvas.width;
		this.am.settings.funcPost = this.dynamic.render;
		this.gameState.hold = true;
		this.gameState.live = 2;
		this.gameState.score = 0;

		var plateAnimation = new Animation({
			"time" : "infinite",
			"alteration" : objects.plates[0].changeState(objects.wallsPacks[0]),
			"render" : undefined
		});

		var ballAnimation = new Animation({
			"time" : "infinite",
			"alteration" : objects.balls[0].changeState(objects.wallsPacks[0],objects.targets[0],objects.plates[0]),
			"render" : undefined
		});

		var backgroundAnimation = new Animation({
			"time" : "infinite",
			"alteration" : objects.backgrounds[0].changeState(objects.balls[0]),
			"render" : undefined
		});

		var bonusesAnimation = new Animation({
			"time" : "infinite",
			"alteration" : objects.bonuses.changeState(objects.plates[0]),
			"render" : undefined
		});

		this.am.add(ballAnimation).add(plateAnimation).add(backgroundAnimation).add(bonusesAnimation).start();
	}
	else if (gameState.state === "win") {
		calculateParticleFromObjects();
		this.p = this.initStartMenu(this.words.win, particlePositions);
	}
	else if (gameState.state === "lose") {
		calculateParticleFromObjects();
		this.p = this.initStartMenu(this.words.lose, particlePositions);
	}
};