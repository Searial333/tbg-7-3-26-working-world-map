
import type { World, Vec2 } from '../../types';
import { get } from '../ecs';
import type { Palette, StateMachine, Transform, Kinematics, Abilities } from '../components';
import { drawDynamics } from '../systems/attachmentSystem';

const p = 4; // pixel size

const drawPart = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, c: string) => {
    ctx.fillStyle = c;
    ctx.fillRect(Math.floor(x * p), Math.floor(y * p), w * p, h * p);
};
const drawPixel = (ctx: CanvasRenderingContext2D, x: number, y: number, c: string) => {
    ctx.fillStyle = c;
    ctx.fillRect(Math.floor(x * p), Math.floor(y * p), p, p);
};

const getPupilOffset = (t: Transform, a: Abilities, defaultX: number = 0): { x: number; y: number } => {
    if (a.context.lookTarget) {
        const headX = t.pos.x + t.size.x / 2;
        const headY = t.pos.y + 8 * p;
        const vecX = a.context.lookTarget.x - headX;
        const vecY = a.context.lookTarget.y - headY;
        const mag = Math.hypot(vecX, vecY);
        if (mag > p * 4) { 
            return { x: Math.round(vecX / mag), y: Math.round(vecY / mag) };
        }
    }
    const moveDirection = Math.abs(t.vel.x) > 5 ? Math.sign(t.vel.x) * t.facing : 0;
    return { x: defaultX || moveDirection, y: 0 };
};

const drawHead = (ctx: CanvasRenderingContext2D, t: Transform, s: StateMachine, pal: Palette, a: Abilities, yOff: number = 0) => {
    drawPart(ctx, 4, 3 + yOff, 12, 9, pal.body);
    drawPart(ctx, 5, 2 + yOff, 10, 11, pal.body);
    drawPart(ctx, 4, 1 + yOff, 4, 4, pal.body_light);
    drawPart(ctx, 12, 1 + yOff, 4, 4, pal.body_light);
    drawPart(ctx, 4, 5 + yOff, 12, 4, pal.bandana_dark);
    drawPart(ctx, 4, 6 + yOff, 12, 3, pal.bandana);
    drawPart(ctx, 4, 5 + yOff, 12, 1, pal.bandana_highlight);
    drawPart(ctx, 6, 8 + yOff, 8, 4, pal.snout_dark);
    drawPart(ctx, 7, 9 + yOff, 6, 3, pal.snout);
    drawPart(ctx, 9, 10 + yOff, 2, 1, pal.nose);
    
    const timeInCycle = s.animTime % 8;
    let lookDirection: 'forward' | 'away' = 'forward';
    if (s.state === 'idle' && timeInCycle > 6 && timeInCycle < 7) {
        lookDirection = 'away';
    }

    const pupilOffset = getPupilOffset(t, a);
    if (a.context.lookTarget) {
        lookDirection = 'forward';
    }
    
    const eyeX1 = lookDirection === 'away' ? 8 : 7;
    const eyeX2 = lookDirection === 'away' ? 11 : 12;

    if (s.state === 'hot_foot') {
        // Pained expression
        drawPart(ctx, 6, 8 + yOff, 3, 1, 'white');
        drawPart(ctx, 11, 8 + yOff, 3, 1, 'white');
        drawPixel(ctx, 7, 8 + yOff, '#ff5555'); // Stressed eyes
        drawPixel(ctx, 12, 8 + yOff, '#ff5555');
        drawPart(ctx, 8, 11 + yOff, 4, 2, '#331100'); // Ouch mouth
    } else {
        drawPart(ctx, 6, 8 + yOff, 3, 1, 'white');
        drawPart(ctx, 11, 8 + yOff, 3, 1, 'white');
        drawPixel(ctx, eyeX1 + pupilOffset.x, 8 + yOff + pupilOffset.y, pal.eye);
        drawPixel(ctx, eyeX2 + pupilOffset.x, 8 + yOff + pupilOffset.y, pal.eye);
    }
}

const drawQuarterTurnHead = (ctx: CanvasRenderingContext2D, t: Transform, pal: Palette, a: Abilities, yOff: number = 0) => {
    drawPart(ctx, 4, 3 + yOff, 11, 9, pal.body);
    drawPart(ctx, 5, 2 + yOff, 9, 11, pal.body);
    drawPart(ctx, 4, 1 + yOff, 4, 4, pal.body_light); 
    drawPart(ctx, 11, 2 + yOff, 3, 3, pal.body_light); 
    drawPart(ctx, 4, 5 + yOff, 11, 4, pal.bandana_dark);
    drawPart(ctx, 4, 6 + yOff, 11, 3, pal.bandana);
    drawPart(ctx, 4, 5 + yOff, 11, 1, pal.bandana_highlight);
    drawPart(ctx, 9, 8 + yOff, 6, 4, pal.snout_dark);
    drawPart(ctx, 10, 9 + yOff, 5, 3, pal.snout);
    drawPart(ctx, 12, 10 + yOff, 2, 1, pal.nose);
    drawPart(ctx, 7, 8 + yOff, 3, 1, 'white'); 
    drawPart(ctx, 11, 8 + yOff, 2, 1, 'white'); 
    
    const pupilOffset = getPupilOffset(t, a, 1);
    drawPixel(ctx, 8 + pupilOffset.x, 8 + yOff + pupilOffset.y, pal.eye);
    drawPixel(ctx, 11 + pupilOffset.x, 8 + yOff + pupilOffset.y, pal.eye);
};

