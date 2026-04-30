/**
 * MatrixRain: High-performance canvas-based matrix code rain effect.
 */
export class MatrixRain {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.container.appendChild(this.canvas);

        this.characters = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍ0123456789";
        this.fontSize = 16;
        this.columns = 0;
        this.drops = [];

        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.active = true;
        this.animate();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.columns = Math.floor(this.canvas.width / this.fontSize);
        
        // Re-initialize drops
        this.drops = [];
        for (let i = 0; i < this.columns; i++) {
            this.drops[i] = Math.random() * -100; // Start at different heights
        }
    }

    animate() {
        if (!this.active) return;

        // Subtle fade effect to create trails (Reduced alpha for longer trails)
        this.ctx.fillStyle = "rgba(5, 1, 5, 0.08)";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = "#00FF41"; 
        this.ctx.font = "bold " + this.fontSize + "px 'JetBrains Mono'";

        for (let i = 0; i < this.drops.length; i++) {
            const text = this.characters.charAt(Math.floor(Math.random() * this.characters.length));
            
            // Randomly make some characters brighter
            if (Math.random() > 0.98) {
                this.ctx.fillStyle = "#fff";
            } else {
                this.ctx.fillStyle = "#00FF41";
            }

            this.ctx.fillText(text, i * this.fontSize, this.drops[i] * this.fontSize);

            if (this.drops[i] * this.fontSize > this.canvas.height && Math.random() > 0.975) {
                this.drops[i] = 0;
            }

            this.drops[i]++;
        }

        requestAnimationFrame(() => this.animate());
    }

    setOpacity(val) {
        if (this.container) {
            this.container.style.opacity = val;
        }
    }
}
