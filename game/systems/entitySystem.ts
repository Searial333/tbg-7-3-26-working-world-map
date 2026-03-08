
import { World } from "../../types";
import { createEntity, get, set, spawnBoss, spawnEnemyStinger, spawnBarrelCannon, spawnVine, spawnVenomProjectile } from "../ecs";
import type { Transform, Health, StateMachine, Kinematics, RendererRef, NPC, Palette } from "../components";

export const activeCollectibles = new Set<string>();
const activeEnemies = new Set<string>();
const activeNPCs = new Set<string>();
const activeBosses = new Set<string>();
const activeBarrels = new Set<string>();
const activeVines = new Set<string>();

// --- PALETTES ---
const KREMLING_PALETTES = {
    green: { // Standard
        skin_dark: '#166534', skin: '#16a34a', skin_highlight: '#4ade80',
        belly_dark: '#ca8a04', belly: '#eab308', belly_highlight: '#fde047',
        armor_dark: '#78350f', armor: '#b45309',
        eye: '#dc2626', white: '#FFFFFF', black: '#000000', mouth: '#991b1b',
    },
    red: { // Fast / Elite
        skin_dark: '#991b1b', skin: '#dc2626', skin_highlight: '#f87171',
        belly_dark: '#1e1b4b', belly: '#312e81', belly_highlight: '#4338ca',
        armor_dark: '#171717', armor: '#404040',
        eye: '#facc15', white: '#FFFFFF', black: '#000000', mouth: '#450a0a',
    },
    blue: { // Tanky
        skin_dark: '#1e3a8a', skin: '#2563eb', skin_highlight: '#60a5fa',
        belly_dark: '#064e3b', belly: '#059669', belly_highlight: '#34d399',
        armor_dark: '#4c1d95', armor: '#6d28d9',
        eye: '#fbbf24', white: '#FFFFFF', black: '#000000', mouth: '#172554',
    }
};

const KLAPTRAP_PALETTES = {
    blue: { // Standard
        body_shadow: '#1e40af', body: '#2563eb', body_highlight: '#60a5fa',
        stripe: '#facc15',
        underbelly: '#dbeafe', underbelly_shadow: '#bfdbfe',
        eye: '#ffffff', pupil: '#000000',
        tooth: '#ffffff', mouth_inside: '#4c1d95',
    },
    purple: { // Jumper
        body_shadow: '#6b21a8', body: '#9333ea', body_highlight: '#c084fc',
        stripe: '#4ade80',
        underbelly: '#f3e8ff', underbelly_shadow: '#e9d5ff',
        eye: '#ffffff', pupil: '#000000',
        tooth: '#ffffff', mouth_inside: '#3b0764',
    },
    red: { // Speed
        body_shadow: '#991b1b', body: '#dc2626', body_highlight: '#f87171',
        stripe: '#171717',
        underbelly: '#fee2e2', underbelly_shadow: '#fecaca',
        eye: '#ffffff', pupil: '#000000',
        tooth: '#ffffff', mouth_inside: '#450a0a',
    }
};

const ZINGER_PALETTES = {
    yellow: { // Standard
        abdomen: '#FACC15', stripe: '#171717',
        thorax: '#1E293B', spike: '#FEF08A',
        head: '#171717', eye: '#FFFFFF', pupil: '#000000',
        leg: '#B45309',
    },
    red: { // Aggressive / Dive
        abdomen: '#ef4444', stripe: '#450a0a',
        thorax: '#171717', spike: '#fca5a5',
        head: '#171717', eye: '#fef3c7', pupil: '#000000',
        leg: '#7f1d1d',
    }
};

const SNAKE_PALETTES = {
    green: {
        body: '#22c55e', body_shadow: '#15803d',
        belly: '#facc15', eye: '#ef4444', pupil: '#000000',
    },
    purple: {
        body: '#9333ea', body_shadow: '#6b21a8',
        belly: '#fca5a5', eye: '#facc15', pupil: '#000000',
    }
};


