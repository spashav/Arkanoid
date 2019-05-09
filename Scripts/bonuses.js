/*
* Bonuses
*/

Arkanoid.Bonus = function(x, y, chance, color) {
	var th = this;
	var speedScale = getRandomInt(10,15) / 10;
	this.tail = [];
	function setResolutionParams(r, s) {
		th.r = 8 * r;
		th.dy = 8 * r * speedScale;
		th.x *= s;
		th.y *= s;
		for (var i = 0; i < th.tail.length; i++) {
			th.tail[i].x *= s;
			th.tail[i].y *= s;
			th.tail[i].r *= s;
			th.tail[i].dx *= s;
			th.tail[i].dy *= s;
		}
	};

	Arkanoid.obj.resolutionObjects.push(setResolutionParams);
	setResolutionParams(Arkanoid.obj.resolution, 1);

	this.chance = chance || 1;
	this.color = color || "white";
	this.x = x;
	this.y = y;
	this.caught = false;
	this.gone = false;
}

Arkanoid.Bonus.prototype.print = function() {
	var c = Arkanoid.obj.context;
	if (!this.caught && !this.gone) {
		c.fillStyle = this.color;
		c.beginPath();
		c.arc(this.x, this.y, this.r, 0, 2 * Math.PI, false);
		c.closePath();
		c.fill();
	}

	for (var i = 0; i < this.tail.length; i++) {
		if (this.tail[i].opacity <= 0.2) {
			this.tail = this.tail.filter(function(x, j) { return j !== i; });
			i--;
		}
		else {
			if (this.gone)
				c.fillStyle = this.color;
			if (this.caught)
				c.fillStyle = "#DDC877";
			c.beginPath();
			c.arc(this.tail[i].x, this.tail[i].y, this.tail[i].r, 0, 2 * Math.PI, false);
			c.closePath();
			c.fill();
		}
	}
};

Arkanoid.Bonus.prototype.changeState = function(t, plates) {
	this.y += this.dy;
	var delta, speedValue;
	for (var i = 0; i < this.tail.length; i++) {
		speedValue = Math.sqrt(this.tail[i].dx * this.tail[i].dx + this.tail[i].dy * this.tail[i].dy);
		delta = 4 * Math.sin((t / 2000 * this.tail[i].angle) * Math.PI) * Arkanoid.obj.resolution;

		this.tail[i].x += this.tail[i].dx - this.tail[i].dy * delta / speedValue;
		this.tail[i].y += this.dy + this.tail[i].dy + this.tail[i].dx * delta / speedValue;

		this.tail[i].dx *= 0.97;
		this.tail[i].opacity -= 0.01;
		this.tail[i].r *= 0.99;
	}

	if (!this.caught && !this.gone) {
		if (this.y > plates.y && this.y < plates.y + plates.height && this.x >= plates.x && this.x <= plates.x + plates.width) {
			Arkanoid.obj.gameState.score += 15;
			Arkanoid.obj.gameState.addScore.push({
				value : 15,
				opacity : 1,
				x : this.x,
				y : this.y,
			});
			this.caught = true;
		}

		if (this.y > Arkanoid.obj.height)
			this.gone = true;

		if (getRandomInt (1,3) == 3)
			this.tail.push({
				x : this.x,
				y : this.y,
				r : getRandomInt(1,4) * Arkanoid.obj.resolution,
				dx : getRandomInt(-this.dy, this.dy) / 2,
				dy : getRandomInt(-this.dy -2, -2),
				opacity : 1,
				angle : getRandomInt(10,40) / 10
			});
	}	
};

Arkanoid.BonusesManager = function() {
	this.b = [];
};

Arkanoid.BonusesManager.prototype.addBonus = function(x, y) {
    this.b.push(new Arkanoid.Bonus(x, y));
    return this;
};

Arkanoid.BonusesManager.prototype.print = function() {
	for (var i = 0; i < this.b.length; i++)
		this.b[i].print();
};

Arkanoid.BonusesManager.prototype.changeState = function(plates) {
	var th = this;
	
	return function(t, s) {
		for (var i = 0; i < th.b.length; i++) {
			th.b[i].changeState(t, plates);
			if ((th.b[i].caught || th.b[i].gone) && th.b[i].tail.length === 0) {
				th.b = th.b.filter(function(x, j) { return j !== i; });
				i--;
			}
		}
	}
};