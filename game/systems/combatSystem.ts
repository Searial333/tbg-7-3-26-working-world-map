
import type { World, Vec2, EntityId } from '../../types';
import { get } from '../ecs';
import type { Transform, StateMachine, Health, Kinematics, Projectile, Boss, Abilities, RendererRef, NPC } from '../components';

function aabb(r1: any, r2: any) {
  return r1.x < r2.x + r2.w && r1.x + r1.w > r2.x && r1.y < r2.y + r2.h && r1.y + r1.h > r2.y;
}

function spawnHeart(w: World, pos: Vec2, size: Vec2) {
    const HEART_DROP_CHANCE = 0.25;
    if (Math.random() < HEART_DROP_CHANCE) {
        const heartSize = 24;
        w.heartPickups.push({
            x: pos.x + (size.x / 2) - (heartSize / 2),
            y: pos.y + (size.y / 2) - (heartSize / 2),
            w: heartSize,
            h: heartSize,
            vy: -400, // Pop up
            life: 15, // 15 seconds
            onGround: false,
        });
    }
}

function handleBossDamage(w: World, bossId: number) {
    const boss = get<Boss>(w, 'boss', bossId);
    const h = get<Health>(w, 'health', bossId);
    const t = get<Transform>(w, 'transform', bossId);
    if (!boss || !h || !t || !boss.healthThresholds || boss.healthThresholds.length === 0) return;

    const currentHealthPercent = h.hp / h.maxHp;
    if (currentHealthPercent <= boss.healthThresholds[0]) {
        const heartPos = { x: t.pos.x + t.size.x / 2, y: t.pos.y + t.size.y / 4 };
        // Boss health drops are guaranteed, not random
        const heartSize = 24;
        w.heartPickups.push({
            x: heartPos.x - (heartSize / 2),
            y: heartPos.y - (heartSize / 2),
            w: heartSize,
            h: heartSize,
            vy: -400,
            life: 15,
            onGround: false,
        });
        boss.healthThresholds.shift();
    }
}

function onEnemyDefeated(w: World, enemyId: EntityId) {
    const t = get<Transform>(w, 'transform', enemyId);
    const s = get<StateMachine>(w, 'state', enemyId);
    if (!t || !s) return;
    
    s.state = 'dying';

    const r = get<RendererRef>(w, 'renderer', enemyId);
    if (r?.painterId === 'enemy:patrol') { // Kremling explodes
        w.actions.createParticleBurst(t.pos.x + t.size.x / 2, t.pos.y + t.size.y / 2, 40, '#22c55e', 'burst', { velocityMultiplier: 1.5 });
        w.actions.createParticleBurst(t.pos.x + t.size.x / 2, t.pos.y + t.size.y / 2, 20, '#f97316', 'burst', { velocityMultiplier: 1.2 });
        s.timers.dead = 0.1; // Vanish quickly
    }
    
    spawnHeart(w, t.pos, t.size);
}