const drawDiaper = (ctx: CanvasRenderingContext2D, bodyY: number, xOffset: number = 0) => {
    const diaperBase = '#F5EFE6';
    const diaperShadow = '#D8CFC2';
    const diaperHighlight = '#FFFFFF';
    const fastenerGold = '#FFD700';
    const fastenerShadow = '#E6A200';
    const y = bodyY + 7;
    const x = xOffset + 1;
    drawPart(ctx, 4 + x, y, 10, 5, diaperShadow);
    drawPart(ctx, 4 + x, y, 10, 4, diaperBase);
    drawPart(ctx, 6 + x, y + 1, 6, 2, diaperHighlight);
    drawPart(ctx, 5 + x, y, 8, 2, diaperBase);
    drawPart(ctx, 5 + x, y, 8, 1, diaperShadow);
    drawPart(ctx, 4 + x, y + 3, 2, 2, diaperBase);
    drawPart(ctx, 12 + x, y + 3, 2, 2, diaperBase);
    drawPart(ctx, 4 + x, y + 1, 1, 2, fastenerShadow);
    drawPart(ctx, 13 + x, y + 1, 1, 2, fastenerShadow);
    drawPart(ctx, 4 + x, y + 1, 1, 1, fastenerGold);
    drawPart(ctx, 13 + x, y + 1, 1, 1, fastenerGold);
};

const drawBottleHorizontal = (ctx: CanvasRenderingContext2D, x: number, y: number, angle: number = 0) => {
    ctx.save();
    ctx.translate(x * p, y * p);
    ctx.rotate(angle * Math.PI / 180);
    drawPart(ctx, 0, -3, 8, 6, '#FFFFFFE0');
    drawPart(ctx, 8, -4, 2, 8, '#89CFF0E0');
    drawPart(ctx, 10, -2, 3, 4, '#B2FFFFE0');
    ctx.restore();
};

const drawBottleVertical = (ctx: CanvasRenderingContext2D, x: number, y: number, angle: number = 0) => {
    ctx.save();
    ctx.translate(x * p, y * p);
    ctx.rotate(angle * Math.PI / 180);
    drawPart(ctx, -4, 0, 8, 10, '#FFFFFFE0');
    drawPart(ctx, -5, -2, 10, 2, '#89CFF0E0');
    drawPart(ctx, -2, -5, 4, 3, '#B2FFFFE0');
    ctx.restore();
};

const drawIdleSprite = (ctx: CanvasRenderingContext2D, t: Transform, s: StateMachine, pal: Palette, a: Abilities) => {
    const breathFrame = Math.floor(s.animTime * 3.5) % 8;
    const bob = [0, 0, 1, 1, 1, 1, 0, 0][breathFrame];
    const bodyY = 11 + bob;
    drawPart(ctx, 2, bodyY + 1, 3, 7, pal.body_shadow);
    const legY = 20 + bob;
    drawPart(ctx, 5, legY, 4, 4, pal.body);
    drawPart(ctx, 4, legY + 3, 5, 2, pal.body_shadow);
    drawPart(ctx, 4, bodyY, 12, 10, pal.body_shadow);
    drawPart(ctx, 4, bodyY, 12, 9, pal.body);
    drawPart(ctx, 5, bodyY + 1, 10, 8, pal.vest_shadow);
    drawPart(ctx, 6, bodyY + 1, 8, 7, pal.vest);
    drawPart(ctx, 6, bodyY + 1, 8, 1, pal.vest_light);
    if (a.context.hasDiaper) drawDiaper(ctx, bodyY);
    drawPart(ctx, 11, legY, 4, 4, pal.body);
    drawPart(ctx, 11, legY + 3, 5, 2, pal.body_shadow);
    drawHead(ctx, t, s, pal, a, bob);
    drawPart(ctx, 15, bodyY + 1, 3, 7, pal.body);
};

