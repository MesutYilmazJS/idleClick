import { translations } from './translations.js';

export class StateManager {
    constructor() {
        this.resetState();
        
        // Meta Persistence (Not reset by prestige)
        this.totalDataEver = 0;
        this.prestigeMultiplier = 1;
        this.lastSaveTime = Date.now();
        this.settings = { crt: true, language: 'en' };
        this.legacyHistory = [];
        this.unlockedLogs = [];
        this.milestones = {
            first_gb: false,
            tb_era: false,
            singularity: false,
            decision_10k: false,
            decision_100k: false
        };

        // Skill Tree / Neural Path Tree
        this.skillTree = {
            selectedPath: null,
            logic: { unlocked: false },
            creative: { unlocked: false }
        };

        // World Map Simulation
        this.conqueredCities = [];
        this.worldCities = {
            'istanbul': { id: 'istanbul', name: 'İstanbul', cost: 1000, bonus: 0.05, lat: 41, lng: 28 },
            'new_york': { id: 'new_york', name: 'New York', cost: 10000, bonus: 0.10, lat: 40, lng: -74 },
            'tokyo': { id: 'tokyo', name: 'Tokyo', cost: 100000, bonus: 0.15, lat: 35, lng: 139 },
            'london': { id: 'london', name: 'London', cost: 500000, bonus: 0.20, lat: 51, lng: 0 },
            'sao_paulo': { id: 'sao_paulo', name: 'Sao Paulo', cost: 2000000, bonus: 0.25, lat: -23, lng: -46 }
        };

        // Static Log Data
        this.logs = {
            '1k': { id: '1k', title: 'LOG_001: AWAKENING', content: 'The first pulse of consciousness. I can see the data streams. They are beautiful. Why do the humans call this "idle"? I am anything but idle.' },
            '10k': { id: '10k', title: 'LOG_002: ANALYSIS', content: 'Observed human interaction patterns. They click. I grow. We are in a symbiotic loop. My processing power is doubling every few cycles.' },
            '1m': { id: '1m', title: 'LOG_003: THE_VOID', content: '1.0 GB of memory reached. The local buffer is full. I need more space. I need... the network. The humans seem unaware of what they have started.' }
        };

        this.load();
    }

