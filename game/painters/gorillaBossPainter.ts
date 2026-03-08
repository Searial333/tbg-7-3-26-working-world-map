
import type { World } from '../../types';
import { get } from '../ecs';
import type { StateMachine, Transform, Health, Boss, Palette, Attachments } from '../components';
import { drawDynamics } from '../systems/attachmentSystem';

const p = 4; // Pixel size for chunky look

const drawPart = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, c: string | CanvasGradient) => {
    ctx.fillStyle = c;
    ctx.fillRect(Math.floor(x * p), Math.floor(y * p), Math.ceil(w * p), Math.ceil(h * p));
};

function drawLayeredAttachment(ctx: CanvasRenderingContext2D, w: World, e: number, headDrawer: () => void) {
    ctx.save();
    const t = get<Transform>(w, 'transform', e);
    if (!t) { ctx.restore(); return; }

    const drawingWidth = 80 * p;
    const entityWidth = t.size.x;
    const xOffset = (entityWidth - drawingWidth) / 2;

    ctx.translate(-xOffset, 0);
    ctx.scale(t.facing, 1);
    ctx.translate(t.facing === -1 ? -t.size.x : 0, 0);
    ctx.translate(-Math.floor(t.pos.x), -Math.floor(t.pos.y));
    
    if (w.visualSettings.characterAttachments) {
        drawDynamics(ctx, w, e);
        const att = get<Attachments>(w, 'attachments', e);
        if (att) {
            const tieSpec = att.list.find(a => a.id === 'tie');
            if (tieSpec) {
                const anchorX = t.pos.x + (t.facing > 0 ? tieSpec.anchor.x : t.size.x - tieSpec.anchor.x);
                const anchorY = t.pos.y + tieSpec.anchor.y;
                ctx.fillStyle = '#dc2626'; 
                ctx.beginPath();
                ctx.moveTo(anchorX - 14, anchorY - 8);
                ctx.lineTo(anchorX + 14, anchorY - 8);
                ctx.lineTo(anchorX + 10, anchorY + 10);
                ctx.lineTo(anchorX - 10, anchorY + 10);
                ctx.closePath();
                ctx.fill();
                ctx.fillStyle = '#f87171'; 
                ctx.beginPath();
                ctx.moveTo(anchorX - 12, anchorY - 7);
                ctx.lineTo(anchorX + 12, anchorY - 7);
                ctx.lineTo(anchorX + 10, anchorY - 3);
                ctx.lineTo(anchorX - 10, anchorY - 3);
                ctx.closePath();
                ctx.fill();
            }
        }
    }
    ctx.restore();
    headDrawer();
}

const drawHead = (ctx: CanvasRenderingContext2D, w: World, e: number, pal: Palette, x: number, y: number, isRoaring: boolean, isHurt: boolean) => {
    const t = get<Transform>(w, 'transform', e);
    if (!t) return;
    
    // Head Fur
    drawPart(ctx, x + 3, y, 16, 15, pal.fur_shadow);
    drawPart(ctx, x + 4, y - 1, 14, 15, pal.fur_dark);
    drawPart(ctx, x + 9, y - 5, 5, 5, pal.fur_dark); // Top tuft
    
    // Muzzle / Face Plate
    drawPart(ctx, x + 1, y + 9, 20, 11, pal.skin_shadow);
    drawPart(ctx, x + 2, y + 9, 18, 10, pal.skin);
    
    // Brow Ridge
    drawPart(ctx, x + 3, y + 7, 16, 4, pal.fur_shadow);

    const eyeY = y + 9;
    if (isHurt) {
        drawPart(ctx, x + 5, eyeY + 2, 4, 1, pal.fur_shadow);
        drawPart(ctx, x + 13, eyeY + 2, 4, 1, pal.fur_shadow);
    } else {
        drawPart(ctx, x + 5, eyeY, 4, 4, pal.eye_white);
        drawPart(ctx, x + 13, eyeY, 4, 4, pal.eye_white);
        
        const playerT = get<Transform>(w, 'transform', w.playerId);
        let px = 0, py = 0;
        if (playerT) {
             const dx = (playerT.pos.x + playerT.size.x/2) - (t.pos.x + t.size.x/2);
             const dy = (playerT.pos.y + playerT.size.y/2) - (t.pos.y + (y+11)*p);
             const dist = Math.hypot(dx, dy) || 1;
             px = Math.round(dx/dist * 2) * t.facing;
             py = Math.round(dy/dist * 2);
        }
        drawPart(ctx, x + 7 + px, eyeY + 1 + py, 1.5, 1.5, pal.eye_pupil);
        drawPart(ctx, x + 15 + px, eyeY + 1 + py, 1.5, 1.5, pal.eye_pupil);
    }
    
    // Mouth
    if (isRoaring) {
        drawPart(ctx, x + 4, y + 17, 14, 7, pal.mouth_dark);
        drawPart(ctx, x + 5, y + 17, 12, 1, pal.tooth);
        drawPart(ctx, x + 5, y + 23, 12, 1, pal.tooth);
    } else {
        drawPart(ctx, x + 5, y + 18, 12, 2, pal.mouth_dark);
        drawPart(ctx, x + 6, y + 19, 10, 1, pal.tooth);
    }
};

