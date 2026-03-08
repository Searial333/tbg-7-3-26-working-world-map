
import type { World } from '../../types';
import { get } from '../ecs';
import type { Transform, Kinematics, Health, StateMachine, BarrelCannon, Vine, Abilities } from '../components';

function aabb(r1: any, r2: any) {
  return r1.x < r2.x + r2.w && r1.x + r1.w > r2.x && r1.y < r2.y + r2.h && r1.y + r1.h > r2.y;
}

export function physicsSystem(w: World) {
    w.entities.forEach(e => {
        const t = get<Transform>(w, 'transform', e);
        const k = get<Kinematics>(w, 'kinematics', e);
        const s = get<StateMachine>(w, 'state', e);
        const barrel = get<BarrelCannon>(w, 'barrelCannon', e);
        const vine = get<Vine>(w, 'vine', e);
        const a = get<Abilities>(w, 'abilities', e);

        // Handle Barrel Cannon Rotation
        if (barrel && t) {
            barrel.direction += barrel.rotateSpeed * w.dt;
            barrel.direction %= 360;
            t.rotation = barrel.direction;
            if (barrel.cooldown > 0) barrel.cooldown -= w.dt;
        }

        // Handle Vine Physics (Simple Pendulum Motion)
        if (vine && t) {
            // Use time for simple harmonic motion
            vine.angle = Math.sin(w.time * vine.swingSpeed) * 45; // +/- 45 degrees
            t.rotation = vine.angle;
        }

        if (!t || !k) return;

        // --- ZONE CHECKS (Water, etc.) ---
        let inWater = false;
        const entityRect = { x: t.pos.x, y: t.pos.y, w: t.size.x, h: t.size.y };
        
        for (const zone of w.level.zones) {
            if (zone.type === 'water') {
                if (aabb(entityRect, zone)) {
                    inWater = true;
                    break;
                }
            }
        }

        // Physics Logic
        const state = s?.state ?? '';
        
        // Special Case: Barrel Blast - Ignore gravity, fixed velocity
        if (state === 'barrel_blast') {
            // Velocity is set at launch
        }
        // Special Case: Inside Barrel - No movement
        else if (state === 'barrel_idle') {
            t.vel.x = 0;
            t.vel.y = 0;
            return;
        }
        // Special Case: Vine Swing - Position tied to vine
        else if (state === 'vine_swing' && s && s.attachedToId !== undefined) {
            const attachedVine = get<Vine>(w, 'vine', s.attachedToId);
            const attachedT = get<Transform>(w, 'transform', s.attachedToId);
            if (attachedVine && attachedT) {
                const radian = (attachedVine.angle + 90) * (Math.PI / 180);
                const endX = attachedT.pos.x + Math.cos(radian) * attachedVine.length;
                const endY = attachedT.pos.y + Math.sin(radian) * attachedVine.length;
                
                t.pos.x = endX - t.size.x / 2;
                t.pos.y = endY - t.size.y / 2;
                
                // Calculate tangential velocity for release
                const swingVelMagnitude = Math.cos(w.time * attachedVine.swingSpeed) * attachedVine.swingSpeed * attachedVine.length * 0.5;
                t.vel.x = Math.cos(radian + Math.PI/2) * swingVelMagnitude;
                t.vel.y = Math.sin(radian + Math.PI/2) * swingVelMagnitude;
            }
            return; 
        }
        // Special Case: Grabbing
        else if (state === 'grabbing') {
            t.vel.x = 0;
            t.vel.y = 0;
            return;
        }
        // Normal Physics (Walking, Falling, Swimming)
        else if (!['climbing', 'dashing'].includes(state)) {
            if (inWater) {
                // Water Physics
                const buoyancy = k.gravity * 0.8; // Counteracts most of gravity
                t.vel.y += (k.gravity - buoyancy) * w.dt;
                
                // Stronger Drag
                t.vel.x *= Math.pow(0.85, w.dt * 60);
                t.vel.y *= Math.pow(0.85, w.dt * 60);
                
                // Clamp sinking speed
                if (t.vel.y > 150) t.vel.y = 150;

                // Reset jumps if in water (swimming logic allows infinite jumps/strokes)
                if (a) {
                    a.context.jumpsLeft = k.maxJumps;
                }
            } else {
                // Normal Gravity
                t.vel.y += k.gravity * w.dt;
                
                // Terminal Velocity Cap (to prevent tunneling)
                const MAX_FALL_SPEED = 1200; 
                if (t.vel.y > MAX_FALL_SPEED) t.vel.y = MAX_FALL_SPEED;
            }
        }
        
        // Apply force from ramps/slopes
        if (t.onGround && t.groundSlope && t.groundSlope !== 0 && state !== 'slipping') {
            const slopeAngle = Math.atan(t.groundSlope);
            const gravityForceOnSlope = k.gravity * Math.sin(slopeAngle);
            t.vel.x += gravityForceOnSlope * w.dt;
        }

        // Apply velocity
        t.pos.x += t.vel.x * w.dt;
        t.pos.y += t.vel.y * w.dt;

        // Out of bounds check
        if (t.pos.y > w.level.bounds.bottom + 200) {
            if (e === w.playerId && w.isTestMode) {
                t.pos.y = t.lastCheckpoint.y - 100;
                t.pos.x = t.lastCheckpoint.x;
                t.vel.y = 0;
                t.vel.x = 0;
                return;
            }
            const health = get<Health>(w, 'health', e);
            if (health) {
                health.hp = 0;
            }
        }
    });
}