const drawRunSprite = (ctx: CanvasRenderingContext2D, t: Transform, s: StateMachine, pal: Palette, a: Abilities) => {
    const f = Math.floor(s.animTime * 12) % 8;
    const bodyY = [2, 1, 0, 1, 2, 1, 0, 1][f] + 10;
    const armFrames = [ [[0, 13, 3, 4], [15, 13, 4, 3]], [[2, 13, 3, 3], [13, 13, 3, 3]], [[15, 13, 3, 3], [0, 13, 4, 4]], [[16, 13, 3, 3], [-1, 13, 4, 4]], [[15, 13, 3, 3], [0, 13, 4, 4]], [[13, 13, 3, 3], [2, 13, 3, 3]], [[0, 13, 3, 4], [15, 13, 4, 3]], [[-1, 13, 3, 4], [16, 13, 4, 3]] ];
    const backArm = armFrames[f][0];
    const frontArm = armFrames[f][1];
    const legY = 10 + bodyY;
    let backLegArgs: [number, number, number, number, string];
    let frontLegArgs: [number, number, number, number, string];
    if (f < 4) { 
        backLegArgs = [4, legY, 4, 4, pal.body]; 
        frontLegArgs = [12, legY - 2, 4, 4, pal.body_shadow];
    } else {
        backLegArgs = [12, legY, 4, 4, pal.body];
        frontLegArgs = [4, legY - 2, 4, 4, pal.body_shadow];
    }
    drawPart(ctx, backArm[0], backArm[1] + bodyY - 10, backArm[2], backArm[3], pal.body_shadow);
    drawPart(ctx, ...backLegArgs);
    drawPart(ctx, 4, 1 + bodyY, 11, 10, pal.body_shadow);
    drawPart(ctx, 4, 1 + bodyY, 11, 9, pal.body);
    drawPart(ctx, 5, 2 + bodyY, 9, 8, pal.vest);
    if (a.context.hasDiaper) {
        const diaperXOffset = [0, 0, -0.5, 0, 0, 0, 0.5, 0][f];
        drawDiaper(ctx, bodyY, diaperXOffset);
    }
    drawPart(ctx, ...frontLegArgs);
    drawQuarterTurnHead(ctx, t, pal, a, bodyY - 10);
    drawPart(ctx, frontArm[0], frontArm[1] + bodyY - 10, frontArm[2], frontArm[3], pal.body);
};

const drawHotFootSprite = (ctx: CanvasRenderingContext2D, t: Transform, s: StateMachine, pal: Palette, a: Abilities) => {
    const f = Math.floor(s.animTime * 15) % 4;
    const bob = [0, -2, 0, -2][f];
    const bodyY = 11 + bob;
    
    // Smoking feet/Pain colors
    const ouchColor = '#ff4444';
    
    drawPart(ctx, 1, bodyY + 4, 3, 4, pal.body_shadow); // arm back
    drawPart(ctx, 4, bodyY, 12, 10, pal.body_shadow);
    drawPart(ctx, 4, bodyY, 12, 9, pal.body);
    drawPart(ctx, 5, bodyY+1, 10, 8, pal.vest);
    if (a.context.hasDiaper) drawDiaper(ctx, bodyY);

    // Flailing legs
    const legL = f % 2 === 0 ? 20 : 23;
    const legR = f % 2 === 1 ? 20 : 23;
    
    drawPart(ctx, 5, legL, 4, 4, ouchColor); // RED FEET
    drawPart(ctx, 11, legR, 4, 4, ouchColor);

    drawHead(ctx, t, s, pal, a, bob);
    drawPart(ctx, 16, bodyY + 4, 3, 4, pal.body); // arm front
};

const drawJumpTakeoffSprite = (ctx: CanvasRenderingContext2D, t: Transform, pal: Palette, a: Abilities) => {
    const bodyY = 13;
    drawPart(ctx, 1, bodyY + 3, 3, 4, pal.body_shadow);
    const legY = 21;
    drawPart(ctx, 5, legY, 4, 4, pal.body_shadow);
    drawPart(ctx, 4, bodyY, 12, 9, pal.body_shadow);
    drawPart(ctx, 4, bodyY, 12, 8, pal.body);
    drawPart(ctx, 5, bodyY + 1, 10, 7, pal.vest);
    drawPart(ctx, 6, bodyY + 1, 8, 1, pal.vest_light);
    if(a.context.hasDiaper) drawDiaper(ctx, bodyY);
    drawPart(ctx, 11, legY, 4, 4, pal.body);
    drawQuarterTurnHead(ctx, t, pal, a, 2);
    drawPart(ctx, 16, bodyY + 3, 3, 4, pal.body);
};

const drawForwardJumpTakeoffSprite = (ctx: CanvasRenderingContext2D, t: Transform, s: StateMachine, pal: Palette, a: Abilities) => {
    const bodyY = 14;
    const legY = 22;
    drawPart(ctx, 2, bodyY + 1, 3, 5, pal.body_shadow);
    drawPart(ctx, 5, legY, 4, 3, pal.body_shadow);
    drawPart(ctx, 11, legY, 4, 3, pal.body_shadow);
    drawPart(ctx, 4, bodyY, 12, 8, pal.body_shadow);
    drawPart(ctx, 4, bodyY, 12, 7, pal.body);
    drawPart(ctx, 5, bodyY + 1, 10, 6, pal.vest);
    if (a.context.hasDiaper) drawDiaper(ctx, bodyY);
    drawHead(ctx, t, s, pal, a, 3);
    drawPart(ctx, 15, bodyY + 1, 3, 5, pal.body);
};

const drawJumpSprite = (ctx: CanvasRenderingContext2D, t: Transform, pal: Palette, a: Abilities) => {
    const isFalling = t.vel.y > 2;
    const legYOff = isFalling ? 2 : 0;
    const bodyY = 11;
    drawPart(ctx, 1, bodyY + 2, 3, 4, pal.body_shadow);
    drawPart(ctx, 5, 20 + legYOff, 4, 4, pal.body_shadow);
    drawPart(ctx, 4, bodyY, 12, 10, pal.body_shadow);
    drawPart(ctx, 4, bodyY, 12, 9, pal.body);
    drawPart(ctx, 5, bodyY+1, 10, 8, pal.vest);
    if (a.context.hasDiaper) drawDiaper(ctx, bodyY);
    drawPart(ctx, 11, 20 + legYOff, 4, 4, pal.body);
    drawQuarterTurnHead(ctx, t, pal, a);
    drawPart(ctx, 16, bodyY + 2, 3, 4, pal.body);
};

