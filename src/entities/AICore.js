/**
 * AICore: Cinematic "Jarvis vs Ultron" Style.
 * Simplified Input: No internal listeners, all handled by MainScene for reliability.
 */
export class AICore {
    constructor(scene, x, y, size) {
        this.scene = scene;
        this.engine = scene.game.gameEngine;
        this.x = x;
        this.y = y;
        this.baseSize = size;
        this.currentStage = -1;
        this.timer = 0;
        
        // Layers for Depth
        this.container = scene.add.container(x, y);
        this.nebulaGraphics = scene.add.graphics().setBlendMode(Phaser.BlendModes.SCREEN).setAlpha(0.2);
        this.capillaryGraphics = scene.add.graphics().setAlpha(0.4);
        this.arcGraphics = scene.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
        this.container.add([this.nebulaGraphics, this.capillaryGraphics, this.arcGraphics]);

        this.nodes = [];
        this.connections = [];
        this.pulseWaves = [];
        this.lightningBolts = [];
        
        this.setupParticles();
        this.checkEvolution(true);
    }

    setupParticles() {
        if (!this.scene.textures.exists('data-spark')) {
            const g = this.scene.make.graphics({ x: 0, y: 0, add: false });
            g.fillStyle(0xffffff, 1);
            g.fillRect(0, 0, 2, 2);
            g.generateTexture('data-spark', 2, 2);
        }
        this.sparkEmitter = this.scene.add.particles(0, 0, 'data-spark', {
            speed: { min: 100, max: 400 },
            scale: { start: 1, end: 0 },
            alpha: { start: 1, end: 0 },
            lifespan: 400,
            emitting: false,
            blendMode: 'ADD'
        });
    }

    checkEvolution(isInit = false) {
        const stage = this.engine.state.currentStage || 0;
        if (stage !== this.currentStage || isInit) {
            this.currentStage = stage;
            this.nodes = [];
            this.connections = [];
            this.buildNetwork();
            if (!isInit) this.scene.cameras.main.flash(300, 255, 255, 255, 0.05);
        }
    }

    buildNetwork() {
        const count = 10 + (this.currentStage * 12);
        this.addNode(0, 0, 10, true); 

        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const dist = this.baseSize * (0.4 + Math.random() * 0.8);
            this.addNode(Math.cos(angle) * dist, Math.sin(angle) * dist, 3);
            this.connections.push({ from: 0, to: i + 1, jitter: 3 + Math.random() * 4 });
        }

        if (this.currentStage >= 1) {
            const interCount = this.currentStage * 15;
            for (let i = 0; i < interCount; i++) {
                this.connections.push({
                    from: Phaser.Math.Between(1, this.nodes.length - 1),
                    to: Phaser.Math.Between(1, this.nodes.length - 1),
                    jitter: 2
                });
            }
        }
    }

    addNode(x, y, size, isCore = false) {
        this.nodes.push({
            x, y, baseX: x, baseY: y, size, isCore,
            flicker: Math.random(),
            driftPhase: Math.random() * Math.PI * 2
        });
    }

    update(time, delta) {
        const path = this.engine.state.skillTree.selectedPath;
        const color = path === 'creative' ? 0xff4d00 : 0x00d2ff; 
        this.timer += delta * 0.001;

        this.nodes.forEach(n => {
            if (!n.isCore) {
                n.x = n.baseX + Math.sin(this.timer * 3 + n.driftPhase) * 5;
                n.y = n.baseY + Math.cos(this.timer * 2.5 + n.driftPhase) * 5;
            }
            n.flicker = Math.random();
        });

        this.pulseWaves = this.pulseWaves.filter(w => {
            w.radius += w.speed * delta;
            w.alpha -= 0.05 * delta;
            return w.alpha > 0;
        });

        this.lightningBolts = this.lightningBolts.filter(b => {
            b.life -= 0.1 * delta;
            return b.life > 0;
        });

        this.draw(color);
    }

    draw(color) {
        this.nebulaGraphics.clear();
        this.capillaryGraphics.clear();
        this.arcGraphics.clear();

        this.nebulaGraphics.fillStyle(color, 0.1);
        this.nebulaGraphics.fillCircle(0, 0, this.baseSize * 1.5);

        this.capillaryGraphics.lineStyle(1, color, 0.1);
        this.connections.forEach(conn => {
            const n1 = this.nodes[conn.from];
            const n2 = this.nodes[conn.to];
            this.capillaryGraphics.beginPath();
            this.capillaryGraphics.moveTo(n1.x, n1.y);
            this.capillaryGraphics.lineTo(n2.x, n2.y);
            this.capillaryGraphics.strokePath();
        });

        this.connections.forEach(conn => {
            const n1 = this.nodes[conn.from];
            const n2 = this.nodes[conn.to];
            if (Math.random() > 0.4) {
                this.arcGraphics.lineStyle(1, color, 0.2 + Math.random() * 0.4);
                this.drawJaggedLine(this.arcGraphics, n1, n2, conn.jitter);
            }
        });

        this.lightningBolts.forEach(bolt => {
            const n1 = this.nodes[bolt.conn.from];
            const n2 = this.nodes[bolt.conn.to];
            this.arcGraphics.lineStyle(2, 0xffffff, bolt.life);
            this.drawJaggedLine(this.arcGraphics, n1, n2, 8);
        });

        this.nodes.forEach(n => {
            const pulse = n.size * (0.8 + n.flicker * 0.4);
            this.arcGraphics.fillStyle(color, n.isCore ? 1 : 0.7);
            this.arcGraphics.fillCircle(n.x, n.y, pulse);
            if (n.isCore) {
                this.arcGraphics.fillStyle(0xffffff, 0.3);
                this.arcGraphics.fillCircle(n.x, n.y, pulse * 2);
            }
        });

        this.pulseWaves.forEach(w => {
            this.arcGraphics.lineStyle(2, color, w.alpha);
            this.arcGraphics.strokeCircle(w.x, w.y, w.radius);
        });
    }

    drawJaggedLine(graphics, n1, n2, jitter) {
        const dist = Phaser.Math.Distance.Between(n1.x, n1.y, n2.x, n2.y);
        const segments = Math.max(3, Math.floor(dist / 10));
        graphics.beginPath();
        graphics.moveTo(n1.x, n1.y);
        for (let i = 1; i < segments; i++) {
            const t = i / segments;
            graphics.lineTo(
                Phaser.Math.Linear(n1.x, n2.x, t) + (Math.random() - 0.5) * jitter * 3,
                Phaser.Math.Linear(n1.y, n2.y, t) + (Math.random() - 0.5) * jitter * 3
            );
        }
        graphics.lineTo(n2.x, n2.y);
        graphics.strokePath();
    }

    onInteraction(pointer) {
        this.sparkEmitter.explode(10, pointer.x, pointer.y);
        if (Math.random() > 0.8) this.scene.cameras.main.shake(100, 0.001);
        
        // Trigger a bolt for visual feedback
        if (this.connections.length > 0) {
            this.lightningBolts.push({
                conn: Phaser.Utils.Array.GetRandom(this.connections),
                life: 1.0
            });
        }
    }

    showFloatingText(x, y, message, color) {
        const text = this.scene.add.text(x, y, message, {
            fontFamily: 'JetBrains Mono', fontSize: '20px', color: color, fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5).setDepth(1000);
        this.scene.tweens.add({
            targets: text, y: y - 100, alpha: 0, duration: 800, onComplete: () => text.destroy()
        });
    }
}
