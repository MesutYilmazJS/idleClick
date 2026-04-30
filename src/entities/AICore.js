/**
 * AICore: Neural Network Evolution Entity.
 * Transforms from a single Neuron to a Singularity Web.
 */
export class AICore {
    constructor(scene, x, y, size) {
        this.scene = scene;
        this.engine = scene.game.gameEngine;
        this.x = x;
        this.y = y;
        this.baseSize = size;
        this.currentStage = 0;
        
        // Layers
        this.graphics = scene.add.graphics();
        this.container = scene.add.container(x, y);
        this.container.add(this.graphics);

        // Core Label
        this.label = scene.add.text(0, size/2 + 40, 'NEURAL_CORE', {
            fontFamily: 'JetBrains Mono', fontSize: '14px', color: '#00FF41', fontStyle: 'bold'
        }).setOrigin(0.5).setAlpha(0.6);
        this.container.add(this.label);

        // State Data
        this.nodes = [];
        this.connections = [];
        this.packets = [];
        
        this.setupParticles();
        this.setupEvents();
        this.checkEvolution(true);
    }

    setupParticles() {
        // Pixel explosion for transitions and clicks
        if (!this.scene.textures.exists('pixel')) {
            const g = this.scene.make.graphics({ x: 0, y: 0, add: false });
            g.fillStyle(0x00FF41, 1);
            g.fillRect(0, 0, 4, 4);
            g.generateTexture('pixel', 4, 4);
        }

        this.pixelEmitter = this.scene.add.particles(0, 0, 'pixel', {
            speed: { min: 100, max: 400 },
            scale: { start: 1, end: 0 },
            alpha: { start: 1, end: 0 },
            lifespan: 800,
            emitting: false
        });
    }

    setupEvents() {
        this.hitArea = this.scene.add.circle(this.x, this.y, this.baseSize / 1.5, 0xffffff, 0)
            .setInteractive({ useHandCursor: true });

        this.hitArea.on('pointerdown', (pointer) => {
            if (this.engine.state.isOverheated) {
                this.scene.cameras.main.shake(100, 0.005);
                this.showFloatingText(pointer.x, pointer.y, 'OVERHEAT', '#ff0000');
                return;
            }

            const { gain, isCritical } = this.engine.state.addCredits(this.engine.state.clickPower);
            this.engine.state.addHeat(this.engine.state.heatPerClick);
            this.engine.state.totalClicks++;
            
            // StateManager's formatValue already includes the unit (MB, GB, TB)
            const formattedGain = `+${this.engine.state.formatValue(gain)}`;
            const textColor = isCritical ? '#ffffff' : (this.engine.state.skillTree.selectedPath === 'creative' ? '#ff003c' : '#00FF41');
            
            this.showFloatingText(pointer.x, pointer.y, formattedGain, textColor, isCritical);

            if (isCritical) {
                this.showCriticalEffect(pointer.x, pointer.y);
            }
            
            this.onInteraction(pointer);
        });
    }