const BASE_KINEMATICS: Kinematics = {
    gravity: 2200,
    runSpeed: 0,
    runAcceleration: 1000,
    runFriction: 0.9,
    maxRollSpeed: 0,
    rollSpeedBoost: 0,
    rollDeceleration: 0,
    rollMinSpeed: 0,
    wallSlideSpeed: 0,
    jumpForce: 0,
    wallJumpXBoost: 0,
    wallJumpYForce: 0,
    airAcceleration: 1000,
    airFriction: 0.95,
    maxAirSpeed: 2 * 60,
    coyoteFrames: 0,
    jumpBufferFrames: 0,
    maxJumps: 0,
    dashSpeed: 0,
    dashDuration: 0,
    dashCooldown: 0,
    bottleChargeTime: 0,
    bottleLaserDuration: 0,
};


export function entitySystem(w: World) {
    // Initialize or Re-initialize level entities
    if ((w as any)._levelInitialized !== w.level.name) {
        activeCollectibles.clear();
        activeEnemies.clear();
        activeNPCs.clear();
        activeBosses.clear();
        activeBarrels.clear();
        activeVines.clear();
        
        w.level.collectibles.forEach(c => activeCollectibles.add(c.id));
        w.level.enemies.forEach(e => activeEnemies.add(e.id));
        w.level.npcs.forEach(n => activeNPCs.add(n.id));
        w.level.bossSpawns?.forEach(b => activeBosses.add(b.id));
        w.level.barrels?.forEach(b => activeBarrels.add(b.id));
        w.level.vines?.forEach(v => activeVines.add(v.id));
        
        (w as any)._levelInitialized = w.level.name;
    }
    
    // Helper to count specific entities in world
    const countEntities = (predicate: (e: number) => boolean) => {
        let count = 0;
        w.entities.forEach(e => { if (predicate(e)) count++; });
        return count;
    };

    const isEnemyInWorld = (id: string) => [...w.entities].some(eid => (get<StateMachine>(w, 'state', eid))?.enemyId === id);
    const isNPCInWorld = (id: string) => [...w.entities].some(eid => (get<NPC>(w, 'npc', eid))?.type === 'shopkeeper' || (get<NPC>(w, 'npc', eid))?.type === 'counter');
    const bossCount = countEntities(e => !!get(w, 'boss', e));
    const barrelCount = countEntities(e => !!get(w, 'barrelCannon', e));
    const vineCount = countEntities(e => !!get(w, 'vine', e));


    // Spawn Bosses if they are missing but active
    if (w.level.bossSpawns && bossCount < w.level.bossSpawns.length) {
        w.level.bossSpawns.forEach(b => {
            if (activeBosses.has(b.id)) {
                // FIXED: Passing b.type to spawnBoss ensures the correct character (DK or Diddy) is spawned
                if (bossCount === 0) spawnBoss(w, {x: b.x, y: b.y}, b.type);
            }
        });
    }

    // Spawn Barrels
    if (w.level.barrels && barrelCount < w.level.barrels.length) {
        if (barrelCount === 0) {
             w.level.barrels.forEach(b => {
                if (activeBarrels.has(b.id)) {
                    spawnBarrelCannon(w, {x: b.x, y: b.y}, b.type, b.direction, b.rotateSpeed);
                }
            });
        }
    }

    // Spawn Vines
    if (w.level.vines && vineCount < w.level.vines.length) {
        if (vineCount === 0) {
            w.level.vines.forEach(v => {
                if (activeVines.has(v.id)) {
                    spawnVine(w, {x: v.x, y: v.y}, v.length);
                }
            });
        }
    }


    // Spawn new NPCs
    w.level.npcs.forEach(n => {
        if (activeNPCs.has(n.id) && !isNPCInWorld(n.id)) {
            if (n.type === 'shopkeeper') {
                const npcId = createEntity(w);
                set<Transform>(w, 'transform', npcId, { pos: { x: n.x, y: n.y }, vel: { x: 0, y: 0 }, size: { x: 280, y: 280 }, facing: -1, onGround: true, onWall: 0, groundY: -1, onLadder: false, lastCheckpoint: {x:0, y:0}, zIndex: 599 });
                set<NPC>(w, 'npc', npcId, { type: 'shopkeeper', interactionState: 'idle' });
                set<StateMachine>(w, 'state', npcId, { state: 'idle', animTime: 0, invulnFrames: 0, respawnFrames: 0, timers: {} });
                set<RendererRef>(w, 'renderer', npcId, { painterId: 'npc:shopkeeper' });
            } else if (n.type === 'counter') {
                const counterId = createEntity(w);
                set<Transform>(w, 'transform', counterId, { pos: { x: n.x, y: n.y }, vel: {x:0, y:0}, size: { x: 640, y: 165 }, facing: 1, onGround: true, onWall: 0, groundY: -1, onLadder: false, lastCheckpoint: {x:0, y:0}, zIndex: 599.5 });
                set<NPC>(w, 'npc', counterId, { type: 'counter', interactionState: 'idle'});
                set<StateMachine>(w, 'state', counterId, { state: 'idle', animTime: 0, invulnFrames: 0, respawnFrames: 0, timers: {} });
                set<RendererRef>(w, 'renderer', counterId, { painterId: 'scenery:counter' });
            }
        }
    });


    // Spawn new enemies
    w.level.enemies.forEach(e => {
        if (activeEnemies.has(e.id) && !isEnemyInWorld(e.id)) {
            const enemyId = createEntity(w);

            if (e.type === 'flyer') { // Zinger
                const v = e.variant as 'yellow' | 'red' || 'yellow';
                const palette = ZINGER_PALETTES[v];
                const runSpeed = v === 'red' ? 180 : 120; // Red is faster
                
                set<Transform>(w, 'transform', enemyId, { pos: { x: e.x, y: e.y }, vel: { x: 0, y: 0 }, size: { x: 56, y: 48 }, facing: -1, onGround: false, onWall: 0, groundY: -1, onLadder: false, lastCheckpoint: {x:0,y:0} });
                set<Health>(w, 'health', enemyId, { hp: 2, maxHp: 2, dead: false });
                set<StateMachine>(w, 'state', enemyId, { state: 'hover', animTime: 0, invulnFrames: 0, respawnFrames: 0, timers: { attackCooldown: 0 }, enemyId: e.id, variant: v });
                set<Kinematics>(w, 'kinematics', enemyId, { ...BASE_KINEMATICS, gravity: 0, runSpeed: runSpeed, runAcceleration: 500 });
                set<RendererRef>(w, 'renderer', enemyId, { painterId: 'enemy:flyer' });
                set<Palette>(w, 'palette', enemyId, palette);

            } else if (e.type === 'klaptrap') {
                const v = e.variant as 'blue' | 'purple' | 'red' || 'blue';
                const palette = KLAPTRAP_PALETTES[v];
                let runSpeed = 90;
                let size = { x: 64, y: 64 };
                if (v === 'red') { runSpeed = 160; size = {x: 48, y: 48}; } // Red is small and fast
                if (v === 'purple') { runSpeed = 80; } // Purple jumps, moves slower

                set<Transform>(w, 'transform', enemyId, { pos: { x: e.x, y: e.y }, vel: { x: -runSpeed, y: 0 }, size: size, facing: -1, onGround: false, onWall: 0, groundY: -1, onLadder: false, lastCheckpoint: {x:0,y:0} });
                set<Health>(w, 'health', enemyId, { hp: 1, maxHp: 1, dead: false });
                set<StateMachine>(w, 'state', enemyId, { state: 'patrol', animTime: 0, invulnFrames: 0, respawnFrames: 0, timers: {}, enemyId: e.id, patrolBounds: e.patrolBounds, variant: v });
                set<Kinematics>(w, 'kinematics', enemyId, { ...BASE_KINEMATICS, runSpeed });
                set<RendererRef>(w, 'renderer', enemyId, { painterId: 'enemy:klaptrap' });
                set<Palette>(w, 'palette', enemyId, palette);

            } else if (e.type === 'snake') {
                const v = e.variant as 'green' | 'purple' || 'green';
                const palette = SNAKE_PALETTES[v];
                
                set<Transform>(w, 'transform', enemyId, { pos: { x: e.x, y: e.y }, vel: { x: 0, y: 0 }, size: { x: 80, y: 80 }, facing: -1, onGround: false, onWall: 0, groundY: -1, onLadder: false, lastCheckpoint: {x:0,y:0} });
                set<Health>(w, 'health', enemyId, { hp: 2, maxHp: 2, dead: false });
                set<StateMachine>(w, 'state', enemyId, { state: 'idle', animTime: 0, invulnFrames: 0, respawnFrames: 0, timers: { spitCooldown: 0 }, enemyId: e.id, variant: v });
                set<Kinematics>(w, 'kinematics', enemyId, { ...BASE_KINEMATICS, gravity: 2200 }); // Stationary
                set<RendererRef>(w, 'renderer', enemyId, { painterId: 'enemy:snake' });
                set<Palette>(w, 'palette', enemyId, palette);

            } else { // Kremling (Patrol)
                const v = e.variant as 'green' | 'red' | 'blue' || 'green';
                const palette = KREMLING_PALETTES[v];
                let runSpeed = 70;
                let hp = 3;
                let size = { x: 96, y: 112 };

                if (v === 'red') { runSpeed = 130; hp = 1; } // Glass cannon
                if (v === 'blue') { runSpeed = 40; hp = 5; size = {x: 120, y: 140}; } // Tank

                set<Transform>(w, 'transform', enemyId, { pos: { x: e.x, y: e.y }, vel: { x: -runSpeed, y: 0 }, size: size, facing: -1, onGround: false, onWall: 0, groundY: -1, onLadder: false, lastCheckpoint: {x:0,y:0} });
                set<Health>(w, 'health', enemyId, { hp: hp, maxHp: hp, dead: false });
                set<StateMachine>(w, 'state', enemyId, { state: 'patrol', animTime: 0, invulnFrames: 0, respawnFrames: 0, timers: { chargeCooldown: 0 }, enemyId: e.id, patrolBounds: e.patrolBounds, variant: v });
                set<Kinematics>(w, 'kinematics', enemyId, { ...BASE_KINEMATICS, runSpeed });
                set<RendererRef>(w, 'renderer', enemyId, { painterId: 'enemy:patrol' });
                set<Palette>(w, 'palette', enemyId, palette);
            }
        }
    });

    const playerT = get<Transform>(w, 'transform', w.playerId);
    const playerS = get<StateMachine>(w, 'state', w.playerId);

    // Update enemies
    w.entities.forEach(e => {
        const s = get<StateMachine>(w, 'state', e);
        if (!s || !s.enemyId) return; // Not an enemy

        // Decrement all active timers
        Object.keys(s.timers).forEach(timer => {
            if (s.timers[timer] > 0) s.timers[timer] -= w.dt;
        });

        const spawnData = w.level.enemies.find(es => es.id === s.enemyId);
        if (!spawnData) return;

        const t = get<Transform>(w, 'transform', e);
        const h = get<Health>(w, 'health', e);
        const k = get<Kinematics>(w, 'kinematics', e);

        if (!t || !h || !k || h.dead) {
            if(t && h?.dead) t.vel.x = 0;
            return;
        }

        const canSeePlayer = playerT && playerS?.state !== 'dying';
        const distToPlayer = canSeePlayer ? Math.hypot(playerT.pos.x - t.pos.x, playerT.pos.y - t.pos.y) : Infinity;

        // --- SNAKE AI ---
        if (spawnData.type === 'snake') {
            const DETECTION_RANGE = 400;
            const ATTACK_COOLDOWN = s.variant === 'purple' ? 1.5 : 3.0; // Purple fires faster
            const ANTICIPATION_TIME = 0.5;
            const SPIT_TIME = 0.3;

            // Always face player if tracking
            if (canSeePlayer && distToPlayer < DETECTION_RANGE + 100) {
                t.facing = playerT.pos.x > t.pos.x ? 1 : -1;
            }

            if (s.state === 'idle') {
                if (canSeePlayer && distToPlayer < DETECTION_RANGE && s.timers.spitCooldown <= 0) {
                    s.state = 'anticipation';
                    s.timers.anticipation = ANTICIPATION_TIME;
                    s.animTime = 0;
                }
            } else if (s.state === 'anticipation') {
                if (s.timers.anticipation <= 0) {
                    s.state = 'spitting';
                    s.timers.spitting = SPIT_TIME;
                    s.animTime = 0;
                    if (playerT) {
                        spawnVenomProjectile(w, e, { x: playerT.pos.x + playerT.size.x/2, y: playerT.pos.y + playerT.size.y/2 });
                    }
                    s.timers.spitCooldown = ATTACK_COOLDOWN;
                }
            } else if (s.state === 'spitting') {
                if (s.timers.spitting <= 0) {
                    s.state = 'idle';
                    s.animTime = 0;
                }
            }

        // --- ZINGER AI ---
        } else if (spawnData.type === 'flyer') {
            const DETECTION_RANGE = 400;
            const ATTACK_RANGE = 250;
            const ATTACK_COOLDOWN = 2.0;
            const ANTICIPATION_TIME = 0.5;
            const SHOOT_TIME = 0.2;

            const canAttack = s.timers.attackCooldown <= 0;
            const isActionable = !['shooting_anticipation', 'shooting'].includes(s.state);

            // Movement Logic
            if (s.state === 'hover') {
                const hoverCenterY = spawnData.y;
                const targetY = hoverCenterY + Math.sin(w.time * 2) * 20;
                t.vel.y = (targetY - t.pos.y) * 0.5;
                t.vel.x *= 0.9;
            } else if (s.state === 'chase' && playerT) {
                const dx = (playerT.pos.x + playerT.size.x / 2) - (t.pos.x + t.size.x / 2);
                const chaseSpeed = k.runSpeed;
                const dy = (playerT.pos.y + playerT.size.y / 2) - (t.pos.y + t.size.y / 2);
                const dist = Math.hypot(dx, dy) || 1;
                
                const targetVelX = (dx / dist) * chaseSpeed;
                const targetVelY = (dy / dist) * chaseSpeed;
                
                t.vel.x += (targetVelX - t.vel.x) * 0.1;
                t.vel.y += (targetVelY - t.vel.y) * 0.1;
                
                if (Math.abs(dx) > 5) t.facing = dx > 0 ? 1 : -1;
            }

            // State Logic
            if (isActionable) {
                if (distToPlayer < ATTACK_RANGE && canAttack) {
                    s.state = 'shooting_anticipation';
                    s.timers.anticipation = ANTICIPATION_TIME;
                    t.vel.x = 0; t.vel.y = 0;
                } else if (distToPlayer < DETECTION_RANGE) {
                    s.state = 'chase';
                } else {
                    s.state = 'hover';
                }
            }
            
            if (s.state === 'shooting_anticipation' && s.timers.anticipation <= 0) {
                s.state = 'shooting';
                s.timers.shooting = SHOOT_TIME;
                
                if(playerT) {
                    if (s.variant === 'red') {
                        // Dive Bomb behavior instead of shooting
                        s.state = 'chase'; // Skip shooting state
                        const dx = playerT.pos.x - t.pos.x;
                        const dy = playerT.pos.y - t.pos.y;
                        const dist = Math.hypot(dx, dy) || 1;
                        t.vel.x = (dx/dist) * 400; // Fast lunge
                        t.vel.y = (dy/dist) * 400;
                    } else {
                        // Standard shoot
                        spawnEnemyStinger(w, e, { x: playerT.pos.x + playerT.size.x/2, y: playerT.pos.y + playerT.size.y/2 });
                    }
                }
                s.timers.attackCooldown = ATTACK_COOLDOWN;
            } else if (s.state === 'shooting' && s.timers.shooting <= 0) {
                s.state = 'chase';
            }

        // --- GROUND ENEMIES (Klaptrap) ---
        } else if (spawnData.type === 'klaptrap') {
            
            // Purple Klaptrap Jumping Logic
            if (s.variant === 'purple' && t.onGround) {
                if (distToPlayer < 200 && Math.random() < 0.05) {
                    t.vel.y = -600; // Hop
                    t.vel.x = (playerT ? Math.sign(playerT.pos.x - t.pos.x) : t.facing) * 150;
                }
            }

            // Basic ground patrol logic
            if (s.state === 'patrol') {
                if (s.patrolBounds) {
                    if (t.pos.x <= s.patrolBounds.left) t.facing = 1;
                    if (t.pos.x + t.size.x >= s.patrolBounds.right) t.facing = -1;
                } else if (t.onWall !== 0) {
                    t.facing = t.onWall === 1 ? -1 : 1;
                }
                t.vel.x = k.runSpeed * t.facing;
            }

        // --- KREMLING AI ---
        } else { 
            const DETECTION_RANGE = s.variant === 'blue' ? 150 : 300; // Blue has poor vision
            const CHARGE_RANGE = 200;
            const CHARGE_COOLDOWN = 3.0;
            const ANTICIPATION_TIME = 0.7;
            const CHARGE_TIME = 0.5;

            const canCharge = s.timers.chargeCooldown <= 0;
            const isActionable = !['charge_anticipation', 'charging', 'stunned'].includes(s.state);

            if (isActionable) {
                // Blue Kremlings don't charge, they just patrol/chase slowly
                if (s.variant === 'blue') {
                     if (canSeePlayer && distToPlayer < DETECTION_RANGE) {
                        s.state = 'chase';
                    } else {
                        s.state = 'patrol';
                    }
                } 
                // Green/Red logic
                else {
                    if (canSeePlayer && distToPlayer < CHARGE_RANGE && canCharge && t.onGround) {
                        s.state = 'charge_anticipation';
                        s.timers.anticipation = ANTICIPATION_TIME;
                        t.vel.x = 0;
                    } else if (canSeePlayer && distToPlayer < DETECTION_RANGE && Math.abs(playerT.pos.y - t.pos.y) < 120) {
                        s.state = 'chase';
                    } else {
                        s.state = 'patrol';
                    }
                }
            }

            // State Logic
            if (s.state === 'charge_anticipation' && s.timers.anticipation <= 0) {
                s.state = 'charging';
                s.timers.charging = CHARGE_TIME;
                t.vel.x = k.runSpeed * 3.5 * t.facing; // High speed charge
            } else if (s.state === 'charging' && (s.timers.charging <= 0 || t.onWall !== 0)) {
                s.state = 'patrol';
                t.vel.x = 0;
                s.timers.chargeCooldown = CHARGE_COOLDOWN;
            }

            // Movement Logic
            if (s.state === 'chase' && playerT) {
                t.facing = playerT.pos.x > t.pos.x ? 1 : -1;
                const mult = s.variant === 'blue' ? 1.0 : 1.8;
                t.vel.x = k.runSpeed * mult * t.facing;
            } else if (s.state === 'patrol') {
                if (s.patrolBounds) {
                    if (t.pos.x <= s.patrolBounds.left) t.facing = 1;
                    if (t.pos.x + t.size.x >= s.patrolBounds.right) t.facing = -1;
                } else if (t.onWall !== 0) {
                    t.facing = t.onWall === 1 ? -1 : 1;
                }
                t.vel.x = k.runSpeed * t.facing;
            }
        }
    });

     // Check for collected items
     if (playerT) {
        w.level.collectibles.forEach(c => {
            if (!activeCollectibles.has(c.id)) return;
            const dist = Math.hypot((c.x + 14) - (playerT.pos.x + playerT.size.x/2), (c.y + 14) - (playerT.pos.y + playerT.size.y/2));
            if (dist < 40) {
                activeCollectibles.delete(c.id);
                w.actions.collectCoin();
                w.actions.createParticleBurst(c.x + 14, c.y + 14, 15, '#FFD700', 'burst', { sizeMultiplier: 1.5 });
            }
        });
     }
}