const drawForwardJumpSprite = (ctx: CanvasRenderingContext2D, t: Transform, s: StateMachine, pal: Palette, a: Abilities) => {
    const isFalling = t.vel.y > 2;
    const legYOff = isFalling ? 2 : -2;
    const bodyY = 11;
    drawPart(ctx, 1, bodyY + 2, 3, 5, pal.body_shadow);
    drawPart(ctx, 5, 20 + legYOff, 4, 4, pal.body_shadow);
    drawPart(ctx, 11, 20 + legYOff, 4, 4, pal.body_shadow);
    drawPart(ctx, 4, bodyY, 12, 10, pal.body_shadow);
    drawPart(ctx, 4, bodyY, 12, 9, pal.body);
    drawPart(ctx, 5, bodyY+1, 10, 8, pal.vest);
    if (a.context.hasDiaper) drawDiaper(ctx, bodyY);
    drawHead(ctx, t, s, pal, a, 0);
    drawPart(ctx, 16, bodyY + 2, 3, 5, pal.body);
};

const drawRollSprite = (ctx: CanvasRenderingContext2D, s: StateMachine, pal: Palette, t: Transform) => {
    ctx.save();
    const centerX = t.size.x / 2 / p;
    const centerY = (t.size.y / p) - 6; 
    const rotation = s.animTime * (Math.abs(t.vel.x) / (p * 4));
    ctx.translate(centerX * p, centerY * p);
    ctx.rotate(rotation);
    ctx.translate(-centerX * p, -centerY * p);
    const yOff = 8; 
    drawPart(ctx, 4, yOff + 2, 12, 8, pal.body_shadow);
    drawPart(ctx, 6, yOff, 8, 12, pal.body_shadow);
    drawPart(ctx, 5, yOff + 2, 10, 8, pal.body);
    drawPart(ctx, 6, yOff + 1, 8, 10, pal.body);
    drawPart(ctx, 7, yOff + 2, 2, 2, pal.body_light);
    drawPart(ctx, 11, yOff + 4, 2, 2, pal.body_light);
    drawPart(ctx, 6, yOff + 7, 2, 2, pal.body_light);
    drawPart(ctx, 9, yOff + 1, 2, 2, pal.bandana_highlight);
    drawPart(ctx, 11, yOff + 3, 2, 4, pal.bandana);
    drawPart(ctx, 9, yOff + 7, 2, 4, pal.bandana);
    drawPart(ctx, 7, yOff + 5, 2, 2, pal.bandana);
    drawPart(ctx, 5, yOff + 3, 2, 2, pal.bandana_dark);
    ctx.restore();
}

const drawDashSprite = (ctx: CanvasRenderingContext2D, t: Transform, pal: Palette, a: Abilities) => {
    const bodyY = 14;
    drawPart(ctx, -2, 19, 4, 3, pal.body);
    drawPart(ctx, 2, bodyY, 18, 8, pal.body_shadow);
    drawPart(ctx, 2, bodyY, 18, 7, pal.body);
    drawPart(ctx, 3, bodyY+1, 16, 6, pal.vest);
    if(a.context.hasDiaper) drawDiaper(ctx, bodyY, 1);
    drawPart(ctx, 10, 21, 4, 3, pal.body_shadow);
    drawQuarterTurnHead(ctx, t, pal, a, 2);
    drawPart(ctx, 17, bodyY + 2, 4, 3, pal.body);
};

const drawDyingSprite = (ctx: CanvasRenderingContext2D, s: StateMachine, pal: Palette) => {
    ctx.save();
    const rot = s.animTime * 20;
    ctx.translate(10 * p, 12 * p);
    ctx.rotate(rot);
    ctx.translate(-10 * p, -12 * p);
    drawPart(ctx, 4, 11, 12, 10, pal.body);
    drawPart(ctx, 6, 8, 3, 1, 'white');
    drawPart(ctx, 11, 8, 3, 1, 'white');
    drawPixel(ctx, 7, 8, pal.eye);
    drawPixel(ctx, 12, 8, pal.eye);
    ctx.restore();
}

const drawWallSlideSprite = (ctx: CanvasRenderingContext2D, t: Transform, pal: Palette, a: Abilities) => {
    const bodyY = 12;
    drawPart(ctx, 3, bodyY + 3, 3, 3, pal.body_shadow);
    drawPart(ctx, 5, 20, 4, 4, pal.body_shadow);
    drawPart(ctx, 5, bodyY, 11, 10, pal.body_shadow);
    drawPart(ctx, 5, bodyY, 11, 9, pal.body);
    drawPart(ctx, 6, bodyY + 1, 9, 8, pal.vest);
    if(a.context.hasDiaper) drawDiaper(ctx, bodyY);
    drawPart(ctx, 15, bodyY + 5, 4, 3, pal.body);
    drawPart(ctx, 11, 21, 4, 4, pal.body);
    drawQuarterTurnHead(ctx, t, pal, a, 0); 
};

