
import type { World } from '../../types';
import { get } from '../ecs';
import type { StateMachine, Transform, Health, RendererRef, Palette } from '../components';

const p = 4; // pixel size

const drawPart = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, c: string) => {
    ctx.fillStyle = c;
    ctx.fillRect(Math.floor(x * p), Math.floor(y * p), w * p, h * p);
};
const drawPixel = (ctx: CanvasRenderingContext2D, x: number, y: number, c: string) => {
    ctx.fillStyle = c;
    ctx.fillRect(Math.floor(x * p), Math.floor(y * p), p, p);
};

const drawKremlingHead = (ctx: CanvasRenderingContext2D, pal: Palette, x: number, y: number, isOpenMouth: boolean) => {
    // Crest
    drawPart(ctx, x + 2, y - 2, 4, 2, pal.skin_dark);
    drawPart(ctx, x + 3, y - 1, 3, 1, pal.skin);
    // Head Shape
    drawPart(ctx, x, y, 9, 6, pal.skin_dark);
    drawPart(ctx, x + 1, y, 8, 5, pal.skin);
    // Snout
    drawPart(ctx, x + 8, y + 2, 5, 4, pal.skin_dark);
    drawPart(ctx, x + 8, y + 2, 4, 3, pal.skin);
    drawPixel(ctx, x + 11, y + 3, pal.skin_dark); // Nostril
    // Eye
    drawPart(ctx, x + 5, y + 2, 3, 2, pal.white);
    drawPart(ctx, x + 6, y + 2, 1, 2, pal.eye);
    // Eyebrow
    drawPart(ctx, x + 4, y + 1, 4, 1, pal.skin_dark);

    if (isOpenMouth) {
        drawPart(ctx, x + 8, y + 5, 4, 2, pal.black);
        drawPart(ctx, x + 9, y + 6, 3, 1, pal.mouth);
    }
};

const drawKremlingWalkCycle = (ctx: CanvasRenderingContext2D, s: StateMachine, pal: Palette, isCharging: boolean) => {
    const animSpeed = isCharging ? 16 : 10;
    const f = Math.floor(s.animTime * animSpeed) % 8;
    const bob = [0, 1, 1.5, 1, 0, 1, 1.5, 1][f];
    const bodyY = isCharging ? 8 + bob : 6 + bob;

    const frames = [
        { bl: { x: 3, y: 20 }, fl: { x: 13, y: 19 }, ba: { x: 17, y: 11 }, fa: { x: 0, y: 12 }, tilt: 1 },
        { bl: { x: 5, y: 20 }, fl: { x: 10, y: 20 }, ba: { x: 16, y: 12 }, fa: { x: 1, y: 13 }, tilt: 0 },
        { bl: { x: 8, y: 19 }, fl: { x: 7, y: 20 }, ba: { x: 15, y: 13 }, fa: { x: 2, y: 14 }, tilt: -1 },
        { bl: { x: 11, y: 19 }, fl: { x: 5, y: 20 }, ba: { x: 14, y: 12 }, fa: { x: 3, y: 13 }, tilt: 0 },
        { bl: { x: 13, y: 19 }, fl: { x: 3, y: 20 }, ba: { x: 4, y: 11 }, fa: { x: 17, y: 12 }, tilt: 1 },
        { bl: { x: 10, y: 20 }, fl: { x: 5, y: 20 }, ba: { x: 3, y: 12 }, fa: { x: 16, y: 13 }, tilt: 0 },
        { bl: { x: 7, y: 20 }, fl: { x: 8, y: 19 }, ba: { x: 2, y: 13 }, fa: { x: 15, y: 14 }, tilt: -1 },
        { bl: { x: 5, y: 20 }, fl: { x: 11, y: 19 }, ba: { x: 3, y: 12 }, fa: { x: 14, y: 13 }, tilt: 0 },
    ];
    const frame = frames[f];
    
    ctx.save();
    ctx.translate(frame.tilt * p, 0);

    // -- DRAWING ORDER (Back to Front) --
    // Tail
    drawPart(ctx, 0, bodyY + 12, 4, 4, pal.skin_dark);
    drawPart(ctx, 1, bodyY + 13, 3, 3, pal.skin);

    // Back Leg
    drawPart(ctx, frame.bl.x, frame.bl.y, 5, 8, pal.skin_dark);
    drawPart(ctx, frame.bl.x, frame.bl.y, 4, 7, pal.skin);

    // Back Arm
    drawPart(ctx, frame.ba.x, frame.ba.y, 4, 8, pal.skin_dark);
    drawPart(ctx, frame.ba.x, frame.ba.y, 3, 7, pal.skin);
    drawPart(ctx, frame.ba.x - 1, frame.ba.y + 6, 5, 3, pal.armor_dark); // Wristband

    // Torso
    drawPart(ctx, 6, bodyY, 11, 15, pal.skin_dark);
    drawPart(ctx, 7, bodyY, 10, 14, pal.skin);
    drawPart(ctx, 9, bodyY + 4, 7, 10, pal.belly_dark);
    drawPart(ctx, 10, bodyY + 4, 6, 9, pal.belly);
    drawPart(ctx, 10, bodyY + 4, 6, 2, pal.belly_highlight);

    // Front Leg
    drawPart(ctx, frame.fl.x, frame.fl.y, 5, 8, pal.skin_dark);
    drawPart(ctx, frame.fl.x + 1, frame.fl.y, 4, 7, pal.skin);

    // Head
    drawKremlingHead(ctx, pal, isCharging ? 10 : 12, bodyY - (isCharging ? 2 : 0), false);
    
    // Front Arm
    drawPart(ctx, frame.fa.x, frame.fa.y, 4, 8, pal.skin_dark);
    drawPart(ctx, frame.fa.x + 1, frame.fa.y, 3, 7, pal.skin);
    drawPart(ctx, frame.fa.x - 1, frame.fa.y + 6, 5, 3, pal.armor); // Wristband
    
    ctx.restore();
};

