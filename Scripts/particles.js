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
