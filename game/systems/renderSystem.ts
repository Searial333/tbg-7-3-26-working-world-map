
import type { World, Particle, Platform, DashGhost, ParallaxLayer } from '../../types';
import { get } from '../ecs';
import type { Transform, RendererRef, Palette, StateMachine, Health, Abilities, Kinematics, Boss, Attachments, BarrelCannon, Vine } from '../components';
import { pixelTeddyPainter, milkProjectilePainter, diaperBombPainter, coconutProjectilePainter, barrelProjectilePainter, giantBarrelProjectilePainter, venomProjectilePainter } from '../painters/pixelTeddyPainter';
import { tbgV2Painter } from '../painters/tbgV2Painter';
import { chibiMalePainter, chibiFemalePainter } from '../painters/chibiPainter';
import { femaleV2Painter } from '../painters/femaleV2Painter';
import { ninjaPainter } from '../painters/ninjaPainter';
import { enemyPainter, klaptrapPainter, snakePainter } from '../painters/enemyPainter';
import { flyingEnemyPainter, enemyStingerPainter } from '../painters/flyingEnemyPainter';
import { shopkeeperPainter } from '../painters/shopkeeperPainter';
import { nevlinPainter } from '../painters/nevlinPainter';
import { dkPainter } from '../painters/gorillaBossPainter';
import { diddyPainter, peanutPainter } from '../painters/diddyPainter';
import { counterPainter } from '../painters/sceneryPainter';
import { drawDynamics } from './attachmentSystem';
import { activeCollectibles } from './entitySystem';
import { UPGRADES, UPGRADE_ORDER, LIFE_COST } from '../../constants/upgrades';

const p = 4; // pixel size

