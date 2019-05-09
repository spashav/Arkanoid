/*
* ObjectSizes
*/

objectSizes = new Object();

objectSizes.Point = function(x, y, dx, dy) {
	this.x = x;
	this.y = y;
	this.dx = dx || 0;
	this.dy = dy || 0;
};

objectSizes.Line = function(x, y, i, j) { // x = point.x + i * t; y = point.y + j * t;
	this.x0 = x;
	this.y0 = y;
	this.i = i;
	this.j = j;
};

objectSizes.LineSegment = function(x1, y1, x2, y2) {
	this.x1 = x1;
	this.x2 = x2;
	this.y1 = y1;
	this.y2 = y2;
	this.i = x1 - x2;
	this.j = y1 - y2;
};

objectSizes.Ball = function(x, y, dx, dy, r) {
	this.x = x;
	this.y = y;
	this.dx = dx;
	this.dy = dy;
	this.r = r;
};


objectSizes.Box = function(x, y, dx, dy, width, height) {
	this.x = x;
	this.y = y;
	this.dx = dx;
	this.dy = dy;
	this.width = width;
	this.height = height;
};

objectSizes.boxToBoxDetection = function(box1, box2) {
	var t = [];
	t[0] = (box2.x - box1.x - box1.width) / (box1.dx - box2.dx);
	t[1] = (box2.x + box2.width - box1.x) / (box1.dx - box2.dx);
	t[2] = (box2.y - box1.y - box1.height) / (box1.dy - box2.dy);
	t[3] = (box2.y + box2.height - box1.y) / (box1.dy - box2.dy);
	if (t[0] <= 1 && t[1] > 0.0001) {
		if (t[2] <= 1 && t[3] > 0.0001) {
			if (t[0] > t[2])
				return {
					"t" : t[0],
					"delta_dx" : - 2 * box2.dx,
					"delta_dy" : 0
				}
			else if (t[0] < t[2])
				return {
					"t" : t[2],
					"delta_dx" : 0,
					"delta_dy" : - 2 * box2.dy
				}
			else
				return {
					"t" : t[2],
					"delta_dx" : - 2 * box2.dx,
					"delta_dy" : - 2 * box2.dy
				}
		}
		if (t[2] > 0.0001 && t[3] <= 1) {
			if (t[0] > t[3])
				return {
					"t" : t[0],
					"delta_dx" : - 2 * box2.dx,
					"delta_dy" : 0
				}
			else if (t[0] < t[3])
				return {
					"t" : t[3],
					"delta_dx" : 0,
					"delta_dy" : - 2 * box2.dy
				}
			else
				return {
					"t" : t[3],
					"delta_dx" : - 2 * box2.dx,
					"delta_dy" : - 2 * box2.dy
				};
		}
	}
	if (t[0] > 0.0001 && t[1] <= 1) {
		if (t[2] <= 1 && t[3] > 0.0001) {
			if (t[1] > t[2])
				return {
					"t" : t[1],
					"delta_dx" : - 2 * box2.dx,
					"delta_dy" : 0
				}
			else if (t[1] < t[2])
				return {
					"t" : t[2],
					"delta_dx" : 0,
					"delta_dy" : - 2 * box2.dy
				}
			else
				return {
					"t" : t[2],
					"delta_dx" : - 2 * box2.dx,
					"delta_dy" : - 2 * box2.dy
				}
		}
		if (t[2] > 0.0001 && t[3] <= 1) {
			if (t[1] > t[3])
				return {
					"t" : t[1],
					"delta_dx" : - 2 * box2.dx,
					"delta_dy" : 0
				}
			else if (t[1] < t[3])
				return {
					"t" : t[3],
					"delta_dx" : 0,
					"delta_dy" : - 2 * box2.dy
				}
			else
				return {
					"t" : t[3],
					"delta_dx" : - 2 * box2.dx,
					"delta_dy" : - 2 * box2.dy
				};
		}
	}
	return false;
};

objectSizes.solve = function(a, b, c) { // a * x * x + b * x + c = 0
	if (a == 0) {
		if (b == 0) return false;
		return c / b;
	}
	var d = b * b - 4 * a * c;
	if (d < 0) return false;
	if (d === 0) return b / (-2 * a);
	return {
		"first" : (-b + Math.sqrt(d)) / (2 * a), 
		"second" : (-b - Math.sqrt(d)) / (2 * a)
	}
};

objectSizes.pointToBallDetection = function(point, ball) {
	var a = (ball.dx - point.dx) * (ball.dx - point.dx) + (ball.dy - point.dy) * (ball.dy - point.dy);
	var b = 2 * ((ball.dx - point.dx) * (ball.x - point.x) + (ball.dy - point.dy) * (ball.y - point.y));
	var c = (ball.x - point.x) * (ball.x - point.x) + (ball.y - point.y) * (ball.y - point.y) - ball.r * ball.r;
	var t = objectSizes.solve(a,b,c);
	var collisionTime = false;
	if (typeof(t) === "Number") {
		return t;
	}
	else {
		if (t.first > 0 && t.first <= 1)
			collisionTime = t.first;
		if (t.second > 0 && t.second <= 1)
			if (!collisionTime || (collisionTime && collisionTime > t.second)) collisionTime = t.second;
		return collisionTime;
	}
};

