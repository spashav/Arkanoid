
// Walls

Arkanoid.WallsPack = function() {
	this.elements = [];
	this.color = "#071A20";
	var th = this;
	Arkanoid.obj.resolutionObjects.push(function(s) {th.elements = [];});
};

Arkanoid.WallsPack.prototype.addBoxWall = function(x, y, w, h, color) {
	var th = this;
	function setResolutionParams(r, s) {
		th.elements.push ({
			"width" : w * Arkanoid.obj.width,
			"height" : h * Arkanoid.obj.height,
			"x" : x * Arkanoid.obj.width,
			"y" : y * Arkanoid.obj.height,
			"color" : color || "#CBD5DD"
		});
	};

	Arkanoid.obj.resolutionObjects.push(setResolutionParams);
	setResolutionParams(1,1);
	
	return this;
}; 

Arkanoid.WallsPack.prototype.print = function() {
	var c = Arkanoid.obj.context;
	for (var i = 0; i < this.elements.length; i++) {
		var element = this.elements[i];
		c.fillStyle = element.color;
		c.fillRect(element.x, element.y, element.width, element.height);
	}
};

Arkanoid.WallsPack.prototype.nearWalls = function(objectS) {
	for (var i = 0; i < this.elements.length; i++) {
		var elem = this.elements[i];

		var side = objectS instanceof objectSizes.Box ?
			objectSizes.boxToBoxDetection(new objectSizes.Box(elem.x, elem.y, 0, 0, elem.width, elem.height), objectS) :
			objectSizes.boxToBallDetection(new objectSizes.Box(elem.x, elem.y, 0, 0, elem.width, elem.height), objectS);
		if (side)
			return side;
	}
	return false;
};