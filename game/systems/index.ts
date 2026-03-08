
import type { World, InputState } from '../../types';
import { get } from '../ecs';
import type { StateMachine, Transform } from '../components';
import { abilitySystem } from './abilitySystem';
import { physicsSystem } from './physicsSystem';
import { collisionSystem } from './collisionSystem';
import { renderSystem } from './renderSystem';
import { dynamicsSystem } from './attachmentSystem';
import { statusSystem } from './statusSystem';
import { combatSystem } from './combatSystem';
import { movingPlatformSystem } from './movingPlatformSystem';
import { entitySystem } from './entitySystem';
import { targetSystem } from './targetSystem';
import { jiggleSystem } from './jiggleSystem';
import { interactionSystem } from './interactionSystem';
import { checkpointSystem } from './checkpointSystem';
import { pickupSystem } from './pickupSystem';
import { bossSystem } from './bossSystem';

export function runSystems(world: World, canvas: HTMLCanvasElement, input: InputState) {
    // Systems that run regardless of game state (for animations, etc.)
    physicsSystem(world);
    collisionSystem(world);
    dynamicsSystem(world);
    jiggleSystem(world);
    movingPlatformSystem(world);
    
    if (world.status === 'playing') {
        if (world.respawnPlayer) {
            statusSystem.respawn(world, world.playerId);
            world.respawnPlayer = false;
        }

        abilitySystem(world, input);
        entitySystem(world);
        bossSystem(world);
        pickupSystem(world);
        checkpointSystem(world);
        targetSystem(world);
        combatSystem(world);
        interactionSystem(world);
        statusSystem.update(world);
        statusSystem.checkLevelCompletion(world);
        statusSystem.checkGameOver(world);
    } else if (world.status === 'bossDefeated') {
        const playerS = get<StateMachine>(world, 'state', world.playerId);
        if (playerS && playerS.state !== 'victoryDance') {
            playerS.state = 'victoryDance';
            playerS.animTime = 0;
            const playerT = get<Transform>(world, 'transform', world.playerId);
            if (playerT) {
                playerT.vel.x = 0;
                playerT.vel.y = 0;
            }
        }
        
        // Let victory dance play for 5 seconds
        if (playerS && playerS.state === 'victoryDance' && playerS.animTime > 5.0) {
            world.status = 'levelComplete'; // This is a world-internal status change, GameCanvas will pick it up
        }

        bossSystem(world); // Keep running this to animate the boss death
        statusSystem.update(world); // Updates anim timers for player and boss
    } else if (world.status === 'levelComplete') {
        // Only run systems needed for the victory animation
        statusSystem.update(world); // Updates anim timers
    } else {
        // Game is over, just run status update to handle death timers
        statusSystem.update(world);
    }
    
    renderSystem(world, canvas);
}