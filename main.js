  // <script type="text/javascript" src="scripts/animation.2.js"></script>

  // <script type="text/javascript" src="scripts/objects.js"></script>
  // <script type="text/javascript" src="scripts/sizes.js"></script>
  // <script type="text/javascript" src="scripts/walls.js"></script>
  // <script type="text/javascript" src="scripts/plates.js"></script>
  // <script type="text/javascript" src="scripts/targets.js"></script>
  // <script type="text/javascript" src="scripts/balls.js"></script>
  // <script type="text/javascript" src="scripts/dynamic.js"></script>
  // <script type="text/javascript" src="scripts/background.js"></script>
  // <script type="text/javascript" src="scripts/bonuses.js"></script>
  // <script type="text/javascript" src="scripts/init.js"></script>
  // <script type="text/javascript" src="scripts/initStartMenu.js"></script>
  // <script type="text/javascript" src="scripts/levels.js"></script>
  // <script type="text/javascript" src="scripts/particles.js"></script>
  // <script type="text/javascript" src="scripts/main.js"></script>
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
    //  Array.prototype.push.call(arg, time || 1000);
    this.pathTo.apply(this, arg);
  }
};

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

Arkanoid.Background = function() {
  this.canvas = Arkanoid.obj.canvas;
  this.context = Arkanoid.obj.context;
};

Arkanoid.Background.prototype.print = function() {
  throw new Error("Abstract method");
};

Arkanoid.Background.prototype.changeState = function() {
  throw new Error("Abstract method");
};

Arkanoid.ParticleBackground = function(n ,radius, maxSpeed, dist, ballX, ballY) {
  Arkanoid.Background.apply(this, arguments);
  this.particles = new ParticlesManadger(dist, ballX, ballY);
  this.particles.setCanvas(this.canvas);

  for (var i = 0; i < n; i++) {
    this.particles.addParticle(Math.floor(Math.random() * (this.canvas.width + 1)), 
      Math.floor(Math.random() * (this.canvas.height + 1)), radius);
    this.particles.p[i].dx = Math.random() * (2 * maxSpeed + 1) - maxSpeed;
    this.particles.p[i].dy = Math.random() * (2 * maxSpeed + 1) - maxSpeed;
  }
};

Arkanoid.ParticleBackground.prototype = Object.create(Arkanoid.Background.prototype);
Arkanoid.ParticleBackground.prototype.constructor = Arkanoid.ParticleBackground;

Arkanoid.ParticleBackground.prototype.print = function() {
  this.particles.render();
};

Arkanoid.ParticleBackground.prototype.changeState = function(ball) {
  var th = this;
  
  return function(t, s) {
    th.particles.updateLinear(ball.x, ball.y);
  }
};

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