objectSizes.lineToLineDetection = function(line1, line2) {
	if (line1.i * line2.j === line2.i * line1.j) return false;
	var o = {};
	if (line1.i !== 0) {
		if (line2.i !== 0)
			o.x = (line1.y0 - line2.y0 + line2.j * line2.x0 / line2.i - line1.j * 
				line1.x0 / line1.i) / (line2.j / line2.i - line1.j / line1.i);
		else
			o.x = line2.x0;
		o.y = line1.y0 + line1.j * (o.x - line1.x0) / line1.i;
	}
	else {
		o.x = line1.x0;
		o.y = line2.y0 + line2.j * (o.x - line2.x0) / line2.i;
	}
	
	return o;
};

objectSizes.lineSegmentToLineSegmentDetection = function(lineSegment1, lineSegment2) {
	var o = objectSizes.lineToLineDetection(new objectSizes.Line(lineSegment1.x1, lineSegment1.y1, lineSegment1.i, lineSegment1.j), 
		new objectSizes.Line(lineSegment2.x1, lineSegment2.y1, lineSegment2.i, lineSegment2.j));

	if (!o) return false;
	if ((o.x > lineSegment1.x1 && o.x > lineSegment1.x2) || (o.x < lineSegment1.x1 && o.x < lineSegment1.x2) || 
		(o.y > lineSegment1.y1 && o.y > lineSegment1.y2) || (o.y < lineSegment1.y1 && o.y < lineSegment1.y2))
		return false;
	if ((o.x > lineSegment2.x1 && o.x > lineSegment2.x2) || (o.x < lineSegment2.x1 && o.x < lineSegment2.x2) || 
		(o.y > lineSegment2.y1 && o.y > lineSegment2.y2) || (o.y < lineSegment2.y1 && o.y < lineSegment2.y2))
		return false;
	return o;
};

objectSizes.boxToBallDetection = function(box, ball) {
	var lineSegments = [
		new objectSizes.LineSegment(box.x, box.y, box.x + box.width, box.y),
		new objectSizes.LineSegment(box.x + box.width, box.y, box.x + box.width, box.y + box.height),
		new objectSizes.LineSegment(box.x, box.y + box.height, box.x + box.width, box.y + box.height),
		new objectSizes.LineSegment(box.x, box.y, box.x, box.y + box.height)
	];

	var points = [
		new objectSizes.Point(box.x, box.y),
		new objectSizes.Point(box.x + box.width, box.y),
		new objectSizes.Point(box.x, box.y + box.height),
		new objectSizes.Point(box.x + box.width, box.y + box.height)
	];

	var _t, delta_dx, delta_dy, speedNormal, intersection, liveVectorLength, sinLineSpeed, d, o;
	var normal = {};
	var speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
	var t = false;

	for (var i = 0; i < lineSegments.length; i++) {

		intersection = objectSizes.lineToLineDetection(
			new objectSizes.Line(lineSegments[i].x1, lineSegments[i].y1, lineSegments[i].i, lineSegments[i].j), 
			new objectSizes.Line(ball.x, ball.y, ball.dx, ball.dy)
		);

		if (!intersection) continue;

		liveVectorLength = Math.sqrt(lineSegments[i].i * lineSegments[i].i + lineSegments[i].j * lineSegments[i].j);
		sinLineSpeed = Math.abs(lineSegments[i].i * ball.dy - lineSegments[i].j * ball.dx) / (liveVectorLength * speed);
		d = ball.r / sinLineSpeed;
		o = {
			"x" : intersection.x - ball.dx * d / speed,
			"y" : intersection.y - ball.dy * d / speed
		};

		if (ball.dx !== 0)
			_t = (o.x - ball.x) / ball.dx;
		else
			_t = (o.y - ball.y) / ball.dy;

		if (_t >= 1 || _t < 0) _t = false;

		if (_t) {
			normal.i = -lineSegments[i].j;
			normal.j = lineSegments[i].i;
			if (normal.i * ball.dx + normal.j * ball.dy < 0) {
				normal.i *= -1;
				normal.j *= -1;
			}

			if (objectSizes.lineSegmentToLineSegmentDetection(lineSegments[i], new objectSizes.LineSegment(o.x, o.y, 
				o.x + normal.i * (ball.r + 100) / liveVectorLength, o.y + normal.j * (ball.r + 100) / liveVectorLength))) {
				
				if (!t || _t < t) {
					t = _t;
					speedNormal = speed * sinLineSpeed / liveVectorLength;
					delta_dx = - 2 * normal.i * speedNormal;
					delta_dy = - 2 * normal.j * speedNormal;
				}
			}
		}
	}

	for (var i = 0; i < points.length; i++) {
		_t = objectSizes.pointToBallDetection(points[i], ball);
		if (_t > 0.0001) {
			if (!t || _t < t) {
				t = _t;
				normal.i = t * ball.dx + ball.x - points[i].x;
				normal.j = t * ball.dy + ball.y - points[i].y;
				speedNormal = (ball.dx * normal.i + ball.dy * normal.j) / (ball.r * ball.r);
				delta_dx = -2 * normal.i * speedNormal;
				delta_dy = -2 * normal.j * speedNormal;
			}
		}
	}

	return t ? {
		"t" : t,
		"delta_dx" : delta_dx,
		"delta_dy" : delta_dy
	} : t;
}