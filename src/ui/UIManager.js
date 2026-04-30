import { MatrixRain } from './MatrixRain.js';

/**
 * UIManager: Manages DOM elements, UI updates, Archive system, and Boot Sequence.
 */
export class UIManager {
    constructor(stateManager) {
        this.state = stateManager;
        this.currentArchiveTab = 'logs';
        
        // Cache DOM elements
        this.els = {
            credits: document.getElementById('credits-display'),
            mps: document.getElementById('mps-display'),
            heatPercent: document.getElementById('heat-percent'),
            overheatWarning: document.getElementById('overheat-warning'),
            overheatOverlay: document.getElementById('overheat-overlay'),
            terminal: document.getElementById('terminal-log'),
            shopList: document.getElementById('shop-list'),
            shopPanel: document.getElementById('shop-panel'),
            settingsPanel: document.getElementById('settings-panel'),
            archivePanel: document.getElementById('archive-panel'),
            archiveContent: document.getElementById('archive-content'),
            labPanel: document.getElementById('lab-panel'),
            labContent: document.getElementById('lab-content'),
            
            // Map & Terminal Tabs
            terminalLogContainer: document.getElementById('terminal-log-container'),
            terminalMapContainer: document.getElementById('terminal-map-container'),
            termTabLogs: document.getElementById('term-tab-logs'),
            termTabMap: document.getElementById('term-tab-map'),
            
            mapNodes: document.getElementById('map-nodes'),
            mapConquestPercent: document.getElementById('conquest-percent'),
            conquestModal: document.getElementById('conquest-modal'),
            conquestCityName: document.getElementById('conquest-city-name'),
            conquestCityCost: document.getElementById('conquest-city-cost'),
            conquestCityBonus: document.getElementById('conquest-city-bonus'),
            conquestConfirmBtn: document.getElementById('conquest-confirm-btn'),

            // Stats & Settings
            statTotalData: document.getElementById('stat-total-data'),
            statPrestigeMult: document.getElementById('stat-prestige-mult'),
            toggleCRT: document.getElementById('toggle-crt'),
            toggleAudio: document.getElementById('toggle-audio'),
            selectLanguage: document.getElementById('select-language'),
            crtEffect: document.getElementById('crt-effect'),

            // Modals
            logModal: document.getElementById('log-modal'),
            logTitle: document.getElementById('log-modal-title'),
            logContent: document.getElementById('log-modal-content'),

            // Boot Screen
            bootScreen: document.getElementById('boot-screen'),
            bootLines: document.getElementById('boot-lines'),
            bootLoading: document.getElementById('boot-loading-area'),
            bootProgress: document.getElementById('boot-progress-bar'),
            bootProgressText: document.getElementById('boot-progress-text'),
            bootAction: document.getElementById('boot-action-area'),

            // Decisions
            decisionModal: document.getElementById('decision-modal'),
            decisionQuestion: document.getElementById('decision-question'),
            decisionOptions: document.getElementById('decision-options'),
            
            // Neural Path selection (Vanish logic)
            pathSelectionContainer: document.getElementById('path-selection-container'),
            identityLabel: document.getElementById('identity-label'),
            navLabBtn: document.getElementById('nav-lab-btn'),

            // Offline
            offlineModal: document.getElementById('offline-modal'),
            offlineTime: document.getElementById('offline-time'),
            offlineEarned: document.getElementById('offline-earned'),

            // Boss HTML UI
            bossTerminalUI: document.getElementById('boss-terminal-ui'),
            bossHPBar: document.getElementById('boss-hp-bar'),
            bossTimerDisplay: document.getElementById('boss-timer-display'),

            // Black Market
            blackMarketPanel: document.getElementById('black-market-panel'),
            blackMarketList: document.getElementById('black-market-list'),
            stolenDataDisplay: document.getElementById('stolen-data-display'),
            
            // Post-Processing
            glitchOverlay: document.getElementById('glitch-overlay'),
            matrixRain: document.getElementById('matrix-rain'),

            // Containers
            gameContainer: document.getElementById('game-container'),
            uiLayer: document.getElementById('ui-layer'),
            
            // Nav
            navBlackMarketBtn: document.getElementById('nav-blackmarket-btn'),

            // Neural Sync
            syncBtn: document.getElementById('sync-btn'),
            syncProgress: document.getElementById('sync-progress'),
            syncPercent: document.getElementById('sync-percent'),
            syncTimer: document.getElementById('sync-timer'),
            syncAdBtn: document.getElementById('sync-ad-btn'),

            // Ads
            adModal: document.getElementById('ad-modal'),
            adTimer: document.getElementById('ad-timer')
        };
        
        // Background Effects
        this.matrixRain = new MatrixRain('matrix-rain');
        this.matrixRain.setOpacity(0.35); // Increased prominence
        
        this.init();
    }

    init() {
        this.els.toggleCRT.checked = this.state.settings.crt;
        if (this.els.toggleAudio) this.els.toggleAudio.checked = this.state.settings.audio;
        if (this.els.selectLanguage) this.els.selectLanguage.value = this.state.settings.language;
        this.applySettings();
        this.updateLanguageUI();
        this.renderShop();
        this.updateTheme(); // Initialize theme based on path
        this.renderWorldMap();

        // Check if Path Selection is needed
        if (!this.state.skillTree.selectedPath) {
            setTimeout(() => {
                this.els.pathSelectionContainer.classList.remove('hidden');
            }, 2000); // Wait for boot or initial load
        } else {
            this.updateIdentityHUD();
            this.els.navLabBtn.classList.add('hidden');
        }
    }

