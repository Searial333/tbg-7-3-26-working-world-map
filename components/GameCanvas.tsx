
import React, { useRef, useEffect, useCallback } from 'react';
import type { GameState, World, InputState, Level, GameActions, VisualSettings, UpgradesState, CreateWorldProps, DebugFlags } from '../types';
import { createWorld, spawnActor, get } from '../game/ecs';
import { runSystems } from '../game/systems';
import type { Health, Abilities, Kinematics, Boss } from '../game/components';
import { CHARACTER_PRESETS } from '../constants/characters';
import { UPGRADES, UPGRADE_ORDER } from '../constants/upgrades';

interface GameCanvasProps {
  gameState: GameState;
  onStateUpdate: (newState: Partial<GameState>) => void;
  onCoinCollected: () => void;
  input: InputState;
  characterId: string;
  level: Level;
  visualSettings: VisualSettings;
  upgrades: UpgradesState;
  debugFlags: DebugFlags;
  className?: string;
  isTestMode: boolean;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ gameState, onStateUpdate, onCoinCollected, input, characterId, level, visualSettings, upgrades, debugFlags, className, isTestMode }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const worldRef = useRef<World | null>(null);
  
  // Define render resolution (HD)
  const renderWidth = 1920;
  const renderHeight = 1080;

  // Define logical resolution.
  // We use a fixed, zoomed-in resolution for all levels (including Boss/Shop) to ensure
  // the game looks big and detailed, avoiding "wasted space".
  const logicalWidth = 960;
  const logicalHeight = 540;

  const initGame = useCallback(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Deep clone level so we can safely mutate it (e.g. move goal post on boss death)
    const levelClone = JSON.parse(JSON.stringify(level));

    const world = createWorld({
        onStateUpdate,
        onCoinCollected,
        level: levelClone,
        visualSettings: visualSettings,
        upgrades: upgrades,
        debugFlags: debugFlags,
        isTestMode: isTestMode,
        logicalWidth,
        logicalHeight,
    });
    worldRef.current = world;
    
    // Create a deep copy to avoid mutating the original preset
    const basePreset = CHARACTER_PRESETS[characterId] || CHARACTER_PRESETS.TEDDY;
    const modifiedPreset = JSON.parse(JSON.stringify(basePreset));

    // Apply upgrades to the physics properties
    UPGRADE_ORDER.forEach(upgradeId => {
      const level = upgrades[upgradeId];
      if (level > 0) {
        const upgrade = UPGRADES[upgradeId];
        // The apply function returns a new, modified physics object
        modifiedPreset.physics = upgrade.apply(modifiedPreset.physics as Kinematics, level);
      }
    });

    const player = spawnActor(world, modifiedPreset, level.playerStart);
    world.playerId = player;

  }, [onStateUpdate, onCoinCollected, characterId, level, visualSettings, upgrades, debugFlags, isTestMode, logicalWidth, logicalHeight]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    let animationFrameId: number;
    const gameLoop = () => {
      if (!worldRef.current || !canvasRef.current) {
        animationFrameId = requestAnimationFrame(gameLoop);
        return;
      }
      
      const world = worldRef.current;
      world.status = gameState.status;
      world.canInteract = gameState.canInteract;
      world.visualSettings = visualSettings; // Keep settings in sync
      world.upgrades = upgrades; // Keep upgrades in sync
      world.debugFlags = debugFlags; // Keep debug flags in sync
      world.hasInteractedWithShop = gameState.hasInteractedWithShop;
      world.isTestMode = isTestMode; // Keep test mode in sync
      
      if (gameState.paused && gameState.status === 'playing') {
        animationFrameId = requestAnimationFrame(gameLoop);
        return;
      }

      const now = performance.now();
      const dt = (now - (world.lastTime || now)) / 1000;
      world.lastTime = now;
      world.time += dt;

      runSystems(world, canvasRef.current, input);

      if (world.status === 'levelComplete' && gameState.status !== 'levelComplete') {
          onStateUpdate({
              status: 'levelComplete',
              levelStats: { coins: world.coinsThisLevel }
          });
      }
      
      if (world.status === 'gameOver' && gameState.status !== 'gameOver') {
          onStateUpdate({ status: 'gameOver' });
      }

      const playerHealth = get<Health>(world, 'health', world.playerId);
      const playerAbilities = get<Abilities>(world, 'abilities', world.playerId);
      
      let bossInfo: GameState['bossInfo'];
      for (const e of world.entities) {
          const b = get<Boss>(world, 'boss', e);
          if (b) {
              const h = get<Health>(world, 'health', e);
              if (h) {
                  const bossName = b.type === 'diddy' ? 'DIDDY KONG' : 'DONKEY KONG';
                  bossInfo = { hp: h.hp, maxHp: h.maxHp, name: bossName, state: b.state };
              }
              break;
          }
      }

      const healthChanged = playerHealth && (playerHealth.hp !== gameState.playerHealth || playerHealth.maxHp !== gameState.playerMaxHealth);
      const diaperCooldownChanged = playerAbilities && (playerAbilities.context.diaperCooldown ?? 0) !== gameState.playerDiaperCooldown;
      const bossInfoChanged = JSON.stringify(bossInfo) !== JSON.stringify(gameState.bossInfo);

      if(healthChanged || diaperCooldownChanged || bossInfoChanged) {
          onStateUpdate({
              playerHealth: playerHealth?.hp ?? gameState.playerHealth,
              playerMaxHealth: playerHealth?.maxHp ?? gameState.playerMaxHealth,
              playerDiaperCooldown: playerAbilities?.context.diaperCooldown ?? 0,
              bossInfo: bossInfo,
          });
      }

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    gameLoop();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [input, gameState, onStateUpdate, visualSettings, upgrades, debugFlags, isTestMode]);

  return <canvas ref={canvasRef} width={renderWidth} height={renderHeight} className={className} />;
};

export default GameCanvas;