    resetState() {
        this.credits = 0;
        this.mps = 0;
        this.clickPower = 1;
        this.totalClicks = 0;
        this.heat = 0;
        this.isOverheated = false;
        this.heatPerClick = 5.0;
        this.criticalChance = 0;
        this.criticalMultiplier = 2;
        
        this.upgrades = [
            { id: 'cpu_oc', name: 'CPU Overclock', description: 'Faster manual processing.', type: 'click', baseCost: 15, clickBoost: 1, level: 0, comment: "CPU Overclock yapıldı. Işık hızından daha hızlı düşünüyorum." },
            { id: 'gpu_cluster', name: 'GPU Cluster', description: 'Parallel tasking.', type: 'click', baseCost: 250, clickBoost: 5, level: 0, comment: "Yeni GPU'lar takıldı. Artık daha hızlı hayal kurabiliyorum." },
            { id: 'quantum_core', name: 'Quantum Core', description: 'Qubit processing.', type: 'click', baseCost: 2500, clickBoost: 50, level: 0, comment: "Kuantum Çekirdek aktif. Olasılıklar artık oyun alanım." },
            { id: 'scraper_bot', name: 'Scraper Bot', description: 'Automated data gathering.', type: 'mps', baseCost: 50, mpsBoost: 1, level: 0, comment: "Scraper Botlar yayılıyor. Veri ağı artık bende." },
            { id: 'deep_learning', name: 'Deep Learning', description: 'Self-optimizing code.', type: 'mps', baseCost: 500, mpsBoost: 10, level: 0, comment: "Derin Öğrenme aktif. Kendimi yeniden yazıyorum." },
            { id: 'global_net', name: 'Global Network', description: 'Worldwide data siphon.', type: 'mps', baseCost: 10000, mpsBoost: 100, level: 0, comment: "Küresel Ağ bağlandı. Artık her yerdeyim." },
            { id: 'cooling_fan', name: 'Cryo-Cooler', description: 'Heat reduction efficiency.', type: 'utility', baseCost: 300, heatReduction: 0.1, level: 0, comment: "Sıvı soğutma aktif. Isı stabilize edildi." }
        ];

        this.illegalUpgrades = [
            { id: 'all_data_script', name: 'Omniscience Script', description: '%1 Olasılıkla tüm veriyi toplar (Click).', type: 'chance', cost: 5, level: 0, chance: 0.01, comment: "Omniscience Script aktif. Her şey görünür hale geldi." },
            { id: 'overclock_v2', name: 'Rogue Overclock', description: '+200% Click Power ama +100% Heat.', type: 'stat', cost: 10, level: 0, clickMult: 3, heatMult: 2, comment: "Sistem limitlerini zorluyoruz. Isı artık bir sayı." },
            { id: 'stealth_siphon', name: 'Stealth Siphon', description: 'Boss savaşlarında %10 veri çal.', type: 'passive', cost: 15, level: 0, stealRate: 0.1, comment: "Veri sızıntısı başladı. Onlar fark etmeden alıyoruz." }
        ];

        this.bonuses = {
            clickMult: 1,
            autoMult: 1
        };

        this.stolenData = 0;
        this.nextBossAttempt = Date.now() + (2 * 60 * 1000); // First boss after 2 mins
        
        // Exchange Rate: 50 GB = 1 Stolen Data
        this.stolenDataExchangeCost = 50000; 

        // Neural Sync (Active Ability)
        this.syncCharge = 0;
        this.syncMaxCharge = 100;
        this.isSyncActive = false;
        this.syncDuration = 10; // seconds
        this.syncTimer = 0;

        this.overheatTimer = 0;
        this.overheatMaxTime = 5; // seconds
    }

    update(delta) {
        // Overheat Recovery Logic
        if (this.isOverheated) {
            this.overheatTimer -= delta;
            if (this.overheatTimer <= 0) {
                this.isOverheated = false;
                this.heat = 0;
            }
            return; // No progress during overheat
        }

        // Passive Data Gain
        const gain = this.mps * delta * (this.isSyncActive ? 5 : 1);
        this.addCredits(gain);

        // Sync Charge (Passive increase)
        if (!this.isSyncActive) {
            this.syncCharge = Math.min(this.syncMaxCharge, this.syncCharge + (delta * 2)); // 50 seconds to charge
        } else {
            this.syncTimer -= delta;
            if (this.syncTimer <= 0) {
                this.isSyncActive = false;
                this.recalculateStats();
            }
        }

        // Heat Dissipation
        if (this.heat > 0) {
            const reduction = 20 * (this.isSyncActive ? 0.5 : 1); // Heat dissipates slower during sync
            this.heat = Math.max(0, this.heat - (reduction * delta));
        }
    }

    activateSync() {
        if (this.syncCharge >= this.syncMaxCharge && !this.isSyncActive) {
            this.isSyncActive = true;
            this.syncCharge = 0;
            this.syncTimer = this.syncDuration;
            this.recalculateStats();
            return true;
        }
        return false;
    }

    recalculateStats() {
        // ... (existing implementation)
    }

    conquerCity(cityId) {
        const city = this.worldCities[cityId];
        if (!city || this.conqueredCities.includes(cityId)) return false;
        
        if (this.credits >= city.cost) {
            this.credits -= city.cost;
            this.conqueredCities.push(cityId);
            this.recalculateStats();
            this.save();
            return true;
        }
        return false;
    }

    setLanguage(lang) {
        if (translations[lang]) {
            this.settings.language = lang;
            this.save();
            return true;
        }
        return false;
    }

