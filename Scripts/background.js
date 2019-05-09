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