const drawSlamSprite = (ctx: CanvasRenderingContext2D, t: Transform, s: StateMachine, pal: Palette, a: Abilities) => {
    const bodyY = 11;
    drawPart(ctx, 1, bodyY - 2, 3, 5, pal.body_shadow);
    drawPart(ctx, 16, bodyY - 2, 3, 5, pal.body);
    drawPart(ctx, 5, 20, 4, 4, pal.body_shadow);
    drawPart(ctx, 11, 20, 4, 4, pal.body_shadow);
    drawPart(ctx, 4, bodyY, 12, 10, pal.body_shadow);
    drawPart(ctx, 4, bodyY, 12, 9, pal.body);
    drawPart(ctx, 5, bodyY+1, 10, 8, pal.vest);
    if (a.context.hasDiaper) drawDiaper(ctx, bodyY);
    drawHead(ctx, t, s, pal, a, 0);
};

const drawBottleSprite = (ctx: CanvasRenderingContext2D, t: Transform, s: StateMachine, pal: Palette, a: Abilities, w: World, e: number) => {
    let shakeY = 0, shakeAngle = 0;
    let chargePercent = 0;
    if (s.state === 'bottleCharge' && (a.context.bottleCharge ?? 0) > 0.1) {
        const k = get<Kinematics>(w, 'kinematics', e)!;
        chargePercent = Math.min(1, (a.context.bottleCharge ?? 0) / k.bottleChargeTime);
        shakeY = Math.sin(s.animTime * 50) * (1 + chargePercent);
        shakeAngle = Math.cos(s.animTime * 50) * (5 + 5 * chargePercent);
    }
    const drawGlow = () => {
        if (chargePercent > 0) {
            const bottleY = t.onGround ? (13 + 4) : (11 + 4);
            const bottlePos = { x: (14 + 4) * p, y: (bottleY + shakeY) * p }; 
            const maxGlowRadius = 24 * p;
            const glowRadius = maxGlowRadius * chargePercent;
            const grad = ctx.createRadialGradient(bottlePos.x, bottlePos.y, glowRadius * 0.2, bottlePos.x, bottlePos.y, glowRadius);
            const glowColor = chargePercent >= 1 ? '255, 255, 0' : '137, 207, 240';
            grad.addColorStop(0, `rgba(${glowColor}, 0.5)`);
            grad.addColorStop(1, `rgba(${glowColor}, 0)`);
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(bottlePos.x, bottlePos.y, glowRadius, 0, Math.PI * 2);
            ctx.fill();
        }
    };
    if (t.onGround) {
        const bodyY = 13;
        const legY = 21;
        if (s.state === 'bottleShootTap') {
            drawPart(ctx, 2, bodyY + 5, 4, 3, pal.body_shadow);
        } else {
            drawPart(ctx, 12, (bodyY + 4) - 3 + shakeY, 4, 3, pal.body_shadow);
        }
        drawPart(ctx, 5, legY, 4, 4, pal.body_shadow);
        drawPart(ctx, 4, bodyY, 12, 9, pal.body_shadow);
        drawPart(ctx, 4, bodyY, 12, 8, pal.body);
        drawPart(ctx, 5, bodyY + 1, 10, 7, pal.vest);
        if(a.context.hasDiaper) drawDiaper(ctx, bodyY);
        drawPart(ctx, 11, legY, 4, 4, pal.body);
        drawQuarterTurnHead(ctx, t, pal, a, 2);
        drawGlow();
        if (s.state === 'bottleShootTap') {
            const recoil = s.animTime < 0.1 ? -4 : 0;
            drawBottleVertical(ctx, 10 + recoil, bodyY + 3, -15);
            drawPart(ctx, 14, bodyY + 7, 4, 3, pal.body);
        } else {
            const bottleY_ground = bodyY + 4;
            drawBottleHorizontal(ctx, 14, bottleY_ground + shakeY, shakeAngle);
            drawPart(ctx, 12, bottleY_ground + 1 + shakeY, 4, 3, pal.body);
        }
    } else {
        const isFalling = t.vel.y > 2;
        const legYOff = isFalling ? 2 : 0;
        const bodyY = 11;
        if (s.state !== 'bottleShootTap') {
             drawPart(ctx, 12, (bodyY + 4) - 3 + shakeY, 4, 3, pal.body_shadow);
        } else {
            drawPart(ctx, 2, bodyY + 5, 4, 3, pal.body_shadow);
        }
        drawPart(ctx, 5, 20 + legYOff, 4, 4, pal.body_shadow);
        drawPart(ctx, 4, bodyY, 12, 10, pal.body_shadow);
        drawPart(ctx, 4, bodyY, 12, 9, pal.body);
        drawPart(ctx, 5, bodyY + 1, 10, 8, pal.vest);
        if (a.context.hasDiaper) drawDiaper(ctx, bodyY);
        drawPart(ctx, 11, 20 + legYOff, 4, 4, pal.body);
        drawQuarterTurnHead(ctx, t, pal, a);
        drawGlow();
        if (s.state === 'bottleShootTap') {
            const recoil = s.animTime < 0.1 ? -4 : 0;
            drawBottleVertical(ctx, 10 + recoil, bodyY + 3, -15);
            drawPart(ctx, 14, bodyY + 7, 4, 3, pal.body);
        } else {
            const bottleY_air = bodyY + 4;
            drawBottleHorizontal(ctx, 14, bottleY_air + shakeY, shakeAngle);
            drawPart(ctx, 12, bottleY_air + 1 + shakeY, 4, 3, pal.body);
        }
    }
}

