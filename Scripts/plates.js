// Plates

Arkanoid.Plate = function(width, height, color) {
	var th = this;

	function setResolutionParams(r, s) {
		th.width = (width || 0.2) * Arkanoid.obj.width;
		th.height = (height || 0.03) * Arkanoid.obj.height;
		th.maxSpeed = 30 * r;
		th.force = 20 * r;
		th.weight = 10 * r;
		th.friction = 10 * r;
		th.newPosX *= s;
		th.newPosY *= s;
		th.x *= s;
		th.y *= s;
		th.speed *= s;
	};
	
	Arkanoid.obj.resolutionObjects.push(setResolutionParams);
	setResolutionParams(Arkanoid.obj.resolution, 1);

	this.speed = 0;
	//this.color = color || "#f3454a";
	this.color = color || "#DDCF84";
	this.x = (Arkanoid.obj.width - this.width)/2;
	this.y = Arkanoid.obj.height - 2 * this.height;
	this.newPosX = this.x; 
	this.newPosY = this.y;
};

Arkanoid.Plate.prototype.print = function() {
	var c = Arkanoid.obj.context;
	c.fillStyle = this.color;;
	c.fillRect(this.newPosX, this.newPosY, this.width, this.height);
};

Arkanoid.Plate.prototype.changeState = function(walls) {
	var th = this;
	var direction = "none";
	var currentSpeed = 0;
	var time = 0;

	function move(e) {
		var e = e || window.event;
		if (e.keyCode === 65) {
			if (direction !== "l") {
				currentSpeed = th.speed;
				time = (new Date()).getTime();
			}
			direction = "l";
		}
		if (e.keyCode === 68) {
			if (direction !== "r") {
				currentSpeed = th.speed;
				time = (new Date()).getTime();
			}
			direction = "r";
		}
	};

	function stopmove(e) {
		if (e.keyCode === 68 || e.keyCode === 65) {
			currentSpeed = th.speed;
			direction = "none";
		};
	}

	window.addEventListener("keydown", move);
	window.addEventListener("keyup", stopmove);
	
	return function(t, s) {
		th.x = th.newPosX;

		var timePassed = ((new Date()).getTime() - time) / 1000;

		if (direction == "r") {
			th.speed = th.maxSpeed - (th.maxSpeed - currentSpeed) * Math.exp(- th.force * timePassed / th.weight);
		}
		else if (direction == "l") {
			th.speed = - th.maxSpeed + (currentSpeed + th.maxSpeed) * Math.exp(- th.force * timePassed / th.weight);
		}
		else {
			th.speed = currentSpeed * Math.exp(-th.friction * timePassed / th.weight);
		}

		var boxPlate = new objectSizes.Box(th.x, th.y, th.speed, 0, th.width, th.height);
		var collision = walls.nearWalls(boxPlate);
		
		if (collision) {
			th.newPosX += collision.t * th.speed;
			th.speed = 0;
		}
		th.newPosX += th.speed;
	};
};

Arkanoid.Plate.prototype.nearPlate = function(objectS) {
	return objectSizes.boxToBallDetection(new objectSizes.Box(this.x, this.y, this.speed, 0, this.width, this.height / 10), objectS); // edit
};