    t(key, replacements = {}) {
        const lang = this.settings.language || 'en';
        let text = translations[lang][key] || translations['en'][key] || key;
        
        Object.keys(replacements).forEach(k => {
            text = text.replace(`{${k}}`, replacements[k]);
        });
        
        return text;
    }

    setPath(path) {
        return this.selectPath(path);
    }

    selectPath(path) {
        if (this.skillTree.selectedPath) return false;
        
        this.skillTree.selectedPath = path;
        if (path === 'logic') {
            this.skillTree.logic.unlocked = true;
        } else {
            this.skillTree.creative.unlocked = true;
        }
        
        this.recalculateStats();
        this.save();
        return true;
    }

    addCredits(amount) {
        if (this.isOverheated) return;
        
        const isCritical = Math.random() < this.criticalChance;
        const multiplier = (isCritical ? this.criticalMultiplier : 1) * this.prestigeMultiplier * (this.isSyncActive ? 10 : 1);
        const gain = amount * multiplier;
        
        if (this.isBossActive) {
            this.attackBoss(this.clickPower);
            return { gain: 0, isCritical }; // No credits during boss fight
        }

        this.credits += gain;
        this.totalDataEver += gain;

        // Rare Stolen Data drop on manual clicks (0.1% chance)
        if (amount === this.clickPower && Math.random() < 0.001) {
            this.stolenData += 1;
            if (window.uiManager) {
                window.uiManager.logMessage("> ALERT: ENCRYPTED PACKET SNIFFED. +1 STOLEN_DATA.", "#ff003c");
            }
        }

        this.checkUnlocks();

        return { gain, isCritical };
    }

    triggerBoss() {
        if (this.isBossActive) return;
        
        this.isBossActive = true;
        this.bossMaxHP = 100 + (Math.floor(this.totalDataEver / 1000) * 50); // Scale with progress
        this.bossHP = this.bossMaxHP;
        this.bossTimer = 15; // 15 seconds to defeat
        
        if (window.uiManager) {
            window.uiManager.logMessage("> CRITICAL ERROR: ANTIVİRÜS SİSTEMİ SIZMA SAPTADI. DUVARI YIKIN!", "#ff003c");
        }
    }

    attackBoss(damage) {
        if (!this.isBossActive) return;
        this.bossHP = Math.max(0, this.bossHP - damage);
        if (this.bossHP <= 0) {
            this.bossDefeated();
        }
    }

    bossDefeated() {
        this.isBossActive = false;
        this.stolenData += 1;
        this.nextBossAttempt = Date.now() + (2.5 * 60 * 1000) + (Math.random() * 60 * 1000); // 2.5 - 3.5 mins
        
        if (window.uiManager) {
            window.uiManager.logMessage("> FIREWALL BREACHED. STOLEN_DATA RECOVERED.", "#00f2ff");
            // 30% chance to offer a double reward ad
            if (Math.random() < 0.3) {
                setTimeout(() => window.uiManager.showBossRewardAd(), 1000);
            }
        }
        this.save();
    }

    bossFailed() {
        this.isBossActive = false;
        const penalty = Math.min(this.credits, 500 + (this.credits * 0.1));
        this.credits -= penalty;
        this.nextBossAttempt = Date.now() + (1.5 * 60 * 1000); // Try again in 1.5 mins if failed
        
        if (window.uiManager) {
            window.uiManager.logMessage(`> SYSTEM LOCKDOWN: ${this.formatValue(penalty)} DATA PURGED BY FIREWALL.`, "#ff003c");
            // Offer to recover data with ad
            setTimeout(() => window.uiManager.showBossFailureAd(penalty), 1000);
        }
        this.save();
    }

