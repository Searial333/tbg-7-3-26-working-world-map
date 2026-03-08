import type { World } from '../../types';
import { get } from '../ecs';
import type { Transform } from '../components';

export function counterPainter(ctx: CanvasRenderingContext2D, w: World, e: number) {
    const t = get<Transform>(w, 'transform', e);
    if (!t) return;

    // The SVG is 640x165, matching the entity size.
    // The painter's context is already translated to the entity's position,
    // so we can draw the contents at local (0,0).

    // Base of the counter
    const counterGrad = ctx.createLinearGradient(0, 0, 0, 155);
    counterGrad.addColorStop(0, "#8B4513");
    counterGrad.addColorStop(1, "#5A2D0C");
    
    ctx.fillStyle = counterGrad;
    ctx.strokeStyle = "#422006";
    ctx.lineWidth = 8;
    ctx.fillRect(0, 10, 640, 155);
    ctx.strokeRect(0, 10, 640, 155);

    // Top surface of the counter
    const counterTopGrad = ctx.createLinearGradient(0, 0, 0, 30);
    counterTopGrad.addColorStop(0, "#A0522D");
    counterTopGrad.addColorStop(1, "#8B4513");
    
    ctx.fillStyle = counterTopGrad;
    ctx.strokeStyle = "#422006";
    ctx.lineWidth = 8;
    
    // Custom rounded rect
    const r = 5;
    const x = 0;
    const y = 0;
    const width = 640;
    const height = 30;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Highlight line on the counter top
    ctx.strokeStyle = "#5A2D0C";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 15);
    ctx.lineTo(640, 15);
    ctx.stroke();
}