// Initialization
Arkanoid.prototype.initObjects = function () {
  var canvas = this.canvas;
  var head = document.getElementsByTagName("head")[0];
  var styleElt = document.createElement("style");
  head.appendChild(styleElt);

  this.gameState = {
    state : undefined, // "begin", "play", "win", "lose"
    hold : undefined,
    live : undefined,
    score : undefined,
    addScore : []
  };

  function initCanvasSize() {
    var viewportHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
    var viewportWidth = window.innerWidth || document.documentElement.clientWidthht || document.body.clientWidth;
    var scaleH =  canvas.height / viewportHeight;
    var scaleW =  canvas.width / viewportWidth;

    if (scaleW < scaleH) 
      canvas.style.width = (canvas.width / scaleH) + "px";
    else 
      canvas.style.width = viewportWidth + "px";

    var hdControl = document.querySelector(".control .btn");
    document.getElementsByClassName("control")[0].style.width = canvas.style.width;
    var hdControlWidth = window.getComputedStyle(hdControl, null).width;
    hdControl.style.height = hdControlWidth;

    if(parseInt(canvas.style.width) < 800) { // 600 - 800
      styleElt.innerHTML = ".control .btn  {font-size: 1.2rem;}";
    }
    else { // > 800
      styleElt.innerHTML = ".control .btn  {font-size: 1.6rem;}";
      styleElt.innerHTML += ".control .btn:hover::after { width: 200px; left: calc(50% - 99px); font-size: 1rem; }";
      styleElt.innerHTML += ".control .btn:hover::before { width: 200px; left: calc(50% - 99px); font-size: 1rem; }";
    }
  };
  initCanvasSize();

  window.onresize = initCanvasSize;

  // init objects
  
  // init walls

  this.objects.wallsPacks = [];
  var walls =  new Arkanoid.WallsPack();
  walls.addBoxWall(0, 0, 1, 0.01).addBoxWall(0, 0, 0.005, 1).addBoxWall(0.995, 0, 0.005, 1);
  this.objects.wallsPacks.push(walls);

  // init plates

  this.objects.plates = [];
  this.objects.plates.push(new Arkanoid.Plate());

  // init balls

  this.objects.balls = [];
  this.objects.balls.push(new Arkanoid.Ball(20, this.objects.plates[0].x + this.objects.plates[0].width / 2,
    this.objects.plates[0].y - 20 * this.scale, 12));

  // init targets

  this.objects.targets = [];
  this.objects.targets.push(new Arkanoid.Targets(15,"#eeb142",this.objects.wallsPacks[0]));

  // init backgrounds

  this.objects.backgrounds = [];
  this.objects.backgrounds.push(new Arkanoid.ParticleBackground(150, 6, 2, 300, this.objects.balls[0].posX, this.objects.balls[0].posY));

  this.objects.bonuses = new Arkanoid.BonusesManager();

  
  var wrap = document.getElementsByClassName("wrapper");
  if (wrap.length > 0) wrap[0].style.background = this.objects.wallsPacks[0].color;

  this.gameState.state = "begin";

  //Malayalam Sangam MN
  this.words = {};

  this.words.begin = [];

  this.words.begin.push("M402.1,567.5l147.1-399.2h58.3l149.7,403.5");
  this.words.begin.push("M790.3,567.5V255.3");
  this.words.begin.push("M969.2,567.5V166");
  this.words.begin.push("M1268,357.5c0.8-14.2,4.6-26.4,11.5-36.6c6.9-10.2,15.7-18.7,26.2-25.4c10.6-6.7,22.4-11.7,35.5-15 c13.1-3.3,26-4.9,38.7-4.9c14.2,0,28,1.5,41.2,4.6c13.3,3.1,25.1,8,35.5,14.7c10.4,6.7,18.7,15.5,24.8,26.2 c6.1,10.8,9.2,23.9,9.2,39.2v168.2c0,6.2,2,46.4,6.1,51.6c4,5.2,8.9,7.8,14.7,7.8c1.9,0,3.9-0.3,6.1-0.9");
  this.words.begin.push("M1628.6,324.1c14.6-17.3,30.6-29.7,47.9-37.2c17.3-7.5,35-11.2,53.1-11.2c27.3,0,48.5,7.7,63.5,23.1 c15,15.4,22.5,36.3,22.5,62.9v214.6");
  this.words.begin.push("M1876.6,424.5c0-20.4,2.9-39.6,8.7-57.7c5.8-18.1,14.1-33.8,25.1-47.3c11-13.5,24.5-24.1,40.7-32 c16.2-7.9,34.6-11.8,55.4-11.8c20.8,0,39.3,3.9,55.7,11.8c16.3,7.9,30.1,18.6,41.2,32c11.2,13.5,19.6,29.2,25.4,47.3 c5.8,18.1,8.7,37.3,8.7,57.7c0,20.4-2.9,39.6-8.7,57.7c-5.8,18.1-14.2,33.8-25.4,47.3c-11.2,13.5-24.9,24-41.2,31.7 c-16.4,7.7-34.9,11.5-55.7,11.5c-20.8,0-39.2-3.8-55.4-11.5c-16.2-7.7-29.7-18.3-40.7-31.7c-11-13.5-19.3-29.2-25.1-47.3 C1879.5,464.1,1876.6,444.8,1876.6,424.5z");
  this.words.begin.push("M2208.9,567.5V272.2");
  this.words.begin.push("M2483.5,561.5c-14.2,8.3-28.8,12.4-43.8,12.4c-19.6,0-36.8-3.8-51.6-11.5c-14.8-7.7-27.2-18.3-37.2-31.7 c-10-13.5-17.6-29.2-22.8-47.3c-5.2-18.1-7.8-37.5-7.8-58.3c0-20.8,2.5-40.2,7.5-58.3c5-18.1,12.5-33.8,22.5-47.3 c10-13.5,22.3-24.1,36.9-32c14.6-7.9,31.7-11.8,51.3-11.8c6.9,0,14.1,1.2,21.6,3.5c7.5,2.3,14.8,5.6,21.9,9.8 c7.1,4.2,19.7,13.5,26.2,19");
  this.words.begin.push("M646.7,429.4H453");
  this.words.begin.push("M790.3,327.7C829,266,873,275.6,904.6,275.6c3.1,0,6.3,0.3,9.8,0.9c3.5,0.6,6.7,1.4,9.8,2.6");
  this.words.begin.push("M1011.9,413.5l155.6-152.3");
  this.words.begin.push("M1202.7,586.5l-112-195.8l-78.8,78.8");
  this.words.begin.push("M1585.9,567.5V240.7");
  this.words.begin.push("M1452,517.9c-9.2,11.9-18.2,21.4-26.8,28.6c-8.7,7.1-17.4,12.7-26.2,16.7c-8.9,4-17.7,6.7-26.5,8.1c-8.9,1.3-17.9,2-27.1,2 c-11.9,0-23-1.9-33.2-5.8c-10.2-3.8-19.1-9.2-26.8-16.2c-7.7-6.9-13.8-15.4-18.2-25.4c-4.4-10-6.6-21.1-6.6-33.5 c0-16.2,4.6-29.4,13.8-39.8c9.2-10.4,20.8-18.8,34.6-25.4c13.8-6.5,28.9-11.9,45.3-16.2c16.3-4.2,31.4-8.5,45.3-12.7 c13.8-4.2,56.6-27.4,65.8-33.2");
  this.words.begin.push("M2233.7,166v49.6h-42.1V166H2233.7z");
  this.words.begin.push("M2524,166v401.5");
  this.words.begin.high = 16;
  this.words.begin.push("M390.5,960.8V776.7");
  this.words.begin.push("M536.2,960.8V827.8");
  this.words.begin.push("M726.1,926.9c-1.4,6.6-3.7,10.8-7.1,16c-3.4,5.2-6.4,6.3-12.2,10.7c-4.1,3.1-10,5.1-15.9,6.9c-5.8,1.9-11.8,2.8-17.9,2.8 c-8.8,0-16.8-1.8-23.9-5.5c-7.1-3.6-13.2-8.5-18.3-14.7c-5.1-6.2-9-13.3-11.7-21.4c-2.7-8.1-4.1-16.8-4.1-25.9 c0-8.5,1.4-16.5,4.1-24.1c2.7-7.6,6.6-14.3,11.5-20.2c5-5.8,11-10.5,18.1-14c7.1-3.5,15.1-5.2,23.9-5.2c8.6,0,16.4,1.6,23.2,4.7 c6.9,3.1,12.7,7.4,17.5,12.8c4.8,5.4,8.5,11.9,11.2,19.4c2.6,7.5,2.8,4.1,2.8,12.9v7.4h-90.5");
  this.words.begin.push("M1207.1,1012.5V810");
  this.words.begin.push("M1577.7,951.1c-9.1,8.3-21.2,12.4-36,12.4c-9.5,0-17.6-2-24.4-6.1c-6.8-4.1-12.4-9.3-16.8-15.7c-4.4-6.4-7.7-13.7-9.8-21.8 c-2.1-8.1-3.2-16.2-3.2-24.4c0-8.8,1.3-17,3.9-24.7c2.6-7.7,6.3-14.4,11.2-20.2c4.8-5.8,10.7-10.2,17.5-13.5 c6.9-3.2,14.5-4.8,23-4.8c7.3,0,13.8,1,19.7,3c5.8,2,10.8,4.9,15,8.6c4.1,3.7,11.2,13.2,13.9,18.2");
  this.words.begin.push("M1728.2,928.7c-1.4,6.6-3.7,12.5-7.1,17.6c-3.4,5.2-5.1,4.8-9.8,8.4c-4.7,3.6-8.9,3.9-14.7,5.8c-5.8,1.9-11.8,2.8-17.9,2.8 c-8.8,0-16.8-1.8-23.9-5.5c-7.1-3.6-13.2-8.5-18.3-14.7c-5.1-6.2-9-13.3-11.7-21.4c-2.7-8.1-4.1-16.8-4.1-25.9 c0-8.5,1.4-16.5,4.1-24.1c2.7-7.6,6.6-14.3,11.5-20.2c5-5.8,11-10.5,18.1-14c7.1-3.5,15.1-5.2,23.9-5.2c8.6,0,16.4,1.6,23.2,4.7 c6.9,3.1,12.7,7.4,17.5,12.8c4.8,5.4,6.2,8.4,8.8,15.9c2.6,7.5,3.9,7.6,3.9,16.4v5.7H1638");
  this.words.begin.push("M1888.4,960.9c-4.9,1.6-10.2,2.4-16,2.4c-3.4,0-6.6-0.5-9.6-1.5c-3-1-5.8-2.7-8.1-5c-2.4-2.3-4.2-5.3-5.6-9 c-1.4-3.7-2-8.2-2-13.4V829.5l0,0v-19l0,0V766");
  this.words.begin.push("M1900.5,897.8c0-9,1.3-17.4,3.8-25.4c2.5-8,6.2-14.9,11-20.8c4.8-5.9,10.8-10.6,17.9-14.1c7.1-3.5,15.2-5.2,24.4-5.2 c9.1,0,17.3,1.7,24.5,5.2c7.2,3.5,13.2,8.2,18.1,14.1c4.9,5.9,8.6,12.9,11.2,20.8c2.5,8,3.8,16.4,3.8,25.4c0,9-1.3,17.4-3.8,25.4 c-2.5,8-6.3,14.9-11.2,20.8c-4.9,5.9-11,10.6-18.1,14c-7.2,3.4-15.4,5.1-24.5,5.1c-9.1,0-17.3-1.7-24.4-5.1c-7.1-3.4-13.1-8-17.9-14 c-4.8-5.9-8.5-12.9-11-20.8C1901.8,915.2,1900.5,906.8,1900.5,897.8z");
  this.words.begin.push("M2118.3,1012.5V805.9");
  this.words.begin.push("M2265,960.8V757.9");
  this.words.begin.push("M2545,834.6l-54.3,154.1c-1.7,4.9-6,13.8-8.3,17.3c-2.3,3.5-4.7,6.3-7.4,8.5c-2.6,2.2-5.2,3.8-7.9,4.7 c-2.6,0.9-5.2,1.4-7.7,1.4c-2.4,0-18.1-5.5-20.3-5.8");
  this.words.begin.push("M712.9,1265.4l64.7-175.6h25.6l72.1,198.1");
  this.words.begin.push("M959.9,1197.3h139.5");
  this.words.begin.push("M1201.5,1265.4v-126.2");
  this.words.begin.push("M1401.5,1202.4c0-9,1.3-17.4,3.8-25.4c2.5-8,6.2-14.9,11-20.8c4.8-5.9,10.8-10.6,17.9-14.1c7.1-3.5,15.2-5.2,24.4-5.2 c9.1,0,17.3,1.7,24.5,5.2c7.2,3.5,13.2,8.2,18.1,14.1c4.9,5.9,8.6,12.9,11.2,20.8c2.5,8,3.8,16.4,3.8,25.4c0,9-1.3,17.4-3.8,25.4 c-2.5,8-6.3,14.9-11.2,20.8c-4.9,5.9-11,10.6-18.1,14c-7.2,3.4-15.4,5.1-24.5,5.1c-9.1,0-17.3-1.7-24.4-5.1c-7.1-3.4-13.1-8-17.9-14 c-4.8-5.9-8.5-12.9-11-20.8C1402.8,1219.8,1401.5,1211.4,1401.5,1202.4z");
  this.words.begin.push("M1641.2,1135.8l-49.8,129.5h-20.3l-54.8-148.1");
  this.words.begin.push("M1760.4,1235.7c-1.4,6.6-3.7,12.5-7.1,17.6c-3.4,5.2-6.3,3.7-11,7.2c-4.7,3.6-8.9,2.7-14.7,4.6c-5.8,1.9-11.8,2.8-17.9,2.8 c-8.8,0-16.8-1.8-23.9-5.5c-7.1-3.6-13.2-8.5-18.3-14.7c-5.1-6.2-9-13.3-11.7-21.4c-2.7-8.1-4.1-16.8-4.1-25.9 c0-8.5,1.4-16.5,4.1-24.1c2.7-7.6,6.6-14.3,11.5-20.2c5-5.8,11-10.5,18.1-14c7.1-3.5,15.1-5.2,23.9-5.2c8.6,0,16.4,1.6,23.2,4.7 c6.9,3.1,12.7,7.4,17.5,12.8c4.8,5.4,6.2,9.5,8.8,17.1c2.6,7.5,3.9,6.4,3.9,15.2v7.4H1669");
  this.words.begin.push("M1878,1265.4v-208.4");
  this.words.begin.push("M2030.7,1229.8c-1.4,6.6-3.7,12.5-7.1,17.6c-3.4,5.2-5.1,6-9.8,9.6c-4.7,3.6-10,6.3-15.9,8.1c-5.8,1.9-11.8,2.8-17.9,2.8 c-8.8,0-16.8-1.8-23.9-5.5c-7.1-3.6-13.2-8.5-18.3-14.7c-5.1-6.2-9-13.3-11.7-21.4c-2.7-8.1-4.1-16.8-4.1-25.9 c0-8.5,1.4-16.5,4.1-24.1c2.7-7.6,6.6-14.3,11.5-20.2c5-5.8,11-10.5,18.1-14c7.1-3.5,15.1-5.2,23.9-5.2c8.6,0,16.4,1.6,23.2,4.7 c6.9,3.1,12.7,7.4,17.5,12.8c4.8,5.4,5,3.7,7.6,11.2c2.6,7.5,3.9,8.8,3.9,17.6v7.4h-90.4");
  this.words.begin.push("M663.5,1394.3h65.2c11.7,0,22.2,2.3,31.5,7c9.3,4.7,17.2,11,23.7,18.9c6.5,8,11.5,17.2,15.1,27.8 c3.6,10.6,5.3,21.9,5.3,33.9c0,12.5-1.9,24.1-5.6,34.8c-3.7,10.7-8.9,20-15.6,27.9c-6.7,8-14.6,14.2-23.9,18.7 c-9.2,4.5-19.4,6.7-30.6,6.7h-65.2V1394.3z");
  this.words.begin.push("M1348.6,1507c0-9,1.3-17.4,3.8-25.4c2.5-8,6.2-14.9,11-20.8c4.8-5.9,10.8-10.6,17.9-14.1c7.1-3.5,15.2-5.2,24.4-5.2 c9.1,0,17.3,1.7,24.5,5.2c7.2,3.5,13.2,8.2,18.1,14.1c4.9,5.9,8.6,12.9,11.2,20.8c2.5,8,3.8,16.4,3.8,25.4c0,9-1.3,17.4-3.8,25.4 c-2.5,8-6.3,14.9-11.2,20.8c-4.9,5.9-11,10.6-18.1,14c-7.2,3.4-15.4,5.1-24.5,5.1c-9.1,0-17.3-1.7-24.4-5.1c-7.1-3.4-13.1-8-17.9-14 c-4.8-5.9-8.5-12.9-11-20.8C1349.9,1524.4,1348.6,1516,1348.6,1507z");
  this.words.begin.push("M1588.3,1440.4l-49.8,129.5h-20.3l-56.5-152.6");
  this.words.begin.push("M1707.4,1539.1c-1.4,6.6-2.6,13.5-7.1,17.6c-4.1,3.8-6.3,3.7-11,7.2c-4.7,3.6-8.9,3.9-14.7,5.8c-5.8,1.9-11.8,2.8-17.9,2.8 c-8.8,0-16.8-1.8-23.9-5.5c-7.1-3.6-13.2-8.5-18.3-14.7c-5.1-6.2-9-13.3-11.7-21.4c-2.7-8.1-4.1-16.8-4.1-25.9 c0-8.5,1.4-16.5,4.1-24.1c2.7-7.6,6.6-14.3,11.5-20.2c5-5.8,11-10.5,18.1-14c7.1-3.5,15.1-5.2,23.9-5.2c8.6,0,16.4,1.6,23.2,4.7 c6.9,3.1,12.7,7.4,17.5,12.8c4.8,5.4,4.8,8.4,8.8,15.9c3.1,5.8,3.9,5.3,3.9,14.1v7.4h-93.9");
  this.words.begin.push("M1907.1,1570v-131.2");
  this.words.begin.push("M2057.3,1438.7V1573c0,8.6-1.5,16.3-4.4,23c-3,6.7-6.9,12.2-11.9,16.6c-5,4.4-10.7,7.7-17.1,10c-6.4,2.3-13,3.4-19.8,3.4 c-11.8,0-22.2-3-31.1-9.1c-8.9-6.1-15.6-15.8-20.2-29.2");
  this.words.begin.push("M2083.9,1570v-191.8");
  this.words.begin.push("M397.3,785.1h49.6c8.6,0,16.2,1.5,22.8,4.4c6.6,3,12.1,6.8,16.6,11.5c4.5,4.7,7.9,10.1,10.2,16.1c2.3,6,3.4,12,3.4,17.9 c0,6.4-1.2,12.7-3.6,18.7c-2.4,6-5.8,11.4-10.3,16.1c-4.5,4.7-10,8.5-16.6,11.3c-6.6,2.8-14.1,4.2-22.6,4.2h-58.5");
  this.words.begin.push("M536.2,862.2c11.7-26.9,36.4-29.9,50.3-29.9c1.4,0,2.8,0.1,4.3,0.4c1.5,0.3,3,0.6,4.3,1.1");
  this.words.begin.push("M850.2,863.7c0.5-12.9-10.3-23-18-26.1c-6-2.5-16.2-4.9-24.1-4.9c-9,0-21.4,3.1-28.3,8.9c-6,5.1-8.8,13.5-9.1,18.9 c-0.5,8.5,4,16.5,8.1,19.7c4.1,3.2,11.2,6.1,17.4,8.6c6.2,2.5,12.9,5,20.2,7.5c7.2,2.4,13.6,6.1,19.8,9.5c8.8,4.8,9.4,5.2,13.3,9.7 c2.2,2.5,4,5.1,5.1,11.4c1.2,7.6,0.4,10.5-2.6,15.9c-3,5.4-3,5.5-8.3,9.7c-4.8,3.9-4.8,4-14.1,7.2c-6.6,2.2-13.9,3.2-21.5,3.2 c-7.2,0-8.5,0-14.9-1.9c-4.4-1.3-6-1.1-11-4.7c-5.1-3.6-8.9-6.8-11.9-12.7c-3-5.8-4.6-10.7-4.8-18.5");
  this.words.begin.push("M970.3,863.7c0.5-12.9-10.3-23-18-26.1c-6-2.5-16.2-4.9-24.1-4.9c-9,0-21.4,3.1-28.3,8.9c-6,5.1-8.8,13.5-9.1,18.9 c-0.5,8.5,4,16.5,8.1,19.7c4.1,3.2,11.2,6.1,17.4,8.6c6.2,2.5,12.9,5,20.2,7.5c7.2,2.4,13.6,6.1,19.8,9.5c8.8,4.8,9.4,5.2,13.3,9.7 c2.2,2.5,4,5.1,5.1,11.4c1.2,7.6,0.4,10.5-2.6,15.9c-3,5.4-3,5.5-8.3,9.7c-4.8,3.9-4.8,4-14.1,7.2c-6.6,2.2-13.9,3.2-21.5,3.2 c-7.2,0-8.5,0-14.9-1.9c-4.4-1.3-6-1.1-11-4.7c-5.1-3.6-8.9-6.8-11.9-12.7c-3-5.8-4.6-10.7-4.8-18.5");
  this.words.begin.push("M1171.7,863.7c0.5-12.9-10.3-23-18-26.1c-6-2.5-16.2-4.9-24.1-4.9c-9,0-21.4,3.1-28.3,8.9c-6,5.1-8.8,13.5-9.1,18.9 c-0.5,8.5,4,16.5,8.1,19.7c4.1,3.2,11.2,6.1,17.4,8.6c6.2,2.5,12.9,5,20.2,7.5c7.2,2.4,13.6,6.1,19.8,9.5c8.8,4.8,9.4,5.2,13.3,9.7 c2.2,2.5,4,5.1,5.1,11.4c1.2,7.6,0.4,10.5-2.6,15.9c-3,5.4-3,5.5-8.3,9.7c-4.8,3.9-4.8,4-14.1,7.2c-6.6,2.2-13.9,3.2-21.5,3.2 c-7.2,0-8.5,0-14.9-1.9c-4.4-1.3-6-1.1-11-4.7c-5.1-3.6-8.9-6.8-11.9-12.7c-3-5.8-4.6-10.7-4.8-18.5");
  this.words.begin.push("M1225.6,853.7c4.4-7.1,10.1-12.5,17.1-16.2c7-3.7,13.8-5.6,20.4-5.6c8.6,0,16.3,1.7,23,5.1c6.7,3.4,12.3,8,16.9,14 c4.6,5.9,8.1,12.9,10.5,20.8c2.5,8,3.7,13.1,3.7,22.3c0,9.1-1.2,12.6-3.6,20.6c-2.4,8-5.8,14.9-10.4,20.8 c-4.6,5.9-10.2,10.6-16.8,14.1c-6.6,3.5-14.2,5.2-22.8,5.2c-6.4,0-13.2-1.8-20.4-5.5c-7.2-3.6-21.8-18.7-26.4-25.6");
  this.words.begin.push("M1347.8,868.3c0.3-6.2,2-11.6,5.1-16.1c3-4.5,6.9-8.2,11.5-11.1c4.6-2.9,9.8-5.1,15.6-6.6c5.7-1.4,11.4-2.2,17-2.2 c6.2,0,12.3,0.7,18.1,2c5.8,1.4,11,3.5,15.6,6.5c4.6,3,8.2,6.8,10.9,11.5c2.7,4.7,4,10.5,4,17.2v66.3c0,2.7,0.9,28.6,2.7,30.9 c1.8,2.3,3.9,3.4,6.5,3.4c0.8,0,1.7-0.1,2.7-0.4");
  this.words.begin.push("M1428.5,938.6c-4,5.2-8,9.4-11.8,12.5c-3.8,3.1-7.6,5.6-11.5,7.3c-3.9,1.8-7.8,2.9-11.6,3.5c-3.9,0.6-7.8,0.9-11.9,0.9 c-5.2,0-10.1-0.8-14.6-2.5c-4.5-1.7-8.4-4-11.8-7.1c-3.4-3-6-6.7-8-11.1c-1.9-4.4-2.9-9.3-2.9-14.7c0-7.1,2-12.9,6.1-17.5 c4-4.6,9.1-8.3,15.2-11.1c6.1-2.9,12.7-5.2,19.9-7.1c7.2-1.9,13.8-3.7,19.9-5.6c6.1-1.9,23.7-11.1,27.7-13.6");
  this.words.begin.push("M2118.3,1012.5 M2136.8,853.7c4.4-7.1,10.1-12.5,17.1-16.2c7-3.7,13.8-5.6,20.4-5.6c8.6,0,16.3,1.7,23,5.1 c6.7,3.4,12.3,8,16.9,14c4.6,5.9,8.1,12.9,10.5,20.8c2.5,8,3.7,16.5,3.7,25.6c0,9.1-1.2,17.7-3.6,25.6c-2.4,8-5.8,14.9-10.4,20.8 c-4.6,5.9-10.2,10.6-16.8,14.1c-6.6,3.5-14.2,5.2-22.8,5.2c-6.4,0-13.2-1.8-20.4-5.5c-7.2-3.6-21.2-18.9-25.8-25.8");
  this.words.begin.push("M2312.4,868.3c0.3-6.2,2-11.6,5.1-16.1c3-4.5,6.9-8.2,11.5-11.1c4.6-2.9,9.8-5.1,15.6-6.6c5.7-1.4,11.4-2.2,17-2.2 c6.2,0,12.3,0.7,18.1,2c5.8,1.4,11,3.5,15.6,6.5c4.6,3,8.2,6.8,10.9,11.5c2.7,4.7,4,10.5,4,17.2v66.3c0,2.7,0.9,32.1,2.7,34.4 c1.8,2.3,3.9,3.4,6.5,3.4c0.8,0,1.7-0.1,2.7-0.4");
  this.words.begin.push("M2393.1,938.6c-4,5.2-8,9.4-11.8,12.5c-3.8,3.1-7.6,5.6-11.5,7.3c-3.9,1.8-7.8,2.9-11.6,3.5c-3.9,0.6-7.8,0.9-11.9,0.9 c-5.2,0-10.1-0.8-14.6-2.5c-4.5-1.7-8.4-4-11.8-7.1c-3.4-3-6-6.7-8-11.1c-1.9-4.4-2.9-9.3-2.9-14.7c0-7.1,2-12.9,6.1-17.5 c4-4.6,9.1-8.3,15.2-11.1c6.1-2.9,12.7-5.2,19.9-7.1c7.2-1.9,13.8-3.7,19.9-5.6c6.1-1.9,19-9.8,23-12.3");
  this.words.begin.push("M2454.1,834.6l45.2,129.7");
  this.words.begin.push("M821.1,1201.4h-84.6");
  this.words.begin.push("M1278.7,1270.4v-90.1c0-5.2-0.8-9.6-2.3-13.1c-1.5-3.5-3.4-6.2-5.7-8.2c-2.3-2-4.8-3.5-7.6-4.3c-2.8-0.8-5.5-1.3-8-1.3 c-4.9,0-16.5,1.1-20.7,3.4c-4.2,2.3-8,5.2-11.2,8.6c-3.2,3.5-5.7,7.3-7.5,11.5c-1.8,4.2-2.7,8.2-2.7,11.9");
  this.words.begin.push("M1355.1,1270.4v-90.1c0-5.2-0.8-9.6-2.3-13.1c-1.5-3.5-3.5-6.2-5.8-8.2c-2.4-2-5-3.5-8-4.3c-3-0.8-12.9-1.3-15.8-1.3 c-3.9,0-7.8,0.9-11.7,2.7c-3.9,1.8-7.4,4.2-10.7,7.2c-3.2,3-5.8,6.6-7.7,10.8c-1.9,4.1-2.9,8.7-2.9,13.6");
  this.words.begin.push("M2225.9,1265.3c-4.9,1.7-10.2,2.6-16,2.6c-3.4,0-6.6-0.5-9.6-1.6c-3-1.1-5.8-2.8-8.1-5.3c-2.4-2.5-4.2-5.7-5.6-9.7 c-1.4-4-2-8.7-2-14.3v-112.1l0,0v-20.3l0,0v-47.7");
  this.words.begin.push("M1148.6,1569.4v-126.2");
  this.words.begin.push("M1225.7,1574.4v-90.1c0-5.2-0.8-9.6-2.3-13.1c-1.5-3.5-3.4-6.2-5.7-8.2c-2.3-2-4.8-3.5-7.6-4.3c-2.8-0.8-13.7-1.3-16.2-1.3 c-4.9,0-9.5,1.1-13.7,3.4c-4.2,2.3-8,5.2-11.2,8.6c-3.2,3.5-5.7,7.3-7.5,11.5c-1.8,4.2-2.7,8.2-2.7,11.9");
  this.words.begin.push("M1302.1,1574.4v-90.1c0-5.2-0.8-9.6-2.3-13.1c-1.5-3.5-3.5-6.2-5.8-8.2c-2.4-2-5-3.5-8-4.3c-3-0.8-15.3-1.3-18.1-1.3 c-3.9,0-7.8,0.9-11.7,2.7c-3.9,1.8-7.4,4.2-10.7,7.2c-3.2,3-5.8,6.6-7.7,10.8c-1.9,4.1-2.9,8.7-2.9,13.6");
  this.words.begin.push("M1815.1,1570v-149.3");
  this.words.begin.push("M1815.1,1479.9c7.8-14.4,36.4-38.4,50.3-38.4c1.4,0,2.8,0.1,4.3,0.4c1.5,0.3,3,0.6,4.3,1.1");
  this.words.begin.push("M1913.8,1401.4v13.7H1900v-13.7H1913.8z");
  this.words.begin.push("M2038.5,1551.9c-4.4,6.9-9.7,12.1-16,15.6c-6.3,3.5-12.6,5.2-19,5.2c-8.6,0-16.4-1.7-23.2-5.2c-6.9-3.5-12.7-8.2-17.5-14.2 c-4.8-6-8.5-13-11-20.9c-2.5-8-3.8-16.5-3.8-25.6c0-9.1,1.3-17.6,3.8-25.5c2.5-7.9,6.2-14.8,10.9-20.7c4.7-5.9,10.4-10.6,17-14 c6.6-3.4,14-5.1,22.1-5.1c5.8,0,12,1.4,18.7,4.2c6.7,2.8,22.4,22.5,27.8,30.5");
  this.words.begin.push("M2166.7,1575v-92.4c0-4.4-0.8-8.2-2.3-11.3c-1.5-3.1-3.5-5.7-6-7.6c-2.5-1.9-5.3-3.4-8.5-4.3c-3.2-0.9-17.2-1.4-20.7-1.4 c-4.4,0-8.8,0.9-13.2,2.8c-4.4,1.9-8.4,4.4-11.9,7.5c-3.6,3.1-6.4,6.9-8.6,11.2c-2.2,4.3-11.5,10.9-11.5,15.8");
  this.words.begin.push("M906.9,1505.4h139.5");
  this.words.begin.push("M2119.2,1086.4c-4.9-1.7-10.2-2.5-16-2.5c-3.4,0-6.6,0.5-9.6,1.6c-3,1-5.8,2.7-8.1,5.1c-2.4,2.4-4.2,5.5-5.6,9.3 c-1.4,3.8-2,8.5-2,13.8v108.3l0,0v19.6l0,0v46.1");
  this.words.begin.push("M2053.8,1132h75.5");
  this.words.begin.push("M2162.7,1132.1h75.5");
  this.words.begin.push("M2275.9,1569.9c-4.9,1.7-10.2,2.6-16,2.6c-3.4,0-6.6-0.5-9.6-1.6c-3-1.1-5.8-2.8-8.1-5.3c-2.4-2.5-4.2-5.7-5.6-9.7 c-1.4-4-2-8.7-2-14.3v-112.1l0,0v-20.3l0,0v-47.7");
  this.words.begin.push("M2211.5,1436.7h75.5");
  this.words.begin.push("M1818.2,827.2h75.5");

  this.words.win = [];

  this.words.win.push("M309,633V456.5L150.9,191.8");
  this.words.win.push("M886.2,413.5c0,34.1-4.4,65.2-13.2,93.6c-8.8,28.3-21.6,52.7-38.5,73.2c-16.8,20.5-37.5,36.4-62.1,47.8 c-24.6,11.4-52.8,17.1-84.5,17.1c-31.6,0-59.6-5.7-84.2-17.1c-24.6-11.4-45.3-27.4-62.1-47.8c-16.8-20.4-29.6-44.8-38.3-73.2 c-8.7-28.3-13.1-59.5-13.1-93.6c0-33.8,4.4-65,13.1-93.4c8.7-28.4,21.5-52.8,38.3-73.2c16.8-20.3,37.5-36.2,62.1-47.6 c24.6-11.4,52.7-17.1,84.2-17.1c31.8,0,59.9,5.7,84.5,17.1c24.6,11.4,45.3,27.3,62.1,47.6c16.8,20.3,29.6,44.7,38.5,73.2 C881.8,348.5,886.2,379.7,886.2,413.5z");
  this.words.win.push("M1280,192v295.6c0,25.7-4.8,48.5-14.7,68.2c-10,19.7-22.8,36.3-38.7,49.7c-15.9,13.4-33.7,23.6-53.7,30.5 c-19.9,7-39.8,10.4-59.8,10.4c-19.1,0-38.1-3.4-57.1-10.3c-19-6.9-36.1-17-51.4-30.4c-15.3-13.4-28.2-30.1-37.8-50 c-9.6-19.9-14.9-43.1-14.9-69.4V170");
  this.words.win.push("M2141.3,192l-111.5,441h-48.6l-108.4-367.5L1764.5,633h-48.6l-117.1-463");
  this.words.win.push("M2226,633V170");
  this.words.win.push("M2360,633V192h63.4L2632,633h63V170");
  this.words.win.push("M470.4,192L311,456.5");
  this.words.win.high = 7;
  this.words.win.push("M486,1088V824");
  this.words.win.push("M694,1088V897");
  this.words.win.push("M967.2,1039.4c-2,9.5-5.3,15.3-10.2,22.8c-4.9,7.4-9.2,9-17.5,15.3c-5.9,4.5-14.4,7.3-22.8,9.9c-8.4,2.7-17,4-25.7,4 c-12.7,0-24.1-2.6-34.3-7.9c-10.2-5.2-19-12.3-26.3-21.2c-7.3-8.9-12.9-19.2-16.8-30.8c-3.9-11.7-5.8-24.1-5.8-37.2 c0-12.2,1.9-23.7,5.8-34.7c3.9-10.9,9.4-20.6,16.6-29c7.2-8.4,15.9-15.1,26.1-20.1c10.2-5,21.6-7.5,34.3-7.5 c12.4,0,23.5,2.3,33.4,6.8c9.9,4.5,18.2,10.6,25.2,18.4c6.9,7.8,12.2,17.1,15.9,27.9c3.8,10.8,3.8,5.9,3.8,18.5V986H839");
  this.words.win.push("M1659,1163V871");
  this.words.win.push("M2191.4,1073.9c-13.1,11.9-30.4,17.9-51.8,17.9c-13.6,0-25.3-2.9-35-8.8c-9.7-5.8-17.8-13.4-24.1-22.6 c-6.3-9.2-11-19.7-14-31.4c-3-11.7-4.6-23.4-4.6-35c0-12.6,1.9-24.5,5.7-35.6c3.8-11.1,9.1-20.7,16.1-29 c6.9-8.3,15.3-14.7,25.2-19.3c9.8-4.6,20.9-6.9,33-6.9c10.5,0,19.9,1.5,28.3,4.4c8.4,2.9,15.6,7.1,21.5,12.4c6,5.4,16.1,19,20,26.1" );
  this.words.win.push("M2407.7,1041.7c-2,9.5-5.3,17.9-10.2,25.3c-4.9,7.4-7.3,6.9-14.1,12c-6.8,5.1-12.7,5.6-21.1,8.3c-8.4,2.7-17,4-25.7,4 c-12.7,0-24.1-2.6-34.3-7.8c-10.2-5.2-19-12.3-26.3-21.2c-7.3-8.9-12.9-19.2-16.8-30.8c-3.9-11.7-5.8-24.1-5.8-37.2 c0-12.2,1.9-23.7,5.8-34.7c3.9-10.9,9.4-20.6,16.6-29c7.2-8.4,15.9-15.1,26.1-20.1c10.2-5,21.6-7.5,34.3-7.5 c12.4,0,23.5,2.3,33.4,6.8c9.9,4.5,18.2,10.6,25.2,18.4c6.9,7.8,8.8,12,12.6,22.9c3.8,10.8,5.6,11,5.6,23.6v8.3h-135");
  this.words.win.push("M532.7,1564.1c-7.1,2.3-14.6,3.4-22.9,3.4c-4.9,0-9.4-0.7-13.8-2.2c-4.4-1.4-8.2-3.8-11.6-7.2c-3.4-3.3-6.3-7.7-8.2-13 c-1.9-5.3-3.1-11.8-3.1-19.3v-150.7l0,0V1348l0,0v-64");
  this.words.win.push("M550.4,1473.4c0-12.9,1.8-25.1,5.5-36.5c3.6-11.4,8.9-21.4,15.9-29.9c6.9-8.5,15.5-15.3,25.7-20.3c10.2-5,21.9-7.5,35-7.5 s24.9,2.5,35.2,7.5c10.3,5,19,11.7,26.1,20.3c7.1,8.5,12.4,18.5,16.1,29.9c3.6,11.4,5.5,23.6,5.5,36.5c0,12.9-1.8,25.1-5.5,36.5 c-3.6,11.4-9,21.4-16.1,29.9c-7.1,8.5-15.8,15.2-26.1,20.1c-10.3,4.9-22.1,7.3-35.2,7.3s-24.8-2.4-35-7.3 c-10.2-4.9-18.8-11.5-25.7-20.1c-6.9-8.5-12.2-18.5-15.9-29.9C552.2,1498.4,550.4,1486.3,550.4,1473.4z");
  this.words.win.push("M862,1639v-298");
  this.words.win.push("M1074,1564v-292");
  this.words.win.push("M1476.7,1382.5l-78.1,221.5c-2.4,7.1-8.7,19.8-11.9,24.8c-3.3,5-6.8,9.1-10.6,12.2c-3.8,3.2-7.5,5.4-11.3,6.7 c-3.8,1.3-7.5,2-11.1,2c-3.4,0-26-7.9-29.1-8.4");
  this.words.win.push("M494,835h71.9c12.4,0,23.4,2.2,32.8,6.5c9.5,4.3,17.4,9.9,23.9,16.7c6.4,6.8,11.3,14.6,14.6,23.2c3.3,8.6,4.9,17.2,4.9,25.7 c0,9.2-1.7,18.2-5.1,26.8c-3.4,8.6-8.3,16.4-14.8,23.2c-6.4,6.8-14.4,12-23.9,16.1c-9.5,4-20.3,5.8-32.5,5.8H481");
  this.words.win.push("M694.4,946c16.8-38.7,52.3-42.9,72.2-42.9c1.9,0,4,0.2,6.2,0.5c2.2,0.4,4.3,0.9,6.2,1.6");
  this.words.win.push("M1145.6,948.1c0.8-18.6-14.8-33-25.8-37.6c-8.6-3.6-23.3-7.1-34.7-7.1c-13,0-30.8,4.4-40.7,12.7 c-8.7,7.3-12.6,19.4-13.1,27.2c-0.7,12.2,5.7,23.7,11.6,28.3c5.9,4.6,16.1,8.7,25,12.4c8.9,3.7,18.6,7.2,29,10.8 c10.4,3.5,19.6,8.8,28.5,13.6c12.6,6.9,13.5,7.4,19.1,13.9c3.1,3.6,5.8,7.4,7.3,16.4c1.8,11,0.5,15.1-3.8,22.8 c-4.3,7.7-4.4,7.9-11.9,13.9c-6.9,5.5-6.8,5.7-20.3,10.3c-9.5,3.2-20,4.6-30.8,4.6c-10.3,0-12.3-0.1-21.5-2.7 c-6.3-1.8-8.7-1.6-15.9-6.7c-7.3-5.2-12.7-9.8-17.1-18.2c-4.3-8.4-6.6-15.4-6.9-26.5");
  this.words.win.push("M1318.3,948.1c0.8-18.6-14.8-33-25.8-37.6c-8.6-3.6-23.3-7.1-34.7-7.1c-13,0-30.8,4.4-40.7,12.7 c-8.7,7.3-12.6,19.4-13.1,27.2c-0.7,12.2,5.7,23.7,11.6,28.3c5.9,4.6,16.1,8.7,25,12.4c8.9,3.7,18.6,7.2,29,10.8 c10.4,3.5,19.6,8.8,28.5,13.6c12.6,6.9,13.5,7.4,19.1,13.9c3.1,3.6,5.8,7.4,7.3,16.4c1.8,11,0.5,15.1-3.8,22.8 c-4.3,7.7-4.4,7.9-11.9,13.9c-6.9,5.5-6.8,5.7-20.3,10.3c-9.5,3.2-20,4.6-30.8,4.6c-10.3,0-12.3-0.1-21.5-2.7 c-6.3-1.8-8.7-1.6-15.9-6.7c-7.3-5.2-12.7-9.8-17.1-18.2c-4.3-8.4-6.6-15.4-6.9-26.5");
  this.words.win.push("M1607.8,948.1c0.8-18.6-14.8-33-25.8-37.6c-8.6-3.6-23.3-7.1-34.7-7.1c-13,0-30.8,4.4-40.7,12.7 c-8.7,7.3-12.6,19.4-13.1,27.2c-0.7,12.2,5.7,23.7,11.6,28.3c5.9,4.6,16.1,8.7,25,12.4c8.9,3.7,18.6,7.2,29,10.8 c10.4,3.5,19.6,8.8,28.5,13.6c12.6,6.9,13.5,7.4,19.1,13.9c3.1,3.6,5.8,7.4,7.3,16.4c1.8,11,0.5,15.1-3.8,22.8 c-4.3,7.7-4.4,7.9-11.9,13.9c-6.9,5.5-6.8,5.7-20.3,10.3c-9.5,3.2-20,4.6-30.8,4.6c-10.3,0-12.3-0.1-21.5-2.7 c-6.3-1.8-8.7-1.6-15.9-6.7c-7.3-5.2-12.7-9.8-17.1-18.2c-4.3-8.4-6.6-15.4-6.9-26.5");
  this.words.win.push("M1685.3,933.7c6.3-10.2,14.5-18,24.6-23.4c10.1-5.3,19.9-8,29.4-8c12.4,0,23.4,2.4,33,7.3c9.6,4.9,17.7,11.6,24.3,20.1 c6.6,8.5,11.6,18.5,15.1,29.9c3.5,11.4,5.3,18.9,5.3,32c0,13.1-1.7,18.1-5.1,29.6c-3.4,11.4-8.4,21.4-15,29.9 c-6.6,8.5-14.6,15.3-24.1,20.2c-9.5,5-20.4,7.5-32.8,7.5c-9.2,0-19-2.6-29.4-7.8c-10.3-5.2-31.4-26.9-37.9-36.9");
  this.words.win.push("M1861,954.7c0.5-9,2.9-16.7,7.3-23.1c4.4-6.4,9.9-11.8,16.6-16c6.7-4.2,14.1-7.4,22.4-9.5c8.2-2.1,16.4-3.1,24.4-3.1 c9,0,17.6,1,26,2.9c8.4,1.9,15.8,5,22.4,9.3c6.5,4.2,12.1,9.8,15.9,16.6c3.9,6.8,6.1,15,6.1,24.7v95.3c0,3.9,1,41.1,3.5,44.4 c2.5,3.3,5.5,4.9,9.1,4.9c1.2,0,2.4-0.2,3.7-0.5");
  this.words.win.push("M1977,1055.9c-5.8,7.5-11.5,13.5-16.9,18c-5.5,4.5-11,8-16.6,10.5c-5.6,2.5-11.2,4.2-16.7,5.1c-5.6,0.8-11.3,1.3-17.1,1.3 c-7.5,0-14.5-1.2-20.9-3.6c-6.4-2.4-12.1-5.8-16.9-10.2c-4.9-4.4-8.7-9.7-11.5-16c-2.8-6.3-4.2-13.3-4.2-21.1 c0-10.2,2.9-18.6,8.7-25.1c5.8-6.5,13.1-11.9,21.8-16c8.7-4.1,18.2-7.5,28.6-10.2c10.3-2.7,19.8-5.3,28.6-8 c8.7-2.7,34.1-16,39.9-19.6");
  this.words.win.push("M863.4,1638.3 M890,1409.9c6.3-10.2,14.5-18,24.6-23.4c10.1-5.3,19.9-8,29.4-8c12.4,0,23.4,2.4,33,7.3 c9.6,4.9,17.7,11.6,24.3,20.1c6.6,8.5,11.6,18.5,15.1,29.9c3.5,11.4,5.3,23.7,5.3,36.9c0,13.1-1.7,25.4-5.1,36.8 c-3.4,11.4-8.4,21.4-15,29.9c-6.6,8.5-14.6,15.3-24.1,20.2c-9.5,5-20.4,7.5-32.8,7.5c-9.2,0-19-2.6-29.4-7.8 c-10.3-5.2-30.5-27.1-37.1-37.1");
  this.words.win.push("M1142.4,1430.9c0.5-9,2.9-16.7,7.3-23.1c4.4-6.4,9.9-11.8,16.6-16c6.7-4.2,14.1-7.4,22.4-9.5c8.2-2.1,16.4-3.1,24.4-3.1 c9,0,17.6,1,26,2.9c8.4,1.9,15.8,5,22.4,9.3c6.5,4.2,11.4,9.8,15.3,16.6c3.9,6.8,5.4,15,5.4,24.7v95.3c0,3.9,1.7,46.1,4.2,49.4 c2.5,3.3,5.8,4.9,9.5,4.9c1.2,0,2.6-0.2,3.9-0.5");
  this.words.win.push("M1258.4,1532c-5.8,7.5-11.5,13.5-16.9,18c-5.5,4.5-11,8-16.6,10.5c-5.6,2.5-11.2,4.2-16.7,5.1c-5.6,0.8-11.3,1.3-17.1,1.3 c-7.5,0-14.5-1.2-20.9-3.6c-6.4-2.4-12.1-5.8-16.9-10.2c-4.9-4.4-8.7-9.7-11.5-16c-2.8-6.3-4.2-13.3-4.2-21.1 c0-10.2,2.9-18.6,8.7-25.1c5.8-6.5,13.1-11.9,21.8-16c8.7-4.1,18.2-7.5,28.6-10.2c10.3-2.7,19.8-5.3,28.6-8 c8.7-2.7,27.3-14.1,33.1-17.7");
  this.words.win.push("M1346.1,1382.5l64.9,186.4");
  this.words.win.push("M431,1371h108");
  this.words.win.push("M2310,1591v-237");
  this.words.win.push("M1985,1381v192.5c0,12.4-1.8,23.4-6.1,33c-4.3,9.6-9.8,17.6-17,23.9c-7.2,6.3-15.3,11.1-24.6,14.4 c-9.2,3.3-18.7,4.9-28.4,4.9c-17,0-31.9-4.4-44.7-13.1c-12.8-8.8-22.7-22.5-29.3-41.7");
  this.words.win.push("M1958.6,1543.2c-6.3,10-14,17.5-23,22.4c-9,5-18.1,7.5-27.4,7.5c-12.4,0-23.5-2.5-33.4-7.5c-9.9-5-18.2-11.8-25.2-20.4 c-6.9-8.6-12.2-18.7-15.9-30.1c-3.6-11.4-5.5-23.7-5.5-36.9c0-13.1,1.8-25.4,5.5-36.7c3.6-11.3,8.9-21.2,15.7-29.7 c6.8-8.5,15-15.2,24.4-20.1c9.5-4.9,20.1-7.3,31.7-7.3c8.3,0,17.2,2,26.8,6c9.6,4,32.2,32.4,40,43.8");
  this.words.win.push("M2034.4,1431.5c0.5-9,2.9-16.7,7.3-23.1c4.4-6.4,9.9-11.8,16.6-16c6.7-4.2,14.1-7.4,22.4-9.5c8.2-2.1,16.4-3.1,24.4-3.1 c9,0,17.6,1,26,2.9c8.4,1.9,15.8,5,22.4,9.3c6.5,4.2,12.3,9.8,16.2,16.6c3.9,6.8,6.4,15,6.4,24.7v95.3c0,3.9,0.7,41.1,3.2,44.4 c2.5,3.3,5.3,4.9,9,4.9c1.2,0,2.3-0.2,3.7-0.5");
  this.words.win.push("M2150.5,1532.6c-5.8,7.5-11.5,13.5-16.9,18c-5.5,4.5-11,8-16.6,10.5c-5.6,2.5-11.2,4.2-16.7,5.1c-5.6,0.8-11.3,1.3-17.1,1.3 c-7.5,0-14.5-1.2-20.9-3.6c-6.4-2.4-12.1-5.8-16.9-10.2c-4.9-4.4-8.7-9.7-11.5-16c-2.8-6.3-4.2-13.3-4.2-21.1 c0-10.2,2.9-18.6,8.7-25.1c5.8-6.5,13.1-11.9,21.8-16c8.7-4.1,18.2-7.5,28.6-10.2c10.3-2.7,19.8-5.3,28.6-8 c8.7-2.7,34.1-16,39.9-19.6");
  this.words.win.push("M2248,1580v-204");
  this.words.win.push("M2258,1337v20h-20v-20H2258z");
  this.words.win.push("M1643,1433.1c0.5-9,2.9-16.7,7.3-23.1c4.4-6.4,9.9-11.8,16.6-16c6.7-4.2,14.1-7.4,22.4-9.5c8.2-2.1,16.4-3.1,24.4-3.1 c9,0,17.6,1,26,2.9c8.4,1.9,15.8,5,22.4,9.3c6.5,4.2,12.5,9.8,16.4,16.6c3.9,6.8,6.6,15,6.6,24.7v95.3c0,3.9,0.5,41.1,3,44.4 c2.5,3.3,5.2,4.9,8.9,4.9c1.2,0,2.3-0.2,3.6-0.5");
  this.words.win.push("M1759.1,1534.2c-5.8,7.5-11.5,13.5-16.9,18c-5.5,4.5-11,8-16.6,10.5c-5.6,2.5-11.2,4.2-16.7,5.1c-5.6,0.8-11.3,1.3-17.1,1.3 c-7.5,0-14.5-1.2-20.9-3.6c-6.4-2.4-12.1-5.8-16.9-10.2c-4.9-4.4-8.7-9.7-11.5-16c-2.8-6.3-4.2-13.3-4.2-21.1 c0-10.2,2.9-18.6,8.7-25.1c5.8-6.5,13.1-11.9,21.8-16c8.7-4.1,18.2-7.5,28.6-10.2c10.3-2.7,19.8-5.3,28.6-8 c8.7-2.7,34.1-16,39.9-19.6");
  this.words.win.push("M2341.3,1413.9c10.8-12.5,22.8-21.4,35.4-26.9c12.6-5.6,25.6-8.3,38.8-8.3c9.9,0,18.7,1.5,26.5,4.3 c7.7,2.9,14.4,7,19.8,12.5c5.4,5.4,9.4,12,12.2,19.8c2.8,7.7,4.1,16.5,4.1,26.2V1618");

  this.words.lose = [];

  this.words.lose.push("M286,574V422.4L150.4,195.5");
  this.words.lose.push("M781.3,385.6c0,29.2-3.8,55.9-11.3,80.2c-7.6,24.3-18.6,45.2-33,62.8c-14.4,17.5-32.2,31.2-53.3,41 c-21.1,9.8-45.3,14.7-72.5,14.7c-27.1,0-51.1-4.9-72.2-14.7c-21.1-9.8-38.9-23.5-53.3-41c-14.4-17.5-25.4-38.5-32.8-62.8 c-7.5-24.3-11.2-51-11.2-80.2c0-29,3.7-55.7,11.2-80.1c7.5-24.4,18.4-45.3,32.8-62.8c14.4-17.4,32.2-31.1,53.3-40.9 c21.1-9.8,45.2-14.7,72.2-14.7c27.2,0,51.4,4.9,72.5,14.7c21.1,9.8,38.9,23.4,53.3,40.9c14.4,17.4,25.4,38.4,33,62.8 C777.6,329.8,781.3,356.5,781.3,385.6z");
  this.words.lose.push("M1119,196v253.1c0,22.1-4.1,41.6-12.6,58.5c-8.5,16.9-19.5,31.1-33.1,42.6c-13.6,11.5-28.9,20.2-46,26.2 c-17.1,6-34.2,8.9-51.2,8.9c-16.4,0-32.7-2.9-49-8.8c-16.3-5.9-31-14.6-44.1-26s-24.1-25.8-32.3-42.9c-8.2-17.1-12.7-36.9-12.7-59.5 V177");
  this.words.lose.push("M424.9,195.6L288.2,422.4");
  this.words.lose.push("M1661,585h-237V196");
  this.words.lose.push("M2068.5,391.3c0,30-3.8,57.4-11.5,82.3c-7.7,24.9-19,46.3-34,64.3c-15,18-33.2,32-54.8,42.1c-21.5,10.1-46.3,15.2-74.4,15.2 c-27.7,0-52.4-5.1-74.2-15.2c-21.7-10.1-40-24.2-54.8-42.1c-14.8-18-26-39.4-33.7-64.3c-7.7-24.9-11.5-52.3-11.5-82.3 c0-30,3.8-57.4,11.5-82.3c7.7-24.9,18.9-46.3,33.7-64.3c14.8-18,33-32,54.8-42.1c21.7-10.1,46.4-15.2,74.2-15.2 c28.1,0,52.9,5.1,74.4,15.2c21.5,10.1,39.8,24.2,54.8,42.1c15,18,26.3,39.4,34,64.3C2064.7,333.9,2068.5,361.4,2068.5,391.3z");
  this.words.lose.push("M2740,585h-269V196h260");
  this.words.lose.push("M2401.9,285.3c1.6-40.5-32.3-71.9-56.2-81.8c-18.8-7.8-50.8-15.5-75.6-15.5c-28.3,0-67,9.6-88.6,27.7 c-18.9,15.9-27.4,42.2-28.4,59.3c-1.6,26.5,12.4,51.6,25.4,61.6c13,10,35.1,19,54.5,27c19.5,8,40.5,15.8,63.2,23.4 c22.7,7.7,42.7,19.1,62,29.7c27.4,15,29.4,16.2,41.7,30.4c6.9,7.9,12.6,16,15.8,35.7c3.9,23.9,1.2,32.9-8.3,49.7 c-9.4,16.8-9.5,17.2-25.9,30.3c-15.1,12.1-14.9,12.5-44.3,22.5c-20.7,7-43.6,9.9-67.2,9.9c-22.4,0-26.7-0.1-46.8-5.9 c-13.8-3.9-18.9-3.4-34.6-14.7c-15.9-11.4-27.7-21.4-37.1-39.6c-9.4-18.3-14.5-33.6-15-57.8");
  this.words.lose.push("M2471,384h211");
  this.words.lose.high = 9;
  this.words.lose.push("M486,1088V824");
  this.words.lose.push("M694,1088V897");
  this.words.lose.push("M967.2,1039.4c-2,9.5-5.3,15.3-10.2,22.8c-4.9,7.4-9.2,9-17.5,15.3c-5.9,4.5-14.4,7.3-22.8,9.9c-8.4,2.7-17,4-25.7,4 c-12.7,0-24.1-2.6-34.3-7.9c-10.2-5.2-19-12.3-26.3-21.2c-7.3-8.9-12.9-19.2-16.8-30.8c-3.9-11.7-5.8-24.1-5.8-37.2 c0-12.2,1.9-23.7,5.8-34.7c3.9-10.9,9.4-20.6,16.6-29c7.2-8.4,15.9-15.1,26.1-20.1c10.2-5,21.6-7.5,34.3-7.5 c12.4,0,23.5,2.3,33.4,6.8c9.9,4.5,18.2,10.6,25.2,18.4c6.9,7.8,12.2,17.1,15.9,27.9c3.8,10.8,3.8,5.9,3.8,18.5V986H839");
  this.words.lose.push("M1659,1163V871");
  this.words.lose.push("M2191.4,1073.9c-13.1,11.9-30.4,17.9-51.8,17.9c-13.6,0-25.3-2.9-35-8.8c-9.7-5.8-17.8-13.4-24.1-22.6 c-6.3-9.2-11-19.7-14-31.4c-3-11.7-4.6-23.4-4.6-35c0-12.6,1.9-24.5,5.7-35.6c3.8-11.1,9.1-20.7,16.1-29 c6.9-8.3,15.3-14.7,25.2-19.3c9.8-4.6,20.9-6.9,33-6.9c10.5,0,19.9,1.5,28.3,4.4c8.4,2.9,15.6,7.1,21.5,12.4c6,5.4,16.1,19,20,26.1" );
  this.words.lose.push("M2407.7,1041.7c-2,9.5-5.3,17.9-10.2,25.3c-4.9,7.4-7.3,6.9-14.1,12c-6.8,5.1-12.7,5.6-21.1,8.3c-8.4,2.7-17,4-25.7,4 c-12.7,0-24.1-2.6-34.3-7.8c-10.2-5.2-19-12.3-26.3-21.2c-7.3-8.9-12.9-19.2-16.8-30.8c-3.9-11.7-5.8-24.1-5.8-37.2 c0-12.2,1.9-23.7,5.8-34.7c3.9-10.9,9.4-20.6,16.6-29c7.2-8.4,15.9-15.1,26.1-20.1c10.2-5,21.6-7.5,34.3-7.5 c12.4,0,23.5,2.3,33.4,6.8c9.9,4.5,18.2,10.6,25.2,18.4c6.9,7.8,8.8,12,12.6,22.9c3.8,10.8,5.6,11,5.6,23.6v8.3h-135");
  this.words.lose.push("M532.7,1564.1c-7.1,2.3-14.6,3.4-22.9,3.4c-4.9,0-9.4-0.7-13.8-2.2c-4.4-1.4-8.2-3.8-11.6-7.2c-3.4-3.3-6.3-7.7-8.2-13 c-1.9-5.3-3.1-11.8-3.1-19.3v-150.7l0,0V1348l0,0v-64");
  this.words.lose.push("M550.4,1473.4c0-12.9,1.8-25.1,5.5-36.5c3.6-11.4,8.9-21.4,15.9-29.9c6.9-8.5,15.5-15.3,25.7-20.3c10.2-5,21.9-7.5,35-7.5 s24.9,2.5,35.2,7.5c10.3,5,19,11.7,26.1,20.3c7.1,8.5,12.4,18.5,16.1,29.9c3.6,11.4,5.5,23.6,5.5,36.5c0,12.9-1.8,25.1-5.5,36.5 c-3.6,11.4-9,21.4-16.1,29.9c-7.1,8.5-15.8,15.2-26.1,20.1c-10.3,4.9-22.1,7.3-35.2,7.3s-24.8-2.4-35-7.3 c-10.2-4.9-18.8-11.5-25.7-20.1c-6.9-8.5-12.2-18.5-15.9-29.9C552.2,1498.4,550.4,1486.3,550.4,1473.4z");
  this.words.lose.push("M862,1639v-298");
  this.words.lose.push("M1074,1564v-292");
  this.words.lose.push("M1476.7,1382.5l-78.1,221.5c-2.4,7.1-8.7,19.8-11.9,24.8c-3.3,5-6.8,9.1-10.6,12.2c-3.8,3.2-7.5,5.4-11.3,6.7 c-3.8,1.3-7.5,2-11.1,2c-3.4,0-26-7.9-29.1-8.4");
  this.words.lose.push("M494,835h71.9c12.4,0,23.4,2.2,32.8,6.5c9.5,4.3,17.4,9.9,23.9,16.7c6.4,6.8,11.3,14.6,14.6,23.2c3.3,8.6,4.9,17.2,4.9,25.7 c0,9.2-1.7,18.2-5.1,26.8c-3.4,8.6-8.3,16.4-14.8,23.2c-6.4,6.8-14.4,12-23.9,16.1c-9.5,4-20.3,5.8-32.5,5.8H481");
  this.words.lose.push("M694.4,946c16.8-38.7,52.3-42.9,72.2-42.9c1.9,0,4,0.2,6.2,0.5c2.2,0.4,4.3,0.9,6.2,1.6");
  this.words.lose.push("M1145.6,948.1c0.8-18.6-14.8-33-25.8-37.6c-8.6-3.6-23.3-7.1-34.7-7.1c-13,0-30.8,4.4-40.7,12.7 c-8.7,7.3-12.6,19.4-13.1,27.2c-0.7,12.2,5.7,23.7,11.6,28.3c5.9,4.6,16.1,8.7,25,12.4c8.9,3.7,18.6,7.2,29,10.8 c10.4,3.5,19.6,8.8,28.5,13.6c12.6,6.9,13.5,7.4,19.1,13.9c3.1,3.6,5.8,7.4,7.3,16.4c1.8,11,0.5,15.1-3.8,22.8 c-4.3,7.7-4.4,7.9-11.9,13.9c-6.9,5.5-6.8,5.7-20.3,10.3c-9.5,3.2-20,4.6-30.8,4.6c-10.3,0-12.3-0.1-21.5-2.7 c-6.3-1.8-8.7-1.6-15.9-6.7c-7.3-5.2-12.7-9.8-17.1-18.2c-4.3-8.4-6.6-15.4-6.9-26.5");
  this.words.lose.push("M1318.3,948.1c0.8-18.6-14.8-33-25.8-37.6c-8.6-3.6-23.3-7.1-34.7-7.1c-13,0-30.8,4.4-40.7,12.7 c-8.7,7.3-12.6,19.4-13.1,27.2c-0.7,12.2,5.7,23.7,11.6,28.3c5.9,4.6,16.1,8.7,25,12.4c8.9,3.7,18.6,7.2,29,10.8 c10.4,3.5,19.6,8.8,28.5,13.6c12.6,6.9,13.5,7.4,19.1,13.9c3.1,3.6,5.8,7.4,7.3,16.4c1.8,11,0.5,15.1-3.8,22.8 c-4.3,7.7-4.4,7.9-11.9,13.9c-6.9,5.5-6.8,5.7-20.3,10.3c-9.5,3.2-20,4.6-30.8,4.6c-10.3,0-12.3-0.1-21.5-2.7 c-6.3-1.8-8.7-1.6-15.9-6.7c-7.3-5.2-12.7-9.8-17.1-18.2c-4.3-8.4-6.6-15.4-6.9-26.5");
  this.words.lose.push("M1607.8,948.1c0.8-18.6-14.8-33-25.8-37.6c-8.6-3.6-23.3-7.1-34.7-7.1c-13,0-30.8,4.4-40.7,12.7 c-8.7,7.3-12.6,19.4-13.1,27.2c-0.7,12.2,5.7,23.7,11.6,28.3c5.9,4.6,16.1,8.7,25,12.4c8.9,3.7,18.6,7.2,29,10.8 c10.4,3.5,19.6,8.8,28.5,13.6c12.6,6.9,13.5,7.4,19.1,13.9c3.1,3.6,5.8,7.4,7.3,16.4c1.8,11,0.5,15.1-3.8,22.8 c-4.3,7.7-4.4,7.9-11.9,13.9c-6.9,5.5-6.8,5.7-20.3,10.3c-9.5,3.2-20,4.6-30.8,4.6c-10.3,0-12.3-0.1-21.5-2.7 c-6.3-1.8-8.7-1.6-15.9-6.7c-7.3-5.2-12.7-9.8-17.1-18.2c-4.3-8.4-6.6-15.4-6.9-26.5");
  this.words.lose.push("M1685.3,933.7c6.3-10.2,14.5-18,24.6-23.4c10.1-5.3,19.9-8,29.4-8c12.4,0,23.4,2.4,33,7.3c9.6,4.9,17.7,11.6,24.3,20.1 c6.6,8.5,11.6,18.5,15.1,29.9c3.5,11.4,5.3,18.9,5.3,32c0,13.1-1.7,18.1-5.1,29.6c-3.4,11.4-8.4,21.4-15,29.9 c-6.6,8.5-14.6,15.3-24.1,20.2c-9.5,5-20.4,7.5-32.8,7.5c-9.2,0-19-2.6-29.4-7.8c-10.3-5.2-31.4-26.9-37.9-36.9");
  this.words.lose.push("M1861,954.7c0.5-9,2.9-16.7,7.3-23.1c4.4-6.4,9.9-11.8,16.6-16c6.7-4.2,14.1-7.4,22.4-9.5c8.2-2.1,16.4-3.1,24.4-3.1 c9,0,17.6,1,26,2.9c8.4,1.9,15.8,5,22.4,9.3c6.5,4.2,12.1,9.8,15.9,16.6c3.9,6.8,6.1,15,6.1,24.7v95.3c0,3.9,1,41.1,3.5,44.4 c2.5,3.3,5.5,4.9,9.1,4.9c1.2,0,2.4-0.2,3.7-0.5");
  this.words.lose.push("M1977,1055.9c-5.8,7.5-11.5,13.5-16.9,18c-5.5,4.5-11,8-16.6,10.5c-5.6,2.5-11.2,4.2-16.7,5.1c-5.6,0.8-11.3,1.3-17.1,1.3 c-7.5,0-14.5-1.2-20.9-3.6c-6.4-2.4-12.1-5.8-16.9-10.2c-4.9-4.4-8.7-9.7-11.5-16c-2.8-6.3-4.2-13.3-4.2-21.1 c0-10.2,2.9-18.6,8.7-25.1c5.8-6.5,13.1-11.9,21.8-16c8.7-4.1,18.2-7.5,28.6-10.2c10.3-2.7,19.8-5.3,28.6-8 c8.7-2.7,34.1-16,39.9-19.6");
  this.words.lose.push("M863.4,1638.3 M890,1409.9c6.3-10.2,14.5-18,24.6-23.4c10.1-5.3,19.9-8,29.4-8c12.4,0,23.4,2.4,33,7.3 c9.6,4.9,17.7,11.6,24.3,20.1c6.6,8.5,11.6,18.5,15.1,29.9c3.5,11.4,5.3,23.7,5.3,36.9c0,13.1-1.7,25.4-5.1,36.8 c-3.4,11.4-8.4,21.4-15,29.9c-6.6,8.5-14.6,15.3-24.1,20.2c-9.5,5-20.4,7.5-32.8,7.5c-9.2,0-19-2.6-29.4-7.8 c-10.3-5.2-30.5-27.1-37.1-37.1");
  this.words.lose.push("M1142.4,1430.9c0.5-9,2.9-16.7,7.3-23.1c4.4-6.4,9.9-11.8,16.6-16c6.7-4.2,14.1-7.4,22.4-9.5c8.2-2.1,16.4-3.1,24.4-3.1 c9,0,17.6,1,26,2.9c8.4,1.9,15.8,5,22.4,9.3c6.5,4.2,11.4,9.8,15.3,16.6c3.9,6.8,5.4,15,5.4,24.7v95.3c0,3.9,1.7,46.1,4.2,49.4 c2.5,3.3,5.8,4.9,9.5,4.9c1.2,0,2.6-0.2,3.9-0.5");
  this.words.lose.push("M1258.4,1532c-5.8,7.5-11.5,13.5-16.9,18c-5.5,4.5-11,8-16.6,10.5c-5.6,2.5-11.2,4.2-16.7,5.1c-5.6,0.8-11.3,1.3-17.1,1.3 c-7.5,0-14.5-1.2-20.9-3.6c-6.4-2.4-12.1-5.8-16.9-10.2c-4.9-4.4-8.7-9.7-11.5-16c-2.8-6.3-4.2-13.3-4.2-21.1 c0-10.2,2.9-18.6,8.7-25.1c5.8-6.5,13.1-11.9,21.8-16c8.7-4.1,18.2-7.5,28.6-10.2c10.3-2.7,19.8-5.3,28.6-8 c8.7-2.7,27.3-14.1,33.1-17.7");
  this.words.lose.push("M1346.1,1382.5l64.9,186.4");
  this.words.lose.push("M431,1371h108");
  this.words.lose.push("M2310,1591v-237");
  this.words.lose.push("M1985,1381v192.5c0,12.4-1.8,23.4-6.1,33c-4.3,9.6-9.8,17.6-17,23.9c-7.2,6.3-15.3,11.1-24.6,14.4 c-9.2,3.3-18.7,4.9-28.4,4.9c-17,0-31.9-4.4-44.7-13.1c-12.8-8.8-22.7-22.5-29.3-41.7");
  this.words.lose.push("M1958.6,1543.2c-6.3,10-14,17.5-23,22.4c-9,5-18.1,7.5-27.4,7.5c-12.4,0-23.5-2.5-33.4-7.5c-9.9-5-18.2-11.8-25.2-20.4 c-6.9-8.6-12.2-18.7-15.9-30.1c-3.6-11.4-5.5-23.7-5.5-36.9c0-13.1,1.8-25.4,5.5-36.7c3.6-11.3,8.9-21.2,15.7-29.7 c6.8-8.5,15-15.2,24.4-20.1c9.5-4.9,20.1-7.3,31.7-7.3c8.3,0,17.2,2,26.8,6c9.6,4,32.2,32.4,40,43.8");
  this.words.lose.push("M2034.4,1431.5c0.5-9,2.9-16.7,7.3-23.1c4.4-6.4,9.9-11.8,16.6-16c6.7-4.2,14.1-7.4,22.4-9.5c8.2-2.1,16.4-3.1,24.4-3.1 c9,0,17.6,1,26,2.9c8.4,1.9,15.8,5,22.4,9.3c6.5,4.2,12.3,9.8,16.2,16.6c3.9,6.8,6.4,15,6.4,24.7v95.3c0,3.9,0.7,41.1,3.2,44.4 c2.5,3.3,5.3,4.9,9,4.9c1.2,0,2.3-0.2,3.7-0.5");
  this.words.lose.push("M2150.5,1532.6c-5.8,7.5-11.5,13.5-16.9,18c-5.5,4.5-11,8-16.6,10.5c-5.6,2.5-11.2,4.2-16.7,5.1c-5.6,0.8-11.3,1.3-17.1,1.3 c-7.5,0-14.5-1.2-20.9-3.6c-6.4-2.4-12.1-5.8-16.9-10.2c-4.9-4.4-8.7-9.7-11.5-16c-2.8-6.3-4.2-13.3-4.2-21.1 c0-10.2,2.9-18.6,8.7-25.1c5.8-6.5,13.1-11.9,21.8-16c8.7-4.1,18.2-7.5,28.6-10.2c10.3-2.7,19.8-5.3,28.6-8 c8.7-2.7,34.1-16,39.9-19.6");
  this.words.lose.push("M2248,1580v-204");
  this.words.lose.push("M2258,1337v20h-20v-20H2258z");
  this.words.lose.push("M1643,1433.1c0.5-9,2.9-16.7,7.3-23.1c4.4-6.4,9.9-11.8,16.6-16c6.7-4.2,14.1-7.4,22.4-9.5c8.2-2.1,16.4-3.1,24.4-3.1 c9,0,17.6,1,26,2.9c8.4,1.9,15.8,5,22.4,9.3c6.5,4.2,12.5,9.8,16.4,16.6c3.9,6.8,6.6,15,6.6,24.7v95.3c0,3.9,0.5,41.1,3,44.4 c2.5,3.3,5.2,4.9,8.9,4.9c1.2,0,2.3-0.2,3.6-0.5");
  this.words.lose.push("M1759.1,1534.2c-5.8,7.5-11.5,13.5-16.9,18c-5.5,4.5-11,8-16.6,10.5c-5.6,2.5-11.2,4.2-16.7,5.1c-5.6,0.8-11.3,1.3-17.1,1.3 c-7.5,0-14.5-1.2-20.9-3.6c-6.4-2.4-12.1-5.8-16.9-10.2c-4.9-4.4-8.7-9.7-11.5-16c-2.8-6.3-4.2-13.3-4.2-21.1 c0-10.2,2.9-18.6,8.7-25.1c5.8-6.5,13.1-11.9,21.8-16c8.7-4.1,18.2-7.5,28.6-10.2c10.3-2.7,19.8-5.3,28.6-8 c8.7-2.7,34.1-16,39.9-19.6");
  this.words.lose.push("M2341.3,1413.9c10.8-12.5,22.8-21.4,35.4-26.9c12.6-5.6,25.6-8.3,38.8-8.3c9.9,0,18.7,1.5,26.5,4.3 c7.7,2.9,14.4,7,19.8,12.5c5.4,5.4,9.4,12,12.2,19.8c2.8,7.7,4.1,16.5,4.1,26.2V1618");
};


