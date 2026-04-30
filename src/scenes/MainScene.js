import { AICore } from '../entities/AICore.js';

/**
 * MainScene: The primary Phaser scene for the AI Training Center.
 */
export class MainScene extends Phaser.Scene {
    constructor() {
        super('MainScene');
    }

    create() {
        this.engine = this.game.gameEngine;
        const { width, height } = this.scale;

        // Background Atmosphere
        this.setupBackground();

        // Neural Core Entity
        const coreSize = Math.min(width, height) * 0.5;
        this.aiCore = new AICore(this, width / 2, height / 2, coreSize);

        // Scanline / CRT Post-FX (Simulated via overlay in HTML, but adding subtle scene overlay here too)
        this.vignette = this.add.graphics();
        this.vignette.fillStyle(0x000000, 0.4);
        this.vignette.fillRect(0, 0, width, height);
        this.vignette.setDepth(100);
        this.vignette.setScrollFactor(0);

        // Digital Grid
        this.setupGrid();

        // Boss UI Layer
        this.setupBossUI();

        // Global Click Listener
        this.input.on('pointerdown', (pointer) => {
            const state = this.engine.state;
            const core = this.aiCore;

            // 1. Boss Interaction (Global)
            if (state.isBossActive) {
                const damage = state.addCredits(state.clickPower);
                if (core) {
                    core.showFloatingText(pointer.x, pointer.y, `DMG: ${damage.gain.toFixed(0)}`, '#ff003c');
                    core.onInteraction(pointer);
                }
                return;
            }

            // 2. Overheat Check
            if (state.isOverheated) {
                this.cameras.main.shake(100, 0.005);
                if (core) core.showFloatingText(pointer.x, pointer.y, 'OVERHEAT', '#ff0000');
                return;
            }

            // 3. Normal Interaction (Global - Screen Wide)
            const data = state.addCredits(state.clickPower);
            state.addHeat(state.heatPerClick);
            state.totalClicks++;
            
            if (core) {
                const textColor = (state.skillTree.selectedPath === 'creative' ? '#ff4d00' : '#00d2ff');
                core.showFloatingText(pointer.x, pointer.y, `+${state.formatValue(data.gain)}`, textColor);
                core.onInteraction(pointer);
            }
        });
    }

    setupBackground() {
        const { width, height } = this.scale;
        
        // Ambient Particles (Neural "dust")
        this.particles = this.add.particles(0, 0, 'pixel', {
            x: { min: 0, max: width },
            y: { min: 0, max: height },
            speed: { min: 2, max: 10 },
            alpha: { start: 0.2, end: 0 },
            scale: { start: 0.5, end: 0 },
            lifespan: 5000,
            frequency: 200,
            blendMode: 'ADD'
        });

        // Matrix Rain Layer (Visible only at Singularity)
        this.matrixLayer = this.add.container(0, 0).setAlpha(0);
        for(let i = 0; i < 40; i++) {
            const column = this.add.text(Phaser.Math.Between(0, width), Phaser.Math.Between(-height, 0), this.generateMatrixStr(), {
                fontFamily: 'JetBrains Mono', fontSize: '14px', color: '#00FF41', alpha: 0.4
            });
            this.matrixLayer.add(column);
            this.tweens.add({
                targets: column,
                y: height + 200,
                duration: Phaser.Math.Between(3000, 7000),
                repeat: -1,
                ease: 'Linear',
                onRepeat: () => {
                    column.setText(this.generateMatrixStr());
                    column.x = Phaser.Math.Between(0, width);
                }
            });
        }
    }

    generateMatrixStr() {
        let str = '';
        for(let i = 0; i < 20; i++) str += String.fromCharCode(0x30A0 + Math.random() * 96) + '\n';
        return str;
    }

    setupGrid() {
        const { width, height } = this.scale;
        const grid = this.add.grid(width/2, height/2, width * 2, height * 2, 64, 64, 0, 0, 0x00FF41, 0.05);
        grid.setAngle(15);
        
        this.tweens.add({
            targets: grid,
            alpha: 0.1,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    setupBossUI() {
        const { width, height } = this.scale;
        this.bossContainer = this.add.container(0, 0).setDepth(200).setAlpha(0);

        // 1. Firewall Hexagon (Glitchy)
        this.firewallHex = this.add.graphics();
        this.drawFirewallHex();
        this.bossContainer.add(this.firewallHex);

        // 2. Countdown Timer (Large background effect)
        this.bossTimerText = this.add.text(width / 2, height / 2, '15.00', {
            fontFamily: 'JetBrains Mono', fontSize: '120px', color: '#ff003c', fontStyle: 'bold'
        }).setOrigin(0.5).setAlpha(0.05);
        this.bossContainer.add(this.bossTimerText);
    }

    drawFirewallHex() {
        const { width, height } = this.scale;
        const size = Math.min(width, height) * 0.35;
        this.firewallHex.clear();
        this.firewallHex.lineStyle(4, 0xff003c, 0.6);
        this.firewallHex.fillStyle(0xff003c, 0.1);

        const points = [];
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const px = width / 2 + Math.cos(angle) * size;
            const py = height / 2 + Math.sin(angle) * size;
            points.push({ x: px, y: py });
        }

        this.firewallHex.beginPath();
        this.firewallHex.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < 6; i++) this.firewallHex.lineTo(points[i].x, points[i].y);
        this.firewallHex.closePath();
        this.firewallHex.strokePath();
        this.firewallHex.fillPath();

        // Extra glitch lines
        for (let i = 0; i < 3; i++) {
            this.firewallHex.lineStyle(1, 0xff003c, 0.3);
            const offset = (Math.random() - 0.5) * 20;
            this.firewallHex.beginPath();
            this.firewallHex.moveTo(points[0].x + offset, points[0].y + offset);
            for (let j = 1; j < 6; j++) this.firewallHex.lineTo(points[j].x + offset, points[j].y + offset);
            this.firewallHex.closePath();
            this.firewallHex.strokePath();
        }
    }

    update(time, delta) {
        const deltaSeconds = delta / 1000;

        // Update Global State and UI
        this.engine.state.update(deltaSeconds);
        this.engine.ui.update();

        // Update Matrix Rain Alpha based on singularity
        if (this.engine.state.milestones.singularity) {
            this.matrixLayer.setAlpha(0.2);
        }

        // Update Entities
        if (this.aiCore) {
            this.aiCore.update(time, delta);
        }

        // Update Boss UI
        this.updateBossUI(deltaSeconds);
    }

    updateBossUI(deltaSeconds) {
        const state = this.engine.state;
        if (state.isBossActive) {
            this.bossContainer.setAlpha(1);
            
            // Glitch effect on hexagon
            if (Math.random() > 0.8) {
                this.drawFirewallHex();
                this.bossContainer.x = (Math.random() - 0.5) * 4;
                this.bossContainer.y = (Math.random() - 0.5) * 4;
            }

            // Timer effect only (Health is now in HTML)
            this.bossTimerText.setText(state.bossTimer.toFixed(2));
            if (state.bossTimer < 5) {
                this.bossTimerText.setAlpha(0.2 + Math.sin(Date.now() / 100) * 0.1);
            }
        } else {
            this.bossContainer.setAlpha(0);
        }
    }
}
