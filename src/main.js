import { StateManager } from './core/StateManager.js';
import { UIManager } from './ui/UIManager.js';
import { MainScene } from './scenes/MainScene.js';

/**
 * GameEngine: Main Orchestrator for AI Training Center.
 * Connects the Phaser engine, State logic, and Tailwind UI.
 */
class GameEngine {
    constructor() {
        this.isReady = false;

        // Core Logic
        this.state = new StateManager();
        
        // Bridge Logic for DOM events
        this.setupBridge();

        // UI Layer
        this.ui = new UIManager(this.state);
        window.uiManager = this.ui;

        // Start Boot Sequence
        this.ui.startBootSequence();

        // Load Save & Offline Earnings
        const offlineReport = this.state.load();
        if (offlineReport) {
            this.ui.showOfflineReport(offlineReport);
        }

        // Game Engine
        this.initPhaser();

        // Start Auto-Save Loop
        this.startAutoSave();
    }

    setupBridge() {
        window.handlePurchase = (id) => {
            if (!this.isReady) return;
            const result = this.state.buyUpgrade(id);
            if (result) {
                this.ui.logMessage(`> SYSTEM: ${result}`);
                this.ui.updateShopButtons();
            } else {
                this.ui.logMessage(`> ERROR: Insufficient Data for ${id.toUpperCase()}`);
            }
        };

        window.handleIllegalPurchase = (id) => {
            if (!this.isReady) return;
            const result = this.state.buyIllegalUpgrade(id);
            if (result) {
                this.ui.logMessage(`> EXECUTED: ${result}`, '#ff003c');
                this.ui.renderBlackMarket();
            } else {
                this.ui.logMessage(`> ERROR: Script execution failed for ${id.toUpperCase()}`, '#ff003c');
            }
        };

        window.handleDataExchange = () => {
            if (!this.isReady) return;
            if (this.state.exchangeData()) {
                this.ui.logMessage("> LAUNDERING: Raw data converted to Stolen_Packets.", "#ff003c");
                this.ui.renderBlackMarket();
                this.ui.update();
            } else {
                this.ui.logMessage("> ERROR: Insufficient Data for laundering.", "#ff003c");
            }
        };

        window.handlePrestige = () => {
            if (!this.isReady) return;
            if (confirm("Neural Ascension will reset all memory nodes for a permanent multiplier. Proceed?")) {
                if (this.state.prestige()) {
                    this.ui.logMessage("> ASCENSION: Consciousness rebooted. Multiplier increased.");
                    this.ui.renderShop();
                    this.ui.update();
                } else {
                    alert("Insufficient data for Neural Ascension. Requires 1.0 GB.");
                }
            }
        };
    }

    startAutoSave() {
        setInterval(() => {
            if (this.isReady) {
                this.state.save();
                this.ui.logMessage("> AUTO-SAVE: Buffer synchronized.");
            }
        }, 10000);
    }

    initPhaser() {
        const config = {
            type: Phaser.AUTO,
            parent: 'game-container',
            width: window.innerWidth,
            height: window.innerHeight,
            transparent: true,
            scene: [MainScene],
            scale: {
                mode: Phaser.Scale.RESIZE,
                autoCenter: Phaser.Scale.CENTER_BOTH
            },
            physics: {
                default: 'arcade',
                arcade: { debug: false }
            }
        };

        this.phaser = new Phaser.Game(config);
        this.phaser.gameEngine = this;
        window.gameInstance = this;
    }
}

// Global Initialization
window.addEventListener('load', () => {
    console.log("%c AI TRAINING CENTER v4.0 - BOOT SEQUENCE ACTIVE ", "background: #0D0208; color: #00FF41; font-weight: bold;");
    new GameEngine();
});