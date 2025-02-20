class ParticleSystem {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.mousePosition = { x: 0, y: 0 };
        this.lastMousePosition = { x: 0, y: 0 };
        this.mouseVelocity = { x: 0, y: 0 };
        this.clickWave = null;
        this.particleCount = 150;
        this.connectionDistance = 100;
        this.baseParticles = []; // Add this line to track original particles
        
        this.setupCanvas();
        this.createParticles();
        this.addEventListeners();
        this.animate();
    }

    setupCanvas() {
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.zIndex = '1';
        document.body.prepend(this.canvas);
        this.resize();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    addEventListeners() {
        window.addEventListener('resize', () => this.resize());
        window.addEventListener('mousemove', (e) => {
            this.mouseVelocity.x = e.clientX - this.mousePosition.x;
            this.mouseVelocity.y = e.clientY - this.mousePosition.y;
            this.mousePosition.x = e.clientX;
            this.mousePosition.y = e.clientY;
        });
        window.addEventListener('click', (e) => this.handleClick(e));
    }

    handleClick(e) {
        this.clickWave = {
            x: e.clientX,
            y: e.clientY,
            radius: 0,
            maxRadius: 200,
            strength: 1
        };

        for (let i = 0; i < 20; i++) {
            const particle = new Particle(this.canvas);
            particle.x = e.clientX;
            particle.y = e.clientY;
            particle.size = Math.random() * 4 + 2;
            particle.speed = Math.random() * 8 + 4;
            const angle = Math.random() * Math.PI * 2;
            particle.vx = Math.cos(angle) * particle.speed;
            particle.vy = Math.sin(angle) * particle.speed;
            particle.isBurst = true;
            this.particles.push(particle);
        }
    }

    createParticles() {
        for (let i = 0; i < this.particleCount; i++) {
            const particle = new Particle(this.canvas);
            this.particles.push(particle);
            this.baseParticles.push(particle);
        }
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.clickWave) {
            this.clickWave.radius += 10;
            this.clickWave.strength *= 0.95;
            
            if (this.clickWave.radius > this.clickWave.maxRadius) {
                this.clickWave = null;
            }
        }
        // Draw connections
        this.ctx.beginPath();
        this.ctx.strokeStyle = 'rgba(255, 92, 157, 0.1)';
        this.baseParticles.forEach((p1, i) => {
            this.baseParticles.slice(i + 1).forEach(p2 => {
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < this.connectionDistance) {
                    const opacity = (1 - distance / this.connectionDistance) * 0.5;
                    this.ctx.strokeStyle = `rgba(255, 92, 157, ${opacity})`;
                    this.ctx.beginPath();
                    this.ctx.moveTo(p1.x, p1.y);
                    this.ctx.lineTo(p2.x, p2.y);
                    this.ctx.stroke();
                }
            });
        });
        // Update and draw all particles
        [...this.baseParticles, ...this.particles].forEach(particle => {
            particle.update(this.mousePosition, this.mouseVelocity, this.clickWave);
            particle.draw(this.ctx);
        });
        // Filter out burst particles
        this.particles = this.particles.filter(particle => 
            particle.isBurst && particle.life <= particle.maxLife
        );
        requestAnimationFrame(() => this.animate());
    }
}

class Particle {
    reset() {
        if (!this.life || this.life <= 1) {
            // Initial spawn
            this.x = Math.random() * this.canvas.width;
            this.y = Math.random() * this.canvas.height;
        } else {
            // Respawn at edges
            const side = Math.floor(Math.random() * 4);
            switch(side) {
                case 0: // top
                    this.x = Math.random() * this.canvas.width;
                    this.y = -10;
                    break;
                case 1: // right
                    this.x = this.canvas.width + 10;
                    this.y = Math.random() * this.canvas.height;
                    break;
                case 2: // bottom
                    this.x = Math.random() * this.canvas.width;
                    this.y = this.canvas.height + 10;
                    break;
                case 3: // left
                    this.x = -10;
                    this.y = Math.random() * this.canvas.height;
                    break;
            }
        }

        this.size = Math.random() * 3 + 1;
        this.baseSpeed = Math.random() * 1 + 0.5;
        this.speed = this.baseSpeed;
        this.vx = (Math.random() - 0.5) * this.speed;
        this.vy = (Math.random() - 0.5) * this.speed;
        this.life = 1;
        this.maxLife = Math.random() * 100 + 100;
        this.color = {
            h: Math.random() > 0.5 ? 
                330 + Math.random() * 20 : 
                25 + Math.random() * 20,
            s: 100,
            l: 75
        };
    }
    constructor(canvas) {
        this.canvas = canvas;
        this.reset();
    }
    update(mousePos, mouseVel, clickWave) {
        this.life++;
        
        // Check if particle is off screen
        const margin = 50; // Buffer zone
        if (this.x < -margin || 
            this.x > this.canvas.width + margin || 
            this.y < -margin || 
            this.y > this.canvas.height + margin) {
            this.reset();
        }

        const dx = mousePos.x - this.x;
        const dy = mousePos.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 200) {
            const force = (200 - distance) / 200;
            this.vx -= dx * force * 0.005; // Reduced from 0.02
            this.vy -= dy * force * 0.005; // Reduced from 0.02
            
            // Reduced mouse velocity influence
            this.vx += mouseVel.x * force * 0.03; // Reduced from 0.1
            this.vy += mouseVel.y * force * 0.03; // Reduced from 0.1
            
            this.speed = this.baseSpeed * (1 + force * 0.5); // Reduced multiplier
        }

        this.x += this.vx;
        this.y += this.vy;

        // Bounce off edges
        if (this.x < 0 || this.x > this.canvas.width) this.vx *= -0.5;
        if (this.y < 0 || this.y > this.canvas.height) this.vy *= -0.5;

        // Add some randomness to movement
        this.vx += (Math.random() - 0.5) * 0.3;
        this.vy += (Math.random() - 0.5) * 0.3;

        // Normalize velocity
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > this.speed) {
            this.vx = (this.vx / speed) * this.speed;
            this.vy = (this.vy / speed) * this.speed;
        }
    }
    draw(ctx) {
        const opacity = this.isBurst ? 
            this.size / 4 : 
            Math.sin((this.life / this.maxLife) * Math.PI);
    
        // Enhanced glow effect
        ctx.shadowBlur = this.size * 4; // Increased from 2
        ctx.shadowColor = `hsla(${this.color.h}, ${this.color.s}%, ${this.color.l}%, ${opacity * 0.8})`; // Increased from 0.5
    
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        
        // Brighter gradient for particles
        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, this.size * 2 // Increased glow radius
        );
        gradient.addColorStop(0, `hsla(${this.color.h}, ${this.color.s}%, ${this.color.l}%, ${opacity})`);
        gradient.addColorStop(0.5, `hsla(${this.color.h}, ${this.color.s}%, ${this.color.l}%, ${opacity * 0.5})`);
        gradient.addColorStop(1, `hsla(${this.color.h}, ${this.color.s}%, ${this.color.l}%, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.fill();
    }
}

new ParticleSystem();