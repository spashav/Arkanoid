// Targets

Arkanoid.Targets = function(count, c, walls) {
	this.count = count || 2;
	this.color = c || "#DDC877";
	this.targets = [];
	for (var j = 0; j < 4; j++) {
		for (var i = 0; i < this.count; i++) {
			this.targets.push(new Object());
			this.targets[j * this.count + i].strength = 1;
		}
	}
	var th = this;

	function setResolutionParams(r, s) {
		var freeWidth = Arkanoid.obj.width - walls.elements[1].width - walls.elements[2].width;
		for (var j = 0; j < 4; j++) {
			for (var i = 0; i < th.count; i++) {
				th.targets[j * th.count + i].width = 5 * freeWidth / (6 * th.count + 3);
				th.targets[j * th.count + i].height = 50 * r;
				th.targets[j * th.count + i].x = walls.elements[1].width + (freeWidth / (6 * th.count + 3)) * (2 + 6 * i);
				th.targets[j * th.count + i].y = 200 * r + j * 80 * r;
			}
		}
	};

	Arkanoid.obj.resolutionObjects.push(setResolutionParams);
	setResolutionParams(Arkanoid.obj.resolution, 1);
};

Arkanoid.Targets.prototype.print = function() {
	var c = Arkanoid.obj.context;
	for (var i = 0; i < this.targets.length; i++) {
		if (this.targets[i].strength > 0) {
			c.fillStyle = this.color;
			c.fillRect(this.targets[i].x, this.targets[i].y, this.targets[i].width, this.targets[i].height);
		}
	}
};

Arkanoid.Targets.prototype.nearTargets = function(objectS) {
	var win = true;
	for (var i = 0; i < this.targets.length; i++) {
		elem = this.targets[i];
		var side = false;
		if (elem.strength > 0) { 
			win = false;
			side = objectSizes.boxToBallDetection(new objectSizes.Box(elem.x, elem.y, 0, 0, elem.width, elem.height), objectS);
		}
		if (side) {
			elem.strength--;
			Arkanoid.obj.gameState.score += 10;
			Arkanoid.obj.objects.bonuses.addBonus(objectS.x, objectS.y - objectS.r);
			Arkanoid.obj.gameState.addScore.push({
				value : 10,
				opacity : 1,
				x : objectS.x,
				y : objectS.y
			});
			return side; // edit - find min time
		}
	}
	if (win) 
		Arkanoid.obj.gameState.state = "win";
	return false;
};