const drawKremlingChargeAnticipation = (ctx: CanvasRenderingContext2D, s: StateMachine, pal: Palette) => {
    const shake = Math.sin(s.animTime * 50) * 0.5;
    const bodyY = 4 + shake;

    // Grounded Leg
    drawPart(ctx, 4, 20, 5, 8, pal.skin_dark);
    // Raised Leg
    drawPart(ctx, 10, 15, 5, 8, pal.skin_dark);

    // Torso (reared back)
    drawPart(ctx, 5, bodyY, 11, 15, pal.skin_dark);
    drawPart(ctx, 6, bodyY, 10, 14, pal.skin);
    drawPart(ctx, 8, bodyY + 4, 7, 10, pal.belly_dark);
    drawPart(ctx, 9, bodyY + 4, 6, 9, pal.belly);
    
    // Head (roaring)
    drawKremlingHead(ctx, pal, 10, bodyY - 4, true);

    // Arms (thrown back)
    drawPart(ctx, 1, bodyY + 2, 4, 8, pal.skin_dark);
    drawPart(ctx, 17, bodyY + 2, 4, 8, pal.skin_dark);
};

const drawKremlingStunned = (ctx: CanvasRenderingContext2D, s: StateMachine, pal: Palette) => {
    const sway = Math.sin(s.animTime * 10) * 2;
    const bodyY = 8;
    ctx.save();
    ctx.translate(sway * p, 0);
    ctx.rotate(sway * 0.02);

    // Legs
    drawPart(ctx, 7, 20, 5, 8, pal.skin_dark);
    drawPart(ctx, 12, 20, 5, 8, pal.skin_dark);
    // Torso (slumped)
    drawPart(ctx, 6, bodyY, 11, 15, pal.skin_dark);
    drawPart(ctx, 7, bodyY, 10, 14, pal.skin);
    drawPart(ctx, 9, bodyY + 4, 7, 10, pal.belly);
    // Arms (limp)
    drawPart(ctx, 3, bodyY + 8, 4, 8, pal.skin_dark);
    drawPart(ctx, 16, bodyY + 8, 4, 8, pal.skin_dark);
    // Head (dizzy)
    drawKremlingHead(ctx, pal, 12, bodyY, false);
    // Dizzy stars/spirals
    ctx.fillStyle = pal.belly_highlight;
    drawPixel(ctx, 10 + Math.cos(s.animTime * 20) * 3, bodyY - 4 + Math.sin(s.animTime*20)*2, pal.belly_highlight);
    drawPixel(ctx, 15 + Math.cos(s.animTime * 20 + 2) * 4, bodyY - 4 + Math.sin(s.animTime*20+2)*2, pal.belly_highlight);
    ctx.restore();
}

