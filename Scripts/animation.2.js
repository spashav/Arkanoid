// Конструктор анимации

function Animation (inputsettings) {

	this.settings = {
		"time" : 500,                       // время анимации
		"delayAnimation" : 0,               // задержка анимации
		"alteration" : {                    // объект, определяющий функцию изменения (может быть задан функцией)
			"type" : "bezier",              // тип функции изменения (bezier, path, differential)
			"alteraionFunction" : "linear", // функция изменения (строка или функция)
			"beginValue" : 0,               // начальное значение для bezier
			"finalValue" : 0,               // конечное значение для bezier
			"beginTime" : 0                 // начальное время для path
		},
		"render" : {                        // объект, определяющий функцию отрисовки (может быть задан функцией)
			"objectToAnimate" : undefined,  // объект, свойство которого будет изменяться
			"paramToAnimate" : undefined,   // свойство, которое будет изменяться
			"prefix" : undefined,           // префикс, который будет добавлен к числовому значению свойства (например, #333)
			"postfix" : "px"                // постфикс, который будет добавлен к числовому значению свойства (например, 10px)
		},
		"animateAgain" : false,             // если указано число, то определяет задержку повторной анимации
		"onStart" : undefined,              // функция, которая будет вызвана перед началом анимации
		"onEnd" : undefined                 // функция, которая будет вызвана после окончания анимации
	};

	// копирование inputsettings в настройки анимации
	for (prop in inputsettings) {
		if ((prop === "alteration" || prop === "render") && typeof(inputsettings[prop]) === "object") {
			for (innerprop in inputsettings[prop]) {
				if (this.settings[prop].hasOwnProperty(innerprop)) 
					this.settings[prop][innerprop] = inputsettings[prop][innerprop];
			}
		}
		else {
			if (this.settings.hasOwnProperty(prop)) 
				this.settings[prop] = inputsettings[prop];
		}
	}
	
	if (this.settings.animateAgain === true) this.settings.animateAgain = 0;

	// состояние анимации. этот объект можно использовать в пользовательских настройках анимации
	this.state = {
		"animationInverted" : false,                          // определяет направление анимации: прямой или обратный порядок 
		"animationDone" : false,                              // закончена ли анимация
		"currentTime" : 0,                                    // прошедшее время, включая время задержки
		"count" : 0,                                          // номер кадра
		"startTime" : false,                                  // время начала анимации
		"currentValue" : this.settings.alteration.beginValue, // текущее значение параметра
		"deltatime" : 0                                       // время между текущим кадром и предыдущим
	}
};

// функция изменения состояния
Animation.prototype.alter = function () {
	var settings = this.settings.alteration;
	var func;
	// время для расчета изменения состояния
	var t = this.state.animationInverted ? this.settings.time - this.state.currentTime + this.settings.delayAnimation : 
		this.state.currentTime - this.settings.delayAnimation;
	// текущее состояние
	var s = this.state.currentValue;

	if (typeof(settings) == "function")
		return settings(t, s);

	// определение функции изменения состояния
	if (typeof(settings.alteraionFunction) === "string")
		func = AnimationManager.alterationFuncs[settings.type][settings.alteraionFunction]();
	else if (typeof(settings.alteraionFunction) === "function")
		func = settings.alteraionFunction;
	else throw new Error("Invalid alteration function");


	if (settings.type == "bezier")
		return (settings.finalValue - settings.beginValue) * func(t/this.settings.time) + settings.beginValue;

	if (settings.type == "path")
		return func(t + settings.beginTime);

	if (settings.type == "differential")
		return s + func(t, s) * this.state.deltatime;

	throw new Error("Invalid alteration type");
};

Animation.prototype.render = function (x) {
	var settings = this.settings.render;
	var value = x;
	if (settings === undefined) return;

	if (typeof(settings) == "function")
		return settings(x);

	if (settings.prefix)
		value = settings.prefix + value;
	if (settings.postfix)
		value = value + settings.postfix;
	settings.objectToAnimate[settings.paramToAnimate] = value;
};