// Deterministic pseudo-random number generator
function pseudoRandom(seed: number) {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

const barrelCannonPainter = (ctx: CanvasRenderingContext2D, w: World, e: number) => {
    const t = get<Transform>(w, 'transform', e);
    const b = get<BarrelCannon>(w, 'barrelCannon', e);
    if (!t || !b) return;

    ctx.save();
    ctx.translate(t.size.x / 2, t.size.y / 2);
    ctx.rotate((t.rotation || 0) * Math.PI / 180);
    ctx.translate(-t.size.x / 2, -t.size.y / 2);

    const barrelW = t.size.x;
    const barrelH = t.size.y;

    const woodGrad = ctx.createLinearGradient(0, 0, 0, barrelH);
    woodGrad.addColorStop(0, '#854d0e');
    woodGrad.addColorStop(0.5, '#a16207');
    woodGrad.addColorStop(1, '#713f12');
    ctx.fillStyle = woodGrad;
    ctx.fillRect(0, 0, barrelW, barrelH);

    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    for(let i=0; i<4; i++) {
        ctx.fillRect(0, i * (barrelH/4) + 4, barrelW, 2);
    }

    const bandColor = '#374151';
    const bandHighlight = '#6b7280';
    
    ctx.fillStyle = bandColor;
    ctx.fillRect(-2, 0, barrelW+4, 12);
    ctx.fillStyle = bandHighlight;
    ctx.fillRect(-2, 2, barrelW+4, 4);
    
    ctx.fillStyle = bandColor;
    ctx.fillRect(-2, barrelH - 12, barrelW+4, 12);
    ctx.fillStyle = bandHighlight;
    ctx.fillRect(-2, barrelH - 10, barrelW+4, 4);

    ctx.save();
    ctx.translate(barrelW/2, barrelH/2);
    ctx.rotate(Math.PI / 2);

    if (b.type === 'auto') {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, -2, 12, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(-4, -2, 3, 0, Math.PI*2);
        ctx.arc(4, -2, 3, 0, Math.PI*2);
        ctx.fill();
        ctx.fillRect(-2, 4, 4, 4);
    } else {
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        for(let i=0; i<5; i++){
            const angle = (i * 4 * Math.PI) / 5 - Math.PI/2;
            const r = 12;
            ctx.lineTo(Math.cos(angle)*r, Math.sin(angle)*r);
        }
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#b45309';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    ctx.restore();
    ctx.restore();
};

const vinePainter = (ctx: CanvasRenderingContext2D, w: World, e: number) => {
    const t = get<Transform>(w, 'transform', e);
    const v = get<Vine>(w, 'vine', e);
    if (!t || !v) return;

    ctx.save();
    ctx.rotate((t.rotation || 0) * Math.PI / 180);

    const width = 12;
    const length = v.length;

    ctx.fillStyle = '#15803d';
    ctx.beginPath();
    ctx.moveTo(-width/2, 0);
    ctx.lineTo(width/2, 0);
    ctx.lineTo(width/4, length);
    ctx.lineTo(-width/4, length);
    ctx.closePath();
    ctx.fill();

    const segments = Math.floor(length / 20);
    for (let i = 0; i < segments; i++) {
        const y = i * 20 + 10;
        ctx.fillStyle = '#22c55e';
        if (i % 2 === 0) {
            ctx.beginPath();
            ctx.ellipse(-width/2, y, 10, 5, -Math.PI/4, 0, Math.PI*2);
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.ellipse(width/2, y, 10, 5, Math.PI/4, 0, Math.PI*2);
            ctx.fill();
        }
    }
    
    ctx.fillStyle = '#14532d';
    ctx.beginPath();
    ctx.arc(0, length, 6, 0, Math.PI*2);
    ctx.fill();

    ctx.restore();
};


const painters: { [id: string]: (ctx: CanvasRenderingContext2D, w: World, e: number) => void } = {
    'pixel:teddy': pixelTeddyPainter,
    'tbg:v2': tbgV2Painter,
    'chibi:male': chibiMalePainter,
    'chibi:female': chibiFemalePainter,
    'v2:female': femaleV2Painter,
    'hd:nevlin': nevlinPainter,
    'ninja:shinobi': ninjaPainter,
    'enemy:patrol': enemyPainter,
    'enemy:klaptrap': klaptrapPainter,
    'enemy:flyer': flyingEnemyPainter,
    'enemy:snake': snakePainter,
    'npc:shopkeeper': shopkeeperPainter,
    'boss:dk': dkPainter,
    'boss:diddy': diddyPainter,
    'projectile:milk': milkProjectilePainter,
    'projectile:diaperBomb': diaperBombPainter,
    'projectile:coconut': coconutProjectilePainter,
    'projectile:peanut': peanutPainter,
    'projectile:barrel': barrelProjectilePainter,
    'projectile:giant_barrel': giantBarrelProjectilePainter,
    'projectile:enemyStinger': enemyStingerPainter,
    'projectile:venom': venomProjectilePainter,
    'scenery:counter': counterPainter,
    'barrelCannon': barrelCannonPainter,
    'vine': vinePainter,
};

const imageCache = new Map<string, HTMLImageElement>();

function updateCamera(w: World, canvas: HTMLCanvasElement) {
    const playerT = get<Transform>(w, 'transform', w.playerId);
    if (!playerT) return;

    const viewWidth = w.camera.logicalWidth;
    const viewHeight = w.camera.logicalHeight;

    let targetX = playerT.pos.x - viewWidth / 2 + playerT.size.x / 2;
    let targetY = playerT.pos.y - viewHeight / 2 + playerT.size.y / 2;
    
    // Dynamic camera tracking
    const playerS = get<StateMachine>(w, 'state', w.playerId);
    const isFast = playerS?.state === 'barrel_blast' || Math.abs(playerT.vel.x) > 800 || Math.abs(playerT.vel.y) > 800;
    const lerp = isFast ? 0.3 : 0.1; 
    
    w.camera.x += (targetX - w.camera.x) * lerp;
    w.camera.y += (targetY - w.camera.y) * lerp;

    // Clamp camera to level bounds for ALL levels
    // Use slightly larger clamping tolerance for screenshake
    w.camera.x = Math.max(w.level.bounds.left, Math.min(w.camera.x, w.level.bounds.right - viewWidth));
    w.camera.y = Math.max(w.level.bounds.top, Math.min(w.camera.y, w.level.bounds.bottom - viewHeight));

    if (!w.visualSettings.screenShake) {
        w.camera.shakeMagnitude = 0;
        w.camera.shakeDuration = 0;
    }

    if (w.camera.shakeDuration > 0) {
        w.camera.shakeDuration -= w.dt;
    } else {
        w.camera.shakeMagnitude = 0;
    }
}


function renderParallax(ctx: CanvasRenderingContext2D, w: World, layers: ParallaxLayer[]) {
    layers.forEach(layer => {
        if (layer.type === 'color') {
            ctx.fillStyle = layer.data;
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        } else if (layer.type === 'image') {
            let img = imageCache.get(layer.id);
            if (!img) {
                img = new Image();
                img.src = layer.data;
                imageCache.set(layer.id, img);
            }

            if (img.complete && img.naturalWidth > 0) {
                const imgW = layer.width || img.naturalWidth;
                const imgH = layer.height || img.naturalHeight;
                const canvasW = ctx.canvas.width;
                const canvasH = ctx.canvas.height;

                const parallaxX = w.camera.x * layer.depth;
                const parallaxY = w.camera.y * layer.depth;

                const tileVertically = layer.depth === 0;

                const startX = parallaxX % imgW;
                const startY = tileVertically ? (parallaxY % imgH) : parallaxY;

                ctx.save();
                ctx.translate(-startX, -startY + (layer.yOffset || 0));

                const cols = Math.ceil(canvasW / imgW) + 1;
                const rows = tileVertically ? (Math.ceil(canvasH / imgH) + 1) : 1;
                
                for (let row = 0; row < rows; row++) {
                    for (let col = 0; col < cols; col++) {
                        ctx.drawImage(img, col * imgW, row * imgH, imgW, imgH);
                    }
                }
                ctx.restore();
            }
        }
    });
}

function renderZones(ctx: CanvasRenderingContext2D, w: World) {
    w.level.zones.forEach((z, index) => {
        if (z.x > w.camera.x + w.camera.logicalWidth || z.x + z.w < w.camera.x) return;

        if (z.type === 'water') {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.fillRect(z.x, z.y, z.w, 10);
            
            const grad = ctx.createLinearGradient(z.x, z.y, z.x, z.y + z.h);
            grad.addColorStop(0, 'rgba(30, 144, 255, 0.3)');
            grad.addColorStop(1, 'rgba(0, 0, 139, 0.5)');
            ctx.fillStyle = grad;
            ctx.fillRect(z.x, z.y, z.w, z.h);
            
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let i = 0; i < z.w; i += 40) {
                const waveOffset = Math.sin(w.time * 2 + i * 0.1) * 5;
                ctx.moveTo(z.x + i, z.y + 15 + waveOffset);
                ctx.lineTo(z.x + i + 20, z.y + 15 + waveOffset);
            }
            ctx.stroke();

        } else if (z.type === 'lava') {
            const glow = Math.sin(w.time * 3) * 0.1 + 0.7;
            const grad = ctx.createLinearGradient(z.x, z.y, z.x, z.y + z.h);
            grad.addColorStop(0, `rgba(255, 69, 0, ${glow})`);
            grad.addColorStop(1, '#800000');
            ctx.fillStyle = grad;
            ctx.fillRect(z.x, z.y, z.w, z.h);
            
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            for(let i = 0; i < z.w / 50; i++) {
                const seed = index * 1000 + i;
                const offset = pseudoRandom(seed) * 50;
                const speed = pseudoRandom(seed + 1) * 2 + 2;
                const bubbleX = z.x + offset + (w.time * 20 + i*30) % (z.w - offset);
                ctx.beginPath();
                ctx.arc(bubbleX, z.y + 5, 3 + Math.sin(w.time*speed)*2, 0, Math.PI*2);
                ctx.fill();
            }
        }
    });
}


function renderPlatforms(ctx: CanvasRenderingContext2D, w: World) {
    w.level.platforms.forEach((plat, index) => {
        if (plat.x > w.camera.x + w.camera.logicalWidth || plat.x + plat.w < w.camera.x) {
            return;
        }

        switch (plat.style) {
            case 'brick':
                ctx.fillStyle = '#b94e22'; 
                ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
                ctx.fillStyle = '#000000';
                for (let y = 0; y < plat.h; y += 40) {
                    ctx.fillRect(plat.x, plat.y + y, plat.w, 4);
                }
                for (let y = 0; y < plat.h; y += 40) {
                    const offset = (y / 40) % 2 === 0 ? 0 : 40;
                    for (let x = offset; x < plat.w; x += 80) {
                        ctx.fillRect(plat.x + x, plat.y + y, 4, 40);
                    }
                }
                ctx.lineWidth = 4;
                ctx.strokeStyle = 'rgba(0,0,0,0.3)';
                ctx.strokeRect(plat.x, plat.y, plat.w, plat.h);
                break;
            case 'question':
                ctx.fillStyle = '#eab308'; 
                ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
                ctx.fillStyle = '#92400e';
                ctx.fillRect(plat.x + 4, plat.y + 4, 8, 8);
                ctx.fillRect(plat.x + plat.w - 12, plat.y + 4, 8, 8);
                ctx.fillRect(plat.x + 4, plat.y + plat.h - 12, 8, 8);
                ctx.fillRect(plat.x + plat.w - 12, plat.y + plat.h - 12, 8, 8);
                
                if (Math.sin(w.time * 5) > -0.5) { 
                    ctx.fillStyle = '#fff';
                    ctx.font = 'bold 40px monospace';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('?', plat.x + plat.w / 2, plat.y + plat.h / 2 + 2);
                }
                ctx.strokeStyle = '#92400e';
                ctx.lineWidth = 6;
                ctx.strokeRect(plat.x, plat.y, plat.w, plat.h);
                break;
            case 'pipe_top':
                const pGradTop = ctx.createLinearGradient(plat.x, 0, plat.x + plat.w, 0);
                pGradTop.addColorStop(0, '#047857'); 
                pGradTop.addColorStop(0.1, '#10b981');
                pGradTop.addColorStop(0.3, '#059669');
                pGradTop.addColorStop(0.8, '#047857'); 
                pGradTop.addColorStop(1, '#022c22'); 
                
                ctx.fillStyle = pGradTop;
                ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
                
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 4;
                ctx.strokeRect(plat.x, plat.y, plat.w, plat.h);
                
                ctx.fillStyle = '#000';
                ctx.fillRect(plat.x + 10, plat.y, plat.w - 20, 4);
                break;
            case 'pipe_body':
                const pGradBody = ctx.createLinearGradient(plat.x, 0, plat.x + plat.w, 0);
                pGradBody.addColorStop(0, '#047857'); 
                pGradBody.addColorStop(0.15, '#10b981'); 
                pGradBody.addColorStop(0.4, '#059669');
                pGradBody.addColorStop(0.8, '#047857');
                pGradBody.addColorStop(1, '#022c22');
                
                ctx.fillStyle = pGradBody;
                ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
                
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.moveTo(plat.x, plat.y); ctx.lineTo(plat.x, plat.y + plat.h);
                ctx.moveTo(plat.x + plat.w, plat.y); ctx.lineTo(plat.x + plat.w, plat.y + plat.h);
                ctx.stroke();
                break;
            case 'hard_block':
                ctx.fillStyle = '#64748b'; 
                ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 4;
                ctx.strokeRect(plat.x, plat.y, plat.w, plat.h);
                ctx.fillStyle = '#334155';
                ctx.fillRect(plat.x + 8, plat.y + 8, 8, 8);
                ctx.fillRect(plat.x + plat.w - 16, plat.y + plat.h - 16, 8, 8);
                ctx.fillRect(plat.x + 8, plat.y + plat.h - 16, 8, 8);
                ctx.fillRect(plat.x + plat.w - 16, plat.y + 8, 8, 8);
                break;
            case 'mushroom_cap':
                const mGrad = ctx.createRadialGradient(plat.x + plat.w/2, plat.y, 0, plat.x + plat.w/2, plat.y, plat.w);
                mGrad.addColorStop(0, '#f87171');
                mGrad.addColorStop(1, '#dc2626');
                ctx.fillStyle = mGrad;
                ctx.beginPath();
                ctx.moveTo(plat.x, plat.y + plat.h);
                ctx.lineTo(plat.x + plat.w, plat.y + plat.h);
                ctx.quadraticCurveTo(plat.x + plat.w, plat.y, plat.x + plat.w/2, plat.y);
                ctx.quadraticCurveTo(plat.x, plat.y, plat.x, plat.y + plat.h);
                ctx.fill();
                ctx.fillStyle = '#ffffff';
                ctx.beginPath(); ctx.arc(plat.x + plat.w * 0.2, plat.y + plat.h * 0.5, 10, 0, Math.PI*2); ctx.fill();
                ctx.beginPath(); ctx.arc(plat.x + plat.w * 0.5, plat.y + plat.h * 0.3, 15, 0, Math.PI*2); ctx.fill();
                ctx.beginPath(); ctx.arc(plat.x + plat.w * 0.8, plat.y + plat.h * 0.5, 10, 0, Math.PI*2); ctx.fill();
                break;
            case 'invisible':
                if (w.debugFlags.showHitboxes) {
                    ctx.fillStyle = 'rgba(255, 0, 255, 0.3)';
                    ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
                    ctx.strokeStyle = 'magenta';
                    ctx.strokeRect(plat.x, plat.y, plat.w, plat.h);
                }
                break;
            case 'coral_reef':
                ctx.fillStyle = '#fed7aa'; 
                ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
                for(let i=0; i < plat.w / 30; i++) {
                    const seed = index * 1000 + i;
                    const spotX = plat.x + pseudoRandom(seed) * plat.w;
                    const spotY = plat.y + pseudoRandom(seed + 1) * plat.h;
                    const spotR = 5 + pseudoRandom(seed + 2) * 10;
                    ctx.fillStyle = pseudoRandom(seed + 3) > 0.5 ? 'rgba(251, 113, 133, 0.5)' : 'rgba(52, 211, 153, 0.5)';
                    ctx.beginPath();
                    ctx.arc(spotX, spotY, spotR, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;
            case 'construction_grate':
                ctx.fillStyle = '#475569'; 
                ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
                ctx.lineWidth = 4;
                const gridSize = 30;
                for (let i = 0; i < plat.w; i += gridSize) {
                    ctx.beginPath();
                    ctx.moveTo(plat.x + i, plat.y);
                    ctx.lineTo(plat.x + i, plat.y + plat.h);
                    ctx.stroke();
                }
                for (let i = 0; i < plat.h; i += gridSize) {
                    ctx.beginPath();
                    ctx.moveTo(plat.x, plat.y + i);
                    ctx.lineTo(plat.x + plat.w, plat.y + i);
                    ctx.stroke();
                }
                break;
            case 'construction_beam':
                const beamGrad = ctx.createLinearGradient(plat.x, plat.y, plat.x, plat.y + plat.h);
                beamGrad.addColorStop(0, '#a0aec0'); 
                beamGrad.addColorStop(0.5, '#718096'); 
                beamGrad.addColorStop(1, '#4a5568'); 
                ctx.fillStyle = beamGrad;
                ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
                
                ctx.fillStyle = '#4a5568';
                ctx.fillRect(plat.x, plat.y, plat.w, 8); 
                ctx.fillRect(plat.x, plat.y + plat.h - 8, plat.w, 8); 
                
                ctx.fillStyle = 'rgba(180, 83, 9, 0.4)';
                for(let i = 0; i < plat.w / 100; i++) {
                    const seed = index * 1000 + i;
                    const rustX = plat.x + pseudoRandom(seed) * plat.w;
                    const rustY = plat.y + pseudoRandom(seed + 1) * plat.h;
                    const rustW = 15 + pseudoRandom(seed + 2) * 20;
                    const rustH = 5 + pseudoRandom(seed + 3) * 10;
                    ctx.fillRect(rustX, rustY, rustW, rustH);
                }
                
                ctx.fillStyle = '#2d3748';
                const rivetCount = Math.floor(plat.w / 60);
                for (let i = 0; i < rivetCount; i++) {
                    const rivetX = plat.x + (plat.w / rivetCount) * i + 15;
                    ctx.beginPath();
                    ctx.arc(rivetX, plat.y + 4, 3, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.beginPath();
                    ctx.arc(rivetX + 10, plat.y + plat.h - 4, 3, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;
            case 'girder_floor':
                ctx.fillStyle = '#475569';
                ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
                ctx.strokeStyle = 'rgba(0,0,0,0.2)';
                ctx.lineWidth = 2;
                for(let i = 0; i < plat.w; i += 40) { ctx.strokeRect(plat.x + i, plat.y, 40, plat.h); }
                for(let i = 0; i < plat.h; i += 40) { ctx.strokeRect(plat.x, plat.y + i, plat.w, 40); }
                break;
            case 'girder':
                ctx.fillStyle = '#94a3b8';
                ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
                ctx.fillStyle = '#64748b';
                ctx.fillRect(plat.x, plat.y, plat.w, 8);
                ctx.fillRect(plat.x, plat.y + plat.h - 8, plat.w, 8);
                ctx.fillStyle = '#475569';
                for (let i=0; i < plat.w / 50; i++) {
                    ctx.beginPath();
                    ctx.arc(plat.x + 25 + i * 50, plat.y + plat.h / 2, 4, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;
            case 'ancient_stone':
                ctx.fillStyle = '#6b7280';
                ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
                ctx.strokeStyle = 'rgba(0,0,0,0.3)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(plat.x + plat.w * 0.2, plat.y);
                ctx.lineTo(plat.x + plat.w * 0.3, plat.y + plat.h);
                ctx.moveTo(plat.x + plat.w * 0.8, plat.y);
                ctx.lineTo(plat.x + plat.w * 0.7, plat.y + plat.h);
                ctx.stroke();
                 const mossHeightStone = Math.min(plat.h, 20);
                 const mossGradStone = ctx.createLinearGradient(plat.x, plat.y, plat.x, plat.y + mossHeightStone);
                 mossGradStone.addColorStop(0, '#4d7c0f');
                 mossGradStone.addColorStop(1, '#365314');
                 ctx.fillStyle = mossGradStone;
                 ctx.fillRect(plat.x, plat.y, plat.w, mossHeightStone);
                break;
            case 'treetop_branch':
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
                ctx.strokeStyle = 'rgba(74, 43, 20, 0.5)';
                ctx.lineWidth = 4;
                for (let i = 0; i < plat.w / 50; i++) {
                    ctx.beginPath();
                    ctx.moveTo(plat.x + i*50, plat.y);
                    ctx.bezierCurveTo(plat.x+i*50+10, plat.y+plat.h/2, plat.x+i*50-10, plat.y+plat.h/2, plat.x+i*50, plat.y+plat.h);
                    ctx.stroke();
                }
                const leafHeight = Math.min(plat.h, 15);
                ctx.fillStyle = '#228B22';
                ctx.fillRect(plat.x, plat.y, plat.w, leafHeight);
                break;
            case 'jungle_floor':
                ctx.fillStyle = '#A0522D';
                ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
                const grassHeight = Math.min(plat.h, 25);
                ctx.fillStyle = '#3CB371';
                ctx.fillRect(plat.x, plat.y, plat.w, grassHeight);
                 for (let i = 0; i < plat.w / 10; i++) {
                    const seed = index * 1000 + i;
                    const bladeX = plat.x + i * 10 + pseudoRandom(seed) * 5;
                    const bladeH = 8 + pseudoRandom(seed + 1) * 8;
                    ctx.fillStyle = '#2E8B57';
                    ctx.fillRect(bladeX, plat.y - bladeH, 3, bladeH);
                }
                break;
            case 'shop_interior':
                ctx.fillStyle = '#6B4226'; 
                ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
                ctx.strokeStyle = 'rgba(0,0,0,0.4)';
                ctx.lineWidth = 2;
                for (let i = 0; i < plat.w / 80; i++) {
                    const plankX = plat.x + i * 80;
                    ctx.strokeRect(plankX, plat.y, 80, plat.h);
                    ctx.fillStyle = 'rgba(0,0,0,0.5)';
                    ctx.fillRect(plankX + 5, plat.y + 5, 4, 4);
                    ctx.fillRect(plankX + 70, plat.y + plat.h - 10, 4, 4);
                }
                break;
            case 'bounce':
                const bounceGrad = ctx.createLinearGradient(plat.x, plat.y, plat.x, plat.y + plat.h);
                bounceGrad.addColorStop(0, '#81C784');
                bounceGrad.addColorStop(1, '#4CAF50');
                ctx.fillStyle = bounceGrad;
                ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
                 ctx.strokeStyle = '#388E3C';
                 ctx.lineWidth = 4;
                 ctx.strokeRect(plat.x, plat.y, plat.w, plat.h);
                 // Spring details
                 ctx.fillStyle = '#1B5E20';
                 ctx.fillRect(plat.x, plat.y + plat.h - 10, plat.w, 10);
                 ctx.beginPath();
                 ctx.moveTo(plat.x, plat.y + 10);
                 ctx.lineTo(plat.x + plat.w, plat.y + 10);
                 ctx.stroke();
                break;
            case 'grass': 
            default:
                ctx.fillStyle = '#7A5C47';
                ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
                const defaultGrassHeight = Math.min(plat.h, 20);
                const defaultGrassGrad = ctx.createLinearGradient(plat.x, plat.y, plat.x, plat.y + defaultGrassHeight);
                defaultGrassGrad.addColorStop(0, '#66BB6A');
                defaultGrassGrad.addColorStop(1, '#4CAF50');
                ctx.fillStyle = defaultGrassGrad;
                ctx.fillRect(plat.x, plat.y, plat.w, defaultGrassHeight);
                break;
        }
    });
}

export function renderSystem(w: World, canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    ctx.imageSmoothingEnabled = !w.visualSettings.pixelPerfect;

    updateCamera(w, canvas);

    const scale = canvas.width / w.camera.logicalWidth;

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    renderParallax(ctx, w, w.parallaxLayers);

    ctx.save();
    
    ctx.scale(scale, scale);
    
    const shakeX = (Math.random() - 0.5) * w.camera.shakeMagnitude;
    const shakeY = (Math.random() - 0.5) * w.camera.shakeMagnitude;
    ctx.translate(-Math.floor(w.camera.x + shakeX), -Math.floor(w.camera.y + shakeY));

    renderZones(ctx, w);
    renderPlatforms(ctx, w);

    w.level.checkpoints.forEach(cp => {
        if (w.activatedCheckpoints.has(cp.id)) {
            ctx.fillStyle = '#4ade80';
            ctx.fillRect(cp.x, cp.y, 5, 40);
            ctx.fillRect(cp.x+5, cp.y, 20, 15);
        } else {
            ctx.fillStyle = '#9ca3af';
            ctx.fillRect(cp.x, cp.y, 5, 40);
        }
    });

    if (w.level.finishZone && !w.level.finishZone.initiallyHidden) {
        const f = w.level.finishZone;
        ctx.save();
        ctx.translate(f.x + f.w/2, f.y + f.h/2);
        ctx.rotate(w.time * 3);
        ctx.fillStyle = 'rgba(255, 215, 0, 0.5)';
        ctx.fillRect(-f.w/2, -f.h/2, f.w, f.h);
        ctx.restore();
    }

    const sortedEntities = Array.from(w.entities).sort((a, b) => {
        const tA = get<Transform>(w, 'transform', a);
        const tB = get<Transform>(w, 'transform', b);
        const zA = tA?.zIndex ?? 0;
        const zB = tB?.zIndex ?? 0;
        return zA - zB;
    });

    ctx.globalAlpha = 1;
    ctx.filter = 'none';

    sortedEntities.forEach(e => {
        const r = get<RendererRef>(w, 'renderer', e);
        const t = get<Transform>(w, 'transform', e);
        if (r && painters[r.painterId] && t) {
            ctx.save();
            ctx.translate(Math.floor(t.pos.x), Math.floor(t.pos.y));
            painters[r.painterId](ctx, w, e);
            ctx.restore();
        }
    });

    w.particles.forEach(p => {
        if (p.life > 0) {
            p.life -= w.dt;
            p.x += p.vx * w.dt;
            p.y += p.vy * w.dt;
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, p.size, p.size);
        }
    });
    w.particles = w.particles.filter(p => p.life > 0);

    w.level.collectibles.forEach(c => {
        if (activeCollectibles.has(c.id)) {
            const wobble = Math.sin(w.time * 5) * 2;
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(c.x + 12, c.y + 12 + wobble, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#B8860B';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.fillStyle = '#FFF';
            ctx.beginPath();
            ctx.arc(c.x + 8, c.y + 8 + wobble, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    w.heartPickups.forEach(h => {
        const pulse = 1 + Math.sin(w.time * 8) * 0.1;
        ctx.save();
        ctx.translate(h.x + h.w/2, h.y + h.h/2);
        ctx.scale(pulse, pulse);
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        const r = h.w/2;
        ctx.moveTo(0, r/2);
        ctx.bezierCurveTo(0, -r/2, -r, -r/2, -r, 0);
        ctx.bezierCurveTo(-r, r, 0, r*1.5, 0, r*1.5);
        ctx.bezierCurveTo(0, r*1.5, r, r, r, 0);
        ctx.bezierCurveTo(r, -r/2, 0, -r/2, 0, r/2);
        ctx.fill();
        ctx.restore();
    });

    w.bananaPickups.forEach(b => {
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(b.x + b.w/2, b.y + b.h/2, b.w/2, 0.5, Math.PI - 0.5);
        ctx.fill();
    });

    w.bananaPeels.forEach(p => {
        ctx.fillStyle = '#fde047';
        ctx.fillRect(p.x, p.y + p.h - 4, p.w, 4);
    });

    w.shockwaves.forEach(s => {
        s.life -= w.dt;
        s.radius += (s.maxRadius - s.radius) * 5 * w.dt;
        ctx.save();
        ctx.globalAlpha = Math.max(0, s.life / s.maxLife);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(s.x, s.y, s.radius, s.height, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });
    w.shockwaves = w.shockwaves.filter(s => s.life > 0);

    w.poofEffects.forEach(p => {
        p.life -= w.dt;
        p.radius += 50 * w.dt;
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });
    w.poofEffects = w.poofEffects.filter(p => p.life > 0);

    w.dashGhosts.forEach(g => {
        g.life -= w.dt;
        ctx.save();
        ctx.globalAlpha = (g.life / g.maxLife) * 0.4;
        ctx.fillStyle = g.palette.body || '#ffffff';
        ctx.fillRect(g.x, g.y, g.size.x, g.size.y);
        ctx.restore();
    });
    w.dashGhosts = w.dashGhosts.filter(g => g.life > 0);

    if (w.targetIndicator) {
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 4;
        const t = w.targetIndicator;
        const r = t.radius * (0.8 + 0.2 * Math.sin(w.time * 15));
        ctx.beginPath();
        ctx.arc(t.x, t.y, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(t.x - r - 10, t.y); ctx.lineTo(t.x + r + 10, t.y);
        ctx.moveTo(t.x, t.y - r - 10); ctx.lineTo(t.x, t.y + r + 10);
        ctx.stroke();
    }

    w.floatingTexts = w.floatingTexts.filter(t => t.life > 0);
    ctx.textAlign = 'center';
    ctx.font = 'bold 24px monospace';
    w.floatingTexts.forEach(t => {
        t.life -= w.dt;
        t.y += t.vy * w.dt;
        t.vy += 200 * w.dt; // gravity
        ctx.fillStyle = 'black';
        ctx.fillText(t.text, t.x + 2, t.y + 2);
        ctx.fillStyle = t.color;
        ctx.fillText(t.text, t.x, t.y);
    });

    if (w.debugFlags.showHitboxes) {
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 1;
        w.entities.forEach(e => {
            const t = get<Transform>(w, 'transform', e);
            if (t) {
                ctx.strokeRect(t.pos.x, t.pos.y, t.size.x, t.size.y);
                ctx.fillStyle = 'white';
                ctx.font = '10px monospace';
                ctx.fillText(`${e}`, t.pos.x + t.size.x/2, t.pos.y - 10);
            }
        });
        w.level.platforms.forEach(p => {
            ctx.strokeStyle = 'blue';
            ctx.strokeRect(p.x, p.y, p.w, p.h);
            ctx.fillStyle = 'cyan';
            ctx.font = '12px monospace';
            ctx.fillText(`${p.style} (${p.w}x${p.h})`, p.x + p.w/2, p.y + p.h/2);
        });
        w.level.zones.forEach(z => {
            ctx.strokeStyle = 'green';
            ctx.strokeRect(z.x, z.y, z.w, z.h);
        });
    }

    ctx.restore();
}
