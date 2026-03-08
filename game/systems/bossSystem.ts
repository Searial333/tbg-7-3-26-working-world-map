
import type { World } from '../../types';
import { get, set, spawnCoconutProjectile, spawnBarrelProjectile, spawnBananaProjectile, spawnPeanutProjectile } from '../ecs';
import type { Transform, StateMachine, Health, Kinematics, Boss } from '../components';

const DIDDY_DIALOGUE = [
    { speaker: "DIDDY KONG", text: "Hey! You shouldn't be here, little bear!" },
    { speaker: "TEDDY", text: "I'm just looking for some honey... and maybe those shiny gems." },
    { speaker: "DIDDY KONG", text: "Shiny gems? Those belong to the Kong family! Prepare to get Peanut-Popped!" }
];

const DK_DIALOGUE = [
    { speaker: "DONKEY KONG", text: "ROOOOOAAARRR!" },
    { speaker: "TEDDY", text: "Whoa! That's a big monkey." },
    { speaker: "DONKEY KONG", text: "I AM THE KING! NO BEARS ALLOWED IN THE TREEHOUSE!" }
];

export function bossSystem(w: World) {
    w.entities.forEach(e => {
        const boss = get<Boss>(w, 'boss', e);
        if (!boss) return;

        const t = get<Transform>(w, 'transform', e);
        const s = get<StateMachine>(w, 'state', e);
        const h = get<Health>(w, 'health', e);
        const k = get<Kinematics>(w, 'kinematics', e);
        if (!t || !s || !h || !k || h.dead) return;
        
        const playerT = get<Transform>(w, 'transform', w.playerId);

        // Face the player
        const lockedStates = ['charging', 'pounding', 'hurt', 'dying', 'intro', 'roll_charge', 'monkey_flip'];
        if (playerT && !lockedStates.includes(boss.state)) {
            t.facing = (playerT.pos.x > t.pos.x) ? 1 : -1;
        }

        if (boss.state !== 'intro') {
            boss.stateTimer -= w.dt;
        }

        if (w.targetIndicator) {
            w.targetIndicator.life -= w.dt;
            if (w.targetIndicator.life <= 0) w.targetIndicator = null;
        }

        // Phase Check
        const healthPercent = h.hp / h.maxHp;
        let currentPhase: 1 | 2 | 3 = 1;
        if (healthPercent < 0.75) currentPhase = 2;
        if (healthPercent < 0.40) currentPhase = 3;
        if (boss.phase !== currentPhase) {
            boss.phase = currentPhase;
            w.actions.setScreenShake(10, 0.3);
            w.actions.createParticleBurst(t.pos.x + t.size.x/2, t.pos.y + t.size.y/2, 30, '#fff', 'ring');
        }
        
        // --- BOSS LOGIC ---
        if (boss.state === 'intro') {
            // Cinematic Intro Sequence
            if (t.pos.y < t.groundY - t.size.y) {
                t.vel.y += k.gravity * w.dt;
                t.pos.y += t.vel.y * w.dt;
            } else {
                if (!boss.didAction) {
                    // Landing effect
                    t.pos.y = t.groundY - t.size.y;
                    t.vel.y = 0;
                    w.actions.setScreenShake(25, 0.5);
                    w.actions.createParticleBurst(t.pos.x + t.size.x/2, t.pos.y + t.size.y, 40, '#8B4513', 'dust', { sizeMultiplier: 2 });
                    boss.didAction = true;
                    boss.stateTimer = 0; // Move to dialogue
                    w.status = 'cinematic';
                }

                // Dialogue Progression
                const lines = boss.type === 'diddy' ? DIDDY_DIALOGUE : DK_DIALOGUE;
                const dialogueIndex = Math.floor(boss.stateTimer);
                
                if (dialogueIndex < lines.length) {
                    const currentLine = lines[dialogueIndex];
                    w.actions.onStateUpdate({ status: 'cinematic', dialogue: currentLine });
                    
                    // Use a timer logic or wait for input (simplified for now to timer)
                    boss.stateTimer += w.dt * 0.4; // Advance lines every ~2.5s
                } else {
                    // End Intro
                    w.status = 'playing';
                    w.actions.onStateUpdate({ status: 'playing', dialogue: null });
                    boss.state = 'idle';
                    boss.didAction = false;
                    boss.stateTimer = 0;
                    boss.patternCooldown = 1.0;
                }
            }
            return;
        }

        if (boss.type === 'diddy') {
            // --- DIDDY KONG AI ---
            const margin = 120;
            if (t.pos.x < w.level.bounds.left + margin) {
                t.pos.x = w.level.bounds.left + margin;
                if (t.vel.x < 0) t.vel.x *= -0.5;
            }
            if (t.pos.x + t.size.x > w.level.bounds.right - margin) {
                t.pos.x = w.level.bounds.right - margin - t.size.x;
                if (t.vel.x > 0) t.vel.x *= -0.5;
            }

            switch (boss.state) {
                case 'idle':
                    t.vel.x *= 0.8;
                    boss.patternCooldown -= w.dt;
                    if (t.onGround) boss.jetpackFuel = Math.min(1.0, (boss.jetpackFuel ?? 0) + w.dt * 0.5);
                    
                    if (boss.patternCooldown <= 0 && playerT) {
                        const distToPlayer = Math.hypot((playerT.pos.x + playerT.size.x / 2) - (t.pos.x + t.size.x / 2), (playerT.pos.y + playerT.size.y / 2) - (t.pos.y + t.size.y / 2));
                        let nextAttack = 'peanut_shot';

                        if (distToPlayer < 250) {
                            nextAttack = 'monkey_flip'; 
                        } else if (boss.jetpackFuel && boss.jetpackFuel > 0.8 && Math.random() < 0.4) {
                            nextAttack = 'jetpack_hover';
                        } else {
                            nextAttack = 'peanut_shot';
                        }

                        boss.state = nextAttack as any;
                        s.animTime = 0;
                        boss.didAction = false;

                        if (nextAttack === 'peanut_shot') {
                            boss.stateTimer = 2.0;
                            boss.shotsLeft = boss.phase + 2; 
                        } else if (nextAttack === 'jetpack_hover') {
                            boss.stateTimer = 4.0;
                            t.vel.y = -1200; 
                        } else if (nextAttack === 'monkey_flip') {
                            boss.stateTimer = 1.2;
                            t.vel.y = -k.jumpForce * 1.4;
                            t.vel.x = k.runSpeed * 2.8 * (playerT.pos.x > t.pos.x ? 1 : -1);
                        }
                    }
                    break;
                
                case 'peanut_shot':
                    t.vel.x = 0;
                    if (boss.shotsLeft && boss.shotsLeft > 0 && s.animTime > 0.4) {
                        if (playerT) {
                            const pX = playerT.pos.x + playerT.size.x/2;
                            const pY = playerT.pos.y + playerT.size.y/2;
                            spawnPeanutProjectile(w, e, { x: pX, y: pY });
                            if (boss.phase >= 2) spawnPeanutProjectile(w, e, { x: pX, y: pY - 80 });
                            if (boss.phase >= 3) spawnPeanutProjectile(w, e, { x: pX, y: pY + 80 });
                        }
                        boss.shotsLeft--;
                        s.animTime = 0; 
                    }
                    if (boss.stateTimer <= 0 || (boss.shotsLeft ?? 0) <= 0) {
                        boss.state = 'idle';
                        boss.patternCooldown = 1.5 - (boss.phase * 0.2);
                    }
                    break;

                case 'jetpack_hover':
                    boss.jetpackFuel = Math.max(0, (boss.jetpackFuel ?? 1.0) - w.dt * 0.3);
                    t.vel.y += -k.gravity * w.dt; 
                    t.vel.y *= 0.92; 
                    if (playerT) {
                        const dx = (playerT.pos.x + playerT.size.x/2) - (t.pos.x + t.size.x/2);
                        t.vel.x += Math.sign(dx) * 80;
                        if (Math.abs(t.vel.x) > 600) t.vel.x = Math.sign(t.vel.x) * 600;
                    }
                    if (Math.floor(w.time * 6) % 6 === 0 && !boss.didAction) {
                        spawnPeanutProjectile(w, e, { x: t.pos.x + t.size.x/2, y: t.pos.y + 1000 });
                        boss.didAction = true;
                    } else if (Math.floor(w.time * 6) % 6 !== 0) {
                        boss.didAction = false;
                    }
                    if (boss.stateTimer <= 0 || (boss.jetpackFuel ?? 0) <= 0 || t.onGround) {
                        boss.state = 'idle';
                        boss.patternCooldown = 1.5;
                    }
                    break;

                case 'monkey_flip':
                    t.rotation = (t.rotation ?? 0) + 900 * w.dt;
                    if (t.onGround && s.animTime > 0.3) {
                        boss.state = 'idle';
                        t.rotation = 0;
                        t.vel.x = 0;
                        boss.patternCooldown = 0.8;
                        w.actions.setScreenShake(15, 0.25);
                        w.actions.createParticleBurst(t.pos.x + t.size.x/2, t.pos.y + t.size.y, 25, '#8D6E63', 'dust');
                    }
                    break;

                case 'hurt':
                    t.vel.x *= 0.8;
                    t.rotation = 0;
                    if (boss.stateTimer <= 0) {
                        boss.state = 'idle';
                        boss.patternCooldown = 1.2;
                    }
                    break;

                case 'dying':
                    t.vel.x = 0;
                    t.rotation = (t.rotation ?? 0) + 180 * w.dt;
                    if (Math.random() < 0.3) {
                        const rx = t.pos.x + Math.random()*t.size.x;
                        const ry = t.pos.y + Math.random()*t.size.y;
                        w.actions.createParticleBurst(rx, ry, 8, '#fff', 'burst');
                    }
                    if (boss.stateTimer <= 0) {
                        h.dead = true;
                        w.status = 'bossDefeated';
                        if (w.level.finishZone) {
                            w.level.finishZone.x = t.pos.x + t.size.x/2 - w.level.finishZone.w/2;
                            w.level.finishZone.y = t.pos.y + t.size.y - w.level.finishZone.h;
                            delete w.level.finishZone.initiallyHidden;
                            w.actions.createParticleBurst(t.pos.x + t.size.x/2, t.pos.y + t.size.y/2, 60, '#fbbf24', 'ring', { sizeMultiplier: 2.5 });
                            w.actions.setScreenShake(20, 0.5);
                            w.shockwaves.push({ x: t.pos.x + t.size.x/2, y: t.pos.y + t.size.y, radius: 0, maxRadius: 300, life: 1.0, maxLife: 1.0, height: 15 });
                        }
                    }
                    break;
            }
        } else {
            // --- DK AI ---
            switch (boss.state) {
                case 'idle':
                    t.vel.x *= 0.9;
                    boss.patternCooldown -= w.dt;
                    if (boss.patternCooldown <= 0 && t.onGround && playerT) {
                        const distToPlayer = Math.abs((playerT.pos.x + playerT.size.x / 2) - (t.pos.x + t.size.x / 2));
                        let nextAttack = '';
                        const rand = Math.random();
                        if (distToPlayer < 300 && boss.phase > 1 && rand < 0.4) nextAttack = 'roll_charge';
                        else if (distToPlayer > 500 && rand < 0.5) nextAttack = 'jumping';
                        else {
                            if (boss.phase > 1 && rand < 0.3) nextAttack = 'banana_throw';
                            else if (boss.phase > 2 && rand < 0.6) nextAttack = 'coconut_toss';
                            else nextAttack = 'barrel_throw';
                        }
                        boss.state = nextAttack as any;
                        s.animTime = 0; boss.didAction = false;
                        if (nextAttack === 'jumping') {
                            t.vel.y = -k.jumpForce; boss.stateTimer = 3.0;
                            const targetX = playerT.pos.x + (Math.random() - 0.5) * 200;
                            t.vel.x = (targetX - t.pos.x) * 0.8;
                            w.targetIndicator = { x: targetX, y: t.groundY, radius: 80, life: 2.0 };
                        }
                        if (nextAttack === 'coconut_toss') { boss.stateTimer = 2.0; boss.shotsLeft = boss.phase; }
                        if (nextAttack === 'roll_charge') boss.stateTimer = 2.5;
                        if (nextAttack === 'barrel_throw') boss.stateTimer = 1.2;
                        if (nextAttack === 'banana_throw') { boss.stateTimer = 1.8; boss.shotsLeft = 3 + boss.phase; }
                    }
                    break;
                case 'jumping':
                    if (t.vel.y > 0 && boss.phase > 2) boss.state = 'pounding_anticipation';
                    if (t.onGround) { boss.state = 'idle'; boss.patternCooldown = 1.0; }
                    break;
                case 'pounding_anticipation':
                    if(w.targetIndicator) t.vel.x = (w.targetIndicator.x - (t.pos.x + t.size.x/2)) * 2.0;
                    if (t.onGround) {
                        boss.state = 'pounding'; s.animTime = 0; boss.stateTimer = 0.5;
                        w.actions.setScreenShake(15, 0.5);
                        w.shockwaves.push({ x: t.pos.x + t.size.x/2, y: t.pos.y + t.size.y, radius: 0, maxRadius: w.level.bounds.right, life: 1.0, maxLife: 1.0, height: 20 });
                        w.targetIndicator = null;
                    }
                    break;
                case 'pounding':
                    t.vel.x = 0;
                    if (boss.stateTimer <= 0) { boss.state = 'idle'; boss.patternCooldown = 2.0; }
                    break;
                case 'roll_charge':
                    t.vel.x = k.runSpeed * (2.0 + boss.phase * 0.5) * t.facing;
                    if ((t.facing > 0 && t.pos.x > w.level.bounds.right - t.size.x) || (t.facing < 0 && t.pos.x < w.level.bounds.left) || t.onWall !== 0) {
                        t.vel.x = 0; boss.stateTimer = 0;
                    }
                    if (boss.stateTimer <= 0) { boss.state = 'idle'; boss.patternCooldown = 2.5; }
                    break;
                case 'barrel_throw':
                    if (s.animTime > 0.7 && !boss.didAction) { spawnBarrelProjectile(w, e, true); boss.didAction = true; }
                    if (boss.stateTimer <= 0) { boss.state = 'idle'; boss.patternCooldown = 2.0 - (boss.phase * 0.5); }
                    break;
                case 'banana_throw':
                    if (boss.shotsLeft && boss.shotsLeft > 0 && s.animTime > 0.3) { spawnBananaProjectile(w, e); boss.shotsLeft--; s.animTime = 0; }
                    if (boss.stateTimer <= 0 || (boss.shotsLeft ?? 0) <= 0) { boss.state = 'idle'; boss.patternCooldown = 2.5; }
                    break;
                case 'coconut_toss':
                    if (boss.shotsLeft && boss.shotsLeft > 0 && !boss.didAction && s.animTime > 0.5) {
                        spawnCoconutProjectile(w, e); boss.shotsLeft--; boss.didAction = true; s.animTime = 0.2;
                    } else if (s.animTime > 0.2) boss.didAction = false;
                    if (boss.stateTimer <= 0 || (boss.shotsLeft ?? 0) <= 0) { boss.state = 'idle'; boss.patternCooldown = 2.0; }
                    break;
                case 'hurt':
                    t.vel.x *= 0.8;
                    if (boss.stateTimer <= 0) { boss.state = 'idle'; boss.patternCooldown = 1.0; }
                    break;
                case 'dying':
                    t.vel.x = 0; t.vel.y = 0;
                    if (Math.random() < 0.5) {
                        const x = t.pos.x + Math.random() * t.size.x;
                        const y = t.pos.y + Math.random() * t.size.y;
                        w.actions.createParticleBurst(x, y, 30, '#FFA500', 'burst', { sizeMultiplier: 3 });
                        w.actions.setScreenShake(10, 0.2);
                    }
                    if (boss.stateTimer <= 0) {
                        h.dead = true;
                        w.status = 'bossDefeated';
                        if (w.level.finishZone) {
                            w.level.finishZone.x = t.pos.x + t.size.x/2 - w.level.finishZone.w/2;
                            w.level.finishZone.y = t.pos.y + t.size.y - w.level.finishZone.h;
                            delete w.level.finishZone.initiallyHidden;
                            w.actions.createParticleBurst(t.pos.x + t.size.x/2, t.pos.y + t.size.y/2, 120, '#fbbf24', 'ring', { sizeMultiplier: 4 });
                            w.actions.setScreenShake(40, 1.0);
                            w.shockwaves.push({ x: t.pos.x + t.size.x/2, y: t.pos.y + t.size.y, radius: 0, maxRadius: 600, life: 1.5, maxLife: 1.5, height: 25 });
                        }
                    }
                    break;
            }
        }
    });
}
