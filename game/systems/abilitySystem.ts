
import type { World, InputState } from '../../types';
import { get, spawnMilkProjectile, spawnDiaperBombProjectile } from '../ecs';
import type { Abilities, Kinematics, StateMachine, Transform, Health, Palette, RendererRef, BarrelCannon, Vine } from '../components';

const changeState = (s: StateMachine, newState: string) => {
    if (s.state !== newState) {
        s.state = newState;
        s.animTime = 0;
    }
};

export function abilitySystem(w: World, input: InputState) {
    const e = w.playerId;
    const t = get<Transform>(w, 'transform', e);
    const s = get<StateMachine>(w, 'state', e);
    const a = get<Abilities>(w, 'abilities', e);
    const k = get<Kinematics>(w, 'kinematics', e);
    const h = get<Health>(w, 'health', e);
    const pal = get<Palette>(w, 'palette', e);
    const r = get<RendererRef>(w, 'renderer', e);
    if (!t || !s || !a || !k || !h || !pal || !r || h.dead) return;
    
    // Disable controls in cinematic or when dialogue is active
    if (w.status === 'cinematic') {
        t.vel.x *= 0.8;
        if (Math.abs(t.vel.x) < 1) t.vel.x = 0;
        if (t.onGround) {
            changeState(s, 'idle');
        } else {
            changeState(s, 'falling');
        }
        return;
    }

    // Disable abilities in shop
    if (w.level.name.includes('Items')) { 
        const runAccel = k.runAcceleration * w.dt;
        if (input.right) {
            t.vel.x = Math.min(k.runSpeed, t.vel.x + runAccel);
            t.facing = 1;
        } else if (input.left) {
            t.vel.x = Math.max(-k.runSpeed, t.vel.x - runAccel);
            t.facing = -1;
        } else {
            t.vel.x *= Math.pow(k.runFriction, w.dt * 60);
            if (Math.abs(t.vel.x) < 0.1) t.vel.x = 0;
        }
        
        if (!t.onGround) {
            changeState(s, 'falling');
        } else if (input.left || input.right) {
            changeState(s, 'running');
        } else {
            changeState(s, 'idle');
        }
        return;
    }

    // Cooldown & Timer management
    if (a.context.diaperCooldown > 0) a.context.diaperCooldown -= w.dt;
    if (a.context.jumpBuffer > 0) a.context.jumpBuffer -= w.dt;
    if (a.context.slipTimer > 0) a.context.slipTimer -= w.dt;
    
    // --- STATE: HOT FOOT ---
    if (s.state === 'hot_foot') {
        if ((s.timers.hot_foot ?? 0) <= 0) {
            changeState(s, 'falling');
            return;
        }

        if (t.onGround) {
            t.vel.y = -k.jumpForce * 0.6;
            t.onGround = false;
            w.actions.createParticleBurst(t.pos.x + t.size.x/2, t.pos.y + t.size.y, 5, '#ff4500', 'dust');
        }

        if (input.left) {
            t.vel.x -= 200 * w.dt;
            t.facing = -1;
        } else if (input.right) {
            t.vel.x += 200 * w.dt;
            t.facing = 1;
        }
        t.vel.x *= 0.98;

        if (Math.random() < 0.3) {
            w.actions.createParticleBurst(t.pos.x + Math.random() * t.size.x, t.pos.y + t.size.y - 10, 1, '#555', 'burst', { velocityMultiplier: 0.1 });
        }
        return;
    }

    // --- STATE: INSIDE BARREL ---
    if (s.state === 'barrel_idle' && s.attachedToId !== undefined) {
        const barrel = get<BarrelCannon>(w, 'barrelCannon', s.attachedToId);
        const barrelT = get<Transform>(w, 'transform', s.attachedToId);
        
        if (barrel && barrelT) {
            t.pos.x = barrelT.pos.x + barrelT.size.x/2 - t.size.x/2;
            t.pos.y = barrelT.pos.y + barrelT.size.y/2 - t.size.y/2;
            t.rotation = barrel.direction; 
            
            if (barrel.type === 'auto' || (input.jumpDown)) {
                changeState(s, 'barrel_blast');
                s.attachedToId = undefined; 
                s.timers.blast = 0.5; 
                barrel.cooldown = 0.5; 
                
                const blastAngle = barrel.direction;
                const radBlast = blastAngle * (Math.PI / 180);

                const blastSpeed = 1800; 
                t.vel.x = Math.cos(radBlast) * blastSpeed;
                t.vel.y = Math.sin(radBlast) * blastSpeed;
                
                w.actions.createParticleBurst(barrelT.pos.x + barrelT.size.x/2, barrelT.pos.y + barrelT.size.y/2, 30, '#F5F5F5', 'burst', { sizeMultiplier: 2 });
                w.actions.setScreenShake(10, 0.2);
            }
        }
        return; 
    }

    // --- STATE: BARREL BLAST ---
    if (s.state === 'barrel_blast') {
        t.rotation = (t.rotation || 0) + 720 * w.dt; 
        s.timers.blast -= w.dt;
        
        if (Math.random() > 0.5) {
             w.actions.createParticleBurst(t.pos.x + t.size.x/2, t.pos.y + t.size.y/2, 2, '#ffffff', 'burst', { velocityMultiplier: 0.5 });
        }

        if (s.timers.blast <= 0) {
            t.rotation = 0;
            t.vel.x *= 0.5; 
            t.vel.y *= 0.5;
            changeState(s, 'falling');
        }
        return;
    }

    // --- STATE: VINE SWING ---
    if (s.state === 'vine_swing' && s.attachedToId !== undefined) {
        const vine = get<Vine>(w, 'vine', s.attachedToId);
        if (input.jumpDown) {
            changeState(s, 'jumping');
            s.attachedToId = undefined;
            t.rotation = 0;
            t.vel.y -= 300;
            a.context.jumpsLeft = k.maxJumps - 1; 
        }
        return;
    }

    // --- STATE: GRABBING ---
    if (s.state === 'grabbing') {
        t.vel.x = 0;
        t.vel.y = 0;
        a.context.jumpsLeft = k.maxJumps; 
        a.context.dashCharges = a.context.maxDashCharges;

        if (input.jumpDown) {
            changeState(s, 'jumping');
            t.vel.y = -k.jumpForce;
            if (t.onWall !== 0) {
                t.vel.x = -t.onWall * k.wallJumpXBoost;
                t.facing = t.onWall === 1 ? -1 : 1;
            }
        } 
        else if ((t.onWall === 1 && input.left) || (t.onWall === -1 && input.right) || input.down) {
            changeState(s, 'falling');
        }
        
        if (!input.interact) { 
             changeState(s, 'falling');
        }
        
        return;
    }


    const canAct = !['slamming', 'rolling', 'backflip', 'winded', 'dashing', 'bottleCharge', 'bottleShootTap', 'bottleShootBeam', 'throwingDiaper', 'slipping', 'hot_foot'].includes(s.state);
    
    if (input.jumpDown) {
        a.context.jumpBuffer = k.jumpBufferFrames / 60.0;
    }

    if (t.onLadder && canAct) {
        if (input.up || input.down) {
            changeState(s, 'climbing');
        }
    } else if (s.state === 'climbing' && !t.onLadder) {
        changeState(s, 'falling');
    }

    if (a.context.jumpBuffer > 0 && canAct) {
        if (s.state === 'wallSliding' && a.available.has('wallSlide')) {
            t.vel.y = -k.wallJumpYForce;
            t.vel.x = -t.onWall * k.wallJumpXBoost;
            t.facing = t.onWall === 1 ? -1 : 1;
            changeState(s, 'jumping');
            a.context.jumpsLeft = k.maxJumps - 1;
            a.context.jumpBuffer = 0;
        } else if (s.state === 'climbing') {
             t.vel.y = -k.jumpForce * 0.8;
             changeState(s, 'jumping');
             a.context.jumpBuffer = 0;
        } else if (t.onGround || a.context.coyote > 0) {
            t.vel.y = -k.jumpForce;
            t.onGround = false;
            a.context.coyote = 0;
            changeState(s, 'jumping');
            a.context.jumpsLeft = k.maxJumps - 1;
            a.context.jumpBuffer = 0;
            w.actions.createParticleBurst(t.pos.x + t.size.x / 2, t.pos.y + t.size.y, 10, 'rgba(139, 69, 19, 0.7)', 'dust');
        } else if (a.context.jumpsLeft > 0 && a.available.has('doubleJump')) {
            t.vel.y = -k.jumpForce * 0.9;
            a.context.jumpsLeft--;
            changeState(s, 'backflip');
            w.actions.createParticleBurst(t.pos.x + t.size.x / 2, t.pos.y + t.size.y / 2, 25, '#c4b5fd', 'ring');
            a.context.jumpBuffer = 0;
        }
    }
    
    if (!input.jump && s.state === 'jumping' && t.vel.y < 0) {
        t.vel.y *= 0.5;
    }
    
    const canDash = a.available.has('dash') && (a.context.dashCharges ?? 0) > 0;
    if (input.dashDown && canDash && !['dashing', 'slamming', 'slipping', 'hot_foot'].includes(s.state)) {
        let dir = { x: 0, y: 0 };
        if (input.up) dir.y = -1;
        else if (input.down && !t.onGround) dir.y = 1; 

        if (input.left) dir.x = -1;
        else if (input.right) dir.x = 1;
        
        if (dir.x === 0 && dir.y === 0) {
            dir.x = t.facing; 
        }
        
        const mag = Math.hypot(dir.x, dir.y) || 1;
        dir.x /= mag;
        dir.y /= mag;

        changeState(s, 'dashing');
        s.timers.dashing = k.dashDuration;
        a.context.dashCooldown = k.dashCooldown;
        t.vel.x = k.dashSpeed * dir.x;
        t.vel.y = k.dashSpeed * dir.y;
        if(dir.x !== 0) t.facing = Math.sign(dir.x) as 1 | -1;

        a.context.dashCharges--;
        w.actions.setScreenShake(5, 0.1);
    }


    if (input.downDown && !t.onGround && a.available.has('slam') && canAct) {
        changeState(s, 'slamming');
    }
    
    if (input.rollDown && t.onGround && a.available.has('roll') && canAct) {
        changeState(s, 'rolling');
        a.context.rollMomentum = k.maxRollSpeed;
    }

    const canShoot = a.available.has('bottleBlaster');
    const isCharging = s.state === 'bottleCharge';

    if (canShoot && input.shoot && canAct) {
        if (!isCharging) {
            changeState(s, 'bottleCharge');
            a.context.bottleCharge = 0;
        }
    }

    if (isCharging) {
         if(input.shoot) {
             a.context.bottleCharge = (a.context.bottleCharge ?? 0) + w.dt;
         } else { 
             if ((a.context.bottleCharge ?? 0) >= k.bottleChargeTime) {
                changeState(s, 'bottleShootBeam');
                s.timers.bottleLaser = k.bottleLaserDuration;
                w.actions.setScreenShake(4, k.bottleLaserDuration);
             } else {
                changeState(s, 'bottleShootTap');
                s.timers.bottleShoot = 0.25;
                spawnMilkProjectile(w, e);
             }
             a.context.bottleCharge = 0;
         }
    }
    
    const diaperCooldown = a.context.diaperCooldown ?? 0;
    if (input.throwDown && a.available.has('diaperBomb') && a.context.hasDiaper && diaperCooldown <= 0 && canAct) {
        a.context.hasDiaper = false;
        a.context.diaperCooldown = 30; 
        changeState(s, 'throwingDiaper');
        s.timers.throwing = 0.25;
        spawnDiaperBombProjectile(w, e);
    }


    if(input.downDown && t.onGround && a.context.onOnewayPlatform) {
        a.context.dropThrough = 0.25; 
    }

    switch (s.state) {
        case 'idle':
            t.vel.x *= Math.pow(k.runFriction, w.dt * 60);
            if (Math.abs(t.vel.x) < 0.1) t.vel.x = 0;
            if (input.left || input.right) changeState(s, 'running');
            break;
        case 'running':
            const runAccel = k.runAcceleration * w.dt;
            
            if (input.right) {
                t.vel.x = Math.min(k.runSpeed, t.vel.x + runAccel);
                t.facing = 1;
            } else if (input.left) {
                t.vel.x = Math.max(-k.runSpeed, t.vel.x - runAccel);
                t.facing = -1;
            } else {
                t.vel.x *= Math.pow(k.runFriction, w.dt * 60);
                if (Math.abs(t.vel.x) < 1) {
                    t.vel.x = 0;
                    changeState(s, 'idle');
                }
            }
            if (!t.onGround) changeState(s, 'falling');
            break;
        case 'rolling':
            a.context.rollMomentum -= k.rollDeceleration * w.dt;
            if (!input.roll || a.context.rollMomentum <= k.rollMinSpeed) {
                changeState(s, 'running');
                t.vel.x = k.rollMinSpeed * t.facing;
                a.context.rollMomentum = 0;
            } else {
                t.vel.x = a.context.rollMomentum * t.facing;
            }
            break;
        case 'climbing':
            t.vel.x = 0;
            t.vel.y = 0;
            if(input.up) t.vel.y = -k.runSpeed / 2;
            if(input.down) t.vel.y = k.runSpeed / 2;
            break;
        case 'jumping':
        case 'falling':
             if (input.right) {
                t.facing = 1;
                t.vel.x = Math.min(t.vel.x + k.airAcceleration * w.dt, k.maxAirSpeed);
            } else if (input.left) {
                t.facing = -1;
                t.vel.x = Math.max(t.vel.x - k.airAcceleration * w.dt, -k.maxAirSpeed);
            } else {
                t.vel.x *= Math.pow(k.airFriction, w.dt * 60);
            }
            if (t.vel.y > 0 && s.state !== 'falling') changeState(s, 'falling');
            if (t.onGround) changeState(s, 'idle');
            
            if (t.onWall !== 0 && !t.onGround) {
                if (input.interact) {
                    changeState(s, 'grabbing');
                } else if (t.vel.y > 0 && a.available.has('wallSlide')) {
                    if ((t.onWall === 1 && input.right) || (t.onWall === -1 && input.left)) {
                        changeState(s, 'wallSliding');
                    }
                }
            }
            break;
        case 'backflip':
             if (input.right) {
                t.facing = 1;
                t.vel.x = Math.min(t.vel.x + k.airAcceleration * w.dt, k.maxAirSpeed);
            } else if (input.left) {
                t.facing = -1;
                t.vel.x = Math.max(t.vel.x - k.airAcceleration * w.dt, -k.maxAirSpeed);
            } else {
                t.vel.x *= Math.pow(k.airFriction, w.dt * 60);
            }
            if (s.animTime > 0.5) {
                changeState(s, 'falling');
            }
            if (t.onGround) {
                changeState(s, 'idle');
            }
            break;
        case 'wallSliding':
            t.vel.y = Math.min(t.vel.y, k.wallSlideSpeed);
            
            if (input.interact) {
                changeState(s, 'grabbing');
            }

            if (Math.floor(w.time * 20) % 2 === 0) {
                const particleX = t.pos.x + (t.onWall > 0 ? t.size.x : 0);
                const particleY = t.pos.y + t.size.y / 2 + (Math.random() * 20 - 10);
                w.actions.createParticleBurst(particleX, particleY, 1, 'rgba(139, 69, 19, 0.5)', 'burst', { velocityMultiplier: 0.5 });
            }

            if(t.onGround || t.onWall === 0 || (t.onWall === 1 && !input.right) || (t.onWall === -1 && !input.left)) {
                changeState(s, 'falling');
            }
            break;
        case 'slamming':
            t.vel.x = 0;
            t.vel.y = 35 * 60;
            if (t.onGround) {
                changeState(s, 'idle');
                w.actions.setScreenShake(10, 0.25);
                w.actions.createParticleBurst(t.pos.x + t.size.x / 2, t.pos.y + t.size.y, 30, 'rgba(139, 69, 19, 0.7)', 'ring', { sizeMultiplier: 2 });
                 w.shockwaves.push({
                    x: t.pos.x + t.size.x / 2, y: t.pos.y + t.size.y,
                    radius: 0, maxRadius: 150, life: 0.3, maxLife: 0.3, height: 10,
                });
            }
            break;
        case 'dashing':
            if (Math.floor(w.time * 60) % 3 === 0) {
                w.dashGhosts.push({
                    x: t.pos.x, y: t.pos.y,
                    life: 0.2, maxLife: 0.2,
                    facing: t.facing,
                    size: t.size,
                    painterId: r.painterId,
                    palette: pal,
                    state: s.state,
                    animTime: s.animTime
                });
            }
            if ((s.timers.dashing ?? 0) <= 0) {
                t.vel.x *= 0.5; 
                t.vel.y *= 0.5;
                changeState(s, 'falling');
            }
            break;
        case 'bottleCharge':
        case 'bottleShootTap':
        case 'bottleShootBeam':
            t.vel.x *= Math.pow(k.runFriction, w.dt * 60);
            if (s.state === 'bottleShootBeam' && (s.timers.bottleLaser ?? 0) <= 0) {
                changeState(s, 'falling');
            }
            if (s.state === 'bottleShootTap' && (s.timers.bottleShoot ?? 0) <= 0) {
                changeState(s, 'falling');
            }
            break;
        case 'throwingDiaper':
             t.vel.x *= Math.pow(k.runFriction, w.dt * 60);
             if((s.timers.throwing ?? 0) <= 0) {
                 changeState(s, 'falling');
             }
             break;
        case 'slipping':
            t.vel.x *= Math.pow(0.992, w.dt * 60); 
            if (Math.abs(t.vel.x) < 10) t.vel.x = 0;

            if ((a.context.slipTimer ?? 0) <= 0) {
                changeState(s, 'idle');
            }
            if (!t.onGround) {
                changeState(s, 'falling'); 
            }
            if (a.context.jumpBuffer > 0 && (t.onGround || a.context.coyote > 0)) {
                t.vel.y = -k.jumpForce;
                t.onGround = false;
                a.context.coyote = 0;
                changeState(s, 'jumping');
                a.context.jumpsLeft = k.maxJumps - 1;
                a.context.jumpBuffer = 0;
            }
            break;
    }
}