const drawThrowingDiaperSprite = (ctx: CanvasRenderingContext2D, t: Transform, s: StateMachine, pal: Palette, a: Abilities) => {
    const isWindingUp = s.animTime < 0.15;
    if (t.onGround) {
        const bodyY = 13;
        drawPart(ctx, 1, bodyY + 3, 3, 4, pal.body_shadow);
        const legY = 21;
        drawPart(ctx, 5, legY, 4, 4, pal.body_shadow);
        drawPart(ctx, 4, bodyY, 12, 9, pal.body_shadow);
        drawPart(ctx, 4, bodyY, 12, 8, pal.body);
        drawPart(ctx, 5, bodyY + 1, 10, 7, pal.vest);
        drawPart(ctx, 6, bodyY + 1, 8, 1, pal.vest_light);
        drawPart(ctx, 11, legY, 4, 4, pal.body);
        drawQuarterTurnHead(ctx, t, pal, a, 2);
        if (isWindingUp) {
            drawPart(ctx, 14, bodyY + 6, 4, 3, pal.body);
        } else {
            drawPart(ctx, 16, bodyY + 2, 4, 3, pal.body);
        }
    } else {
        const isFalling = t.vel.y > 2;
        const legYOff = isFalling ? 2 : 0;
        const bodyY = 11;
        drawPart(ctx, 1, bodyY + 3, 3, 4, pal.body_shadow);
        drawPart(ctx, 5, 20 + legYOff, 4, 4, pal.body_shadow);
        drawPart(ctx, 4, bodyY, 12, 10, pal.body_shadow);
        drawPart(ctx, 4, bodyY, 12, 9, pal.body);
        drawPart(ctx, 5, bodyY + 1, 10, 8, pal.vest);
        drawPart(ctx, 11, 20 + legYOff, 4, 4, pal.body);
        drawQuarterTurnHead(ctx, t, pal, a);
        if (isWindingUp) {
            drawPart(ctx, 14, bodyY + 5, 4, 3, pal.body);
        } else {
            drawPart(ctx, 16, bodyY + 2, 4, 3, pal.body);
        }
    }
};

const drawBackflipSprite = (ctx: CanvasRenderingContext2D, t: Transform, s: StateMachine, pal: Palette, a: Abilities) => {
    const progress = Math.min(1, s.animTime / 0.5);
    const rotation = progress * 2 * Math.PI;
    ctx.save();
    ctx.translate(t.size.x / 2, t.size.y / 2);
    ctx.rotate(-rotation);
    ctx.translate(-t.size.x / 2, -t.size.y / 2);
    if (Math.abs(t.vel.x) > 10) {
        drawJumpSprite(ctx, t, pal, a);
    } else {
        drawForwardJumpSprite(ctx, t, s, pal, a);
    }
    ctx.restore();
};

const drawVictoryDanceSprite = (ctx: CanvasRenderingContext2D, t: Transform, s: StateMachine, pal: Palette, a: Abilities) => {
    const time = s.animTime;
    if (time < 2) {
        const bodyY = 14;
        const legY = 22;
        drawPart(ctx, 0, bodyY - 8, 4, 8, pal.body_shadow);
        drawPart(ctx, 5, legY, 4, 3, pal.body_shadow);
        drawPart(ctx, 11, legY, 4, 3, pal.body_shadow);
        drawPart(ctx, 4, bodyY, 12, 8, pal.body_shadow);
        drawPart(ctx, 4, bodyY, 12, 7, pal.body);
        drawPart(ctx, 5, bodyY + 1, 10, 6, pal.vest);
        if (a.context.hasDiaper) drawDiaper(ctx, bodyY);
        drawHead(ctx, t, s, pal, a, 3);
        drawPart(ctx, 16, bodyY - 8, 4, 8, pal.body);
    } else if (time < 4) {
        const spinTime = time - 2;
        const rotation = spinTime * Math.PI * 2;
        ctx.save();
        ctx.translate(t.size.x/2, t.size.y/2);
        ctx.rotate(rotation);
        ctx.translate(-t.size.x/2, -t.size.y/2);
        drawIdleSprite(ctx, t, s, pal, a);
        ctx.restore();
    } else {
        const bodyY = 11;
        const legY = 20;
        drawPart(ctx, 2, bodyY + 1, 3, 7, pal.body_shadow);
        drawPart(ctx, 5, legY, 4, 4, pal.body);
        drawPart(ctx, 4, legY + 3, 5, 2, pal.body_shadow);
        drawPart(ctx, 4, bodyY, 12, 10, pal.body_shadow);
        drawPart(ctx, 4, bodyY, 12, 9, pal.body);
        drawPart(ctx, 5, bodyY + 1, 10, 8, pal.vest);
        if (a.context.hasDiaper) drawDiaper(ctx, bodyY);
        drawPart(ctx, 11, legY, 4, 4, pal.body);
        drawPart(ctx, 11, legY + 3, 5, 2, pal.body_shadow);
        drawHead(ctx, t, s, pal, a, 0);
        drawPart(ctx, 15, bodyY - 2, 3, 5, pal.body); 
        drawPart(ctx, 16, bodyY - 4, 1, 2, pal.body); 
        drawPart(ctx, 18, bodyY - 4, 1, 2, pal.body);
    }
};