/*
* Start menu
*/

Arkanoid.prototype.initStartMenu = function(words, particlePositions) {
  var canvas = this.canvas;
  var c = this.context;
  var am = this.am;

  am.settings.funcPost = function() {
    c.globalAlpha = 0.1;
    c.fillStyle = '#000000';
    c.fillRect(0, 0, canvas.width, canvas.height);
    particles.render();
  }

  var particles = new ParticlesManadger();
  particles.setCanvas(canvas);

  var numberParticles;
  var paticleNum = 0;
  for (var k = 0; k < words.length; k++) {
    var pathAnim = new SVGanimation(undefined, true, 20);
    
    pathAnim.parse(words[k]);
    pathAnim.fullTime = 0;
    
    for (var i = 0; i < pathAnim.animations.length; i++)
      pathAnim.fullTime += pathAnim.animations[i].time;
    
    numberParticles = Math.floor(40 * pathAnim.fullTime / 8000);

    for (var i = 0; i < numberParticles; i++) {
      var particlePos = {
        "x" : undefined,
        "y" : undefined
      };
      if (particlePositions) {
        particles.count = -250;
        particlePos = particlePositions[getRandomInt(0,particlePositions.length - 1)];
      }
      
      if (k < words.high) 
        particles.addParticle(particlePos.x, particlePos.y, getRandomInt(3, 6), "#B0F8D6");
      else
        particles.addParticle(particlePos.x, particlePos.y, getRandomInt(1, 4), "#B0F8D6");
      var p = particles.p[particles.p.length - 1];
      p.angle = getRandomInt(10,40) / 10;
      p.pastState = undefined;
      p.currentTime = i * pathAnim.fullTime / numberParticles;

      var time = 0;
      for (var j = 0; j < pathAnim.animations.length; j++) { // get start curve of animation
        time += pathAnim.animations[j].time;
        if (p.currentTime <= time) {
          p.currentCurve = j;
          p.currentCurveTime = time - pathAnim.animations[j].time;
          break;
        }
      }
    }

    pathAnim.beginPaticleNum = paticleNum;
    paticleNum += numberParticles;
    pathAnim.endPaticleNum = paticleNum;

    pathAnim.settings.alteration = (function() {
      var path = pathAnim;
      return function (t) {
        var dx, dy, speedValue, delta, state;
        for (var i = path.beginPaticleNum; i < path.endPaticleNum; i++) {
          dx = dy = delta = 0;
          speedValue = 1;
          var particle = particles.p[i];

          var particleTime = t + particle.currentTime;
          if (particleTime > path.fullTime) particleTime -= path.fullTime;
          var anim = path.animations[particle.currentCurve];

          if (particleTime > particle.currentCurveTime + anim.time) {
            particle.currentCurveTime += anim.time;
            particle.currentCurve++;
            anim = path.animations[particle.currentCurve];
            particle.pastState = undefined;
            state = anim.alter(0);
          }
          else if (particleTime < particle.currentCurveTime) {
            particle.currentCurveTime = 0;
            particle.currentCurve = 0;
            particleTime = 0;
            anim = path.animations[particle.currentCurve];
            particle.pastState = undefined;
            particle.angle = getRandomInt(10,40) / 10;
            state = anim.alter(0);
          }
          else
            state = anim.alter(particleTime - particle.currentCurveTime);
          if (!state) {
            particle.destX = particle.x;
            particle.destY = particle.y;
            continue;
          }

          if (particle.pastState) {
            dx = state.x - particle.pastState.x;
            dy = state.y - particle.pastState.y;
            if ((dx !== 0 || dy !== 0)) {
              speedValue = Math.sqrt(dx * dx + dy * dy);
              delta = 15 * Math.sin((particleTime / 500 * particle.angle) * Math.PI); 
            }
          }

          particle.destX = (state.x - dy * delta / speedValue) * Arkanoid.obj.resolution;
          particle.destY = (state.y + dx * delta / speedValue) * Arkanoid.obj.resolution;

          if (!particle.x || !particle.y || particleTime < 40) {
            particle.x = particle.destX;
            particle.y = particle.destY;
            particle.dx = 0;
            particle.dy = 0;
          }
          if (!particle.pastState && 
            (Math.abs(particle.dx) + Math.abs(particle.destX - particle.x) < 40 * Arkanoid.obj.resolution || 
            Math.abs(particle.dy) + Math.abs(particle.destY - particle.y) < 40 * Arkanoid.obj.resolution)) {
            particle.dx = (particle.destX - particle.x) / 20;
            particle.dy = (particle.destY - particle.y) / 20;
          }
          particle.pastState = state;
        }
      };
    })();

    am.add(pathAnim);
  }

  var cursorAnimation = new Animation({
    "time" : "infinite",
    "alteration" : particles.updateAcc(am),
    "render" : undefined
  });


  var particleMoving = true;
  canvas.onmousemove = function(e) {
    var x = (e.clientX - canvas.getBoundingClientRect().left) * (canvas.width / canvas.getBoundingClientRect().width);
    var y = (e.clientY - canvas.getBoundingClientRect().top) * (canvas.height / canvas.getBoundingClientRect().height);
    if (x > 800 * Arkanoid.obj.resolution && x < 2080 * Arkanoid.obj.resolution && 
      y > 500 * Arkanoid.obj.resolution && y < 1300 * Arkanoid.obj.resolution) {
      if (particleMoving) {
        particles.count = 0;
        particleMoving = false;
        for (var i = 0; i < particles.p.length; i++) {
          particles.p[i].dx = (Math.random() - 0.5) * 90 * Arkanoid.obj.resolution;
          particles.p[i].dy = (Math.random() - 0.5) * 90 * Arkanoid.obj.resolution;
        }
      }
    }
    else if (!particleMoving)
      particleMoving = true;
  };

  am.add(cursorAnimation).start();
  return particles;
  for (var i = 0; i < am.animations.length - 1; i++) 
    am.freeze(am.animations[i]);
}

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