Animation.prototype.timing = function () {
	// Определение начального времени
	if (this.state.startTime === false)
		this.state.startTime = (new Date()).getTime();

	// Определенение изменения времени и общего прошедшего времени
	var currentDelta = this.state.deltatime;
	this.state.deltatime = (new Date()).getTime() - this.state.currentTime - this.state.startTime;
	if (this.state.deltatime > 30 && this.state.deltatime > 2 * currentDelta) {
		this.state.startTime = this.state.startTime + this.state.deltatime - 2 * currentDelta;
		this.state.deltatime = 2 * currentDelta;
	}

	this.state.currentTime += this.state.deltatime;

	// Задание времени последней анимации
	if (this.state.currentTime > this.settings.time + this.settings.delayAnimation) {
		this.state.deltatime -= this.settings.time + this.settings.delayAnimation - this.state.currentTime;
		this.state.currentTime = this.settings.time + this.settings.delayAnimation;
	}
	// Определение начала анимации и задание времени первой анимации
	if ((this.state.currentTime - this.state.deltatime < this.settings.delayAnimation) && 
		(this.state.currentTime > this.settings.delayAnimation))
		this.state.currentTime = this.settings.delayAnimation;
};

Animation.prototype.revert = function () {

	if (this.state.currentTime >= this.settings.delayAnimation) {
		this.state.startTime = this.state.startTime - this.settings.time + 2 * this.state.currentTime;
		this.state.currentTime = this.settings.time - this.state.currentTime - this.settings.delayAnimation;
		
		this.settings.delayAnimation = 0;

		this.state.animationInverted = this.state.animationInverted ? false : true;

		if (this.state.animationDone)
			AnimationManager.obj.add(this).start();
	}
};


function AnimationManager (inputsettings) {

	if (AnimationManager.hasOwnProperty("obj")) return AnimationManager.obj;

	this.settings = {
		"delay" : undefined,
		"onEndAll" : undefined,
		"funcPre" : undefined,
		"funcPost" : undefined,
		"autostart" : false
	};

	for (prop in inputsettings)
		if (this.settings.hasOwnProperty(prop)) this.settings[prop] = inputsettings[prop];

	this.animations = [];
	this.done = true;
	this.currentTime;

	AnimationManager.obj = this;
};

AnimationManager.prototype.add = function (animation) {
	if (!(animation instanceof Animation)) throw new Error("Сan't add not Animation objects");

	animation.state.startTime = false;
	animation.state.count = 0;
	animation.state.animationDone = false;

	this.animations.push(animation);
	if (this.settings.autostart && this.done) {
		this.done = false;
		var th = this;
		window.requestAnimationFrame(function() { th.animate(); });
	}
	return this;
};

AnimationManager.prototype.remove = function (animation) {
	this.animations = this.animations.filter (function (x) { return (x !== animation)});
	return this;
};


AnimationManager.prototype.freeze = function (animation) {
	animation.state.freezed = true;
	return this;
};

AnimationManager.prototype.unfreeze = function (animation) {
	if (animation.state.freezed) {
		animation.startTime += (new Date()).getTime() - animation.startTime - animation.currentTime;
		animation.state.freezed = false;
	}
	return this;
};

AnimationManager.prototype.start = function () {
	if (this.done) {
		this.done = false;
		var th = this;
		window.requestAnimationFrame(function() { th.animate(); });
	}
	return this;
};