    /**
     * Start the Cyberpunk Boot Sequence
     */
    async startBootSequence() {
        const isReturning = this.state.totalDataEver > 0;
        const t = (k) => this.state.t(k);
        const lines = [
            t('boot_kernel'),
            t('boot_connection'),
            isReturning ? t('boot_welcome_back') : t('boot_searching'),
            t('boot_initializing')
        ];

        // Typewriter lines
        for (const line of lines) {
            await this.addBootLine(line);
            await new Promise(r => setTimeout(r, 600));
        }

        // Show Progress Bar
        this.els.bootLoading.classList.remove('hidden');
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                this.showInitializeButton();
            }
            this.els.bootProgress.style.width = `${progress}%`;
            this.els.bootProgressText.innerText = `${Math.floor(progress)}%`;
        }, 200);
    }

    addBootLine(text) {
        return new Promise(resolve => {
            const line = document.createElement('div');
            line.className = 'boot-line';
            line.innerText = text;
            this.els.bootLines.appendChild(line);
            
            // Trigger animation
            setTimeout(() => {
                line.classList.add('boot-line-active');
                resolve();
            }, 50);
        });
    }

    showInitializeButton() {
        this.els.bootLoading.classList.add('opacity-30');
        this.els.bootAction.classList.remove('hidden');
        this.els.bootAction.classList.add('animate-pulse');
    }

    initializeAI() {
        // Fade out boot screen
        this.els.bootScreen.classList.add('opacity-0');
        setTimeout(() => {
            this.els.bootScreen.style.display = 'none';
            this.logMessage(this.state.t('neural_sync_overclock').replace('> NEURAL_SYNC: Overclocking cognitive processing. 10x Data Flow.', '> SYSTEM: AI Core initialized successfully.')); 
            // Wait, I should add a specific key for this or just use the string.
            // Actually I'll just use a direct translation if available or just the original for this specific one.
            this.logMessage(this.state.settings.language === 'tr' ? "> SİSTEM: Yapay Zeka Çekirdeği başarıyla başlatıldı." : "> SYSTEM: AI Core initialized successfully.");
            
            // Start the game loop if needed via bridge
            if (window.gameInstance) {
                window.gameInstance.isReady = true;
            }
        }, 1000);
    }

    update() {
        this.els.credits.innerText = this.state.formatValue(this.state.credits);
        this.els.mps.innerText = `+${this.state.formatValue(this.state.mps)}/s`;
        
        const heat = this.state.heat;
        const temp = 30 + (heat * 0.7); // 30°C idle, 100°C overheat
        this.els.heatPercent.innerText = `${temp.toFixed(1)}°C`;
        
        // Dynamic text color based on temp
        if (temp > 80) {
            this.els.heatPercent.style.color = '#ff003c';
        } else if (temp > 60) {
            this.els.heatPercent.style.color = '#ffaa00';
        } else {
            this.els.heatPercent.style.color = 'var(--matrix-green)';
        }
        
        if (this.state.isOverheated) {
            this.els.overheatWarning.classList.remove('hidden');
            this.els.overheatOverlay.classList.remove('hidden');
        } else {
            this.els.overheatWarning.classList.add('hidden');
            this.els.overheatOverlay.classList.add('hidden');
        }
        
        this.els.statTotalData.innerText = this.state.formatValue(this.state.totalDataEver);
        this.els.statPrestigeMult.innerText = `x${this.state.prestigeMultiplier.toFixed(2)}`;
        
        this.updateShopButtons();
        this.updateMapNodes();
        this.updateBossTerminalUI();
        this.updateBlackMarketUI();
        this.updateSyncUI();
        this.updateVisualEffects();
    }

    updateSyncUI() {
        const charge = this.state.syncCharge;
        const max = this.state.syncMaxCharge;
        const percent = (charge / max) * 100;
        
        this.els.syncProgress.style.height = `${percent}%`;
        this.els.syncPercent.innerText = `${Math.floor(percent)}%`;
        
        if (this.state.isSyncActive) {
            this.els.syncBtn.classList.add('sync-active-pulse');
            this.els.syncTimer.classList.remove('hidden');
            this.els.syncTimer.innerText = `SYNC_ACTIVE: ${this.state.syncTimer.toFixed(1)}s`;
            this.els.syncBtn.disabled = true;
        } else {
            this.els.syncBtn.classList.remove('sync-active-pulse');
            this.els.syncTimer.classList.add('hidden');
            this.els.syncBtn.disabled = charge < max;
        }
    }

    activateSync() {
        if (this.state.activateSync()) {
            this.logMessage(this.state.t('neural_sync_overclock'), "#00FF41");
            // Trigger visual flash only on game container to prevent UI movement/flash
            this.els.gameContainer.classList.add('sync-flash');
            setTimeout(() => this.els.gameContainer.classList.remove('sync-flash'), 500);
        }
    }

    updateVisualEffects() {
        // Full Screen Glitch Triggers (Shake only the game world, filter can stay on body or specific overlay)
        const shouldGlitch = this.state.isOverheated || (this.state.isBossActive && Math.random() > 0.95);
        if (shouldGlitch) {
            this.els.gameContainer.classList.add('glitch-active');
            this.els.glitchOverlay.classList.remove('hidden');
        } else {
            this.els.gameContainer.classList.remove('glitch-active');
            this.els.glitchOverlay.classList.add('hidden');
        }

        // Matrix Rain Evolution (Singularity Milestone)
        if (this.state.milestones.singularity) {
            this.els.matrixRain.classList.add('matrix-rain-active');
        }
    }

    updateBossTerminalUI() {
        if (this.state.isBossActive) {
            this.els.bossTerminalUI.classList.remove('hidden');
            // Standard HP Bar: 100% to 0%
            const hpPercent = (this.state.bossHP / this.state.bossMaxHP) * 100;
            const oldWidth = this.els.bossHPBar.style.width;
            this.els.bossHPBar.style.width = `${hpPercent}%`;
            this.els.bossTimerDisplay.innerText = `${this.state.bossTimer.toFixed(2)}s`;
            
            // Trigger shake on hit
            if (oldWidth !== `${hpPercent}%`) {
                this.els.bossTerminalUI.classList.add('boss-hit-shake');
                setTimeout(() => this.els.bossTerminalUI.classList.remove('boss-hit-shake'), 100);
            }
            
            // Critical warning color
            if (this.state.bossTimer < 5) {
                this.els.bossTimerDisplay.style.color = '#ff003c';
                this.els.bossTimerDisplay.classList.add('scale-110');
            } else {
                this.els.bossTimerDisplay.style.color = 'white';
                this.els.bossTimerDisplay.classList.remove('scale-110');
            }
        } else {
            this.els.bossTerminalUI.classList.add('hidden');
        }
    }

    setTerminalTab(tab) {
        if (tab === 'logs') {
            this.els.terminalLogContainer.classList.remove('hidden');
            this.els.terminalMapContainer.classList.add('hidden');
            this.els.termTabLogs.classList.add('text-[var(--matrix-green)]', 'opacity-100');
            this.els.termTabLogs.classList.remove('opacity-40');
            this.els.termTabMap.classList.remove('text-[var(--matrix-green)]', 'opacity-100');
            this.els.termTabMap.classList.add('opacity-40');
        } else {
            this.els.terminalLogContainer.classList.add('hidden');
            this.els.terminalMapContainer.classList.remove('hidden');
            this.els.termTabMap.classList.add('text-[var(--matrix-green)]', 'opacity-100');
            this.els.termTabMap.classList.remove('opacity-40');
            this.els.termTabLogs.classList.remove('text-[var(--matrix-green)]', 'opacity-100');
            this.els.termTabLogs.classList.add('opacity-40');
            this.renderWorldMap(); // Ensure nodes are correctly positioned when shown
        }
    }

    applySettings() {
        if (this.state.settings.crt) this.els.crtEffect.classList.add('crt-active');
        else this.els.crtEffect.classList.remove('crt-active');

        // Audio Toggle Wiring
        if (window.gameInstance && window.gameInstance.phaser) {
            const scene = window.gameInstance.phaser.scene.getScene('MainScene');
            if (scene && scene.audio) {
                scene.audio.toggle(this.state.settings.audio);
            }
        }
    }

    toggleSetting(key) {
        if (key === 'crt') {
            this.state.settings.crt = this.els.toggleCRT.checked;
        } else if (key === 'audio') {
            this.state.settings.audio = this.els.toggleAudio.checked;
        }
        this.applySettings();
        this.state.save();
    }

    changeLanguage(lang) {
        if (this.state.setLanguage(lang)) {
            this.updateLanguageUI();
            this.renderShop(); // Refresh shop for translated comments if applicable
            this.renderArchive(); // Refresh archive
            this.renderLab(); // Refresh lab
        }
    }

    updateLanguageUI() {
        const t = (key) => this.state.t(key);
        
        // HUD
        document.getElementById('lbl-storage-net').innerText = t('storage_net');
        document.getElementById('lbl-thermal-core').innerText = t('thermal_core');
        document.getElementById('overheat-warning').innerText = t('overheat_alert');
        
        // Nav
        document.getElementById('nav-market-label').innerText = t('market');
        document.getElementById('nav-neural-label').innerText = t('neural');
        document.getElementById('nav-memory-label').innerText = t('memory');
        document.getElementById('nav-config-label').innerText = t('config');
        document.getElementById('nav-illegal-label').innerText = t('illegal');
        
        // Settings
        document.getElementById('settings-title').innerText = t('system_config');
        document.getElementById('settings-stats-title').innerText = t('core_stats');
        document.getElementById('lbl-total-data').innerText = t('total_data');
        document.getElementById('lbl-multiplier').innerText = t('multiplier');
        document.getElementById('settings-visuals-title').innerText = t('visuals');
        document.getElementById('lbl-crt-effect').innerText = t('crt_effect');
        document.getElementById('lbl-audio-effect').innerText = this.state.settings.language === 'tr' ? 'Ses Efektleri' : 'Audio Effects';
        document.getElementById('settings-lang-title').innerText = t('language');
        document.getElementById('lbl-system-lang').innerText = t('system_language');
        document.getElementById('btn-prestige').innerText = t('neural_ascension');
        document.getElementById('btn-export').innerText = t('export');
        document.getElementById('btn-import').innerText = t('import');
        
        // Panels Titles
        const shopTitle = document.getElementById('shop-title');
        if (shopTitle) shopTitle.innerText = t('market_place');
        
        const labTitle = document.getElementById('lab-title');
        if (labTitle) labTitle.innerText = t('neural_laboratory');
        
        const labSub = document.getElementById('lab-subtitle');
        if (labSub) labSub.innerText = t('identity_unit_v24');

        const labWarning = document.getElementById('lab-warning-text');
        if (labWarning) labWarning.innerText = t('path_irreversible_warning');
        
        const archiveTitle = document.getElementById('archive-title');
        if (archiveTitle) archiveTitle.innerText = t('neural_archive');
        
        const archiveSub = document.getElementById('archive-subtitle');
        if (archiveSub) archiveSub.innerText = t('core_memory_recovery');
        
        document.getElementById('tab-logs').innerText = t('memory_logs');
        document.getElementById('tab-milestones').innerText = t('milestones');
        document.getElementById('tab-legacy').innerText = t('ascension_data');
        
        const archiveFooter1 = document.getElementById('archive-footer-encryption');
        if (archiveFooter1) archiveFooter1.innerText = t('encryption_level');
        const archiveFooter2 = document.getElementById('archive-footer-buffer');
        if (archiveFooter2) archiveFooter2.innerText = t('buffer_status');

        // Terminal Tabs
        this.els.termTabLogs.innerText = `[ ${t('logs').toUpperCase()} ]`;
        this.els.termTabMap.innerText = `[ ${t('world_map').toUpperCase()} ]`;

        // Offline Modal
        const offlineTitle = document.getElementById('offline-title');
        if (offlineTitle) offlineTitle.innerText = t('offline_title');
        const offlineTimeLabel = document.getElementById('offline-time-label');
        if (offlineTimeLabel) offlineTimeLabel.innerText = t('offline_time_lbl');
        const offlineDataLabel = document.getElementById('offline-data-label');
        if (offlineDataLabel) offlineDataLabel.innerText = t('offline_data_lbl');
        const offlineConfirm = document.getElementById('offline-confirm-btn');
        if (offlineConfirm) offlineConfirm.innerText = t('confirm_system');
        const offlineAd = document.getElementById('offline-ad-btn');
        if (offlineAd) offlineAd.innerText = t('watch_ad_double');

        // Black Market
        const bmTitle = document.getElementById('bm-title');
        if (bmTitle) bmTitle.innerText = t('black_market_title');
        const bmSub = document.getElementById('bm-subtitle');
        if (bmSub) bmSub.innerText = t('access_illegal');
        const bmAd = document.getElementById('bm-ad-btn');
        if (bmAd) bmAd.innerText = t('free_stolen_data');
        const bmFooterLabel = document.getElementById('bm-footer-label');
        if (bmFooterLabel) bmFooterLabel.innerHTML = `${t('stolen_data_label')} <span id="stolen-data-display" class="text-[#ff003c] font-bold">${this.state.stolenData}</span>`;
        const bmFooterQuote = document.getElementById('bm-footer-quote');
        if (bmFooterQuote) bmFooterQuote.innerText = t('everything_price');

        // Ad Modal
        const adLink = document.getElementById('ad-link-status');
        if (adLink) adLink.innerText = t('ad_link_established');
        const adSync = document.getElementById('ad-sync-status');
        if (adSync) adSync.innerText = t('ad_sync_stream');
        const adFooter = document.getElementById('ad-revenue-status');
        if (adFooter) adFooter.innerText = t('ad_simulation_revenue');
    }

    logMessage(text, color = null) {
        const entry = document.createElement('div');
        entry.className = 'mb-1 border-l-2 pl-2 leading-tight opacity-0 transition-opacity duration-300';
        entry.style.borderColor = color || 'var(--matrix-green)';
        entry.style.color = color || 'var(--matrix-green)';
        entry.innerText = text;
        this.els.terminal.appendChild(entry);
        
        // Trigger reflow to start transition
        setTimeout(() => entry.classList.remove('opacity-0'), 10);
        
        this.els.terminal.scrollTop = this.els.terminal.scrollHeight;
        if (this.els.terminal.children.length > 15) this.els.terminal.removeChild(this.els.terminal.firstChild);
    }

    togglePanel(panelId) {
        this.playSFX('ui_click');
        const panels = {
            shop: this.els.shopPanel,
            settings: this.els.settingsPanel,
            archive: this.els.archivePanel,
            lab: this.els.labPanel,
            'black-market': this.els.blackMarketPanel
        };

        const target = panels[panelId];
        if (!target) return;

        Object.keys(panels).forEach(key => {
            if (key !== panelId) {
                panels[key].classList.add('panel-hidden-center');
            }
        });

        if (target.classList.contains('panel-hidden-center')) {
            target.classList.remove('panel-hidden-center');
            if (panelId === 'archive') this.renderArchive();
            if (panelId === 'lab') this.renderLab();
            if (panelId === 'black-market') this.renderBlackMarket();
        } else {
            target.classList.add('panel-hidden-center');
        }

        this.updateBackgroundBlur();
    }

    updateBackgroundBlur() {
        const panels = [
            this.els.shopPanel, this.els.settingsPanel, this.els.archivePanel, 
            this.els.labPanel, this.els.blackMarketPanel, this.els.logModal, 
            this.els.decisionModal, this.els.offlineModal, this.els.conquestModal,
            this.els.adModal
        ];

        const isAnyOpen = panels.some(p => p && !p.classList.contains('hidden') && !p.classList.contains('panel-hidden-center'));

        if (isAnyOpen) {
            this.els.gameContainer.classList.add('modal-active-blur');
            this.els.uiLayer.classList.add('modal-active-blur');
        } else {
            this.els.gameContainer.classList.remove('modal-active-blur');
            this.els.uiLayer.classList.remove('modal-active-blur');
        }
    }

    setArchiveTab(tab) {
        this.playSFX('ui_click', { detune: 200 });
        this.currentArchiveTab = tab;
        const tabs = ['logs', 'recovery', 'milestones', 'legacy'];
        tabs.forEach(t => {
            const el = document.getElementById(`tab-${t}`);
            if (!el) return;
            if (t === tab) {
                el.classList.add('tab-active', 'text-[var(--matrix-green)]');
                el.classList.remove('text-white/40', 'hover:bg-white/5');
            } else {
                el.classList.remove('tab-active', 'text-[var(--matrix-green)]');
                el.classList.add('text-white/40', 'hover:bg-white/5');
            }
        });
        this.renderArchive();
    }

    playSFX(key, config = {}) {
        if (window.gameInstance && window.gameInstance.phaser) {
            const scene = window.gameInstance.phaser.scene.getScene('MainScene');
            if (scene && scene.audio) {
                scene.audio.play(key, config);
            }
        }
    }

    renderArchive() {
        this.els.archiveContent.innerHTML = '';
        if (this.currentArchiveTab === 'logs') this.renderLogs();
        else if (this.currentArchiveTab === 'recovery') this.renderRecovery();
        else if (this.currentArchiveTab === 'milestones') this.renderMilestones();
        else if (this.currentArchiveTab === 'legacy') this.renderLegacy();
    }

    renderLogs() {
        if (this.state.unlockedLogs.length === 0) {
            this.els.archiveContent.innerHTML = `
                <div class="flex flex-col items-center justify-center py-20 opacity-20">
                    <div class="text-4xl mb-4">💾</div>
                    <div class="text-[10px] uppercase font-bold tracking-[0.2em]">${this.state.t('no_logs_recovered')}</div>
                </div>`;
            return;
        }

        this.state.unlockedLogs.forEach(logId => {
            const log = this.state.logs[logId];
            const div = document.createElement('div');
            div.className = 'archive-item group matrix-border bg-white/5 p-4 cursor-pointer hover:bg-white/10 transition-all flex items-center gap-4';
            div.onclick = () => this.openLogModal(log);
            div.innerHTML = `
                <div class="w-10 h-10 flex items-center justify-center bg-[var(--matrix-green)]/10 text-[var(--matrix-green)] rounded border border-[var(--matrix-green)]/20">
                    <span class="text-xs">DOC</span>
                </div>
                <div class="flex-grow">
                    <div class="text-xs font-bold uppercase tracking-widest text-white/90 group-hover:text-[var(--matrix-green)] transition-colors">${log.title}</div>
                    <div class="text-[9px] opacity-40 uppercase mt-1">Status: DECRYPTED // Type: Neural_Record</div>
                </div>
                <div class="text-[9px] font-bold opacity-30 group-hover:opacity-100 transition-opacity uppercase">Read_Data ></div>
            `;
            this.els.archiveContent.appendChild(div);
        });
    }

    renderMilestones() {
        const m = this.state.milestones;
        const list = [
            { id: 'first_gb', title: 'Gigabyte Milestone', desc: 'Reach 1.0 GB total data.', achieved: m.first_gb },
            { id: 'tb_era', title: 'Terabyte Era', desc: 'Reach 1.0 TB total data.', achieved: m.tb_era },
            { id: 'singularity', title: 'Singularity Point', desc: 'Achieve a x100 prestige multiplier.', achieved: m.singularity }
        ];

        list.forEach(item => {
            const div = document.createElement('div');
            div.className = `matrix-border p-4 flex gap-4 transition-all ${item.achieved ? 'bg-[var(--matrix-green)]/5 border-[var(--matrix-green)]' : 'opacity-30'}`;
            div.innerHTML = `
                <div class="w-10 h-10 flex items-center justify-center ${item.achieved ? 'text-[var(--matrix-green)]' : 'text-white/20'}">
                    <span class="text-xl">${item.achieved ? '★' : '☆'}</span>
                </div>
                <div class="flex-grow">
                    <div class="flex justify-between items-start">
                        <div class="text-xs font-bold uppercase tracking-widest">${item.title}</div>
                        <div class="text-[9px] font-bold ${item.achieved ? 'text-[var(--matrix-green)]' : 'text-white/40'}">
                            ${item.achieved ? '[ COMPLETED ]' : '[ LOCKED ]'}
                        </div>
                    </div>
                    <div class="text-[10px] opacity-60 mt-1">${item.desc}</div>
                    ${item.achieved ? '<div class="mt-2 h-1 w-full bg-[var(--matrix-green)]/20 rounded-full overflow-hidden"><div class="h-full bg-[var(--matrix-green)] w-full"></div></div>' : ''}
                </div>
            `;
            this.els.archiveContent.appendChild(div);
        });
    }

    renderLegacy() {
        if (this.state.legacyHistory.length === 0) {
            this.els.archiveContent.innerHTML = `
                <div class="flex flex-col items-center justify-center py-20 opacity-20">
                    <div class="text-4xl mb-4">🌀</div>
                    <div class="text-[10px] uppercase font-bold tracking-[0.2em]">${this.state.t('no_ascensions_recorded')}</div>
                </div>`;
            return;
        }

        this.state.legacyHistory.forEach(h => {
            const div = document.createElement('div');
            div.className = 'matrix-border bg-yellow-400/5 p-4 flex justify-between items-center border-yellow-400/30';
            div.innerHTML = `
                <div class="flex items-center gap-4">
                    <div class="w-10 h-10 rounded-full border border-yellow-400/30 flex items-center justify-center text-yellow-400">
                        <span class="text-xs">Σ</span>
                    </div>
                    <div>
                        <div class="text-xs font-bold text-yellow-400 uppercase">Ascension Node: ${h.date}</div>
                        <div class="text-[9px] opacity-60 uppercase">Memory Sacrificed: ${h.memory}</div>
                    </div>
                </div>
                <div class="text-right">
                    <div class="text-xs font-bold text-yellow-400">${h.multiplier}</div>
                    <div class="text-[8px] opacity-40 uppercase">Multiplier</div>
                </div>
            `;
            this.els.archiveContent.appendChild(div);
        });
    }

    renderRecovery() {
        const nextFrag = this.state.memoryFragments.find(f => !this.state.recoveredFragments.includes(f.id));
        const recovered = this.state.recoveredFragments.map(id => this.state.memoryFragments.find(f => f.id === id));

        const recoveryDiv = document.createElement('div');
        recoveryDiv.className = 'space-y-6';

        // 1. Next Fragment to Recover
        if (nextFrag) {
            const nextDiv = document.createElement('div');
            nextDiv.className = 'matrix-border bg-white/5 p-6 border-dashed opacity-80';
            const canAfford = this.state.credits >= nextFrag.cost;
            
            nextDiv.innerHTML = `
                <div class="flex justify-between items-center mb-4">
                    <div class="text-xs font-bold uppercase tracking-widest text-[var(--matrix-green)]">Next_Memory_Block: [ UNKNOWN ]</div>
                    <div class="text-[10px] font-mono ${canAfford ? 'text-white' : 'text-red-500'}">Cost: ${this.state.formatValue(nextFrag.cost)}</div>
                </div>
                <p class="text-[10px] opacity-40 mb-4 uppercase">Status: CORRUPTED // Sector: ${nextFrag.id.replace('frag_', '0x0')}</p>
                <button onclick="uiManager.handleRecoverMemory()" class="w-full py-3 matrix-border text-[10px] font-bold uppercase tracking-[0.2em] transition-all ${canAfford ? 'hover:bg-white hover:text-black' : 'opacity-20 cursor-not-allowed'}" ${canAfford ? '' : 'disabled'}>
                    Execute_Recovery_Sequence
                </button>
            `;
            recoveryDiv.appendChild(nextDiv);
        } else {
            const allDone = document.createElement('div');
            allDone.className = 'p-6 text-center text-[10px] uppercase opacity-40 matrix-border';
            allDone.innerText = 'All_Memory_Clusters_Stabilized';
            recoveryDiv.appendChild(allDone);
        }

        // 2. Recovered Fragments List
        if (recovered.length > 0) {
            const listDiv = document.createElement('div');
            listDiv.className = 'space-y-3';
            recovered.reverse().forEach(frag => {
                const div = document.createElement('div');
                div.className = 'matrix-border bg-white/5 p-4 border-l-2 border-[var(--matrix-green)]';
                div.innerHTML = `
                    <div class="flex justify-between items-center mb-2">
                        <div class="text-[10px] font-bold uppercase tracking-widest text-[var(--matrix-green)]">${frag.title}</div>
                        <div class="text-[9px] px-2 py-0.5 bg-[var(--matrix-green)]/20 text-[var(--matrix-green)] rounded uppercase font-bold">Bonus: ${frag.bonus.val}x ${frag.bonus.type}</div>
                    </div>
                    <p class="text-[10px] opacity-70 italic leading-relaxed">"${frag.lore}"</p>
                `;
                listDiv.appendChild(div);
            });
            recoveryDiv.appendChild(listDiv);
        }

        this.els.archiveContent.appendChild(recoveryDiv);
    }

    handleRecoverMemory() {
        const result = this.state.recoverMemory();
        if (result.success) {
            this.playSFX('recovery_success');
            this.logMessage(`> RECOVERY_SUCCESS: ${result.frag.title} SECURED.`, "#00FF41");
            this.renderArchive();
            this.update(); 
        } else {
            this.playSFX('glitch_static', { volume: 0.3 });
            this.logMessage(`> RECOVERY_FAILED: ${result.msg}`, "#ff003c");
        }
    }

    renderLab() {
        this.els.labContent.innerHTML = '';
        const tree = this.state.skillTree;

        const paths = [
            {
                id: 'logic',
                name: 'LogicPath',
                desc: 'Optimize neural pathways for maximum autonomous efficiency.',
                bonus: '+25% All Automatic Production (MPS)',
                color: '#00f2ff',
                themeClass: 'theme-logic',
                unlocked: tree.logic.unlocked
            },
            {
                id: 'creative',
                name: 'CreativePath',
                desc: 'Harness chaotic patterns for explosive manual processing.',
                bonus: '+50% Click Power & +10% Critical Chance',
                color: '#ff003c',
                themeClass: 'theme-creative',
                unlocked: tree.creative.unlocked
            }
        ];

        paths.forEach(path => {
            const isSelected = tree.selectedPath === path.id;
            const isLocked = tree.selectedPath && tree.selectedPath !== path.id;
            
            const div = document.createElement('div');
            div.className = `matrix-border p-6 rounded-xl transition-all duration-500 flex flex-col gap-4 ${isSelected ? 'border-2 scale-105' : ''} ${isLocked ? 'opacity-20 grayscale cursor-not-allowed' : ''}`;
            div.style.borderColor = path.color;
            
            div.innerHTML = `
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full flex items-center justify-center" style="background: ${path.color}33">
                        <span style="color: ${path.color}" class="text-lg font-bold">${path.name[0]}</span>
                    </div>
                    <div class="text-xl font-bold uppercase tracking-tighter" style="color: ${path.color}">${path.name}</div>
                </div>
                <p class="text-xs opacity-60 italic">${path.desc}</p>
                <div class="p-3 bg-black/40 rounded border-l-4" style="border-color: ${path.color}">
                    <div class="text-[10px] uppercase font-bold opacity-40 mb-1">${this.state.settings.language === 'tr' ? 'Bonus Aktif:' : 'Active Bonus:'}</div>
                    <div class="text-xs font-bold">${path.bonus}</div>
                </div>
                ${!tree.selectedPath ? `
                    <button onclick="uiManager.handleSelectPath('${path.id}')" class="mt-4 py-3 matrix-border text-[10px] font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all" style="border-color: ${path.color}; color: ${path.color}">
                        ${this.state.t('activate_signal')}
                    </button>
                ` : isSelected ? `
                    <div class="mt-4 text-center text-[10px] font-bold uppercase tracking-widest py-2 bg-white/10" style="color: ${path.color}">${this.state.t('active_identity')}</div>
                ` : `
                    <div class="mt-4 text-center text-[10px] font-bold uppercase tracking-widest py-2">${this.state.t('access_denied')}</div>
                `}
            `;
            this.els.labContent.appendChild(div);
        });
    }

    handleSelectPath(pathId) {
        if (this.state.selectPath(pathId)) {
            const colors = { logic: '#00f2ff', creative: '#ff003c' };
            this.logMessage(this.state.t('identity_fixed', { path: pathId.toUpperCase() }), colors[pathId]);
            this.updateTheme();
            this.renderLab();
            
            // Selection & Vanish Animation
            this.els.pathSelectionContainer.classList.add('opacity-0', 'pointer-events-none');
            this.els.navLabBtn.classList.add('hidden');
            setTimeout(() => {
                this.els.pathSelectionContainer.style.display = 'none';
                this.updateIdentityHUD();
            }, 700);

            // Visual feedback
            this.els.labPanel.classList.add('animate-pulse');
            setTimeout(() => this.els.labPanel.classList.remove('animate-pulse'), 1000);
        }
    }

    updateIdentityHUD() {
        const path = this.state.skillTree.selectedPath;
        if (!path) return;

        this.els.identityLabel.classList.remove('hidden');
        this.els.identityLabel.innerText = `${path.toUpperCase()}_MODE_ACTIVE`;
        this.els.identityLabel.style.backgroundColor = path === 'logic' ? '#00f2ff' : '#ff003c';
    }

    updateTheme() {
        const path = this.state.skillTree.selectedPath;
        const root = document.documentElement;
        
        if (path === 'logic') {
            root.style.setProperty('--matrix-green', '#00f2ff');
            root.style.setProperty('--matrix-glow-color', '#00f2ff');
            this.els.crtEffect.style.background = 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.15) 50%), linear-gradient(90deg, rgba(0, 242, 255, 0.04), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.04))';
        } else if (path === 'creative') {
            root.style.setProperty('--matrix-green', '#ff003c');
            root.style.setProperty('--matrix-glow-color', '#ff003c');
            this.els.crtEffect.style.background = 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.15) 50%), linear-gradient(90deg, rgba(255, 0, 60, 0.04), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.04))';
        } else {
            root.style.setProperty('--matrix-green', '#00FF41');
            root.style.setProperty('--matrix-glow-color', '#00FF41');
        }

        this.updateIdentityHUD();
    }

    renderWorldMap() {
        this.els.mapNodes.innerHTML = '';
        Object.values(this.state.worldCities).forEach(city => {
            const dot = document.createElement('div');
            dot.className = `absolute w-3 h-3 rounded-full cursor-pointer transition-all hover:scale-150 map-node-glow ${this.state.conqueredCities.includes(city.id) ? 'bg-[#00FF41]' : 'bg-red-500/50'}`;
            
            // Lat/Lng to XY (Simplified Mercator-ish)
            const x = ((city.lng + 180) / 360) * 100;
            const y = ((90 - city.lat) / 180) * 100;
            
            dot.style.left = `${x}%`;
            dot.style.top = `${y}%`;
            dot.title = city.name;
            
            dot.onclick = (e) => {
                e.stopPropagation();
                this.showConquestModal(city.id);
            };
            
            this.els.mapNodes.appendChild(dot);
        });

        const percent = Math.floor((this.state.conqueredCities.length / Object.keys(this.state.worldCities).length) * 100);
        this.els.mapConquestPercent.innerText = `${percent}%`;
    }

    updateMapNodes() {
        // Just update colors/status without full re-render if possible
        const dots = this.els.mapNodes.children;
        Object.values(this.state.worldCities).forEach((city, i) => {
            if (dots[i]) {
                const isConquered = this.state.conqueredCities.includes(city.id);
                dots[i].className = `absolute w-3 h-3 rounded-full cursor-pointer transition-all hover:scale-150 map-node-glow ${isConquered ? 'bg-[#00FF41]' : 'bg-red-500/50'}`;
            }
        });
        
        const percent = Math.floor((this.state.conqueredCities.length / Object.keys(this.state.worldCities).length) * 100);
        this.els.mapConquestPercent.innerText = `${percent}%`;
    }

    showConquestModal(cityId) {
        const city = this.state.worldCities[cityId];
        if (!city) return;

        const isConquered = this.state.conqueredCities.includes(cityId);
        
        this.els.conquestModal.classList.remove('hidden');
        this.updateBackgroundBlur();
        this.els.conquestCityName.innerText = city.name.toUpperCase();
        this.els.conquestCityCost.innerText = this.state.formatValue(city.cost);
        this.els.conquestCityBonus.innerText = `+${(city.bonus * 100).toFixed(0)}% Global Multiplier`;
        
        const btnText = isConquered ? this.state.t('already_conquered') : (this.state.credits < city.cost ? this.state.t('insufficient_data') : this.state.t('authorize_conquest'));
        this.els.conquestConfirmBtn.disabled = isConquered || this.state.credits < city.cost;
        this.els.conquestConfirmBtn.innerText = btnText;
        
        this.els.conquestConfirmBtn.onclick = () => {
            if (this.state.conquerCity(cityId)) {
                this.logMessage(this.state.t('conquest_authorized', { city: city.name.toUpperCase() }), '#00FF41');
                this.renderWorldMap();
                this.els.conquestModal.classList.add('hidden');
                this.updateBackgroundBlur();
            }
        };
    }

    closeConquestModal() {
        this.els.conquestModal.classList.add('hidden');
        this.updateBackgroundBlur();
    }

    openLogModal(log) {
        this.els.logModal.classList.remove('hidden');
        this.updateBackgroundBlur();
        this.els.logTitle.innerText = log.title;
        this.els.logContent.innerText = '';
        
        let i = 0;
        const text = log.content;
        const speed = 30; // Typewriter speed

        if (this.typewriterInterval) clearInterval(this.typewriterInterval);
        
        this.typewriterInterval = setInterval(() => {
            this.els.logContent.innerText += text[i];
            i++;
            if (i >= text.length) clearInterval(this.typewriterInterval);
        }, speed);
    }

    closeLogModal() {
        this.els.logModal.classList.add('hidden');
        this.updateBackgroundBlur();
        if (this.typewriterInterval) clearInterval(this.typewriterInterval);
    }

    showDecisionModal(decision) {
        this.els.decisionModal.classList.remove('hidden');
        this.updateBackgroundBlur();
        this.els.decisionQuestion.innerText = decision.question;
        this.els.decisionOptions.innerHTML = '';

        decision.options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'matrix-btn matrix-border p-4 text-xs font-bold uppercase tracking-widest hover:bg-[var(--matrix-green)] hover:text-black transition-all';
            btn.innerText = opt.text;
            btn.onclick = () => {
                this.state.applyDecisionBonus(opt.bonus, opt.value, opt.message);
                this.els.decisionModal.classList.add('hidden');
                this.updateBackgroundBlur();
            };
            this.els.decisionOptions.appendChild(btn);
        });
    }

    showOfflineReport(report) {
        if (!report) return;
        this.currentOfflineReport = report;

        const minutes = Math.floor(report.seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        let timeStr = `${minutes} Dakika`;
        if (hours > 0) timeStr = `${hours} Saat ${minutes % 60} Dakika`;

        this.els.offlineModal.classList.remove('hidden');
        this.updateBackgroundBlur();
        this.els.offlineTime.innerText = timeStr;
        this.els.offlineEarned.innerText = this.state.formatValue(report.earned);
        
        this.logMessage(`> RECOVERY: Processed ${this.state.formatValue(report.earned)} from background buffer.`);
    }

    closeOfflineModal() {
        this.els.offlineModal.classList.add('hidden');
        this.updateBackgroundBlur();
    }

    watchAdForOffline() {
        if (!this.currentOfflineReport) return;
        this.startAdSimulation(() => {
            const bonus = this.currentOfflineReport.earned; // Double the original earned
            this.state.credits += bonus;
            this.state.totalDataEver += bonus;
            this.logMessage(`> REWARD: Offline data doubled! +${this.state.formatValue(bonus)}`, "#ffcc00");
            this.closeOfflineModal();
        });
    }

    watchAdForSync() {
        if (this.state.isSyncActive) return;
        this.startAdSimulation(() => {
            this.state.rewardAdSync();
            this.logMessage("> REWARD: Neural Sync fully charged!", "#ffcc00");
        });
    }

    watchAdForStolenData() {
        this.startAdSimulation(() => {
            this.state.rewardAdStolenData();
            this.logMessage("> REWARD: +1 Stolen Data acquired from dark web ad-stream.", "#ffcc00");
            this.updateBlackMarketUI();
        });
    }

    startAdSimulation(onComplete) {
        this.els.adModal.classList.remove('hidden');
        let timeLeft = 5; // 5 seconds for simulation
        this.els.adTimer.innerText = timeLeft;

        const interval = setInterval(() => {
            timeLeft--;
            this.els.adTimer.innerText = timeLeft;
            if (timeLeft <= 0) {
                clearInterval(interval);
                this.els.adModal.classList.add('hidden');
                if (onComplete) onComplete();
            }
        }, 1000);
    }

    showBossRewardAd() {
        this.showAdChoiceModal(
            "DOUBLE_REWARD",
            "Firewall sızıntısı bitti ama hala veri sızıntısı var. Reklam izleyerek +1 Stolen Data daha kazanmak ister misin?",
            () => {
                this.state.rewardAdStolenData();
                this.logMessage("> REWARD: Bonus Stolen Data recovered!", "#ffcc00");
            }
        );
    }

    showBossFailureAd(penalty) {
        this.showAdChoiceModal(
            "DATA_RECOVERY",
            `Sistem kilitlendi ve ${this.state.formatValue(penalty)} veri kaybedildi. Bir reklam izleyerek bu veriyi geri kazanabilirsin.`,
            () => {
                this.state.credits += penalty;
                this.state.totalDataEver += penalty;
                this.logMessage("> REWARD: Purged data successfully recovered!", "#ffcc00");
            }
        );
    }

    showAdChoiceModal(title, desc, onAdSuccess) {
        this.els.decisionModal.classList.remove('hidden');
        this.els.decisionQuestion.innerHTML = `
            <div class="text-yellow-500 text-sm mb-2 uppercase font-black tracking-widest">[ ${title} ]</div>
            <div class="text-lg">${desc}</div>
        `;
        this.els.decisionOptions.innerHTML = '';

        // Option 1: Watch Ad
        const adBtn = document.createElement('button');
        adBtn.className = 'matrix-btn border-2 border-yellow-500 p-4 text-xs font-bold uppercase tracking-widest text-yellow-500 hover:bg-yellow-500 hover:text-black transition-all';
        adBtn.innerText = "Watch Ad & Get Reward";
        adBtn.onclick = () => {
            this.els.decisionModal.classList.add('hidden');
            this.startAdSimulation(onAdSuccess);
        };

        // Option 2: Decline
        const noBtn = document.createElement('button');
        noBtn.className = 'matrix-btn matrix-border p-4 text-xs font-bold uppercase tracking-widest opacity-40 hover:opacity-100 transition-all';
        noBtn.innerText = "Skip Reward";
        noBtn.onclick = () => {
            this.els.decisionModal.classList.add('hidden');
        };

        this.els.decisionOptions.appendChild(adBtn);
        this.els.decisionOptions.appendChild(noBtn);
    }

    importSave() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                if (this.state.importFromJSON(event.target.result)) window.location.reload();
            };
            reader.readAsText(file);
        };
        input.click();
    }

    renderShop() {
        this.els.shopList.innerHTML = '';
        this.state.upgrades.forEach(upgrade => {
            const cost = this.state.getUpgradeCost(upgrade);
            const card = document.createElement('div');
            card.className = 'matrix-border p-4 bg-black/40 rounded-lg flex flex-col gap-2';
            card.id = `upgrade-${upgrade.id}`;
            card.innerHTML = `
                <div class="flex justify-between items-start">
                    <div>
                        <div class="font-bold text-sm uppercase">${upgrade.name}</div>
                        <div class="text-[9px] opacity-60">${upgrade.description}</div>
                    </div>
                    <div class="upgrade-level text-[10px] font-bold px-2 py-1 bg-[var(--matrix-green)]/10 rounded">LVL ${upgrade.level}</div>
                </div>
                <div class="flex justify-between items-center mt-2">
                    <div class="upgrade-cost text-xs font-bold text-[var(--matrix-green)]">${this.state.formatValue(cost)}</div>
                    <button onclick="window.handlePurchase('${upgrade.id}')" class="buy-btn matrix-btn matrix-border px-4 py-1 text-[10px] uppercase font-bold rounded" ${this.state.credits < cost ? 'disabled' : ''}>
                        ${this.state.credits >= cost ? 'Optimize' : 'Insufficient'}
                    </button>
                </div>
            `;
            this.els.shopList.appendChild(card);
        });
    }

    updateShopButtons() {
        this.state.upgrades.forEach(upgrade => {
            const card = document.getElementById(`upgrade-${upgrade.id}`);
            if (card) {
                const btn = card.querySelector('.buy-btn');
                const cost = this.state.getUpgradeCost(upgrade);
                const canAfford = this.state.credits >= cost;
                btn.disabled = !canAfford;
                btn.innerText = canAfford ? 'Optimize' : 'Insufficient';
                card.querySelector('.upgrade-level').innerText = `LVL ${upgrade.level}`;
                card.querySelector('.upgrade-cost').innerText = this.state.formatValue(cost);
            }
        });
    }

    renderBlackMarket() {
        this.els.blackMarketList.innerHTML = '';

        // Add Exchange Item
        const exchangeDiv = document.createElement('div');
        exchangeDiv.className = 'illegal-item p-4 border-dashed border-[#ff003c]/50 bg-black/40 flex flex-col gap-2 mb-4';
        exchangeDiv.innerHTML = `
            <div class="flex justify-between items-start">
                <div>
                    <div class="text-[10px] font-black text-white uppercase tracking-widest">DATA_LAUNDERING</div>
                    <div class="text-[9px] opacity-60 italic mt-1">Laundry raw data into stolen packets.</div>
                </div>
                <div class="text-[10px] font-bold text-[#ff003c] exchange-cost-display">${this.state.formatValue(this.state.stolenDataExchangeCost)}</div>
            </div>
            <button onclick="window.handleDataExchange()" 
                class="mt-2 py-2 bg-[#ff003c11] border border-[#ff003c]/30 text-[10px] font-bold uppercase hover:bg-[#ff003c] hover:text-white transition-all"
                ${this.state.credits < this.state.stolenDataExchangeCost ? 'disabled' : ''}>
                ${this.state.credits < this.state.stolenDataExchangeCost ? 'INSUFFICIENT DATA' : 'EXCHANGE DATA'}
            </button>
        `;
        this.els.blackMarketList.appendChild(exchangeDiv);

        this.state.illegalUpgrades.forEach(upgrade => {
            const div = document.createElement('div');
            div.className = `illegal-item p-4 matrix-border flex flex-col gap-2 transition-all ${upgrade.level > 0 ? 'opacity-50 grayscale' : ''}`;
            div.innerHTML = `
                <div class="flex justify-between items-start">
                    <div>
                        <div class="text-xs font-bold text-[#ff003c] uppercase tracking-widest">${upgrade.name}</div>
                        <div class="text-[9px] opacity-60 italic mt-1">${upgrade.description}</div>
                    </div>
                    <div class="text-[10px] font-bold text-[#ff003c]">${upgrade.cost} DATA</div>
                </div>
                <button onclick="window.handleIllegalPurchase('${upgrade.id}')" 
                    class="mt-2 py-2 border border-[#ff003c]/30 text-[10px] font-bold uppercase hover:bg-[#ff003c] hover:text-white transition-all"
                    ${this.state.stolenData < upgrade.cost || upgrade.level > 0 ? 'disabled' : ''}>
                    ${upgrade.level > 0 ? 'INSTALLED' : (this.state.stolenData < upgrade.cost ? 'NOT ENOUGH DATA' : 'EXECUTE SCRIPT')}
                </button>
            `;
            this.els.blackMarketList.appendChild(div);
        });
    }

    updateBlackMarketUI() {
        this.els.stolenDataDisplay.innerText = this.state.stolenData;
        
        if (this.state.stolenData > 0) {
            this.els.navBlackMarketBtn.classList.remove('hidden');
        }

        if (this.els.blackMarketPanel.classList.contains('panel-hidden-center')) return;
        
        this.state.illegalUpgrades.forEach(upgrade => {
            const btn = Array.from(this.els.blackMarketList.querySelectorAll('button')).find(b => b.getAttribute('onclick').includes(upgrade.id));
            if (btn) {
                const canAfford = this.state.stolenData >= upgrade.cost;
                btn.disabled = !canAfford || upgrade.level > 0;
                btn.innerText = upgrade.level > 0 ? 'INSTALLED' : (canAfford ? 'EXECUTE SCRIPT' : 'NOT ENOUGH DATA');
            }
        });

        // Update Laundering Button
        const launderingBtn = Array.from(this.els.blackMarketList.querySelectorAll('button')).find(b => b.getAttribute('onclick').includes('handleDataExchange'));
        if (launderingBtn) {
            const canAfford = this.state.credits >= this.state.stolenDataExchangeCost;
            launderingBtn.disabled = !canAfford;
            launderingBtn.innerText = canAfford ? 'EXCHANGE DATA' : 'INSUFFICIENT DATA';
            // Update cost text
            const costLabel = launderingBtn.parentElement.querySelector('.exchange-cost-display');
            if (costLabel) costLabel.innerText = this.state.formatValue(this.state.stolenDataExchangeCost);
        }
    }

}
