
import type { World } from '../../types';
import { get } from '../ecs';
import type { Transform, StateMachine, Abilities, Health, Kinematics, Projectile, BarrelCannon, Vine } from '../components';

function aabb(r1: any, r2: any) {
  return r1.x < r2.x + r2.w && r1.x + r1.w > r2.x && r1.y < r2.y + r2.h && r1.y + r1.h > r2.y;
}

export function collisionSystem(w: World) {
    w.entities.forEach(e => {
        const t = get<Transform>(w, 'transform', e);
        const s = get<StateMachine>(w, 'state', e);
        const p = get<Projectile>(w, 'projectile', e);
        
        if (!t || (s && s.state === 'dying')) return;

        const a = get<Abilities>(w, 'abilities', e);
        const k = get<Kinematics>(w, 'kinematics', e);
        const h = get<Health>(w, 'health', e);

        const wasOnGround = t.onGround;
        t.onGround = false;
        t.onWall = 0;
        t.onLadder = false;
        t.groundSlope = 0;
        if(a) a.context.onOnewayPlatform = false;

        // --- Barrel Cannon Interaction (Player Only) ---
        if (e === w.playerId && s && s.state !== 'barrel_idle' && s.state !== 'barrel_blast') {
            for (const bId of w.entities) {
                const barrel = get<BarrelCannon>(w, 'barrelCannon', bId);
                const bT = get<Transform>(w, 'transform', bId);
                if (barrel && bT && barrel.cooldown <= 0) {
                    const playerRect = { x: t.pos.x, y: t.pos.y, w: t.size.x, h: t.size.y };
                    const barrelRect = { x: bT.pos.x + 10, y: bT.pos.y + 10, w: bT.size.x - 20, h: bT.size.y - 20 };
                    
                    if (aabb(playerRect, barrelRect)) {
                        s.state = 'barrel_idle';
                        s.attachedToId = bId;
                        s.animTime = 0;
                        t.pos.x = bT.pos.x + bT.size.x/2 - t.size.x/2;
                        t.pos.y = bT.pos.y + bT.size.y/2 - t.size.y/2;
                        t.vel.x = 0;
                        t.vel.y = 0;
                        return;
                    }
                }
            }
        }

        // --- Vine Interaction (Player Only) ---
        if (e === w.playerId && s && s.state !== 'vine_swing' && s.state !== 'barrel_blast' && s.state !== 'barrel_idle') {
             for (const vId of w.entities) {
                const vine = get<Vine>(w, 'vine', vId);
                const vT = get<Transform>(w, 'transform', vId);
                if (vine && vT) {
                    const playerCenter = { x: t.pos.x + t.size.x/2, y: t.pos.y + t.size.y/2 };
                    const anchor = vT.pos;
                    const dx = playerCenter.x - anchor.x;
                    const dy = playerCenter.y - anchor.y;
                    const distSq = dx*dx + dy*dy;
                    
                    if (distSq < (vine.length * vine.length) && dy > 0 && dy < vine.length + 20 && Math.abs(dx) < 30) {
                        s.state = 'vine_swing';
                        s.attachedToId = vId;
                        s.animTime = 0;
                        return;
                    }
                }
             }
        }


        // --- Platform Collisions ---
        w.level.platforms.forEach(plat => {
            const entityRect = { x: t.pos.x, y: t.pos.y, w: t.size.x, h: t.size.y };
            const platformRect = { x: plat.x, y: plat.y, w: plat.w, h: plat.h };

            if (!aabb(entityRect, platformRect)) {
                return;
            }

            // --- RAMP LOGIC ---
            if (plat.type === 'ramp_down' || plat.type === 'ramp_up') {
                const entityCenterX = entityRect.x + entityRect.w / 2;
                if (entityCenterX >= plat.x && entityCenterX <= plat.x + plat.w) {
                    const slope = (plat.type === 'ramp_down' ? plat.h : -plat.h) / plat.w;
                    const startY = plat.type === 'ramp_down' ? plat.y : plat.y + plat.h;
                    const rampSurfaceY = startY + (entityCenterX - plat.x) * slope;

                    if (t.vel.y >= 0 && entityRect.y + entityRect.h >= rampSurfaceY - 10 && entityRect.y < rampSurfaceY + t.size.y) {
                         t.pos.y = rampSurfaceY - entityRect.h;
                         if(t.vel.y > 0) t.vel.y = 0;
                         t.onGround = true;
                         t.groundSlope = slope;
                         
                        if (!wasOnGround && k && e === w.playerId) {
                             if(a) {
                                a.context.coyote = k.coyoteFrames / 60.0;
                                a.context.jumpsLeft = k.maxJumps;
                                a.context.dashCharges = a.context.maxDashCharges;
                             }
                             if(s) s.timers.landSquash = 8 / 60.0;
                         }
                    }
                }
                return;
            }

            // --- STANDARD COLLISION RESOLUTION ---
            
            // Check previous position to determine collision side
            const prevY = t.pos.y - t.vel.y * w.dt;
            const prevX = t.pos.x - t.vel.x * w.dt;
            
            let resolved = false;

            // 1. Landing on Top
            if (prevY + t.size.y <= platformRect.y && entityRect.y + entityRect.h >= platformRect.y) {
                if (plat.type === 'oneway' && (a?.context.dropThrough > 0 || (p && e !== w.playerId))) {
                    return;
                }

                // Bounce Pad Logic
                if (plat.type === 'bounce') {
                    t.pos.y = platformRect.y - entityRect.h;
                    t.vel.y = -1400; // High bounce
                    
                    // Reset air options
                    if (a && k) {
                        a.context.jumpsLeft = k.maxJumps;
                        a.context.dashCharges = a.context.maxDashCharges;
                    }
                    if (s) {
                        s.state = 'jumping';
                        s.animTime = 0;
                    }
                    
                    w.actions.createParticleBurst(t.pos.x + t.size.x/2, t.pos.y + t.size.y, 15, '#4ade80', 'ring', { sizeMultiplier: 1.5 });
                    return;
                }
                
                t.pos.y = platformRect.y - entityRect.h;
                if (s && s.state === 'barrel_blast') {
                    s.state = 'idle'; s.timers.blast = 0; t.rotation = 0;
                }

                if (p && h) {
                    if ((p.type === 'coconut' || p.type === 'barrel') && p.bouncesLeft && p.bouncesLeft > 0) {
                        t.vel.y *= -0.6;
                        p.bouncesLeft--;
                        if (Math.abs(t.vel.x) < 100) t.vel.x = (100 + Math.random() * 50) * (Math.random() > 0.5 ? 1 : -1);
                        w.actions.createParticleBurst(t.pos.x + t.size.x/2, t.pos.y + t.size.y, 5, '#a1662f', 'burst', { velocityMultiplier: 0.5 });
                    } else {
                         if(t.vel.y > 0) t.vel.y = 0;
                    }
                    if (p.type === 'banana') {
                        h.hp = 0;
                        w.poofEffects.push({ x: t.pos.x + t.size.x/2, y: t.pos.y + t.size.y/2, life: 0.3, maxLife: 0.3, radius: 0 });
                        w.bananaPeels.push({ x: t.pos.x, y: plat.y - 12, w: 32, h: 12, life: 20 });
                    }
                } else {
                    if(t.vel.y > 0) t.vel.y = 0;
                }

                t.onGround = true;
                if (a) a.context.onOnewayPlatform = (plat.type === 'oneway');

                if (!wasOnGround && k && e === w.playerId) {
                    if (a) {
                        a.context.coyote = k.coyoteFrames / 60.0;
                        a.context.jumpsLeft = k.maxJumps;
                        a.context.dashCharges = a.context.maxDashCharges;
                    }
                    if (s) s.timers.landSquash = 8 / 60.0;
                }
                resolved = true;
            } 
            // 2. Ceiling Collision
            else if (plat.type === 'solid' && prevY >= platformRect.y + platformRect.h && entityRect.y < platformRect.y + platformRect.h) {
                t.pos.y = platformRect.y + platformRect.h;
                if (t.vel.y < 0) t.vel.y = 0;
                
                if (s && s.state === 'barrel_blast') {
                    s.state = 'falling'; s.timers.blast = 0; t.rotation = 0;
                }
                resolved = true;
            }

            // 3. Horizontal Collision (Walls)
            if (plat.type === 'solid') {
                // Re-calculate rect in case Y was corrected
                const yCorrectedRect = { x: t.pos.x, y: t.pos.y, w: t.size.x, h: t.size.y };
                
                // Only check horizontal if we are still intersecting after Y correction
                if (aabb(yCorrectedRect, platformRect)) {
                     // Hitting Left Side
                     if (prevX + t.size.x <= plat.x && yCorrectedRect.x + t.size.x > plat.x) {
                         t.pos.x = plat.x - t.size.x;
                         t.vel.x = p && p.bouncesLeft ? t.vel.x * -0.8 : 0;
                         t.onWall = 1;
                         resolved = true;
                     }
                     // Hitting Right Side
                     else if (prevX >= plat.x + plat.w && yCorrectedRect.x < plat.x + plat.w) {
                         t.pos.x = plat.x + plat.w;
                         t.vel.x = p && p.bouncesLeft ? t.vel.x * -0.8 : 0;
                         t.onWall = -1;
                         resolved = true;
                     }
                     
                     if (resolved && s && s.state === 'barrel_blast') {
                        s.state = 'falling'; s.timers.blast = 0; t.rotation = 0;
                    }
                }
            }

            // 4. UNSTUCK LOGIC (Separation)
            // If we are overlapping but no specific direction was detected (e.g. spawned inside, or tunneled), push out.
            if (!resolved && plat.type === 'solid' && aabb({ x: t.pos.x, y: t.pos.y, w: t.size.x, h: t.size.y }, platformRect)) {
                const overlapL = (t.pos.x + t.size.x) - platformRect.x;
                const overlapR = (platformRect.x + platformRect.w) - t.pos.x;
                const overlapT = (t.pos.y + t.size.y) - platformRect.y;
                const overlapB = (platformRect.y + platformRect.h) - t.pos.y;

                const minOverlap = Math.min(overlapL, overlapR, overlapT, overlapB);

                if (minOverlap === overlapT) { // Push up
                    t.pos.y = platformRect.y - t.size.y;
                    t.vel.y = 0;
                    t.onGround = true;
                } else if (minOverlap === overlapB) { // Push down
                    t.pos.y = platformRect.y + platformRect.h;
                    t.vel.y = 0;
                } else if (minOverlap === overlapL) { // Push left
                    t.pos.x = platformRect.x - t.size.x;
                    t.vel.x = 0;
                    t.onWall = 1;
                } else if (minOverlap === overlapR) { // Push right
                    t.pos.x = platformRect.x + platformRect.w;
                    t.vel.x = 0;
                    t.onWall = -1;
                }
            }
        });
        
        // --- Zone Collisions (Ladders) ---
        w.level.zones.forEach(zone => {
             if (zone.type === 'ladder') {
                 const entityRect = { x: t.pos.x + t.size.x/4, y: t.pos.y, w: t.size.x/2, h: t.size.y };
                 if (aabb(entityRect, zone)) {
                     t.onLadder = true;
                 }
             }
        });

        // --- Banana Peel Collision (Player only) ---
        if (e === w.playerId && a && s && s.state !== 'slipping' && t.onGround) {
            const playerRect = { x: t.pos.x, y: t.pos.y, w: t.size.x, h: t.size.y };
            w.bananaPeels.forEach(peel => {
                if (peel.life > 0 && aabb(playerRect, {x: peel.x, y: peel.y, w: peel.w, h: peel.h})) {
                    s.state = 'slipping';
                    s.animTime = 0;
                    a.context.slipTimer = 1.2;
                    t.vel.x += 400 * ((Math.abs(t.vel.x) > 1 ? Math.sign(t.vel.x) : t.facing));
                    peel.life = 0;
                    w.actions.createParticleBurst(t.pos.x + t.size.x/2, t.pos.y + t.size.y, 15, '#fde047', 'line', { direction: t.facing });
                }
            });
        }
    });
}
