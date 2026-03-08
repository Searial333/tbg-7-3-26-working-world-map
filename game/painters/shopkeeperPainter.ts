import type { World } from '../../types';
import { get } from '../ecs';
import type { StateMachine, Transform, NPC } from '../components';

const p = 4; // pixel size

const drawPart = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, c: string) => {
    ctx.fillStyle = c;
    ctx.fillRect(Math.floor(x * p), Math.floor(y * p), w * p, h * p);
};

const PALETTE = {
    fur_dark: '#6D4C41', fur: '#8D6E63', fur_light: '#A1887F',
    fur_grey: '#BDBDBD', fur_grey_dark: '#9E9E9E',
    hat_dark: '#3E2723', hat: '#4E342E', hat_highlight: '#5D4037',
    snout: '#BC8F8F', snout_dark: '#A0522D',
    nose: '#3E2723', eye_white: '#ffffff', eye_pupil: '#1f2937',
};

const GREETINGS = [
    "Hmph, what brings you to my neck of the woods?",
    "Careful now, Little Cub... those potions can be... unpredictable.",
    "Put some pep in your step, with some of these here new fangled SpringBoots.",
    "Buh Bye, Baby Bear...",
    "Looking for an upgrade?",
];

function drawInteractionPrompt(ctx: CanvasRenderingContext2D, w: World, t: Transform) {
    const greetingIndex = Math.floor(w.time / 4) % GREETINGS.length;
    const text = GREETINGS[greetingIndex];
    
    ctx.font = 'bold 18px Krub, sans-serif';
    const textMetrics = ctx.measureText(text);
    const textWidth = textMetrics.width;

    const pulse = 1 + Math.sin(w.time * 6) * 0.05;
    const bubbleW = (textWidth + 30) * pulse;
    const bubbleH = 50 * pulse;
    const bubbleX = t.size.x / 2 - bubbleW / 2;
    const bubbleY = -bubbleH - 20;

    // Bubble shape
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.lineWidth = 4 * pulse;
    ctx.beginPath();
    ctx.moveTo(bubbleX + 20, bubbleY);
    ctx.lineTo(bubbleX + bubbleW - 20, bubbleY);
    ctx.quadraticCurveTo(bubbleX + bubbleW, bubbleY, bubbleX + bubbleW, bubbleY + 20);
    ctx.lineTo(bubbleX + bubbleW, bubbleY + bubbleH - 20);
    ctx.quadraticCurveTo(bubbleX + bubbleW, bubbleY + bubbleH, bubbleX + bubbleW - 20, bubbleY + bubbleH);
    ctx.lineTo(bubbleX + 30, bubbleY + bubbleH); 
    ctx.quadraticCurveTo(bubbleX + 20, bubbleY + bubbleH + 20, bubbleX + 25, bubbleY + bubbleH-5);
    ctx.lineTo(bubbleX + 20, bubbleY + bubbleH);
    ctx.quadraticCurveTo(bubbleX, bubbleY + bubbleH, bubbleX, bubbleY + bubbleH - 20);
    ctx.lineTo(bubbleX, bubbleY + 20);
    ctx.quadraticCurveTo(bubbleX, bubbleY, bubbleX + 20, bubbleY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Text
    ctx.fillStyle = '#1f2937';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, bubbleX + bubbleW / 2, bubbleY + bubbleH / 2);
}


export function shopkeeperPainter(ctx: CanvasRenderingContext2D, w: World, e: number) {
    const t = get<Transform>(w, 'transform', e);
    const s = get<StateMachine>(w, 'state', e);
    const npc = get<NPC>(w, 'npc', e);
    if (!t || !s) return;

    const pal = PALETTE;
    const time = w.time;
    const bob = Math.sin(time * 1.5) * 2; // Slower, heavier breathing
    const bodyY = 15 + bob;
    
    // --- DRAWING ORDER: BACK TO FRONT ---
    
    // BACK ARM
    drawPart(ctx, 4, bodyY + 12, 14, 12, pal.fur_dark);
    drawPart(ctx, 4, bodyY + 12, 13, 11, pal.fur);

    // BODY
    drawPart(ctx, 10, bodyY, 60, 52, pal.fur_dark);
    drawPart(ctx, 11, bodyY, 58, 51, pal.fur);
    
    // BELLY
    drawPart(ctx, 28, bodyY + 20, 24, 30, pal.fur_grey_dark);
    drawPart(ctx, 29, bodyY + 20, 22, 29, pal.fur_grey);
    
    // HEAD
    const headY = bob;
    drawPart(ctx, 20, headY + 4, 40, 36, pal.fur_dark);
    drawPart(ctx, 21, headY + 4, 38, 35, pal.fur);
    // Ears
    drawPart(ctx, 18, headY, 12, 12, pal.fur_light);
    drawPart(ctx, 50, headY, 12, 12, pal.fur_light);
    
    // SNOUT (Grey and weathered)
    drawPart(ctx, 25, headY + 25, 30, 14, pal.fur_grey_dark);
    drawPart(ctx, 26, headY + 25, 28, 13, pal.fur_grey);
    // Nose
    drawPart(ctx, 35, headY + 25, 10, 6, pal.nose);
    
    // EYES & Hat
    const eyeY = headY + 20;
    const eyeBlink = time % 5 < 0.15;
    if (!eyeBlink) {
        // Kind, slightly squinted eyes
        drawPart(ctx, 28, eyeY, 8, 4, pal.eye_white); 
        drawPart(ctx, 44, eyeY, 8, 4, pal.eye_white);
        drawPart(ctx, 30, eyeY + 1, 4, 2, pal.eye_pupil); 
        drawPart(ctx, 46, eyeY + 1, 4, 2, pal.eye_pupil);
    } else {
        // Blink line
        drawPart(ctx, 28, eyeY+1, 8, 2, pal.fur_dark);
        drawPart(ctx, 44, eyeY+1, 8, 2, pal.fur_dark);
    }
    // Hat
    drawPart(ctx, 15, headY + 8, 50, 8, pal.hat_dark); // Brim
    drawPart(ctx, 22, headY - 4, 36, 14, pal.hat_dark); // Crown
    drawPart(ctx, 23, headY - 3, 34, 13, pal.hat);
    drawPart(ctx, 15, headY + 9, 50, 4, pal.hat);

    // FRONT ARM
    drawPart(ctx, 62, bodyY + 12, 14, 12, pal.fur_dark);
    drawPart(ctx, 62, bodyY + 12, 13, 11, pal.fur);

    if (npc?.interactionState === 'prompting') {
        drawInteractionPrompt(ctx, w, t);
    }
}