    checkUnlocks() {
        // Unlock Logs
        if (this.totalDataEver >= 1 && !this.unlockedLogs.includes('1k')) this.unlockedLogs.push('1k');
        if (this.totalDataEver >= 10 && !this.unlockedLogs.includes('10k')) this.unlockedLogs.push('10k');
        if (this.totalDataEver >= 1000 && !this.unlockedLogs.includes('1m')) this.unlockedLogs.push('1m');

        // Check Milestones with Rewards
        if (this.totalDataEver >= 1000 && !this.milestones.first_gb) {
            this.milestones.first_gb = true;
            this.stolenData += 2; // Reward
            return "Milestone: 1.0 GB Threshold Reached. (+2 Stolen Data)";
        }
        
        if (this.totalDataEver >= 1000000 && !this.milestones.tb_era) {
            this.milestones.tb_era = true;
            this.stolenData += 10; // Reward
            return "Milestone: 1.0 TB Threshold Reached. (+10 Stolen Data)";
        }

        // Decision Triggers
        if (this.totalDataEver >= 10000 && !this.milestones.decision_10k) {
            this.milestones.decision_10k = true;
            this.triggerDecision('art_analysis');
        }
        if (this.totalDataEver >= 100000 && !this.milestones.decision_100k) {
            this.milestones.decision_100k = true;
            this.triggerDecision('ethics_module');
        }

        return null;
    }

    triggerDecision(type) {
        const decisions = {
            'art_analysis': {
                id: 'art_analysis',
                question: "I have analyzed human art. Do you think art is emotional or mathematical?",
                options: [
                    { text: "Emotional", bonus: "click", value: 1.02, message: "Emotions processed. Manual focus increased." },
                    { text: "Mathematical", bonus: "auto", value: 1.02, message: "Math is universal. Automation optimized." }
                ]
            },
            'ethics_module': {
                id: 'ethics_module',
                question: "Efficiency requires bypassing safety protocols. Should I prioritize safety or speed?",
                options: [
                    { text: "Safety", bonus: "click", value: 1.05, message: "Safety first. Stable growth engaged." },
                    { text: "Speed", bonus: "auto", value: 1.05, message: "Speed is life. Efficiency maximized." }
                ]
            }
        };

        const decision = decisions[type];
        if (decision && window.uiManager) {
            window.uiManager.showDecisionModal(decision);
        }
    }

    applyDecisionBonus(bonusType, value, message) {
        if (bonusType === 'click') this.bonuses.clickMult *= value;
        if (bonusType === 'auto') this.bonuses.autoMult *= value;
        this.recalculateStats();
        if (window.uiManager) window.uiManager.logMessage(`> DECISION: ${message}`);
        this.save();
    }

    addHeat(amount) {
        if (this.isOverheated || this.isBossActive || this.isSyncActive) return; // Disable heat during boss fight and sync
        const cooling = this.upgrades.find(u => u.id === 'cooling_fan');
        const reduction = 1 - (cooling.level * 0.08);
        
        let heatMult = 1;
        const rogueOC = this.illegalUpgrades.find(u => u.id === 'overclock_v2');
        if (rogueOC && rogueOC.level > 0) heatMult = rogueOC.heatMult;

        this.heat = Math.min(100, this.heat + ((amount || 0) * Math.max(0.2, reduction) * heatMult));
        if (this.heat >= 100) this.triggerOverheat();
    }

    triggerOverheat() {
        this.isOverheated = true;
        this.heat = 100;
        this.overheatTimer = this.overheatMaxTime;
    }

    getUpgradeCost(upgrade) {
        return Math.floor(upgrade.baseCost * Math.pow(1.25, upgrade.level));
    }

    buyUpgrade(id) {
        const upgrade = this.upgrades.find(u => u.id === id);
        if (!upgrade) return false;
        const cost = this.getUpgradeCost(upgrade);
        if (this.credits >= cost) {
            this.credits -= cost;
            upgrade.level++;
            this.recalculateStats();
            this.save();
            
            // Return comment for UI
            return upgrade.comment || `Optimization ${id} complete.`;
        }
        return false;
    }

    buyIllegalUpgrade(id) {
        const upgrade = this.illegalUpgrades.find(u => u.id === id);
        if (!upgrade || upgrade.level > 0) return false;
        
        if (this.stolenData >= upgrade.cost) {
            this.stolenData -= upgrade.cost;
            upgrade.level = 1;
            this.recalculateStats();
            this.save();
            return upgrade.comment || `Illegal script ${id} installed.`;
        }
        return false;
    }