const drawKremlingDefeated = (ctx: CanvasRenderingContext2D, pal: Palette) => {
    // On its back, feet in the air
    const y = 14;
    // Torso
    drawPart(ctx, 6, y, 12, 7, pal.skin); 
    drawPart(ctx, 8, y+2, 8, 5, pal.belly);
    // Head
    drawPart(ctx, 10, y - 5, 8, 6, pal.skin);
    // X for eyes
    ctx.fillStyle = pal.black;
    drawPixel(ctx, 12, y - 3, pal.black); drawPixel(ctx, 13, y - 2, pal.black);
    drawPixel(ctx, 13, y - 3, pal.black); drawPixel(ctx, 12, y - 2, pal.black);
    // Legs up
    drawPart(ctx, 8, y - 4, 4, 5, pal.skin_dark);
    drawPart(ctx, 13, y - 4, 4, 5, pal.skin_dark);
}

export function enemyPainter(ctx: CanvasRenderingContext2D, w: World, e: number) {
    const t = get<Transform>(w, 'transform', e);
    const s = get<StateMachine>(w, 'state', e);
    const h = get<Health>(w, 'health', e);
    const pal = get<Palette>(w, 'palette', e);

    if (!t || !s || !h || !pal) return;

    if (s.invulnFrames > 0 && Math.floor(s.invulnFrames * 25) % 2 === 0) {
        return;
    }
    
    ctx.save();
    ctx.scale(t.facing, 1);
    ctx.translate(t.facing === -1 ? -t.size.x : 0, 0);

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(t.size.x / 2, t.size.y, t.size.x / 3, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Default Kremling Painter logic
    switch (s.state) {
        case 'dying':
            drawKremlingDefeated(ctx, pal);
            break;
        case 'stunned':
            drawKremlingStunned(ctx, s, pal);
            break;
        case 'charge_anticipation':
            drawKremlingChargeAnticipation(ctx, s, pal);
            break;
        case 'charging':
            drawKremlingWalkCycle(ctx, s, pal, true);
            break;
        case 'patrol':
        case 'chase':
        default:
            drawKremlingWalkCycle(ctx, s, pal, s.state === 'chase');
            break;
    }

    ctx.restore();
    
    // Health bar
    if (h.hp < h.maxHp && h.hp > 0) {
        const barWidth = t.size.x * 0.6;
        const barHeight = 8;
        const barX = (t.size.x - barWidth) / 2;
        const barY = -20;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        const healthPercent = h.hp / h.maxHp;
        ctx.fillStyle = '#f87171';
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
        
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
    }
}

// --- KLAPTRAP PAINTER (HD Version) ---
const drawKlaptrapWalk = (ctx: CanvasRenderingContext2D, s: StateMachine, pal: Palette) => {
    const f = Math.floor(s.animTime * 12) % 8;
    const bob = [0, 1, 1.5, 1, 0, -0.5, -1, -0.5][f];
    const bodyY = 4 + bob;

    const legFrames = [
        { bl: { x: 1, y: 11, h: 4 }, fl: { x: 8, y: 12, h: 3 } },
        { bl: { x: 2, y: 12, h: 3 }, fl: { x: 7, y: 11, h: 4 } },
        { bl: { x: 4, y: 12, h: 3 }, fl: { x: 5, y: 10, h: 5 } },
        { bl: { x: 6, y: 11, h: 4 }, fl: { x: 3, y: 11, h: 4 } },
        { bl: { x: 8, y: 12, h: 3 }, fl: { x: 1, y: 11, h: 4 } },
        { bl: { x: 7, y: 11, h: 4 }, fl: { x: 2, y: 12, h: 3 } },
        { bl: { x: 5, y: 10, h: 5 }, fl: { x: 4, y: 12, h: 3 } },
        { bl: { x: 3, y: 11, h: 4 }, fl: { x: 6, y: 11, h: 4 } },
    ];
    const frame = legFrames[f];
    const mouthOpen = f % 4 < 2;

    // Back Legs
    drawPart(ctx, frame.bl.x, frame.bl.y, 2, frame.bl.h, pal.body_shadow);
    drawPart(ctx, frame.bl.x - 1, frame.bl.y + frame.bl.h, 4, 2, pal.body_shadow); // Foot

    // Front Legs
    drawPart(ctx, frame.fl.x, frame.fl.y, 2, frame.fl.h, pal.body);
    drawPart(ctx, frame.fl.x - 1, frame.fl.y + frame.fl.h, 4, 2, pal.body); // Foot

    // Tail
    drawPart(ctx, -2, bodyY + 4, 4, 2, pal.body_shadow);
    drawPart(ctx, -3, bodyY + 2, 3, 2, pal.body);

    // Body
    drawPart(ctx, 0, bodyY, 14, 8, pal.body_shadow);
    drawPart(ctx, 0, bodyY, 13, 7, pal.body);
    // Stripes
    drawPart(ctx, 1, bodyY + 1, 2, 4, pal.stripe);
    drawPart(ctx, 5, bodyY + 1, 2, 4, pal.stripe);
    // Underbelly
    drawPart(ctx, 1, bodyY + 6, 11, 3, pal.underbelly_shadow);
    drawPart(ctx, 1, bodyY + 6, 11, 2, pal.underbelly);

    // Head/Snout
    if (mouthOpen) {
        drawPart(ctx, 11, bodyY, 5, 4, pal.body_shadow);
        drawPart(ctx, 11, bodyY, 4, 3, pal.body);
        drawPart(ctx, 12, bodyY + 3, 3, 1, pal.tooth);
        drawPart(ctx, 11, bodyY + 5, 4, 3, pal.body_shadow);
        drawPart(ctx, 11, bodyY + 5, 4, 2, pal.underbelly);
        drawPart(ctx, 12, bodyY + 5, 3, 1, pal.tooth);
        drawPart(ctx, 12, bodyY + 3, 2, 2, pal.mouth_inside);
    } else { 
        drawPart(ctx, 11, bodyY + 2, 5, 4, pal.body_shadow);
        drawPart(ctx, 11, bodyY + 2, 4, 3, pal.body);
        drawPart(ctx, 11, bodyY + 4, 4, 2, pal.underbelly);
        drawPixel(ctx, 15, bodyY + 3, pal.tooth);
    }
    
    // Eyes
    drawPart(ctx, 5, bodyY - 4, 5, 5, pal.eye);
    drawPart(ctx, 6, bodyY - 3, 3, 3, pal.pupil);
    drawPixel(ctx, 6, bodyY - 3, pal.eye); 
};

const drawKlaptrapDefeated = (ctx: CanvasRenderingContext2D, s: StateMachine, pal: Palette) => {
    const twitch = Math.sin(s.animTime * 20) * 0.5;
    const y = 8;
    drawPart(ctx, 1, y + 2, 14, 8, pal.body_shadow);
    drawPart(ctx, 2, y + 2, 12, 7, pal.underbelly); 
    drawPart(ctx, 4, y - 4, 8, 7, pal.underbelly);
    drawPart(ctx, 5, y - 5, 6, 1, pal.body); 
    ctx.fillStyle = pal.pupil;
    drawPixel(ctx, 6, y-2, pal.pupil); drawPixel(ctx, 7, y-3, pal.pupil);
    drawPixel(ctx, 7, y-2, pal.pupil); drawPixel(ctx, 6, y-3, pal.pupil);
    drawPixel(ctx, 10, y-2, pal.pupil); drawPixel(ctx, 11, y-3, pal.pupil);
    drawPixel(ctx, 11, y-2, pal.pupil); drawPixel(ctx, 10, y-3, pal.pupil);
    drawPart(ctx, 3 + twitch, y - 2, 2, 5, pal.body_shadow); 
    drawPart(ctx, 6 - twitch, y - 3, 2, 5, pal.body);      
    drawPart(ctx, 11 + twitch, y - 3, 2, 5, pal.body_shadow); 
    drawPart(ctx, 14 - twitch, y - 2, 2, 5, pal.body);      
};

export function klaptrapPainter(ctx: CanvasRenderingContext2D, w: World, e: number) {
     const t = get<Transform>(w, 'transform', e);
    const s = get<StateMachine>(w, 'state', e);
    const h = get<Health>(w, 'health', e);
    const pal = get<Palette>(w, 'palette', e);
    if (!t || !s || !h || !pal) return;

    if (s.invulnFrames > 0 && Math.floor(s.invulnFrames * 25) % 2 === 0) return;
    
    ctx.save();
    ctx.scale(t.facing, 1);
    ctx.translate(t.facing === -1 ? -t.size.x : 0, 0);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(t.size.x / 2, t.size.y - (p*1.5), t.size.x / 3, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    switch (s.state) {
        case 'dying':
            drawKlaptrapDefeated(ctx, s, pal);
            break;
        case 'patrol':
        default:
            drawKlaptrapWalk(ctx, s, pal);
            break;
    }
    
    ctx.restore();
}

// --- SNAKE PAINTER ---
const drawSnake = (ctx: CanvasRenderingContext2D, s: StateMachine, pal: Palette, isSpitting: boolean, isAnticipating: boolean) => {
    const time = s.animTime;
    const idleSway = Math.sin(time * 3) * 2;
    const bodyY = 12;
    drawPart(ctx, 2, bodyY + 12, 16, 6, pal.body_shadow);
    drawPart(ctx, 2, bodyY + 12, 15, 5, pal.body);
    drawPart(ctx, 3, bodyY + 14, 14, 2, pal.belly);
    drawPart(ctx, 4, bodyY + 7, 12, 6, pal.body_shadow);
    drawPart(ctx, 4, bodyY + 7, 11, 5, pal.body);
    drawPart(ctx, 5, bodyY + 9, 10, 2, pal.belly);
    let headX = 8 + idleSway * 0.5;
    let headY = bodyY;
    let headAngle = idleSway * 0.05;
    if (isAnticipating) { headX -= 4; headY += 2; headAngle -= 0.3; } 
    else if (isSpitting) { const lunge = Math.sin(Math.min(1, s.animTime * 5) * Math.PI) * 10; headX += lunge; headY -= 2; headAngle += 0.2; }
    ctx.save();
    ctx.translate(headX * p, headY * p);
    ctx.rotate(headAngle);
    drawPart(ctx, -2, 0, 6, 8, pal.body);
    drawPart(ctx, -1, 0, 4, 8, pal.belly);
    drawPart(ctx, 0, -6, 10, 7, pal.body_shadow);
    drawPart(ctx, 0, -6, 9, 6, pal.body);
    if (isSpitting) { drawPart(ctx, 4, -1, 6, 4, pal.body_shadow); drawPart(ctx, 4, -1, 5, 3, pal.belly); drawPart(ctx, 0, -6, 9, 4, pal.body); drawPart(ctx, 6, -3, 1, 2, '#fff'); } 
    else { drawPart(ctx, 4, -2, 6, 3, pal.belly); }
    drawPart(ctx, 3, -5, 3, 3, '#fff');
    drawPixel(ctx, 5, -4, pal.eye);
    ctx.restore();
};

const drawSnakeDefeated = (ctx: CanvasRenderingContext2D, s: StateMachine, pal: Palette) => {
    const y = 20;
    drawPart(ctx, 0, y, 8, 6, pal.belly);
    drawPart(ctx, 7, y+2, 8, 6, pal.belly);
    drawPart(ctx, 14, y, 8, 6, pal.belly);
    drawPart(ctx, 20, y+4, 6, 4, pal.body); 
    ctx.save();
    ctx.translate(4 * p, y * p);
    ctx.rotate(Math.PI + 0.2);
    drawPart(ctx, 0, -6, 10, 7, pal.body_shadow);
    drawPart(ctx, 0, -6, 9, 6, pal.body);
    drawPart(ctx, 4, -2, 6, 3, pal.belly);
    drawPixel(ctx, 4, -4, '#000'); drawPixel(ctx, 6, -4, '#000');
    drawPixel(ctx, 5, -3, '#000');
    drawPixel(ctx, 4, -2, '#000'); drawPixel(ctx, 6, -2, '#000');
    ctx.restore();
};

export function snakePainter(ctx: CanvasRenderingContext2D, w: World, e: number) {
    const t = get<Transform>(w, 'transform', e);
    const s = get<StateMachine>(w, 'state', e);
    const h = get<Health>(w, 'health', e);
    const pal = get<Palette>(w, 'palette', e);
    if (!t || !s || !h || !pal) return;
    if (s.invulnFrames > 0 && Math.floor(s.invulnFrames * 25) % 2 === 0) return;
    ctx.save();
    ctx.scale(t.facing, 1);
    ctx.translate(t.facing === -1 ? -t.size.x : 0, 0);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(t.size.x / 2, t.size.y - 4, t.size.x / 2.5, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    switch(s.state) {
        case 'dying': drawSnakeDefeated(ctx, s, pal); break;
        case 'anticipation': drawSnake(ctx, s, pal, false, true); break;
        case 'spitting': drawSnake(ctx, s, pal, true, false); break;
        default: drawSnake(ctx, s, pal, false, false); break;
    }
    ctx.restore();
    if (h.hp < h.maxHp && h.hp > 0) {
        const barWidth = t.size.x * 0.8;
        const barHeight = 5;
        const barX = (t.size.x - barWidth) / 2;
        const barY = -12;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        const healthPercent = h.hp / h.maxHp;
        ctx.fillStyle = '#f87171';
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
    }
}