// Helper function to draw dynamic parts (attachments) in World Space
// This temporarily un-does the local entity translation to draw in global space
function drawAttachmentsLayer(ctx: CanvasRenderingContext2D, w: World, e: number) {
    if (!w.visualSettings.characterAttachments) return;
    
    const t = get<Transform>(w, 'transform', e);
    if (!t) return;

    ctx.save();
    // Undo the entity-local translation applied by renderSystem to return to World Space
    // NOTE: This preserves the global scale and camera translation applied by renderSystem
    ctx.translate(-Math.floor(t.pos.x), -Math.floor(t.pos.y));
    
    // Draw dynamics (chains/ribbons) which are computed in absolute world coordinates
    drawDynamics(ctx, w, e);
    
    ctx.restore();
}

export function pixelTeddyPainter(ctx: CanvasRenderingContext2D, w: World, e: number) {
    const t = get<Transform>(w, 'transform', e);
    const s = get<StateMachine>(w, 'state', e);
    const pal = get<Palette>(w, 'palette', e);
    const k = get<Kinematics>(w, 'kinematics', e);
    const a = get<Abilities>(w, 'abilities', e);

    if (!t || !s || !pal || !k || !a) return;

    // Draw attachments (bandana tails) BEFORE flipping context
    // This function handles its own coordinate space reset
    drawAttachmentsLayer(ctx, w, e);

    ctx.save();
    
    if (s.state !== 'dying' && s.state !== 'victoryDance') {
      ctx.scale(t.facing, 1);
      ctx.translate(t.facing === -1 ? -t.size.x : 0, 0);
    }

    const isMovingHorizontally = Math.abs(t.vel.x) > 10;

    switch(s.state) {
        case 'running':
            drawRunSprite(ctx, t, s, pal, a);
            break;
        case 'hot_foot':
            drawHotFootSprite(ctx, t, s, pal, a);
            break;
        case 'jumping':
            if (s.animTime < 0.15) {
                if (isMovingHorizontally) {
                    drawJumpTakeoffSprite(ctx, t, pal, a);
                } else {
                    drawForwardJumpTakeoffSprite(ctx, t, s, pal, a);
                }
            } else {
                if (isMovingHorizontally) {
                    drawJumpSprite(ctx, t, pal, a);
                } else {
                    drawForwardJumpSprite(ctx, t, s, pal, a);
                }
            }
            break;
        case 'falling':
            if (isMovingHorizontally) {
                drawJumpSprite(ctx, t, pal, a);
            } else {
                drawForwardJumpSprite(ctx, t, s, pal, a);
            }
            break;
        case 'backflip':
            drawBackflipSprite(ctx, t, s, pal, a);
            break;
        case 'rolling':
            drawRollSprite(ctx, s, pal, t);
            break;
        case 'dashing':
            drawDashSprite(ctx, t, pal, a);
            break;
        case 'dying':
            drawDyingSprite(ctx, s, pal);
            break;
        case 'wallSliding':
            drawWallSlideSprite(ctx, t, pal, a);
            break;
        case 'slamming':
            drawSlamSprite(ctx, t, s, pal, a);
            break;
        case 'bottleCharge':
        case 'bottleShootTap':
        case 'bottleShootBeam':
            drawBottleSprite(ctx, t, s, pal, a, w, e);
            break;
        case 'throwingDiaper':
            drawThrowingDiaperSprite(ctx, t, s, pal, a);
            break;
        case 'victoryDance':
            drawVictoryDanceSprite(ctx, t, s, pal, a);
            break;
        case 'climbing':
        default:
            drawIdleSprite(ctx, t, s, pal, a);
            break;
    }

    ctx.restore();
}

