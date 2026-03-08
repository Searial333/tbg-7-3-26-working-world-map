
import React, { useState, useCallback, useEffect, useRef } from 'react';
import GameCanvas from './components/GameCanvas';
import Overworld from './components/Overworld';
import ShopUI from './components/ShopUI';
import VisualsMenu from './components/VisualsMenu';
import { LevelEditor } from './components/LevelEditor';
import type { GameStatus, GameState, LevelProgress, LevelId, VisualSettings, LevelProgressState, UpgradesState, WorldId, UpgradeId, DebugFlags, Level } from './types';
import { useInput } from './hooks/useInput';
import { TouchControls } from './components/TouchControls';
import { LEVEL_ORDER, LEVELS, WORLDS } from './constants/levels';
import { UPGRADES, LIFE_COST } from './constants/upgrades';
import { generateLevel } from './services/geminiService';

const DialogueUI: React.FC<{ dialogue: GameState['dialogue'] }> = ({ dialogue }) => {
    if (!dialogue) return null;
    return (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-full max-w-4xl z-[60] animate-fade-in-up px-4">
            <div className="ui-panel relative p-6 border-4 border-[#5c3716] shadow-2xl flex items-center gap-6">
                <div className="flex-1">
                    <h3 className="text-2xl font-bold text-yellow-400 mb-2 uppercase tracking-tighter drop-shadow-sm">{dialogue.speaker}</h3>
                    <p className="text-xl text-white font-medium leading-relaxed drop-shadow-sm">{dialogue.text}</p>
                </div>
                <div className="animate-bounce text-yellow-300 text-3xl shrink-0">▼</div>
            </div>
        </div>
    );
};

const BossHUD: React.FC<{ info: GameState['bossInfo'] }> = ({ info }) => {
    if (!info || info.hp <= 0) return null;
    const percent = Math.max(0, info.hp / info.maxHp) * 100;
    
    return (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 w-full max-w-2xl z-40 px-4">
             <div className="text-center mb-2">
                <h3 className="ui-title !text-3xl !tracking-tighter !m-0 drop-shadow-lg">{info.name}</h3>
            </div>
            <div className="h-6 w-full bg-black/60 border-4 border-[#5c3716] rounded-full overflow-hidden shadow-2xl relative">
                <div 
                    className="h-full bg-gradient-to-r from-red-800 via-red-500 to-red-600 transition-all duration-300 ease-out relative"
                    style={{ width: `${percent}%` }}
                >
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white/50 uppercase tracking-widest">
                    Boss Integrity System Active
                </div>
            </div>
        </div>
    );
};