// Particles

function getRandomInt(min, max) {
  if (min == max) return 0;
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

function Particle (x, y, radius, color) {
  var th = this;

  function setResolutionParams(r, s) {
    th.r = (radius || 3) * r;
    th.x *= s;
    th.y *= s;
    th.dx *= s;
    th.dy *= s;
    th.destX *= s;
    th.destY *= s;
    th.attraction *= s;
  };
  
  Arkanoid.obj.resolutionObjects.push(setResolutionParams);
  setResolutionParams(Arkanoid.obj.resolution, 1);

  this.x = x;
  this.y = y;
  this.dx = 0;
  this.dy = 0;
  this.destX = x;
  this.destY = y;
  this.friction = Math.random() * 0.04 + 0.94;
  this.attractionX = 1 / getRandomInt(400, 1000);
  this.attractionY = 1 / getRandomInt(400, 1000);

  this.c = color || "#0af";
  this.opacity = 0.5;
};

Particle.prototype.render = function(context) {
  if (this.x === undefined || this.y === undefined) return false;
  context.fillStyle = this.c;

  context.beginPath();
  context.arc(this.x, this.y, this.r, 0, 2 * Math.PI, true);
  context.closePath();

  context.globalAlpha = this.opacity;
  context.fill();
};

Particle.prototype.updateLinear = function() {
  this.x += this.dx;
  this.y += this.dy;
};

Particle.prototype.updateAcc = function(timer) {
  var prevdx = this.dx;
  var prevdy = this.dy;

  if (timer !== undefined) {
    if (timer > 0) {
      this.dx += (this.destX - this.x) * this.attractionX / 3;
      this.dy += (this.destY - this.y) * this.attractionY / 3; 
    }
    else  {
      this.dx += (this.destX - this.x) * this.attractionX * Math.min(0, (timer + 200) / 600);
      this.dy += (this.destY - this.y) * this.attractionY * Math.min(0, (timer + 200) / 600); 
    }
  }
  else {
    this.dx += (this.destX - this.x) * this.attractionX;
    this.dy += (this.destY - this.y) * this.attractionY; 
  }
  

  this.dx *= this.friction;
  this.dy *= this.friction;
  this.x += this.dx;
  this.y +=  this.dy;
};

Particle.distance = function(first, second) {
  return Math.sqrt((first.x - second.x) * (first.x - second.x) + (first.y - second.y) * (first.y - second.y));
};

function Line(pointL, pointR, opacity, color) {
  this.first = pointL;
  this.second = pointR;
  this.opacity = opacity || 0.5;
  this.c = color || '#0fa';
};

Line.prototype.render = function(context) {
  context.strokeStyle = this.c;

  context.beginPath();
  context.moveTo(this.first.x, this.first.y);
  context.lineTo(this.second.x, this.second.y);
  context.closePath();

  context.globalAlpha = this.opacity;
  context.stroke();
};

function ParticlesManadger(dist, centerX, centerY) {
  var th = this;

  function setResolutionParams(r, s) {
    th.d = (dist || 100) * r;
  };
  
  Arkanoid.obj.resolutionObjects.push(setResolutionParams);
  setResolutionParams(Arkanoid.obj.resolution, 1);

  this.p = [];
  this.l = [];
  if (centerX && centerY) this.p.push(new Particle(centerX, centerY));
  
}

ParticlesManadger.prototype.setCanvas = function(canvas) {
  this.canvas = canvas;
};

ParticlesManadger.prototype.addParticle = function(x, y, radius, color) {
  this.p.push(new Particle(x, y, radius, color));
  return this;
};

ParticlesManadger.prototype.addLine = function(first, second, opacity, color) {
  this.l.push(new Line(this.p[first], this.p[second], opacity, color));
  return this;
};

ParticlesManadger.prototype.render = function(context) {
  var context = context || this.canvas.getContext('2d');
  for (var i = 0; i < this.p.length; i++)
    this.p[i].render(context);

  context.lineWidth = 2 *  Arkanoid.obj.resolution;
  for (var i = 0; i < this.l.length; i++)
    this.l[i].render(context);
};

ParticlesManadger.prototype.updateLinear = function(centerX, centerY) {
  for (var i = 1; i < this.p.length; i++) {
    this.p[i].updateLinear ();
    if (this.p[i].x - this.p[i].r > this.canvas.width) this.p[i].x = -this.p[i].r;
    if (this.p[i].x + this.p[i].r < 0) this.p[i].x = this.canvas.width + this.p[i].r;
    if (this.p[i].y - this.p[i].r > this.canvas.height) this.p[i].y = -this.p[i].r;
    if (this.p[i].y + this.p[i].r < 0) this.p[i].y = this.canvas.height + this.p[i].r;
  }
  this.p[0].x = centerX;
  this.p[0].y = centerY;
  this.l = [];
  for (var i = 0; i < this.p.length - 1; i++) {
    for (var j = i + 1; j < this.p.length; j++) {
      var dist = Particle.distance(this.p[i], this.p[j]);
      if (i === 0) 
        this.p[j].opacity = 0.5 * Math.max(0, 1 - dist / this.d);
      if (dist < this.d) {
        if (i === 0)
          this.addLine(i, j, 0.5 * (1 - dist / this.d), '#0fa');
        else
          this.addLine(i, j, 0.5 * (1 - dist / this.d), '#5B816F');
      }
    }
  }
};

ParticlesManadger.prototype.updateAcc = function(am) {
  var th = this;

  return function (t) {
    if (th.count !== undefined) {
      th.count++;
      if (th.count > 200) {
        th.count = undefined;
        for (var i = 0; i < am.animations.length - 1; i++) 
          am.unfreeze(am.animations[i]);
      }
      else {
        for (var i = 0; i < am.animations.length - 1; i++) 
          am.freeze(am.animations[i]); 
      }
    }
    for (var i = 0; i < th.p.length; i++) {
      th.p[i].updateAcc(th.count);
    }
  }
};

/*
* Using
*/

window.onload = function() {
  var ark = new Arkanoid("field");
  ark.initObjects();
  ark.initStage();
};