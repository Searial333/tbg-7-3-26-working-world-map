
import type { World } from '../../types';
import { get } from '../ecs';
import type { StateMachine, Transform, Health, Palette } from '../components';

const p = 4; // pixel size

const drawPart = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, c: string) => {
    ctx.fillStyle = c;
    ctx.fillRect(Math.floor(x * p), Math.floor(y * p), w * p, h * p);
};

const drawZinger = (ctx: CanvasRenderingContext2D, w: World, pal: Palette) => {
    const t = w.time * 25; 
    const wingFlap = Math.sin(t);
    const hoverBob = Math.sin(w.time * 5) * 0.5;

    const y = 2 + hoverBob; // Vertical offset

    // PALETTE mapping
    const cAbdomen = pal.abdomen;
    const cStripe = pal.stripe;
    const cThorax = pal.thorax;
    const cSpike = pal.spike;
    const cHead = pal.head;
    const cEye = pal.eye;
    const cPupil = pal.pupil;
    const cLeg = pal.leg;
    const cWing = 'rgba(255, 255, 255, 0.6)';
    const cWingBorder = 'rgba(255, 255, 255, 0.9)';

    // --- FAR WING (Behind) ---
    ctx.save();
    ctx.translate(5 * p, (y - 2) * p);
    ctx.rotate(wingFlap * 0.3 - 0.3);
    ctx.fillStyle = cWing;
    ctx.beginPath();
    ctx.ellipse(0, -10, 8, 3, -Math.PI / 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // --- LEGS ---
    drawPart(ctx, 6, y + 7, 1, 3, cLeg);
    drawPart(ctx, 6, y + 10, 2, 1, cLeg); // Foot
    drawPart(ctx, 8, y + 7, 1, 3, cLeg);
    drawPart(ctx, 8, y + 10, 2, 1, cLeg); // Foot

    // --- ABDOMEN (Left Side) ---
    // Round body
    drawPart(ctx, 1, y + 2, 6, 7, cAbdomen);
    drawPart(ctx, 0, y + 3, 8, 5, cAbdomen);
    
    // Stripes (Vertical for side view)
    drawPart(ctx, 2, y + 2, 1, 7, cStripe);
    drawPart(ctx, 4, y + 2, 1, 7, cStripe);

    // Stinger (Bottom/Rear Left)
    drawPart(ctx, 1, y + 8, 2, 2, cAbdomen);
    drawPart(ctx, 2, y + 10, 1, 2, '#FFFFFF'); // Tip

    // Spikes (Dorsal)
    drawPart(ctx, 1, y + 1, 1, 1, cSpike); // Back
    drawPart(ctx, 3, y, 1, 2, cSpike);     // Middle
    drawPart(ctx, 5, y + 1, 1, 1, cSpike); // Front

    // --- THORAX (Center) ---
    drawPart(ctx, 7, y + 3, 3, 4, cThorax);

    // --- HEAD (Right Side) ---
    drawPart(ctx, 9, y + 1, 5, 6, cHead);
    
    // Eyes
    drawPart(ctx, 10, y + 2, 3, 3, cEye);
    drawPart(ctx, 12, y + 3, 1, 1, cPupil); // Looking forward (right)

    // Mandibles
    drawPart(ctx, 12, y + 6, 1, 2, '#9CA3AF'); 
    drawPart(ctx, 10, y + 6, 1, 1, '#9CA3AF');

    // --- NEAR WING (Front) ---
    ctx.save();
    ctx.translate(7 * p, (y - 2) * p);
    ctx.rotate(wingFlap * 0.4 + 0.1);
    ctx.fillStyle = cWing;
    ctx.strokeStyle = cWingBorder;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(0, -10, 9, 3, -Math.PI / 2.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
};

export function flyingEnemyPainter(ctx: CanvasRenderingContext2D, w: World, e: number) {
    const t = get<Transform>(w, 'transform', e);
    const s = get<StateMachine>(w, 'state', e);
    const h = get<Health>(w, 'health', e);
    const pal = get<Palette>(w, 'palette', e);

    if (!t || !s || !h || !pal) return;

    if (s.invulnFrames > 0 && Math.floor(s.invulnFrames * 25) % 2 === 0) {
        return;
    }

    ctx.save();
    
    // Flip horizontally based on facing direction.
    // Painter draws facing RIGHT.
    ctx.scale(t.facing, 1);
    ctx.translate(t.facing === -1 ? -t.size.x : 0, 0);

    switch(s.state) {
        case 'shooting_anticipation':
            const vibrateX = (Math.random() - 0.5) * 4;
            const vibrateY = (Math.random() - 0.5) * 4;
            ctx.translate(vibrateX, vibrateY);
            drawZinger(ctx, w, pal); 
            break;
        case 'shooting':
            const lunge = (s.timers.shooting / 0.2) * 5;
            ctx.translate(lunge * p, 0); // Lunge forward
            drawZinger(ctx, w, pal);
            break;
        case 'dying':
            const fallProgress = 1 - (s.timers.dead / 0.5);
            ctx.translate(0, fallProgress * 30 * p);
            ctx.rotate(fallProgress * 4 * t.facing);
            drawZinger(ctx, w, pal);
            break;
        default: 
            drawZinger(ctx, w, pal);
            break;
    }

    ctx.restore();

     // Health bar
     if (h.hp < h.maxHp) {
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

export function enemyStingerPainter(ctx: CanvasRenderingContext2D, w: World, e: number) {
    const t = get<Transform>(w, 'transform', e);
    if (!t) return;

    ctx.save();
    ctx.translate(t.size.x / 2, t.size.y / 2);
    const angle = Math.atan2(t.vel.y, t.vel.x);
    ctx.rotate(angle);
    
    // Stinger body
    ctx.fillStyle = '#FEF08A'; // Light yellow
    ctx.beginPath();
    ctx.moveTo(-t.size.x/2, -t.size.y/4);
    ctx.lineTo(t.size.x/2, 0);
    ctx.lineTo(-t.size.x/2, t.size.y/4);
    ctx.closePath();
    ctx.fill();
    
    // Inner highlight
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(-t.size.x/2 + 2, -1);
    ctx.lineTo(t.size.x/2 - 2, 0);
    ctx.lineTo(-t.size.x/2 + 2, 1);
    ctx.fill();

    // Base cap
    ctx.fillStyle = '#FACC15'; // Yellow base
    ctx.fillRect(-t.size.x/2 - 2, -t.size.y/4, 4, t.size.y/2);

    ctx.restore();
}
