
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
		
		numberParticles = Math.floor(30 * pathAnim.fullTime / 8000);

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