AnimationManager.prototype.animate = function () {

	if (typeof(this.settings.funcPre) === "function") this.settings.funcPre();


	for (var i = 0; i < this.animations.length; i++) {

		var animation = this.animations[i];
		var settings = animation.settings;
		var state = animation.state;

		if (state.freezed) continue;
		
		animation.timing();

		// анимация 
		if (state.currentTime >= settings.delayAnimation) {
			if (state.count === 0 && typeof(settings.onStart) === "function")
				settings.onStart();

			state.count++;

			state.currentValue = animation.alter();
			if (animation.render) animation.render(state.currentValue);
		}

		// конец анимации
		if (state.currentTime >= settings.time + settings.delayAnimation) {
			if (typeof(settings.animateAgain) === "number") {
				state.startTime = false;
				state.currentTime = 0;
				state.count = 0;
				settings.delayAnimation = settings.animateAgain;
			}
			else {
				state.animationDone = true;
				this.remove(animation);
				i--;
			}

			if (typeof(settings.onEnd) === "function") settings.onEnd();
		}
	}

	if (typeof(this.settings.funcPost) === "function") this.settings.funcPost();

	if (this.animations.length > 0) {
		var th = this;
		this.requestID = window.requestAnimationFrame(function() { th.animate(); });
	}
	else {
		if (typeof(this.settings.onEndAll) === "function")
			this.settings.onEndAll();
		this.done = true;
	}
};

AnimationManager.alterationFuncs = {
	"bezier" : {
		"noanimate" : function () { return function (x) { return 0; }; },
		"linear"    : function () { return function (x) { return x; }; },
		"sqrt"      : function () { return function (x) { return Math.sqrt(x); }; },
		"bezier" : function (x1, y1, x2, y2) {
			var x1 = x1 || 0, x2 = x2 || 0, y1 = y1 || 0, y2 = y2 || 0;
			return function (x) {
				return x;
			};
		},
		"oscillations" : function (inputsettings) {
			var settings = {
				"number" : 1,
				"attenuation" : 0,
				"initialPos" : 0,
				"func" : AnimationManager.alterationFuncs.bezier.noanimate()
			};
			for (prop in inputsettings)
				if (settings.hasOwnProperty(prop)) settings[prop] = inputsettings[prop];
			return function (x) {
				return Math.exp(-1 * settings.attenuation * x) * Math.sin((x * settings.number + 
					settings.initialPos/180) * Math.PI) + Math.min(1,settings.func(x) * settings.number);
			};
		},
		"sin" : function (inputsettings) {
			return this.oscillations(inputsettings);
		},
		"cos" : function (inputsettings) {
			inputsettings.initialPos = 90;
			return this.oscillations(inputsettings);
		}
	},
	"path" : {           // s(t) = f(t)
		"linear" : function (scale) { 
			var scale = scale || 2;
			return function (t) { return t/scale; }; },
		"fall" : function (x0, v0, scale) {
			var x0 = x0 || 0;
			var v0 = v0 || 0;
			var scale = scale || 1;
			scale *= 100000;
			x0 *= scale;
			v0 *= scale / 100;
			return function (t) {
				return ((-9.8/2) * t * t + v0 * t + x0)/scale;
			};
		}
	},  
	"differential" : {   // ds/dt = f(t,s)
		"linear" : function () { return function (t, s) { return 1; }; }
	}
};


function SVGanimation (render, animateAgain, baseTime) {
	var th = this;
	Animation.call(this, {
		"time" : 0,
		"alteration" : function(t) {
			var time = 0;
			if (th.animations.length > 0) {
				for (var i = 0; i < th.animations.length; i++) {
					var anim = th.animations[i];
					time += anim.time;
					if (t <= time) {
						if (t - th.state.deltatime < time - anim.time)
							return anim.alter(0);
						else
							return anim.alter(t - time + anim.time);
					}
				}
			}
			else return false;
		},
		"render" : render,
		"animateAgain" : animateAgain || false
	});
	this.animations = [];
	this.paths = [];
	this.x = 0;
	this.y = 0;
	this.baseTime = baseTime || 10;
};

SVGanimation.prototype = Object.create(Animation.prototype);
SVGanimation.prototype.constructor = SVGanimation;