export function milkProjectilePainter(ctx: CanvasRenderingContext2D, w: World, e: number) {
    const t = get<Transform>(w, 'transform', e);
    if (!t) return;
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(t.size.x / 2, t.size.y / 2, t.size.x / 2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = 'rgba(220, 220, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(t.size.x / 2 + 2, t.size.y / 2 - 2, t.size.x / 4, 0, Math.PI * 2);
    ctx.fill();
}

export function coconutProjectilePainter(ctx: CanvasRenderingContext2D, w: World, e: number) {
    const t = get<Transform>(w, 'transform', e);
    if (!t) return;
    
    ctx.save();
    const rot = w.time * 10 + e;
    ctx.translate(t.size.x / 2, t.size.y / 2);
    ctx.rotate(rot);
    ctx.translate(-t.size.x / 2, -t.size.y / 2);
    
    const grad = ctx.createRadialGradient(t.size.x/2, t.size.y/2, 2, t.size.x/2, t.size.y/2, t.size.x/2);
    grad.addColorStop(0, '#a1662f');
    grad.addColorStop(0.7, '#804224');
    grad.addColorStop(1, '#593a1a');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(t.size.x / 2, t.size.y / 2, t.size.x / 2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#422006';
    ctx.beginPath();
    ctx.arc(t.size.x * 0.4, t.size.y * 0.4, t.size.x * 0.1, 0, Math.PI * 2);
    ctx.arc(t.size.x * 0.6, t.size.y * 0.4, t.size.x * 0.1, 0, Math.PI * 2);
    ctx.arc(t.size.x * 0.5, t.size.y * 0.6, t.size.x * 0.1, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}


export function diaperBombPainter(ctx: CanvasRenderingContext2D, w: World, e: number) {
    const t = get<Transform>(w, 'transform', e);
    if (!t) return;
    
    ctx.save();
    const rot = w.time * 15;
    ctx.translate(t.size.x / 2, t.size.y / 2);
    ctx.rotate(rot);
    ctx.translate(-t.size.x / 2, -t.size.y / 2);

    const diaperBase = '#F5EFE6';
    const diaperShadow = '#D8CFC2';
    const fastenerGold = '#FFD700';
    const dirtyStain = '#AFAF7D';

    drawPart(ctx, 1, 1, 4, 3, diaperShadow);
    drawPart(ctx, 0, 2, 5, 2, diaperBase);
    
    drawPixel(ctx, 0, 2, fastenerGold);

    drawPart(ctx, 2, 2, 2, 1, dirtyStain);
    
    ctx.restore();
}

export function barrelProjectilePainter(ctx: CanvasRenderingContext2D, w: World, e: number) {
    const t = get<Transform>(w, 'transform', e);
    if (!t) return;
    
    ctx.save();
    const rot = w.time * 10 * Math.sign(t.vel.x);
    ctx.translate(t.size.x / 2, t.size.y / 2);
    ctx.rotate(rot);
    ctx.translate(-t.size.x / 2, -t.size.y / 2);
    
    const barrelW = t.size.x;
    const barrelH = t.size.y;
    
    const bodyGrad = ctx.createLinearGradient(0, 0, 0, barrelH);
    bodyGrad.addColorStop(0, '#a1662f');
    bodyGrad.addColorStop(0.5, '#804224');
    bodyGrad.addColorStop(1, '#593a1a');
    ctx.fillStyle = bodyGrad;
    ctx.fillRect(0, 0, barrelW, barrelH);
    
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 2;
    for(let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(0, Math.random() * barrelH);
        ctx.bezierCurveTo(barrelW * 0.3, Math.random() * barrelH, barrelW * 0.7, Math.random() * barrelH, barrelW, Math.random() * barrelH);
        ctx.stroke();
    }

    const bandGrad = ctx.createLinearGradient(0,0, 0, barrelH * 0.15);
    bandGrad.addColorStop(0, '#cbd5e1');
    bandGrad.addColorStop(0.5, '#94a3b8');
    bandGrad.addColorStop(1, '#64748b');
    ctx.fillStyle = bandGrad;
    ctx.fillRect(0, barrelH * 0.1, barrelW, barrelH * 0.15);
    ctx.fillRect(0, barrelH * 0.75, barrelW, barrelH * 0.15);
    
    ctx.fillStyle = '#475569';
    for(let i=0; i<4; i++) {
        ctx.fillRect(i * (barrelW/4) + 5, barrelH * 0.12, 2, 2);
        ctx.fillRect(i * (barrelW/4) + 5, barrelH * 0.88, 2, 2);
    }
    
    ctx.restore();
}

export function giantBarrelProjectilePainter(ctx: CanvasRenderingContext2D, w: World, e: number) {
    barrelProjectilePainter(ctx, w, e);

    const t = get<Transform>(w, 'transform', e);
    if (!t) return;

    ctx.save();
    const rot = w.time * 10 * Math.sign(t.vel.x);
    ctx.translate(t.size.x / 2, t.size.y / 2);
    ctx.rotate(rot);
    ctx.translate(-t.size.x / 2, -t.size.y / 2);

    ctx.fillStyle = '#fde047'; 
    ctx.font = `bold ${t.size.y * 0.4}px "Luckiest Guy"`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = '#92400e'; 
    ctx.lineWidth = 6;
    ctx.strokeText('DK', t.size.x / 2, t.size.y / 2 + 4);
    ctx.fillText('DK', t.size.x / 2, t.size.y / 2 + 4);

    ctx.restore();
}

export function venomProjectilePainter(ctx: CanvasRenderingContext2D, w: World, e: number) {
    const t = get<Transform>(w, 'transform', e);
    if (!t) return;

    ctx.save();
    ctx.translate(t.size.x / 2, t.size.y / 2);
    const angle = Math.atan2(t.vel.y, t.vel.x);
    ctx.rotate(angle);

    // Core glob
    ctx.fillStyle = '#a3e635'; // Lime green
    ctx.beginPath();
    ctx.ellipse(0, 0, 10, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Trailing blobs
    ctx.fillStyle = '#65a30d'; // Darker green
    const tailWobble = Math.sin(w.time * 20) * 3;
    ctx.beginPath();
    ctx.arc(-12, tailWobble, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-20, -tailWobble, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}
