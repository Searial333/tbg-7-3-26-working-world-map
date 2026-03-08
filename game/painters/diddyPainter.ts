
import type { World } from '../../types';
import { get } from '../ecs';
import type { Palette, StateMachine, Transform, Abilities, Input, Kinematics, Boss } from '../components';

const p = 4; // Pixel scale for chunky but detailed look

const drawPart = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, c: string) => {
    ctx.fillStyle = c;
    ctx.fillRect(Math.floor(x * p), Math.floor(y * p), Math.ceil(w * p), Math.ceil(h * p));
};

const drawHead = (ctx: CanvasRenderingContext2D, pal: Palette, x: number, y: number, state: string, animTime: number) => {
    // 1. Fur Base (Skull)
    drawPart(ctx, x + 2, y + 2, 10, 10, pal.fur_dark || '#5D4037');
    drawPart(ctx, x + 3, y + 2, 8, 9, pal.fur || '#8D6E63');
    
    // 2. Ears
    drawPart(ctx, x + 1, y + 4, 2, 3, pal.fur_dark || '#5D4037');
    drawPart(ctx, x + 11, y + 4, 2, 3, pal.fur_dark || '#5D4037');

    // 3. Face Mask (Skin)
    drawPart(ctx, x + 3, y + 5, 8, 7, pal.skin || '#FFECB3');
    
    // 4. Eyes
    const isDying = state === 'dying';
    const blink = (animTime % 4 < 0.1) || isDying;
    
    if (isDying) {
        // X eyes for defeat
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        [0, 4].forEach(ox => {
            ctx.beginPath();
            ctx.moveTo((x + 4 + ox)*p, (y + 6)*p); ctx.lineTo((x + 6 + ox)*p, (y + 8)*p);
            ctx.moveTo((x + 6 + ox)*p, (y + 6)*p); ctx.lineTo((x + 4 + ox)*p, (y + 8)*p);
            ctx.stroke();
        });
    } else if (!blink) {
        drawPart(ctx, x + 4, y + 6, 2, 3, '#fff');
        drawPart(ctx, x + 8, y + 6, 2, 3, '#fff');
        drawPart(ctx, x + 5, y + 7, 1, 1, '#000');
        drawPart(ctx, x + 9, y + 7, 1, 1, '#000');
    }

    // 5. Snout
    drawPart(ctx, x + 2, y + 9, 10, 5, pal.skin_shadow || '#FFE082');
    drawPart(ctx, x + 3, y + 9, 8, 4, pal.skin || '#FFECB3');
    // Mouth
    const isRoaring = state === 'intro' || state === 'hurt' || state === 'dying';
    if (isRoaring) {
        drawPart(ctx, x + 5, y + 11, 4, 2, '#3E2723');
    } else {
        drawPart(ctx, x + 5, y + 11, 4, 1, '#3E2723');
    }

    // 6. Red Cap (Iconic)
    drawPart(ctx, x + 1, y, 12, 5, '#D32F2F'); // Cap Top
    drawPart(ctx, x + 7, y + 3, 9, 2, '#B71C1C'); // Cap Brim
    drawPart(ctx, x + 6, y + 1, 2, 2, '#FFFFFF');
};

const drawPopgun = (ctx: CanvasRenderingContext2D, x: number, y: number, angle: number) => {
    ctx.save();
    ctx.translate(x * p, y * p);
    ctx.rotate(angle);
    drawPart(ctx, 0, -2, 7, 4, '#8D6E63'); 
    drawPart(ctx, 1, -1, 5, 2, '#A1887F'); 
    drawPart(ctx, 1, 1, 2, 3, '#5D4037');
    drawPart(ctx, 7, -3, 2, 6, '#3E2723');
    drawPart(ctx, 8, -2, 1, 4, '#1A0F0B');
    ctx.restore();
};

const drawJetpack = (ctx: CanvasRenderingContext2D, x: number, y: number, thrust: number, fuel: number = 1) => {
    [0, 8].forEach(offX => {
        const jX = x + offX;
        drawPart(ctx, jX, y, 6, 10, '#5D4037');
        drawPart(ctx, jX + 1, y, 4, 10, '#8D6E63'); 
        drawPart(ctx, jX, y + 2, 6, 1, '#212121'); 
        drawPart(ctx, jX, y + 7, 6, 1, '#212121');
        drawPart(ctx, jX + 1, y - 2, 4, 2, '#D32F2F');
        
        if (thrust > 0) {
            // Sputter logic: if fuel is low or thrust is intermittent
            const isSputtering = fuel < 0.3 && Math.random() < 0.3;
            if (isSputtering) return;

            const h = (8 + Math.random() * 12) * thrust;
            const flicker = 0.8 + Math.random() * 0.4;
            
            ctx.fillStyle = 'rgba(255, 152, 0, 0.3)';
            ctx.fillRect((jX)*p, (y + 10)*p, 6*p, h*1.5*p);

            const grad = ctx.createLinearGradient(0, (y + 10) * p, 0, (y + 10 + h) * p);
            grad.addColorStop(0, '#FFFFFF');
            grad.addColorStop(0.3, '#FFF59D');
            grad.addColorStop(0.6, '#FF9800');
            grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad;
            ctx.fillRect((jX + 1) * p, (y + 10) * p, 4 * p, h * flicker * p);
        }
    });
};

