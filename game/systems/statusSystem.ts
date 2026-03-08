


import type { World, EntityId } from '../../types';
import { get, set } from '../ecs';
import type { StateMachine, Transform, Health, Abilities, Kinematics, Projectile, Boss, NPC } from '../components';
import { activeCollectibles } from './entitySystem';

function aabb(r1: {x:number, y:number, w:number, h:number}, r2: {x:number, y:number, w:number, h:number}) {
  return r1.x < r2.x + r2.w && r1.x + r1.w > r2.x && r1.y < r2.y + r2.h && r1.y + r1.h > r2.y;
}


function updateEntityStatus(w: World, e: EntityId) {
    const s = get<StateMachine>(w, 'state', e);
    const h = get<Health>(w, 'health', e);
    const t = get<Transform>(w, 'transform', e);
    const a = get<Abilities>(w, 'abilities', e);
    const p = get<Projectile>(w, 'projectile', e);
    const boss = get<Boss>(w, 'boss', e);

    if (p && t) {
        p.life -= w.dt;
        if (p.life <= 0 && h) {
            if (p.type === 'diaperBomb') {
                w.stinkClouds.push({ x: t.pos.x + t.size.x / 2, y: t.pos.y + t.size.y / 2, radius: 150, life: 5, maxLife: 5, height: 0 });
                w.actions.createParticleBurst(t.pos.x + t.size.x / 2, t.pos.y + t.size.y / 2, 50, '#9ccc65', 'burst', { sizeMultiplier: 2, velocityMultiplier: 1.2 });
            }
            if (p.type === 'barrel' || p.type === 'giant_barrel') {
                w.actions.createParticleBurst(t.pos.x + t.size.x / 2, t.pos.y + t.size.y / 2, 50, '#a1662f', 'burst', { sizeMultiplier: 2.5, velocityMultiplier: 1.8 }); // wood shards
                w.actions.createParticleBurst(t.pos.x + t.size.x / 2, t.pos.y + t.size.y / 2, 25, '#f97316', 'burst', { velocityMultiplier: 1.2 }); // fire
                w.actions.setScreenShake(8, 0.2);
            }
            h.hp = 0;
        }
    }

    if (h && h.hp <= 0 && !h.dead && s?.state !== 'dying') {
        h.dead = true;
        if(s) {
            s.state = 'dying';
            if (boss) {
                boss.state = 'dying';
                boss.stateTimer = 3.0; // 3 second death sequence
            }
            if(p) { // projectiles disappear instantly
                s.timers.dead = 0;
            } else {
                s.timers.dead = e === w.playerId ? 2.0 : 0.5; // Player has 2s death sequence
            }
        }
        if(t && e === w.playerId) {
            t.vel.x = 0;
            t.vel.y = -12 * 60; // Death hop
        }
    }

    if (s) {
        s.animTime += w.dt;
        if (s.invulnFrames > 0) s.invulnFrames -= w.dt;
        if (s.respawnFrames > 0) s.respawnFrames -= w.dt;

        Object.keys(s.timers).forEach(timer => {
            if (s.timers[timer] > 0) {
                s.timers[timer] -= w.dt;
            } else {
                if (timer === 'stun' && s.state === 'stunned') {
                    s.state = 'patrol';
                }
                if (timer === 'dead' && h?.dead && !boss && e !== w.playerId) {
                    // Mark entity for removal if we had a removal system
                    // For now, they just stay 'dead'
                }
                // Clean up timers
                delete s.timers[timer];
            }
        });
    }

    if (a && t) {
        if (t.onGround) {
            const k = get<Kinematics>(w, 'kinematics', e);
            if (k) a.context.coyote = k.coyoteFrames / 60.0;
        } else {
            if (a.context.coyote > 0) a.context.coyote -= w.dt;
        }
        if(a.context.dropThrough > 0) a.context.dropThrough -= w.dt;
        if(a.context.dashCooldown > 0) a.context.dashCooldown -= w.dt;
    }
}

function respawn(w: World, e: EntityId) {
    const t = get<Transform>(w, 'transform', e);
    const h = get<Health>(w, 'health', e);
    const s = get<StateMachine>(w, 'state', e);
    const a = get<Abilities>(w, 'abilities', e);
    const k = get<Kinematics>(w, 'kinematics', e);

    if (t && h && s && a && k) {
        t.pos = { ...t.lastCheckpoint };
        t.vel = { x: 0, y: 0 };
        h.hp = h.maxHp;
        h.dead = false;
        s.state = 'idle';
        s.invulnFrames = 3.0; // 3 seconds invulnerability on respawn
        delete s.timers.dead;
        a.context.jumpsLeft = k.maxJumps;
        a.context.hasDiaper = true;
    }
}

function checkLevelCompletion(w: World) {
    if (w.status !== 'playing') return;

    const playerT = get<Transform>(w, 'transform', w.playerId);
    const playerS = get<StateMachine>(w, 'state', w.playerId);
    if (!playerT || !playerS) return;
    
    const playerRect = { x: playerT.pos.x, y: playerT.pos.y, w: playerT.size.x, h: playerT.size.y };

    let levelComplete = false;

    // Check for standard finish zone
    if (w.level.finishZone && !w.level.finishZone.initiallyHidden) {
        // For shop levels, prevent exit until player has interacted with the shop
        if (w.level.type === 'shop' && !w.hasInteractedWithShop) {
            // Do nothing
        } else {
            const finishRect = { x: w.level.finishZone.x, y: w.level.finishZone.y, w: w.level.finishZone.w, h: w.level.finishZone.h };
            if (aabb(playerRect, finishRect)) {
                levelComplete = true;
            }
        }
    }

    // Check for teleporters
    if (!levelComplete && w.level.teleporters) {
        for (const teleporter of w.level.teleporters) {
            if (aabb(playerRect, teleporter)) {
                levelComplete = true;
                break;
            }
        }
    }

    if (levelComplete) {
        w.status = 'levelComplete'; // Standardize the level complete trigger
        playerS.state = 'victoryDance';
        playerS.animTime = 0;
        playerT.vel.x = 0; // Stop movement
        playerT.vel.y = 0;
    }
}

function checkGameOver(w: World) {
    const playerH = get<Health>(w, 'health', w.playerId);
    const playerS = get<StateMachine>(w, 'state', w.playerId);
    
    if (playerH?.dead && playerS?.state === 'dying' && (playerS.timers.dead === undefined || playerS.timers.dead <= 0)) {
        w.status = 'gameOver';
    }
}


export const statusSystem = {
    update: (w: World) => w.entities.forEach(e => updateEntityStatus(w, e)),
    respawn,
    checkLevelCompletion,
    checkGameOver,
};