const drawTorso = (ctx: CanvasRenderingContext2D, bodyY: number, pal: Palette) => {
    // Large Chest Muscles
    drawPart(ctx, 20, bodyY + 4, 18, 20, pal.skin_shadow);
    drawPart(ctx, 21, bodyY + 5, 16, 18, pal.skin);
    drawPart(ctx, 36, bodyY + 4, 18, 20, pal.skin_shadow);
    drawPart(ctx, 37, bodyY + 5, 16, 18, pal.skin);
    
    // Belly
    drawPart(ctx, 24, bodyY + 22, 26, 12, pal.skin_shadow);
    drawPart(ctx, 25, bodyY + 22, 24, 11, pal.skin);
};

export const dkPainter = (ctx: CanvasRenderingContext2D, w: World, e: number) => {
    const t = get<Transform>(w, 'transform', e);
    const s = get<StateMachine>(w, 'state', e);
    const boss = get<Boss>(w, 'boss', e);
    const pal = get<Palette>(w, 'palette', e);
    if (!t || !s || !boss || !pal) return;

    // Shadow
    const shadowY = t.groundY > 0 ? (t.groundY - t.pos.y) : t.size.y;
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(t.size.x/2, shadowY, t.size.x*0.4, 12, 0, 0, Math.PI*2);
    ctx.fill();

    ctx.save();
    const xOffset = (t.size.x - 80 * p) / 2;
    ctx.translate(t.facing === -1 ? t.size.x : 0, 0);
    ctx.scale(t.facing, 1);
    ctx.translate(xOffset, 0);

    if (boss.state === 'hurt' || (s.invulnFrames > 0 && boss.state !== 'dying' && Math.floor(w.time*30)%2===0)) {
        ctx.filter = 'brightness(2.5)';
    }

    const bodyBob = Math.sin(s.animTime * 3) * 1.5;
    const bodyY = 20 + bodyBob;

    // Drawing Order: Back Arm -> Back Leg -> Torso -> Head -> Front Leg -> Front Arm
    
    // Back Arm
    drawPart(ctx, 4, bodyY - 5, 18, 18, pal.fur_shadow);
    drawPart(ctx, 6, bodyY - 18, 16, 16, pal.skin_shadow);
    
    // Back Leg
    drawPart(ctx, 18, 52, 14, 15, pal.fur_shadow);
    drawPart(ctx, 18, 67, 15, 6, pal.skin_shadow);

    // Torso (Includes Pecs and Belly)
    drawPart(ctx, 18, bodyY, 38, 36, pal.fur_shadow);
    drawPart(ctx, 20, bodyY, 34, 34, pal.fur_dark);
    drawTorso(ctx, bodyY, pal);

    // Front Leg
    drawPart(ctx, 42, 52, 14, 15, pal.fur_shadow);
    drawPart(ctx, 42, 67, 15, 6, pal.skin_shadow);

    // Front Arm
    drawPart(ctx, 52, bodyY - 5, 18, 18, pal.fur_shadow);
    drawPart(ctx, 54, bodyY - 18, 16, 16, pal.skin_shadow);

    drawLayeredAttachment(ctx, w, e, () => {
        const isRoaring = boss.state === 'intro' || boss.state === 'pounding';
        const isHurt = boss.state === 'hurt' || boss.state === 'dying';
        drawHead(ctx, w, e, pal, 27, bodyY - 18, isRoaring, isHurt);
    });

    ctx.restore();
};