export function diddyPainter(ctx: CanvasRenderingContext2D, w: World, e: number) {
    const t = get<Transform>(w, 'transform', e);
    const s = get<StateMachine>(w, 'state', e);
    const pal = get<Palette>(w, 'palette', e);
    const boss = get<Boss>(w, 'boss', e);
    if (!t || !s || !pal) return;

    ctx.save();
    
    // Scaling and rotation
    ctx.translate(t.size.x/2, t.size.y/2);
    if (t.rotation) ctx.rotate(t.rotation * Math.PI / 180);
    ctx.scale(t.facing, 1);
    ctx.translate(-t.size.x/2, -t.size.y/2);

    const time = s.animTime;
    const isMidAir = !t.onGround;
    const isHovering = boss?.state === 'jetpack_hover';
    const isFlipping = boss?.state === 'monkey_flip';
    const isShooting = boss?.state === 'peanut_shot';
    const isDying = boss?.state === 'dying';

    const bob = Math.sin(time * 8) * (isHovering ? 2 : 1);
    const bodyY = 12 + bob;

    // Defeat Visuals: Fade out
    if (isDying) {
        ctx.globalAlpha = Math.max(0, (boss?.stateTimer ?? 1) / 3);
    }

    // 0. Tail 
    ctx.save();
    ctx.translate(2 * p, (bodyY + 12) * p);
    ctx.rotate(Math.sin(time * 4) * 0.2 + (isDying ? 1.5 : 0.5));
    drawPart(ctx, -6, -1, 8, 2, pal.fur_dark || '#5D4037');
    ctx.restore();

    // 1. Jetpack 
    const thrustValue = isHovering ? 1.0 : (isMidAir && t.vel.y < 0 ? 0.4 : 0);
    drawJetpack(ctx, 2, bodyY + 1, thrustValue, boss?.jetpackFuel ?? 1.0);

    if (isFlipping) {
        // Rotating shirt ball
        ctx.save();
        ctx.translate(t.size.x / 2, t.size.y / 2);
        ctx.rotate(time * 20);
        ctx.translate(-t.size.x / 2, -t.size.y / 2);
        drawPart(ctx, 4, 4, 10, 10, '#D32F2F');
        drawPart(ctx, 7, 7, 4, 4, '#FFEB3B');
        ctx.restore();
    } else {
        // Arms
        const armSwing = Math.sin(time * 8) * 4;
        if (isShooting) {
             drawPopgun(ctx, 14, bodyY + 6, -0.2); 
        } else if (!isDying) {
             drawPart(ctx, 0, bodyY + 6 + armSwing, 4, 7, pal.fur || '#8D6E63');
        }

        // Legs
        if (isHovering || isDying) {
            drawPart(ctx, 4, bodyY + 15, 3, 5, pal.fur || '#8D6E63');
            drawPart(ctx, 10, bodyY + 15, 3, 5, pal.fur || '#8D6E63');
            drawPart(ctx, 3, bodyY + 19, 5, 2, pal.skin || '#FFECB3');
            drawPart(ctx, 9, bodyY + 19, 5, 2, pal.skin || '#FFECB3');
        } else {
            drawPart(ctx, 2, bodyY + 14, 4, 4, pal.fur || '#8D6E63');
            drawPart(ctx, 10, bodyY + 14, 4, 4, pal.fur || '#8D6E63');
            drawPart(ctx, 1, bodyY + 17, 6, 3, pal.skin || '#FFECB3');
            drawPart(ctx, 9, bodyY + 17, 6, 3, pal.skin || '#FFECB3');
        }

        // Body 
        drawPart(ctx, 4, bodyY + 5, 9, 11, '#D32F2F'); 
        drawPart(ctx, 7, bodyY + 8, 3, 3, '#FFEB3B'); 
        drawPart(ctx, 5, bodyY + 14, 7, 2, pal.skin || '#FFECB3'); 

        // Head
        drawHead(ctx, pal, 2, bodyY - 10, boss?.state || 'idle', time);

        // Front Arm
        if (isShooting) {
             drawPopgun(ctx, 12, bodyY + 8, 0.1); 
        } else if (!isDying) {
             drawPart(ctx, 11, bodyY + 6 - armSwing, 4, 7, pal.fur || '#8D6E63');
        }
    }

    ctx.restore();
}

export const peanutPainter = (ctx: CanvasRenderingContext2D, w: World, e: number) => {
    const t = get<Transform>(w, 'transform', e);
    if (!t) return;
    
    ctx.save();
    ctx.translate(t.size.x/2, t.size.y/2);
    ctx.rotate(w.time * 15);
    ctx.fillStyle = '#D7CCC8';
    ctx.beginPath(); ctx.ellipse(-3, 0, 5, 4, 0, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(3, 0, 5, 4, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#A1887F';
    ctx.fillRect(-4, -1, 1, 1);
    ctx.fillRect(2, 1, 1, 1);
    ctx.restore();
};