export function combatSystem(w: World) {
    if (w.level.type === 'shop') return; // No combat in the shop

    const playerT = get<Transform>(w, 'transform', w.playerId);
    const playerS = get<StateMachine>(w, 'state', w.playerId);
    const playerH = get<Health>(w, 'health', w.playerId);
    const playerK = get<Kinematics>(w, 'kinematics', w.playerId);
    const playerA = get<Abilities>(w, 'abilities', w.playerId);
    if (!playerT || !playerS || !playerH || !playerK || !playerA) return;

    const enemies: number[] = [];
    const bosses: number[] = [];
    const npcs: number[] = [];
    w.entities.forEach(e => {
        if (get<StateMachine>(w, 'state', e)?.enemyId) {
            enemies.push(e);
        }
        if (get<Boss>(w, 'boss', e)) {
            bosses.push(e);
        }
        if (get<NPC>(w, 'npc', e)) {
            npcs.push(e);
        }
    });

    // --- 0. Environmental Hazards (Lava/Spikes) ---
    const playerRect = { x: playerT.pos.x, y: playerT.pos.y, w: playerT.size.x, h: playerT.size.y };
    for (const zone of w.level.zones) {
        if (zone.type === 'lava') {
            if (aabb(playerRect, zone)) {
                if (!w.isTestMode && !w.debugFlags.godMode && playerS.state !== 'hot_foot' && playerS.invulnFrames <= 0) {
                    // APPLY HOT FOOT EFFECT
                    playerH.hp -= 1;
                    playerS.state = 'hot_foot';
                    playerS.animTime = 0;
                    playerS.timers.hot_foot = 2.0; // 2 seconds of pain
                    playerS.invulnFrames = 2.5; // Slightly longer than effect
                    
                    // Initial blast out of lava
                    playerT.vel.y = -900;
                    playerT.vel.x = playerT.facing * -300;
                    
                    w.actions.setScreenShake(15, 0.3);
                    w.actions.createParticleBurst(playerT.pos.x + playerT.size.x / 2, playerT.pos.y + playerT.size.y, 30, '#ff4500', 'burst', { sizeMultiplier: 2 });
                    w.actions.createParticleBurst(playerT.pos.x + playerT.size.x / 2, playerT.pos.y + playerT.size.y, 20, '#ff9800', 'burst', { sizeMultiplier: 1.5 });
                }
            }
        }
    }

    // --- Player attacks affecting enemies & bosses ---

    // 1. Milk Laser Beam
    if (playerS.state === 'bottleShootBeam') {
        const beamWidth = 1200;
        const beamHeight = 40;
        const beamOriginY = playerT.pos.y + 68;
        const beamY = beamOriginY - beamHeight / 2;
        const beamX = playerT.facing > 0 ? playerT.pos.x + playerT.size.x + 28 : playerT.pos.x - 28 - beamWidth;
        const beamRect = { x: beamX, y: beamY, w: beamWidth, h: beamHeight };

        const allTargets = [...enemies, ...bosses];
        allTargets.forEach(e => {
            const targetH = get<Health>(w, 'health', e);
            const targetS = get<StateMachine>(w, 'state', e);
            const targetT = get<Transform>(w, 'transform', e);
            if (!targetH || !targetS || !targetT || targetH.dead) return;

            const targetRect = { x: targetT.pos.x, y: targetT.pos.y, w: targetT.size.x, h: targetT.size.y };
            if (aabb(targetRect, beamRect) && targetS.invulnFrames <= 0) {
                 const damage = 3;
                 targetH.hp -= damage;
                 targetS.invulnFrames = 0.2;
                 if (get<Boss>(w, 'boss', e)) handleBossDamage(w, e);

                 if (w.visualSettings.floatingText) {
                    w.floatingTexts.push({ text: `${damage}`, x: targetT.pos.x + targetT.size.x / 2, y: targetT.pos.y, life: 1, maxLife: 1, color: '#ffdd55', vy: -60 });
                 }
                 if(targetH.hp <= 0) {
                    if(!get<Boss>(w, 'boss', e)) onEnemyDefeated(w, e);
                }
            }
        });
    }

    // 2. Stink Cloud Damage
    w.stinkClouds.forEach(cloud => {
        const currentRadius = cloud.radius * (1 - (cloud.life / cloud.maxLife)**2);
        enemies.forEach(e => {
            const enemyH = get<Health>(w, 'health', e);
            const enemyS = get<StateMachine>(w, 'state', e);
            const enemyT = get<Transform>(w, 'transform', e);
            if (!enemyH || !enemyS || !enemyT || enemyH.dead) return;

            const dist = Math.hypot((enemyT.pos.x + enemyT.size.x / 2) - cloud.x, (enemyT.pos.y + enemyT.size.y / 2) - cloud.y);
            if (dist < currentRadius && enemyS.invulnFrames <= 0) {
                 enemyH.hp -= 1;
                 enemyS.invulnFrames = 0.5; // Damage over time
                 if (w.visualSettings.floatingText) {
                    w.floatingTexts.push({ text: '1', x: enemyT.pos.x + enemyT.size.x / 2, y: enemyT.pos.y, life: 1, maxLife: 1, color: '#8BC34A', vy: -60 });
                 }
                 if(enemyH.hp <= 0) {
                    onEnemyDefeated(w, e);
                }
            }
        });
    });

    // --- Enemy/Boss attacks affecting player ---

    // 1. Boss shockwave
    w.shockwaves.forEach(wave => {
        if (playerS.invulnFrames <= 0 && !playerT.onGround && Math.abs(wave.y - (playerT.pos.y + playerT.size.y)) < wave.height * 2) {
             // Player is in the air during a shockwave - safe
        } else if (playerS.invulnFrames <= 0 && playerT.onGround && Math.abs(wave.x - (playerT.pos.x + playerT.size.x / 2)) < wave.radius) {
            if (w.isTestMode || w.debugFlags.godMode) return;
            playerH.hp -= 1;
            playerS.invulnFrames = 2.0;
        }
    });


    w.entities.forEach(e => {
        if (e === w.playerId) return;

        // NPCs are not part of the combat system for taking damage, but can be collided with by projectiles.
        const isNpc = get<NPC>(w, 'npc', e);

        const isEnemy = get<StateMachine>(w, 'state', e)?.enemyId;
        const isBoss = get<Boss>(w, 'boss', e);
        const isProjectile = get<Projectile>(w, 'projectile', e);

        // --- Contact-based Combat (Stomps & Bumps) ---
        if (isEnemy || isBoss) {
            const targetT = get<Transform>(w, 'transform', e);
            const targetH = get<Health>(w, 'health', e);
            const targetS = get<StateMachine>(w, 'state', e);
            if (!targetT || !targetH || !targetS || targetH.dead) return;

            const playerRect = { x: playerT.pos.x, y: playerT.pos.y, w: playerT.size.x, h: playerT.size.y };
            const targetRect = { x: targetT.pos.x, y: targetT.pos.y, w: targetT.size.x, h: targetT.size.y };
            
            if (aabb(playerRect, targetRect)) {
                // --- 1. Check for Player Stomp ---
                const isFallingOnTop = playerT.vel.y > 0 && (playerRect.y + playerRect.h) < (targetRect.y + targetRect.h * 0.5);
                
                const weakPointHit = isBoss
                    ? (playerRect.y + playerRect.h) < (targetRect.y + targetRect.h * 0.3) // Boss head is top 30%
                    : isFallingOnTop; // Regular enemy is stomped if falling on top half

                if (isFallingOnTop && weakPointHit && targetS.invulnFrames <= 0) {
                    targetH.hp -= 1;
                    targetS.invulnFrames = 0.5;
                    if (isBoss) handleBossDamage(w, e);

                    playerT.vel.y = -playerK.jumpForce * 0.7; // Bounce player
                    playerS.state = 'jumping';
                    // AAA FEATURE: Refresh air abilities on stomp
                    playerA.context.jumpsLeft = playerK.maxJumps;
                    playerA.context.dashCharges = playerA.context.maxDashCharges;

                    w.actions.createParticleBurst(playerT.pos.x + playerT.size.x / 2, playerRect.y + playerRect.h, 15, '#FFFFFF', 'burst');
                    if (w.visualSettings.floatingText) {
                        w.floatingTexts.push({ text: `1`, x: targetT.pos.x + targetT.size.x / 2, y: targetT.pos.y, life: 1, maxLife: 1, color: '#ffdd55', vy: -60 });
                    }

                    if (isBoss) {
                        isBoss.state = 'hurt';
                        isBoss.stateTimer = 0.3;
                        targetT.vel.x = 0;
                    }

                    if (targetH.hp <= 0) {
                        if (!isBoss) onEnemyDefeated(w, e);
                    } else if (!isBoss) {
                        targetS.state = 'stunned';
                        targetS.timers.stun = 1.0;
                    }
                    return; // Interaction for this frame is done.
                }

                // --- 2. Check for other Player Attacks (roll, dash, slam) vs non-bosses ---
                const playerIsAttacking = playerS.state === 'rolling' || playerS.state === 'dashing' || playerS.state === 'slamming';
                if (!isBoss && playerIsAttacking && targetS.invulnFrames <= 0) {
                    targetH.hp -= 1;
                    targetS.invulnFrames = 0.5;
                    const knockbackDir = Math.sign(targetT.pos.x - playerT.pos.x) || 1;
                    targetT.vel.x = knockbackDir * 200;
                    targetT.vel.y = -200;

                    if (w.visualSettings.floatingText) { w.floatingTexts.push({ text: '1', x: targetT.pos.x + targetT.size.x / 2, y: targetT.pos.y, life: 1, maxLife: 1, color: '#ffdd55', vy: -60 }); }
                    w.actions.createParticleBurst(targetT.pos.x + targetT.size.x / 2, targetT.pos.y + targetT.size.y / 2, 10, '#ff9933', 'burst');
                    
                    if (targetH.hp <= 0) {
                        onEnemyDefeated(w, e);
                    } else {
                        targetS.state = 'stunned';
                        targetS.timers.stun = 1.0;
                    }
                    return;
                }

                // --- 3. If no successful player attack, Player takes damage ---
                const canTargetDamagePlayer = isBoss ? (isBoss.state === 'roll_charge' || isBoss.state === 'pounding') : (targetS.state !== 'stunned');

                if (playerS.invulnFrames <= 0 && canTargetDamagePlayer) {
                    if (w.isTestMode || w.debugFlags.godMode) return;
                    playerH.hp -= 1;
                    playerS.invulnFrames = 2.0;
                    const knockbackDir = Math.sign(playerT.pos.x - targetT.pos.x) || 1;
                    playerT.vel.x = 200 * knockbackDir;
                    playerT.vel.y = -400;
                    if(playerS.state !== 'jumping') playerS.state = 'falling';
                    w.actions.setScreenShake(8, 0.2);
                    w.actions.createParticleBurst(playerT.pos.x + playerT.size.x / 2, playerT.pos.y + playerT.size.y / 2, 15, '#ff5555', 'burst');
                    return;
                }
            }
        }

        // --- Projectile collisions ---
        if (isProjectile && isProjectile.life > 0) {
             const projT = get<Transform>(w, 'transform', e);
             if(!projT) return;
             const projRect = {x: projT.pos.x, y: projT.pos.y, w: projT.size.x, h: projT.size.y };

             if (isProjectile.owner === w.playerId) { // Player projectile
                const allTargets = [...enemies, ...bosses, ...npcs];
                let projectileConsumed = false;

                for (const targetId of allTargets) {
                    if (projectileConsumed) break;

                    const targetT = get<Transform>(w, 'transform', targetId);
                    if (!targetT) continue;

                    const targetRect = { x: targetT.pos.x, y: targetT.pos.y, w: targetT.size.x, h: targetT.size.y };

                    if (aabb(projRect, targetRect)) {
                        // Any collision consumes the projectile.
                        isProjectile.life = 0;
                        projectileConsumed = true;

                        const isTargetNpc = npcs.includes(targetId);
                        if (isTargetNpc) {
                            // Hit an NPC, projectile just disappears. Diaper bomb will explode via statusSystem.
                            continue;
                        }

                        // It's an enemy or boss
                        const targetH = get<Health>(w, 'health', targetId);
                        const targetS = get<StateMachine>(w, 'state', targetId);
                        if (!targetH || !targetS || targetH.dead) continue;
                        
                        // Don't apply damage if target is invulnerable
                        if (targetS.invulnFrames > 0) continue;

                        const targetBoss = get<Boss>(w, 'boss', targetId);
                        const isWeakPointHit = !targetBoss || (projRect.y < targetT.pos.y + targetT.size.y * 0.3);

                        if (!isWeakPointHit) {
                            if (w.visualSettings.floatingText) w.floatingTexts.push({ text: 'clank', x: projT.pos.x, y: projT.pos.y, life: 1, maxLife: 1, color: '#aaaaaa', vy: -60 });
                            continue;
                        }

                        if (isProjectile.damage > 0) {
                            targetH.hp -= isProjectile.damage;
                            targetS.invulnFrames = 0.3;

                            if (targetBoss) {
                                targetBoss.state = 'hurt';
                                targetBoss.stateTimer = 0.3;
                                targetT.vel.x = 0;
                                handleBossDamage(w, targetId);
                            }
                            w.actions.createParticleBurst(projT.pos.x, projT.pos.y, 10, '#FFFFFF');
                            if (w.visualSettings.floatingText) {
                                w.floatingTexts.push({ text: `${isProjectile.damage}`, x: targetT.pos.x + targetT.size.x / 2, y: targetT.pos.y, life: 1, maxLife: 1, color: '#ffdd55', vy: -60 });
                            }
                            if (targetH.hp <= 0) {
                                if (!targetBoss) onEnemyDefeated(w, targetId);
                            }
                        }
                    }
                }
             } else { // Enemy/Boss projectile
                 const playerRect = {x: playerT.pos.x, y: playerT.pos.y, w: playerT.size.x, h: playerT.size.y};
                 if (aabb(projRect, playerRect)) {
                    if (playerS.invulnFrames <= 0 && !w.isTestMode && !w.debugFlags.godMode) {
                        isProjectile.life = 0;
                        playerH.hp -= 1; // Always lose one heart
                        playerS.invulnFrames = 2.0;
                    } else if (w.isTestMode || w.debugFlags.godMode) { // Projectile hits god-mode player
                        isProjectile.life = 0;
                        w.actions.createParticleBurst(projT.pos.x + projT.size.x / 2, projT.pos.y + projT.size.y / 2, 15, '#facc15', 'burst');
                    }
                 }
             }
        }
    });
}