const GameOverlay: React.FC<{ 
    status: GameStatus; 
    onContinue: () => void;
    onExit: () => void;
    coins: number;
    continueCost: number;
    levelStats?: { coins: number };
}> = ({ status, onContinue, onExit, coins, continueCost, levelStats }) => {
    const [tallyCoins, setTallyCoins] = useState(0);
    const [showContinue, setShowContinue] = useState(false);

    useEffect(() => {
        if (status === 'levelComplete' && levelStats) {
            setShowContinue(false);
            setTallyCoins(0);

            const duration = 1500; // ms
            const totalFrames = duration / (1000 / 60);
            let frame = 0;

            const counter = setInterval(() => {
                frame++;
                const progress = frame / totalFrames;
                const currentTally = Math.round(levelStats.coins * progress);
                setTallyCoins(currentTally);

                if (frame >= totalFrames) {
                    clearInterval(counter);
                }
            }, 1000/60);
            
            const buttonTimer = setTimeout(() => setShowContinue(true), 4000);

            return () => {
                clearInterval(counter);
                clearTimeout(buttonTimer);
            };
        }
    }, [status, levelStats]);


    if (status === 'playing' || status === 'bossDefeated' || status === 'respawning' || status === 'editor' || status === 'cinematic') return null;

    if (status === 'levelComplete') {
        return (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-50 animate-fade-in backdrop-blur-sm">
                <div className="text-center">
                    <h2 className="text-8xl font-bold text-white drop-shadow-[0_5px_15px_rgba(255,223,0,0.7)] animate-bounce" style={{ WebkitTextStroke: '4px #ca8a04' }}>VICTORY!</h2>
                    <div className="mt-8 ui-panel max-w-sm mx-auto p-4">
                        <div className="flex items-center justify-center gap-4 text-4xl">
                           <span className="drop-shadow-lg">💰</span>
                           <span className="font-bold text-white w-24 text-left">{tallyCoins}</span>
                        </div>
                    </div>
                     {showContinue && (
                        <button onClick={onExit} className="ui-button mt-8 animate-fade-in-up">
                            Return to Map
                        </button>
                    )}
                </div>
            </div>
        )
    }

    // Game Over UI
    const canContinue = coins >= continueCost;

    return (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in backdrop-blur-sm">
            <div className="text-center">
                <h2 className="text-8xl font-bold text-red-600 drop-shadow-[0_5px_15px_rgba(0,0,0,0.8)] animate-pulse" style={{ WebkitTextStroke: '2px #450a0a' }}>GAME OVER</h2>
                
                <div className="mt-8 space-y-4">
                    <div className="flex justify-center gap-8">
                        <button 
                            onClick={onContinue} 
                            disabled={!canContinue}
                            className={`ui-button ${!canContinue ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                        >
                            Retry (💰 {continueCost})
                        </button>
                        <button onClick={onExit} className="ui-button !bg-red-800 border-red-600 hover:!bg-red-700">
                            Give Up
                        </button>
                    </div>
                    {!canContinue && (
                        <p className="text-red-400 font-bold text-lg animate-bounce">Not enough coins!</p>
                    )}
                </div>
            </div>
        </div>
    );
};

const App: React.FC = () => {
    // State initialization
    const [gameState, setGameState] = useState<GameState>({
        status: 'playing', 
        paused: false,
        playerHealth: 9,
        playerMaxHealth: 9,
        currentLevelId: null,
        shopOpen: false,
        canInteract: false,
        playerDiaperCooldown: 0,
        hasInteractedWithShop: false,
        dialogue: null,
    });

    const [levelProgress, setLevelProgress] = useState<LevelProgress>({
        '1-1': 'unlocked'
    });
    
    const [coins, setCoins] = useState(0);
    
    const [upgrades, setUpgrades] = useState<UpgradesState>({
        speed: 0,
        jump: 0,
        dash: 0
    });

    const [visualSettings, setVisualSettings] = useState<VisualSettings>({
        pixelPerfect: true,
        screenShake: true,
        particleDensity: 1.0,
        floatingText: true,
        backgroundEffects: true,
        characterAttachments: true,
        touchControlsOpacity: 0.5,
        showTouchControls: false,
    });

    const [debugOpen, setDebugOpen] = useState(false);
    const [debugFlags, setDebugFlags] = useState<DebugFlags>({
        godMode: false,
        showHitboxes: false,
        freeCam: false,
    });

    const [showVisualsMenu, setShowVisualsMenu] = useState(false);
    const [customLevels, setCustomLevels] = useState<Record<string, Level>>({});
    const [isGeneratingLevel, setIsGeneratingLevel] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const input = useInput(containerRef);
    const isTouchDevice = 'ontouchstart' in window;

    // Handlers
    const handleStateUpdate = useCallback((newState: Partial<GameState>) => {
        setGameState(prev => {
            // Check for level completion transition
            if (newState.status === 'levelComplete' && prev.status !== 'levelComplete') {
                // Unlock next level
                const currentId = prev.currentLevelId;
                if (currentId) {
                    const currentIndex = LEVEL_ORDER.indexOf(currentId);
                    if (currentIndex !== -1 && currentIndex < LEVEL_ORDER.length - 1) {
                        const nextLevelId = LEVEL_ORDER[currentIndex + 1];
                        setLevelProgress(lp => ({
                            ...lp,
                            [currentId]: 'completed',
                            [nextLevelId]: lp[nextLevelId] === 'completed' ? 'completed' : 'unlocked'
                        }));
                    } else {
                         setLevelProgress(lp => ({ ...lp, [currentId]: 'completed' }));
                    }
                }
            }
            return { ...prev, ...newState };
        });
        
        // Add coins from level stats
        if (newState.levelStats?.coins) {
            setCoins(prev => prev + (newState.levelStats?.coins || 0));
        }
    }, []);

    const handleCoinCollected = useCallback(() => {
    }, []);

    const handleSelectLevel = (levelId: LevelId) => {
        setGameState(prev => ({
            ...prev,
            currentLevelId: levelId,
            status: 'playing',
            playerHealth: prev.playerMaxHealth, 
            hasInteractedWithShop: false,
            bossInfo: undefined,
            dialogue: null,
        }));
    };

    const handleGenerateLevel = async (prompt: string) => {
        setIsGeneratingLevel(true);
        try {
            const partialLevel = await generateLevel(prompt);
            const id = `custom-${Date.now()}`;
            
            const fullLevel: Level = {
                id: id,
                worldId: 'W1',
                name: partialLevel.name || 'AI Generated Level',
                subtitle: partialLevel.subtitle || 'Procedural Madness',
                type: 'normal',
                gimmick: 'standard',
                difficulty: 3,
                playerStart: { x: 100, y: 800 },
                bounds: partialLevel.bounds || { left: 0, right: 4000, top: 0, bottom: 2000 },
                background: partialLevel.background || 'JUNGLE_BEACH',
                music: 'jungle_1',
                platforms: (partialLevel.platforms || []).map(p => ({
                    ...p,
                    w: Math.max(p.w, 40),
                    h: Math.max(p.h, 40), 
                })),
                zones: [],
                collectibles: (partialLevel.collectibles || []).map((c, i) => ({ ...c, id: `c_ai_${i}` })),
                enemies: (partialLevel.enemies || []).map((e, i) => ({ ...e, id: `e_ai_${i}` })),
                npcs: [],
                checkpoints: [],
                finishZone: partialLevel.finishZone || { x: 3800, y: 800, w: 100, h: 200 },
                starRequirements: { bronze: 10, silver: 50, gold: 100 },
                parTime: 999,
            };

            setCustomLevels(prev => ({ ...prev, [id]: fullLevel }));
            handleSelectLevel(id);
        } catch (e) {
            console.error("Failed to generate level:", e);
            alert("Failed to generate level. Please try again.");
        } finally {
            setIsGeneratingLevel(false);
        }
    };

    const handleExitLevel = () => {
        setGameState(prev => ({ ...prev, currentLevelId: null, status: 'playing', dialogue: null }));
    };

    const handleContinue = () => {
        if (coins >= 50) {
            setCoins(c => c - 50);
            setGameState(prev => ({
                ...prev,
                status: 'respawning', 
                playerHealth: prev.playerMaxHealth,
                dialogue: null,
            }));
            setTimeout(() => setGameState(prev => ({ ...prev, status: 'playing' })), 100);
        }
    };

    const handleRestartLevel = () => {
        if (!gameState.currentLevelId) return;
        setGameState(prev => ({
            ...prev,
            status: 'respawning',
            playerHealth: prev.playerMaxHealth,
            dialogue: null,
        }));
        setTimeout(() => setGameState(prev => ({ ...prev, status: 'playing' })), 50);
    };

    const handleBuyLife = () => {
        if (coins >= LIFE_COST) {
            setCoins(c => c - LIFE_COST);
            setGameState(prev => ({ ...prev, playerHealth: Math.min(prev.playerHealth + 1, prev.playerMaxHealth + 1), playerMaxHealth: prev.playerMaxHealth + 1 }));
            return true;
        }
        return false;
    };

    const handleBuyUpgrade = (id: UpgradeId) => {
        const upgrade = UPGRADES[id];
        const level = upgrades[id];
        if (level >= upgrade.maxLevel) return false;
        
        const cost = upgrade.costs[level];
        if (coins >= cost) {
            setCoins(c => c - cost);
            setUpgrades(u => ({ ...u, [id]: u[id] + 1 }));
            return true;
        }
        return false;
    };

    // --- LEVEL EDITOR HANDLERS ---
    const handleOpenEditor = () => {
        setGameState(prev => ({ ...prev, status: 'editor', currentLevelId: null }));
    };

    const handleCloseEditor = () => {
        setGameState(prev => ({ ...prev, status: 'playing', currentLevelId: null }));
    };

    const handleTestEditorLevel = (level: Level) => {
        setCustomLevels(prev => ({ ...prev, [level.id]: level }));
        handleSelectLevel(level.id);
    };


    // Debug Actions
    const handleUnlockAll = () => {
        const allUnlocked: LevelProgress = {};
        LEVEL_ORDER.forEach(id => allUnlocked[id] = 'unlocked');
        setLevelProgress(prev => ({...prev, ...allUnlocked}));
    };

    // Toggle Visuals Menu with Esc key and Debug with Backtick
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (gameState.status === 'editor') return; 
                setShowVisualsMenu(prev => !prev);
                setGameState(prev => ({ ...prev, paused: !prev.paused }));
            }
            if (e.code === 'Backquote') {
                setDebugOpen(prev => {
                    const newState = !prev;
                    if (newState) {
                        const allUnlocked: LevelProgress = {};
                        LEVEL_ORDER.forEach(id => allUnlocked[id] = 'unlocked');
                        setLevelProgress(lp => ({...lp, ...allUnlocked}));
                        console.log("Debug Mode Enabled: All levels unlocked.");
                    }
                    return newState;
                });
            }
            if (e.code === 'KeyR' && gameState.currentLevelId) {
                handleRestartLevel();
            }
            if (e.code === 'KeyE' && gameState.canInteract && gameState.status === 'playing') {
                 setGameState(prev => ({ ...prev, shopOpen: !prev.shopOpen, hasInteractedWithShop: true }));
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [gameState.canInteract, gameState.status, gameState.currentLevelId]);

    const currentLevel = gameState.currentLevelId ? (LEVELS[gameState.currentLevelId] || customLevels[gameState.currentLevelId]) : null;

    return (
        <div ref={containerRef} className="w-full h-screen bg-black overflow-hidden relative select-none">
            
            {/* Editor Mode */}
            {gameState.status === 'editor' && (
                <LevelEditor 
                    onClose={handleCloseEditor}
                    onTestLevel={handleTestEditorLevel}
                />
            )}

            {/* Main Game Area */}
            {gameState.status !== 'editor' && (
                <>
                    {currentLevel ? (
                        <GameCanvas
                            level={currentLevel}
                            gameState={gameState}
                            onStateUpdate={handleStateUpdate}
                            onCoinCollected={handleCoinCollected}
                            input={input}
                            characterId="TEDDY"
                            visualSettings={visualSettings}
                            upgrades={upgrades}
                            debugFlags={debugFlags}
                            className="w-full h-full object-contain"
                            isTestMode={debugFlags.godMode}
                        />
                    ) : (
                        <Overworld 
                            levelProgress={levelProgress}
                            onSelectLevel={handleSelectLevel}
                            onGenerateLevel={handleGenerateLevel}
                            isGenerating={isGeneratingLevel}
                            onOpenEditor={handleOpenEditor}
                        />
                    )}
                </>
            )}

            {/* Debug Menu */}
            {debugOpen && (
                <div className="absolute top-4 left-4 bg-black/80 text-white p-4 rounded border border-green-500 z-[100] font-mono text-sm">
                    <h3 className="text-green-400 font-bold mb-2 border-b border-green-500 pb-1">DEBUG CONSOLE</h3>
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={debugFlags.godMode} onChange={e => setDebugFlags(p => ({...p, godMode: e.target.checked}))} />
                            GOD MODE (Invincible)
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={debugFlags.showHitboxes} onChange={e => setDebugFlags(p => ({...p, showHitboxes: e.target.checked}))} />
                            SHOW HITBOXES
                        </label>
                        <hr className="border-gray-600" />
                        <button onClick={handleUnlockAll} className="bg-green-700 hover:bg-green-600 px-2 py-1 rounded w-full text-left">
                            🔓 UNLOCK ALL LEVELS
                        </button>
                        <button onClick={() => setCoins(c => c + 1000)} className="bg-yellow-700 hover:bg-yellow-600 px-2 py-1 rounded w-full text-left">
                            💰 ADD 1000 COINS
                        </button>
                        <button onClick={() => {
                            if(gameState.currentLevelId) handleStateUpdate({ status: 'levelComplete' });
                        }} className="bg-blue-700 hover:bg-blue-600 px-2 py-1 rounded w-full text-left">
                            ⏩ COMPLETE LEVEL
                        </button>
                    </div>
                </div>
            )}

            {/* Cinematic dialogue UI */}
            {gameState.status === 'cinematic' && <DialogueUI dialogue={gameState.dialogue} />}

            {/* Overlays */}
            {(gameState.status === 'levelComplete' || gameState.status === 'gameOver') && (
                <GameOverlay 
                    status={gameState.status}
                    coins={coins}
                    continueCost={50}
                    onContinue={handleContinue}
                    onExit={handleExitLevel}
                    levelStats={gameState.levelStats}
                />
            )}

            {/* Boss HUD */}
            {gameState.status !== 'editor' && gameState.bossInfo && <BossHUD info={gameState.bossInfo} />}

            {/* Shop UI */}
            {gameState.shopOpen && (
                <ShopUI 
                    coins={coins}
                    upgrades={upgrades}
                    onBuyLife={handleBuyLife}
                    onBuyUpgrade={handleBuyUpgrade}
                    onClose={() => setGameState(prev => ({ ...prev, shopOpen: false }))}
                />
            )}

            {/* Visuals Menu */}
            {showVisualsMenu && gameState.status !== 'editor' && (
                <VisualsMenu 
                    settings={visualSettings} 
                    onUpdate={(s) => setVisualSettings(prev => ({ ...prev, ...s }))}
                    onClose={() => {
                        setShowVisualsMenu(false);
                        setGameState(prev => ({ ...prev, paused: false }));
                    }}
                    isTouchDevice={isTouchDevice}
                />
            )}

            {/* HUD Elements */}
            {gameState.status !== 'editor' && gameState.status !== 'cinematic' && (
                <div className="absolute top-4 right-4 flex flex-col gap-2 pointer-events-none">
                    <div className="bg-black/50 p-2 rounded text-white font-bold border-2 border-[#5c3716] flex items-center gap-2">
                        <span>💰</span><span>{coins}</span>
                    </div>
                    {gameState.currentLevelId && (
                        <div className="bg-black/50 p-2 rounded text-white font-bold border-2 border-[#5c3716] flex items-center gap-2 text-red-400">
                            <span>❤️</span><span>{gameState.playerHealth}/{gameState.playerMaxHealth}</span>
                        </div>
                    )}
                     <div className="text-xs text-white/50 text-right">
                        ESC for Settings | R to Restart
                    </div>
                </div>
            )}
            
            {/* Interaction Prompt */}
            {gameState.canInteract && !gameState.shopOpen && gameState.status === 'playing' && (
                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-black/60 text-white px-6 py-3 rounded-full animate-bounce border-2 border-white/50">
                    Press <span className="font-bold text-yellow-300 text-xl mx-1">E</span> to Interact
                </div>
            )}

            {/* Touch Controls */}
            {visualSettings.showTouchControls && gameState.status === 'playing' && !gameState.shopOpen && (
                <TouchControls input={input} opacity={visualSettings.touchControlsOpacity} />
            )}

        </div>
    );
};

export default App;