SVGanimation.lineTo = function(x1, y1, x2, y2, time) {
	function calc(t) {
		var newstate = Object.create(null);
		newstate.x = (x2 - x1) * t + x1;
		newstate.y = (y2 - y1) * t + y1;
		return newstate;
	}

	var values = {};
	var step = 100;

	for (var i = 0; i <= step; i ++)
		values[i] = calc(i / step);

	return function (t) {
		if (time !== 0) 
			return values[Math.floor(step * t / time)];
		return undefined;
	};
};

SVGanimation.cubicCurveTo = function(mx, my, x1, y1, x2, y2, x, y, time) { // cubic bezier
	function calc(t) {
		var newstate = Object.create(null);
		newstate.x = (1 - t) * (1 - t) * (1 - t) * mx + 3 * (1 - t) * (1 - t) * t * x1 + 3 * (1 - t) * t * t * x2 + t * t * t * x;
		newstate.y = (1 - t) * (1 - t) * (1 - t) * my + 3 * (1 - t) * (1 - t) * t * y1 + 3 * (1 - t) * t * t * y2 + t * t * t * y;
		return newstate;
	}

	var values = {};
	var step = 100;

	for (var i = 0; i <= step; i ++)
		values[i] = calc(i / step);

	return function (t) {
		if (time !== 0) 
			return values[Math.floor(step * t / time)];
		return undefined;
	};
};

SVGanimation.quadraticCurveTo = function(mx, my, x1, y1, x, y, time) { // cubic bezier
	function calc(t) {
		var newstate = Object.create(null);
		newstate.x = (1 - t) * (1 - t) * mx + 2 * (1 - t) * t * x1 + t * t * x;
		newstate.y = (1 - t) * (1 - t) * my + 2 * (1 - t) * t * y1 + t * t * y;
		return newstate;
	}

	var values = {};
	var step = 100;

	for (var i = 0; i <= step; i ++)
		values[i] = calc(i / step);

	return function (t) {
		if (time !== 0) 
			return values[Math.floor(step * t / time)];
		return undefined;
	};
};

