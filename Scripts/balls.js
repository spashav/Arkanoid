// Balls

Arkanoid.Ball = function(radius, x, y, baseSpeed, color) {
	var th = this;
	function setResolutionParams(r, s) {
		th.r = (radius || 20) * r;
		th.baseSpeed = baseSpeed * r;
		th.newPosX *= s;
		th.newPosY *= s;
		th.x *= s;
		th.y *= s;
		th.minSpeed *= s;
		th.maxSpeed *= s;
		th.dx *= s;
		th.dy *= s;
	};

	Arkanoid.obj.resolutionObjects.push(setResolutionParams);
	setResolutionParams(Arkanoid.obj.resolution, 1);

	this.color = color || "#BDFDDF";
	this.dx = 0;
	this.dy = 0;
	// this.minSpeed = this.baseSpeed;
	// this.maxSpeed = this.baseSpeed * 1.5;
	this.x = x;
	this.y = y;
	this.newPosX = this.x; 
	this.newPosY = this.y;
	this.rubbing = 0.5;
};

Arkanoid.Ball.prototype.print = function() {
	var c = Arkanoid.obj.context;
	c.save();
	c.beginPath();
	c.arc(this.newPosX, this.newPosY, this.r, 0, 2 * Math.PI, false);
	c.closePath();
	c.fillStyle = this.color;
	c.fill();
	c.beginPath();
	c.arc(this.newPosX, this.newPosY, this.r, 0, 2 * Math.PI, false);
	c.arc(this.newPosX - this.dx, this.newPosY - this.dy, this.r, 0, 2 * Math.PI, false);
	c.closePath();
	c.fillStyle = this.color;
	c.shadowColor = this.color;
	c.shadowBlur = 15 * Arkanoid.obj.scale;
	c.globalAlpha = 0.2;
	c.shadowOffsetX = -this.dx;
	c.shadowOffsetY = -this.dy;
	c.fill();
	c.restore();
};

Arkanoid.Ball.prototype.changeState = function(walls, targets, plates) {
	var th = this;
	var walls = walls;
	
	return function(t, s) {
		th.y = th.newPosY;
		th.x = th.newPosX;
		if (Arkanoid.obj.gameState.hold) {
			th.newPosX = plates.newPosX + plates.width / 2;
			th.newPosY = plates.y - th.r;
			return;
		}
		

		var sizeBall = new objectSizes.Ball(th.x, th.y, th.dx, th.dy, th.r);
		var plateSide = plates.nearPlate(sizeBall);
		var targetSide = targets.nearTargets(sizeBall);
		var collision = walls.nearWalls(sizeBall) || targetSide || plateSide;

		var t = 1;
		var delta_dx = delta_dy = 0;
		if (collision) {
			if (collision.t)
				t = collision.t;
			if (collision.delta_dx)
				delta_dx = collision.delta_dx;
			if (collision.delta_dy)
				delta_dy = collision.delta_dy;
		}
		
		th.newPosX += t * th.dx;
		th.newPosY += t * th.dy;
		th.dx += delta_dx;
		th.dy += delta_dy;

		if (Math.abs(th.dx/th.dy) > 2) {
			th.dx /= Math.abs(th.dx/th.dy) - 1;
		}
		var speed = Math.sqrt(th.dx * th.dx + th.dy * th.dy);

		if (speed > th.maxSpeed) {
			th.dx *= th.maxSpeed / speed;
			th.dy *= th.maxSpeed / speed;
		}
		else if (speed < th.minSpeed) {
			th.dx *= th.minSpeed / speed;
			th.dy *= th.minSpeed / speed;
		}

		if (plateSide) {
			if (plates.speed * th.dx > 0)
				th.dx += th.rubbing * plates.speed * (th.maxSpeed - Math.abs(th.dx))/th.maxSpeed;
			else
				th.dx += th.rubbing * plates.speed;
		}

		if (targetSide) {
			th.minSpeed += 2 * th.baseSpeed / targets.targets.length;
			th.maxSpeed += 2 * th.baseSpeed / targets.targets.length;
		}

		if (th.dy > 0 && th.y + th.dy > Arkanoid.obj.height - th.r) {
			th.dx = 0;
			th.dy = 0;
			Arkanoid.obj.gameState.hold = true;
			Arkanoid.obj.gameState.live--;
		}
	};
};