    showFloatingText(x, y, message, color, isCritical = false) {
        const fontSize = isCritical ? '32px' : '20px';
        const text = this.scene.add.text(x, y, message, {
            fontFamily: 'JetBrains Mono',
            fontSize: fontSize,
            color: color,
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(300);

        // Random horizontal drift
        const driftX = (Math.random() - 0.5) * 40;

        this.scene.tweens.add({
            targets: text,
            x: x + driftX,
            y: y - 100,
            alpha: 0,
            duration: 1000,
            ease: 'Cubic.easeOut',
            onComplete: () => text.destroy()
        });
    }

    showCriticalEffect(x, y) {
        const color = this.getPathColor();
        const text = this.scene.add.text(x, y, 'CRITICAL!', {
            fontFamily: 'JetBrains Mono', fontSize: '24px', color: '#FFFFFF', fontStyle: 'bold'
        }).setOrigin(0.5).setStroke(color, 4);

        this.scene.tweens.add({
            targets: text,
            y: y - 100,
            alpha: 0,
            duration: 800,
            ease: 'Cubic.easeOut',
            onComplete: () => text.destroy()
        });

        this.pixelEmitter.emitParticleAt(x, y, 30);
    }

    getPathColor() {
        const path = this.engine.state.skillTree.selectedPath;
        if (path === 'logic') return 0x00f2ff;
        if (path === 'creative') return 0xff003c;
        return 0x00FF41;
    }

    checkEvolution(isInitial = false) {
        const data = this.engine.state.totalDataEver;
        let nextStage = 1;
        if (data >= 1000000) nextStage = 3;
        else if (data >= 1000) nextStage = 2;

        if (nextStage !== this.currentStage) {
            this.transition(nextStage, isInitial);
        }
    }

    transition(stage, isInitial) {
        if (!isInitial) {
            // Particle explosion on old nodes
            this.nodes.forEach(n => {
                this.pixelEmitter.emitParticleAt(this.x + n.x, this.y + n.y, 10);
            });
            this.scene.cameras.main.flash(400, 0, 255, 65, 0.2);
        }

        this.currentStage = stage;
        this.nodes = [];
        this.connections = [];
        this.packets = [];

        if (stage === 1) this.createStage1();
        else if (stage === 2) this.createStage2();
        else if (stage === 3) this.createStage3();

        if (!isInitial) {
            this.container.setScale(0).setAlpha(0);
            this.scene.tweens.add({
                targets: this.container,
                scale: 1, alpha: 1, duration: 1000, ease: 'Elastic.easeOut'
            });
        }
    }

    createStage1() {
        // Central Node
        this.nodes.push({ x: 0, y: 0, size: 40, pulse: 1 });
        // 3-4 Satellites
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            const dist = this.baseSize / 3;
            this.nodes.push({ 
                x: Math.cos(angle) * dist, 
                y: Math.sin(angle) * dist, 
                size: 10, 
                pulse: 1 
            });
            this.connections.push({ from: 0, to: i + 1 });
        }
    }

    createStage2() {
        // 12 nodes in a mesh
        for (let i = 0; i < 12; i++) {
            this.nodes.push({
                x: Phaser.Math.Between(-this.baseSize/2, this.baseSize/2),
                y: Phaser.Math.Between(-this.baseSize/2, this.baseSize/2),
                size: 12,
                pulse: 1
            });
        }
        // Connect each to 2-3 neighbors
        this.nodes.forEach((n, i) => {
            const targets = [ (i+1)%12, (i+3)%12 ];
            targets.forEach(t => this.connections.push({ from: i, to: t }));
        });

        // Initialize some packets
        for (let i = 0; i < 8; i++) this.spawnPacket();
    }

    createStage3() {
        // High density web
        for (let i = 0; i < 40; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * (this.baseSize / 1.5);
            this.nodes.push({ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, size: 8, pulse: 1 });
        }
        // Complex connections
        for (let i = 0; i < 80; i++) {
            this.connections.push({ 
                from: Phaser.Math.Between(0, 39), 
                to: Phaser.Math.Between(0, 39) 
            });
        }
        for (let i = 0; i < 20; i++) this.spawnPacket();
    }

    spawnPacket() {
        if (this.connections.length === 0) return;
        const conn = Phaser.Utils.Array.GetRandom(this.connections);
        this.packets.push({
            fromNode: this.nodes[conn.from],
            toNode: this.nodes[conn.to],
            progress: 0,
            speed: 0.01 + Math.random() * 0.02
        });
    }

    onInteraction(pointer) {
        // Visual feedback based on stage
        if (this.currentStage === 1) {
            this.scene.tweens.add({ targets: this.nodes[0], pulse: 1.5, duration: 100, yoyo: true });
        } else if (this.currentStage === 2) {
            this.fireNetwork();
        } else if (this.currentStage === 3) {
            this.scene.cameras.main.shake(150, 0.003);
            this.pixelEmitter.emitParticleAt(pointer.x, pointer.y, 20);
            this.drawShockwave(pointer.x - this.x, pointer.y - this.y);
        }
    }

    fireNetwork() {
        this.nodes.forEach(n => {
            this.scene.tweens.add({ targets: n, pulse: 2, duration: 150, yoyo: true });
        });
    }

    drawShockwave(x, y) {
        const circle = this.scene.add.circle(this.x + x, this.y + y, 10, 0x00FF41, 0.2);
        circle.setStrokeStyle(2, 0x00FF41, 0.8);
        this.scene.tweens.add({
            targets: circle,
            radius: 300, alpha: 0, duration: 600,
            onComplete: () => circle.destroy()
        });
    }

    update(time, delta) {
        this.checkEvolution();
        this.graphics.clear();

        if (this.currentStage === 3) {
            this.container.rotation += 0.002;
        }

        const themeColor = this.engine.state.isBossActive ? 0xff003c : this.getPathColor();
        const isOverheated = this.engine.state.isOverheated;

        // 1. Draw Connections (Synapses)
        this.connections.forEach(c => {
            const n1 = this.nodes[c.from];
            const n2 = this.nodes[c.to];
            const alpha = this.currentStage === 1 ? 0.2 : 0.4;
            this.graphics.lineStyle(1, isOverheated ? 0xff0000 : themeColor, alpha);
            this.graphics.beginPath();
            this.graphics.moveTo(n1.x, n1.y);
            this.graphics.lineTo(n2.x, n2.y);
            this.graphics.strokePath();
        });

        // 2. Draw Data Packets
        this.packets.forEach((p, index) => {
            p.progress += p.speed;
            if (p.progress >= 1) {
                this.packets.splice(index, 1);
                this.spawnPacket();
                return;
            }
            const px = Phaser.Math.Linear(p.fromNode.x, p.toNode.x, p.progress);
            const py = Phaser.Math.Linear(p.fromNode.y, p.toNode.y, p.progress);
            this.graphics.fillStyle(isOverheated ? 0xff0000 : themeColor, 1);
            this.graphics.fillCircle(px, py, 3);
        });

        // 3. Draw Nodes (Neurons)
        this.nodes.forEach((n, i) => {
            const color = isOverheated ? 0xff0000 : themeColor;
            const alpha = (i === 0 && this.currentStage === 1) ? 0.8 : 0.4;
            
            this.graphics.fillStyle(color, alpha);
            this.graphics.fillCircle(n.x, n.y, n.size * n.pulse);
            
            this.graphics.lineStyle(2, color, 1);
            this.graphics.strokeCircle(n.x, n.y, n.size * n.pulse);

            // Subtle breathing
            n.pulse = 1 + Math.sin(time / 500 + i) * 0.05;
        });

        let labelColor = isOverheated ? '#ff0000' : (this.engine.state.skillTree.selectedPath === 'logic' ? '#00f2ff' : (this.engine.state.skillTree.selectedPath === 'creative' ? '#ff003c' : '#00FF41'));
        if (this.engine.state.isBossActive) labelColor = '#ff003c';

        this.label.setText(isOverheated ? 'SYSTEM_OVERHEAT' : (this.engine.state.isBossActive ? 'FIREWALL_BREACH_DETECTED' : `NEURAL_STAGE_${this.currentStage}`));
        this.label.setColor(labelColor);
    }
}