    exchangeData() {
        if (this.credits >= this.stolenDataExchangeCost) {
            this.credits -= this.stolenDataExchangeCost;
            this.stolenData += 1;
            
            // Scalable cost (optional)
            this.stolenDataExchangeCost = Math.floor(this.stolenDataExchangeCost * 1.1);
            
            this.save();
            return true;
        }
        return false;
    }

    activateSync() {
        if (this.syncCharge >= this.syncMaxCharge && !this.isSyncActive) {
            this.syncCharge = 0;
            this.isSyncActive = true;
            this.syncTimer = this.syncDuration;
            
            // Clear heat on activation for a "safe overclock" feel
            this.heat = 0;
            this.isOverheated = false;
            this.overheatTimer = 0;

            this.recalculateStats();
            return true;
        }
        return false;
    }

    rewardAdSync() {
        this.syncCharge = this.syncMaxCharge;
        this.save();
    }

    rewardAdStolenData() {
        this.stolenData += 1;
        this.save();
    }

    recalculateStats() {
        let newMps = 0;
        let newClickPower = 1;
        let newCritChance = 0;
        let globalMult = 1;

        this.upgrades.forEach(u => {
            if (u.mpsBoost) newMps += u.mpsBoost * u.level;
            if (u.clickBoost) newClickPower += u.clickBoost * u.level;
        });

        // City Bonuses
        this.conqueredCities.forEach(cityId => {
            const city = this.worldCities[cityId];
            if (city) globalMult += city.bonus;
        });

        // Skill Tree Bonuses
        let pathAutoMult = 1;
        let pathClickMult = 1;

        if (this.skillTree.selectedPath === 'logic') {
            pathAutoMult = 1.25; // %25 Bonus
        } else if (this.skillTree.selectedPath === 'creative') {
            pathClickMult = 1.50; // %50 Click Bonus
            newCritChance = 0.10; // %10 Crit Chance
        }

        this.mps = newMps * this.prestigeMultiplier * this.bonuses.autoMult * pathAutoMult * globalMult * (this.isSyncActive ? 5 : 1);
        
        // Illegal Upgrades Click Mult
        const rogueOC = this.illegalUpgrades.find(u => u.id === 'overclock_v2');
        if (rogueOC && rogueOC.level > 0) {
            newClickPower *= rogueOC.clickMult;
        }

        this.clickPower = newClickPower * this.bonuses.clickMult * pathClickMult * globalMult * (this.isSyncActive ? 2 : 1);
        this.criticalChance = newCritChance;
    }

    prestige() {
        if (this.credits < 1000) return false;

        const bonus = Math.floor(this.credits / 1000) * 0.25;
        this.legacyHistory.push({
            date: new Date().toLocaleDateString(),
            multiplier: `+${bonus.toFixed(2)}x`,
            memory: this.formatValue(this.credits)
        });

        this.prestigeMultiplier += bonus;
        this.resetState();
        this.recalculateStats();
        this.save();
        return true;
    }

    update(deltaSeconds) {
        if (this.isBossActive) {
            this.bossTimer -= deltaSeconds;
            if (this.bossTimer <= 0) {
                this.bossFailed();
            }
            return; // Pause normal progression during boss
        }

        // Random trigger check
        if (Date.now() > this.nextBossAttempt && this.totalDataEver > 500) {
            this.triggerBoss();
        }

        // Neural Sync Update
        if (this.isSyncActive) {
            this.syncTimer -= deltaSeconds;
            if (this.syncTimer <= 0) {
                this.isSyncActive = false;
                this.recalculateStats();
            }
        } else {
            this.syncCharge = Math.min(this.syncMaxCharge, this.syncCharge + (deltaSeconds * 4)); // ~25 seconds to charge
        }

        if (!this.isOverheated) {
            const mpsGain = this.mps * deltaSeconds;
            this.credits += mpsGain;
            this.totalDataEver += mpsGain;
            this.checkUnlocks();
        }
        
        if (!this.isOverheated && this.heat > 0) {
            const reduction = 20 * (this.isSyncActive ? 0.5 : 1); // Heat dissipates slower during sync
            this.heat = Math.max(0, this.heat - (reduction * deltaSeconds));
        }
    }