SVGanimation.ellipticalArc = function(_x1, _y1, r1, r2, rotation, largeFlag, sweepFlag, _x2, _y2, time) {
	// rotation
	rotation = - Math.PI * rotation / 180;
	var x1 = _x1 * Math.cos(rotation) - _y1 * Math.sin(rotation);
	var x2 = _x2 * Math.cos(rotation) - _y2 * Math.sin(rotation);
	var y1 = _y1 * Math.cos(rotation) + _x1 * Math.sin(rotation);
	var y2 = _y2 * Math.cos(rotation) + _x2 * Math.sin(rotation);

	var a, b, x0, y0, t1, t2, direction; // x0, y0 - ellipse center

	function solve(a, b, c) { // a * x * x + b * x + c = 0
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

	if (x1 !== x2) {
		a = (r1 * r1 * (y1 - y2)) / (r2 * r2 * (x2 - x1)); // x0 = a * y0 + b
		b = (r1 * r1 * (y1 * y1 - y2 * y2) + r2 * r2 * (x1 * x1 - x2 * x2)) / (2 * r2 * r2 * (x1 - x2));
		y0 = solve(a * a * r2 * r2 + r1 * r1, 2 * a * (b - x1) * r2 * r2 - 2 * y1 * r1 * r1, 
			(b - x1) * (b - x1) * r2 * r2 + y1 * y1 * r1 * r1 - r1 * r1 * r2 * r2);
		if (y0) {
			if (typeof y0 == "object") {
				x0 = a * y0.first + b;
				var direction = (x0 - x1) * (y2 - y1) - (x2 - x1) * (y0.first - y1);
				if (direction > 0) {
					if ((largeFlag == 0 && sweepFlag == 0) || (largeFlag == 1 && sweepFlag == 1))
						y0 = y0.first;
					else
						y0 = y0.second;
				}
				else {
					if ((largeFlag == 1 && sweepFlag == 0) || (largeFlag == 0 && sweepFlag == 1))
						y0 = y0.first;
					else
						y0 = y0.second;
				}
			}
		}
		else return false;
		x0 = a * y0 + b;
	}
	else if (y1 !== y2) {
		y0 = (y1 + y2) / 2;
		x0 = solve(4 * r2 * r2, -8 * x1 * r2 * r2, 4 * r2 * r2 * x1 * x1 + r1 * r1 * (y1 - y2) * (y1 - y2) - 4 * r1 * r1 * r2 * r2);
		if (x0) {
			if (typeof x0 == "object") {
				var direction = (x0.first - x1) * (y2 - y1) - (x2 - x1) * (y0 - y1);
				if (direction > 0) {
					if ((largeFlag == 0 && sweepFlag == 0) || (largeFlag == 1 && sweepFlag == 1))
						x0 = x0.first;
					else
						x0 = x0.second;
				}
				else {
					if ((largeFlag == 1 && sweepFlag == 0) || (largeFlag == 0 && sweepFlag == 1))
						x0 = x0.first;
					else
						x0 = x0.second;
				}
			}
		}
		else return false;
	}
	else return false;

	t1 = Math.acos((x1 - x0) / r1); // x = r1 * cos(t), y = r2 * sin(t) - ellipse
	if ((y1 - y0) / r2 < 0) 
	 	t1 = 2 * Math.PI - t1;

	t2 = Math.acos((x2 - x0) / r1);
	if ((y2 - y0) / r2 < 0) 
		t2 = 2 * Math.PI - t2;

	if (Math.abs(t1 - t2) > Math.PI) {
		if (!largeFlag) {
			t1 += 2 * Math.PI;
		}
	}
	else {
		if (largeFlag) {
			t2 -= 2 * Math.PI;
		}
	}

	function calc(t) {
		var newstate = Object.create(null);
		var x = x0 + r1 * Math.cos((t2 - t1) * t + t1);
		var y = y0 + r2 * Math.sin((t2 - t1) * t + t1);
		newstate.x = x * Math.cos(-rotation) - y * Math.sin(-rotation);
		newstate.y = y * Math.cos(-rotation) + x * Math.sin(-rotation);
		return newstate;
	}

	var values = {};
	var step = 100;

	for (var i = 0; i <= step; i ++)
		values[i] = calc(i / step);

	return function (t) {
		if (time !== 0) 
			return values[Math.floor(step * t / time)];
		return undefined;
	};
};

SVGanimation.calculatePathLength = function (path, dt) {
	var state = path(0), l = 0;
	var next;
	for (var t = dt; t <= 1000; t += dt) {
		next = path(t);
		l += Math.sqrt((state.x - next.x) * (state.x - next.x) + (state.y - next.y) * (state.y - next.y));
		state = next;
	}
	return l;
};

SVGanimation.prototype.pathTo = function(type) {
	var pathTime;

	switch (type) {
		case "M":
			this.x = arguments[1];
			this.y = arguments[2];
			break;
		case "m":
			this.x += arguments[1];
			this.y += arguments[2];
			break;	
		case "L":
			time = arguments[3] || this.baseTime * SVGanimation.calculatePathLength(
				SVGanimation.lineTo(this.x, this.y, arguments[1], arguments[2], 1000), 10);
			this.settings.time += time;
			this.animations.push({
				"time" : time,
				"alter" : SVGanimation.lineTo(this.x, this.y, arguments[1], arguments[2], time)
			});
			this.x = arguments[1];
			this.y = arguments[2];
			break;	
		case "l":
			time = arguments[3] || this.baseTime * SVGanimation.calculatePathLength(
				SVGanimation.lineTo(this.x, this.y, this.x + arguments[1], this.y + arguments[2], 1000), 10);
			this.settings.time += time;
			this.animations.push({
				"time" : time,
				"alter" : SVGanimation.lineTo(this.x, this.y, this.x + arguments[1], this.y + arguments[2], time)
			});
			this.x += arguments[1];
			this.y += arguments[2];
			break;
		case "H":
			time = arguments[2] || this.baseTime * SVGanimation.calculatePathLength(
				SVGanimation.lineTo(this.x, this.y, arguments[1], this.y, 1000), 10);
			this.settings.time += time;
			this.animations.push({
				"time" : time,
				"alter" : SVGanimation.lineTo(this.x, this.y, arguments[1], this.y, time)
			});
			this.x = arguments[1];
			break;
		case "h":
			time = arguments[2] || this.baseTime * SVGanimation.calculatePathLength(
				SVGanimation.lineTo(this.x, this.y, this.x + arguments[1], this.y, 1000), 10);
			this.settings.time += time;
			this.animations.push({
				"time" : time,
				"alter" : SVGanimation.lineTo(this.x, this.y, this.x + arguments[1], this.y, time)
			});
			this.x += arguments[1];
			break;
		case "V":
			time = arguments[2] || this.baseTime * SVGanimation.calculatePathLength(
				SVGanimation.lineTo(this.x, this.y, this.x, arguments[1], 1000), 10);
			this.settings.time += time;
			this.animations.push({
				"time" : time,
				"alter" : SVGanimation.lineTo(this.x, this.y, this.x, arguments[1], time)
			});
			this.y = arguments[1];
			break;
		case "v":
			time = arguments[2] || this.baseTime * SVGanimation.calculatePathLength(
				SVGanimation.lineTo(this.x, this.y, this.x, this.y + arguments[1], 1000), 10);
			this.settings.time += time;
			this.animations.push({
				"time" : time,
				"alter" : SVGanimation.lineTo(this.x, this.y, this.x, this.y + arguments[1], time)
			});
			this.y += arguments[1];
			break;
		case "A": // Elliptical Arc
			time = arguments[8] || this.baseTime * SVGanimation.calculatePathLength(
				SVGanimation.ellipticalArc(this.x, this.y, arguments[1], arguments[2], arguments[3], arguments[4], 
					arguments[5], arguments[6], arguments[7], 1000), 10);
			this.settings.time += time;
			this.animations.push({
				"time" : time,
				"alter" : SVGanimation.ellipticalArc(this.x, this.y, arguments[1], arguments[2], arguments[3], arguments[4], 
					arguments[5], arguments[6], arguments[7], time)
			});
			this.x = arguments[6];
			this.y = arguments[7];
			break;
		case "a": // Elliptical Arc
			time = arguments[8] || this.baseTime * SVGanimation.calculatePathLength(
				SVGanimation.ellipticalArc(this.x, this.y, arguments[1], arguments[2], arguments[3], arguments[4], 
					arguments[5], this.x + arguments[6], this.y + arguments[7], 1000), 10);
			this.settings.time += time;
			this.animations.push({
				"time" : time,
				"alter" : SVGanimation.ellipticalArc(this.x, this.y, arguments[1], arguments[2], arguments[3], arguments[4], 
					arguments[5], this.x + arguments[6], this.y + arguments[7], time)
			});
			this.x += arguments[6];
			this.y += arguments[7];
			break;
		case "C": // cubic bezier
			time = arguments[7] || this.baseTime * SVGanimation.calculatePathLength(
				SVGanimation.cubicCurveTo(this.x, this.y, arguments[1], arguments[2], arguments[3], arguments[4], 
					arguments[5], arguments[6], 1000), 10);
			this.settings.time += time;
			this.animations.push({
				"time" : time,
				"alter" : SVGanimation.cubicCurveTo(this.x, this.y, arguments[1], arguments[2], arguments[3], arguments[4], 
					arguments[5], arguments[6], time)
			});
			this.x = arguments[5];
			this.y = arguments[6];
			break;
		case "c": // cubic bezier
			time = arguments[7] || this.baseTime * SVGanimation.calculatePathLength(
				SVGanimation.cubicCurveTo(this.x, this.y, this.x + arguments[1], this.y + arguments[2], 
					this.x + arguments[3], this.y + arguments[4], this.x + arguments[5], this.y + arguments[6], 1000), 10);
			this.settings.time += time;
			this.animations.push({
				"time" : time,
				"alter" : SVGanimation.cubicCurveTo(this.x, this.y, this.x + arguments[1], this.y + arguments[2], 
					this.x + arguments[3], this.y + arguments[4], this.x + arguments[5], this.y + arguments[6], time)
			});
			this.x += arguments[5];
			this.y += arguments[6];
			break;
		case "S": // smooth cubic bezier
			if (this.paths.length == 0) return this;
			var path = this.paths[this.paths.length - 1];
			var x, y;
			if (path[0] == "C" || path[0] == "S" || path[0] == "T" || path[0] == "Q") {
				x = this.x + this.x - path[path.length - 5];
				y = this.y + this.y - path[path.length - 4];
			}
			else if (path[0] == "c" || path[0] == "s" || path[0] == "t" || path[0] == "q") {
				x = this.x + this.x - path[path.length - 5] - this.paths[this.paths.length - 2][1];
				y = this.y + this.y - path[path.length - 4] - this.paths[this.paths.length - 2][2];
			}
			else return this;

			time = arguments[5] || this.baseTime * SVGanimation.calculatePathLength(
				SVGanimation.cubicCurveTo(this.x, this.y, x, y, arguments[1], arguments[2], 
					arguments[3], arguments[4], 1000), 10);
			this.settings.time += time;
			this.animations.push({
				"time" : time,
				"alter" : SVGanimation.cubicCurveTo(this.x, this.y, x, y, arguments[1], arguments[2], 
					arguments[3], arguments[4], time)
			});
			this.x = arguments[3];
			this.y = arguments[4];
			break;
		case "s": // smooth cubic bezier
			if (this.paths.length == 0) return this;
			var path = this.paths[this.paths.length - 1];
			var x, y;
			if (path[0] == "C" || path[0] == "S" || path[0] == "T" || path[0] == "Q") {
				x = this.x - path[path.length - 5];
				y = this.y - path[path.length - 4];
			}
			else if (path[0] == "c" || path[0] == "s" || path[0] == "t" || path[0] == "q") {
				x = path[path.length - 3] - path[path.length - 5];
				y = path[path.length - 2] - path[path.length - 4];
			}
			else return this;

			time = arguments[5] || this.baseTime * SVGanimation.calculatePathLength(
				SVGanimation.cubicCurveTo(this.x, this.y, this.x + x, this.y + y, this.x + arguments[1], 
					this.y + arguments[2], this.x + arguments[3], this.y + arguments[4], 1000), 10);
			this.settings.time += time;
			this.animations.push({
				"time" : time,
				"alter" : SVGanimation.cubicCurveTo(this.x, this.y, this.x + x, this.y + y, this.x + arguments[1], 
					this.y + arguments[2], this.x + arguments[3], this.y + arguments[4], time)
			});
			this.x += arguments[3];
			this.y += arguments[4];
			break;
		case "Q": // quadratic bezier
			time = arguments[5] || this.baseTime * SVGanimation.calculatePathLength(
				SVGanimation.quadraticCurveTo(this.x, this.y, arguments[1], arguments[2], arguments[3], arguments[4], 1000), 10);
			this.settings.time += time;
			this.animations.push({
				"time" : time,
				"alter" : SVGanimation.quadraticCurveTo(this.x, this.y, arguments[1], arguments[2], arguments[3], arguments[4], 
					time)
			});
			this.x = arguments[3];
			this.y = arguments[4];
			break;
		case "q": // quadratic bezier
			time = arguments[5] || this.baseTime * SVGanimation.calculatePathLength(
				SVGanimation.quadraticCurveTo(this.x, this.y, this.x + arguments[1], this.y + arguments[2], 
					this.x + arguments[3], this.y + arguments[4], 1000), 10);
			this.settings.time += time;
			this.animations.push({
				"time" : time,
				"alter" : SVGanimation.quadraticCurveTo(this.x, this.y, this.x + arguments[1], this.y + arguments[2], 
					this.x + arguments[3], this.y + arguments[4], time)
			});
			this.x += arguments[3];
			this.y += arguments[4];
			break;
		case "T": // smooth quadratic bezier
			if (this.paths.length == 0) return this;
			var path = this.paths[this.paths.length - 1];
			var x, y;
			if (path[0] == "C" || path[0] == "S" || path[0] == "T" || path[0] == "Q") {
				x = this.x + this.x - path[path.length - 5];
				y = this.y + this.y - path[path.length - 4];
			}
			else if (path[0] == "c" || path[0] == "s" || path[0] == "t" || path[0] == "q") {
				x = this.x + this.x - path[path.length - 5] - this.paths[this.paths.length - 2][1];
				y = this.y + this.y - path[path.length - 4] - this.paths[this.paths.length - 2][2];
			}
			else return this;

			time = arguments[3] || this.baseTime * SVGanimation.calculatePathLength(
				SVGanimation.quadraticCurveTo(this.x, this.y, x, y, arguments[1], arguments[2], 1000), 10);
			this.settings.time += time;
			this.animations.push({
				"time" : time,
				"alter" : SVGanimation.quadraticCurveTo(this.x, this.y, x, y, arguments[1], arguments[2], time),
			});
			this.x = arguments[1];
			this.y = arguments[2];
			break;
		case "t": // smooth quadratic bezier
			if (this.paths.length == 0) return this;
			var path = this.paths[this.paths.length - 1];
			var x, y;
			if (path[0] == "C" || path[0] == "S" || path[0] == "T" || path[0] == "Q") {
				x = this.x - path[path.length - 5];
				y = this.y - path[path.length - 4];
			}
			else if (path[0] == "c" || path[0] == "s" || path[0] == "t" || path[0] == "q") {
				x = path[path.length - 3] - path[path.length - 5];
				y = path[path.length - 2] - path[path.length - 4];
			}
			else return this;

			time = arguments[3] || this.baseTime * SVGanimation.calculatePathLength(
				SVGanimation.quadraticCurveTo(this.x, this.y, this.x + x, this.y + y, this.x + arguments[1], 
					this.y + arguments[2], 1000), 10);
			this.settings.time += time;
			this.animations.push({
				"time" : time,
				"alter" : SVGanimation.quadraticCurveTo(this.x, this.y, this.x + x, this.y + y, this.x + arguments[1], 
					this.y + arguments[2], time)
			});
			this.x += arguments[1];
			this.y += arguments[2];
			break;
		case "Z":
			break;
		case "z":
			break;
	}

	this.paths.push(Array.prototype.slice.call(arguments, 0));
	return this;
};

SVGanimation.prototype.parse = function(s) {
	var pattern = /[a-zA-Z]{1}[0-9.,-]+/g;
	var paths = s.match(pattern);
	for (var i = 0; i < paths.length; i++) {
		pattern = /-{0,1}[0-9.]+|[a-zA-Z]+/g;
		var arg = paths[i].match(pattern);
		for (var j = 1; j < arg.length; j++) {
			arg[j] = parseFloat(arg[j]);
		}
		// if (arg[0] !== "M" && arg[0] !== "m" && arg[0] !== "Z" && arg[0] !== "z") 
		// 	Array.prototype.push.call(arg, time || 1000);
		this.pathTo.apply(this, arg);
	}
};