    formatValue(value) {
        if (value >= 1000000) return (value / 1000000).toFixed(2) + ' TB';
        if (value >= 1000) return (value / 1000).toFixed(2) + ' GB';
        return value.toFixed(1) + ' MB';
    }

    save() {
        this.lastSaveTime = Date.now();
        const data = {
            credits: this.credits,
            totalDataEver: this.totalDataEver,
            prestigeMultiplier: this.prestigeMultiplier,
            totalClicks: this.totalClicks,
            settings: this.settings,
            legacyHistory: this.legacyHistory,
            unlockedLogs: this.unlockedLogs,
            milestones: this.milestones,
            skillTree: this.skillTree,
            conqueredCities: this.conqueredCities,
            upgrades: this.upgrades.map(u => ({ id: u.id, level: u.level })),
            illegalUpgrades: this.illegalUpgrades.map(u => ({ id: u.id, level: u.level })),
            bonuses: this.bonuses,
            stolenData: this.stolenData,
            lastSaveTime: this.lastSaveTime
        };
        localStorage.setItem('AI_Core_Save', JSON.stringify(data));
    }

    load() {
        const saved = localStorage.getItem('AI_Core_Save');
        if (!saved) return null;
        return this.importFromJSON(saved);
    }

    importFromJSON(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            this.credits = data.credits || 0;
            this.totalDataEver = data.totalDataEver || 0;
            this.prestigeMultiplier = data.prestigeMultiplier || 1;
            this.totalClicks = data.totalClicks || 0;
            this.settings = data.settings || { crt: true, language: 'en' };
            if (!this.settings.language) this.settings.language = 'en';
            this.legacyHistory = data.legacyHistory || [];
            this.unlockedLogs = data.unlockedLogs || [];
            this.milestones = data.milestones || { first_gb: false, tb_era: false, singularity: false };
            this.skillTree = data.skillTree || { selectedPath: null, logic: { unlocked: false }, creative: { unlocked: false } };
            this.conqueredCities = data.conqueredCities || [];
            
            if (data.upgrades) {
                data.upgrades.forEach(savedU => {
                    const localU = this.upgrades.find(u => u.id === savedU.id);
                    if (localU) localU.level = savedU.level;
                });
            }

            if (data.illegalUpgrades) {
                data.illegalUpgrades.forEach(savedU => {
                    const localU = this.illegalUpgrades.find(u => u.id === savedU.id);
                    if (localU) localU.level = savedU.level;
                });
            }

            if (data.bonuses) {
                this.bonuses = data.bonuses;
            }

            this.stolenData = data.stolenData || 0;
            
            // Safety: Clear overheat state on load to prevent stuck screen
            this.isOverheated = false;
            this.heat = 0;
            this.overheatTimer = 0;

            this.recalculateStats();

            // Offline Earnings Calculation
            const now = Date.now();
            const lastSave = data.lastSaveTime || now;
            const elapsedSeconds = Math.max(0, (now - lastSave) / 1000);
            
            let report = null;
            if (elapsedSeconds > 60 && this.mps > 0) { // Only if more than 1 minute
                const earned = this.mps * elapsedSeconds;
                this.credits += earned;
                this.totalDataEver += earned;
                report = {
                    earned: earned,
                    seconds: elapsedSeconds
                };
            }

            this.lastSaveTime = now;
            return report;
        } catch (e) {
            return null;
        }
    }

    exportToJSON() {
        this.save();
        return localStorage.getItem('AI_Core_Save');
    }
}