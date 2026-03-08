
import React, { useState, useRef, useEffect } from 'react';
import type { Level, Platform, EnemySpawn, Collectible, Vec2 } from '../types';

interface LevelEditorProps {
    onTestLevel: (level: Level) => void;
    onClose: () => void;
}

type Tool = 'platform' | 'enemy' | 'coin' | 'eraser' | 'start' | 'finish';
type PlatformStyle = 'jungle_floor' | 'ancient_stone' | 'treetop_branch' | 'brick' | 'girder' | 'bounce';
type EnemyType = 'patrol' | 'flyer' | 'klaptrap' | 'snake';

const DEFAULT_LEVEL: Level = {
    id: 'custom_editor',
    worldId: 'W1',
    name: 'My New Level',
    subtitle: 'Editor Creation',
    type: 'normal',
    difficulty: 1,
    playerStart: { x: 100, y: 800 },
    bounds: { left: 0, right: 3000, top: 0, bottom: 2000 },
    background: 'JUNGLE_BEACH',
    music: 'jungle_1',
    platforms: [
        { style: 'jungle_floor', type: 'solid', x: 0, y: 1000, w: 1000, h: 400 },
    ],
    zones: [],
    collectibles: [],
    enemies: [],
    npcs: [],
    checkpoints: [],
    finishZone: { x: 2500, y: 800, w: 100, h: 200 },
    starRequirements: { bronze: 10, silver: 50, gold: 100 },
    parTime: 999,
};

const GRID_SIZE = 20;

export const LevelEditor: React.FC<LevelEditorProps> = ({ onTestLevel, onClose }) => {
    const [level, setLevel] = useState<Level>(DEFAULT_LEVEL);
    const [selectedTool, setSelectedTool] = useState<Tool>('platform');
    const [selectedStyle, setSelectedStyle] = useState<PlatformStyle>('jungle_floor');
    const [selectedEnemy, setSelectedEnemy] = useState<EnemyType>('patrol');
    const [camera, setCamera] = useState({ x: 0, y: 0, zoom: 0.5 });
    
    // Dragging state
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState<Vec2 | null>(null);
    const [currentRect, setCurrentRect] = useState<{x:number, y:number, w:number, h:number} | null>(null);
    const [isPanning, setIsPanning] = useState(false);
    const [lastPan, setLastPan] = useState<Vec2 | null>(null);

    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Helpers
    const snap = (val: number) => Math.round(val / GRID_SIZE) * GRID_SIZE;
    
    const screenToWorld = (sx: number, sy: number) => {
        return {
            x: (sx / camera.zoom) + camera.x,
            y: (sy / camera.zoom) + camera.y
        };
    };

    const worldToScreen = (wx: number, wy: number) => {
        return {
            x: (wx - camera.x) * camera.zoom,
            y: (wy - camera.y) * camera.zoom
        };
    };

    // Input Handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        const rect = canvasRef.current!.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const worldPos = screenToWorld(mouseX, mouseY);
        
        if (e.button === 1 || (e.button === 0 && e.shiftKey)) { // Middle click or Shift+Click to Pan
            setIsPanning(true);
            setLastPan({ x: mouseX, y: mouseY });
            return;
        }

        if (e.button !== 0) return;

        if (selectedTool === 'platform') {
            setIsDragging(true);
            setDragStart({ x: snap(worldPos.x), y: snap(worldPos.y) });
            setCurrentRect({ x: snap(worldPos.x), y: snap(worldPos.y), w: 0, h: 0 });
        } else if (selectedTool === 'enemy') {
            setLevel(prev => ({
                ...prev,
                enemies: [...prev.enemies, { 
                    type: selectedEnemy, 
                    x: snap(worldPos.x), 
                    y: snap(worldPos.y), 
                    id: `e_ed_${Date.now()}`,
                    variant: 'green' 
                }]
            }));
        } else if (selectedTool === 'coin') {
            setLevel(prev => ({
                ...prev,
                collectibles: [...prev.collectibles, { type: 'coin', x: snap(worldPos.x), y: snap(worldPos.y), id: `c_ed_${Date.now()}` }]
            }));
        } else if (selectedTool === 'start') {
            setLevel(prev => ({ ...prev, playerStart: { x: snap(worldPos.x), y: snap(worldPos.y) } }));
        } else if (selectedTool === 'finish') {
            setLevel(prev => ({ ...prev, finishZone: { ...prev.finishZone!, x: snap(worldPos.x), y: snap(worldPos.y) } }));
        } else if (selectedTool === 'eraser') {
            // Simple hitbox check to remove items
            const wx = worldPos.x;
            const wy = worldPos.y;
            
            setLevel(prev => {
                const newPlatforms = prev.platforms.filter(p => !(wx >= p.x && wx <= p.x + p.w && wy >= p.y && wy <= p.y + p.h));
                const newEnemies = prev.enemies.filter(e => Math.hypot(e.x - wx, e.y - wy) > 50);
                const newCollectibles = prev.collectibles.filter(c => Math.hypot(c.x - wx, c.y - wy) > 30);
                return { ...prev, platforms: newPlatforms, enemies: newEnemies, collectibles: newCollectibles };
            });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        const rect = canvasRef.current!.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const worldPos = screenToWorld(mouseX, mouseY);

        if (isPanning && lastPan) {
            const dx = (mouseX - lastPan.x) / camera.zoom;
            const dy = (mouseY - lastPan.y) / camera.zoom;
            setCamera(prev => ({ ...prev, x: prev.x - dx, y: prev.y - dy }));
            setLastPan({ x: mouseX, y: mouseY });
            return;
        }

        if (isDragging && dragStart && selectedTool === 'platform') {
            const currentX = snap(worldPos.x);
            const currentY = snap(worldPos.y);
            const w = currentX - dragStart.x;
            const h = currentY - dragStart.y;
            
            // Normalize rect (handle negative width/height)
            const finalX = w < 0 ? currentX : dragStart.x;
            const finalY = h < 0 ? currentY : dragStart.y;
            const finalW = Math.abs(w);
            const finalH = Math.abs(h);

            setCurrentRect({ x: finalX, y: finalY, w: finalW, h: finalH });
        }
    };

    const handleMouseUp = () => {
        if (isPanning) {
            setIsPanning(false);
            setLastPan(null);
        }

        if (isDragging && currentRect && selectedTool === 'platform') {
            // Enforce minimum size to prevent invisible physics bugs
            const safeW = Math.max(currentRect.w, 40);
            const safeH = Math.max(currentRect.h, 40);
            
            const newPlatform: Platform = {
                x: currentRect.x,
                y: currentRect.y,
                w: safeW,
                h: safeH,
                style: selectedStyle,
                type: selectedStyle === 'bounce' ? 'bounce' : (selectedStyle === 'treetop_branch' ? 'oneway' : 'solid'),
            };
            
            setLevel(prev => ({ ...prev, platforms: [...prev.platforms, newPlatform] }));
            setIsDragging(false);
            setDragStart(null);
            setCurrentRect(null);
        }
    };

    // Rendering Loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear
        ctx.fillStyle = '#1f2937'; // Dark background
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Grid
        ctx.strokeStyle = '#374151';
        ctx.lineWidth = 1;
        const startX = Math.floor(camera.x / GRID_SIZE) * GRID_SIZE;
        const startY = Math.floor(camera.y / GRID_SIZE) * GRID_SIZE;
        const endX = startX + (canvas.width / camera.zoom);
        const endY = startY + (canvas.height / camera.zoom);

        ctx.beginPath();
        for (let x = startX; x < endX; x += GRID_SIZE) {
            const s = worldToScreen(x, 0);
            ctx.moveTo(s.x, 0);
            ctx.lineTo(s.x, canvas.height);
        }
        for (let y = startY; y < endY; y += GRID_SIZE) {
            const s = worldToScreen(0, y);
            ctx.moveTo(0, s.y);
            ctx.lineTo(canvas.width, s.y);
        }
        ctx.stroke();

        // Origin Lines
        const origin = worldToScreen(0, 0);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(origin.x, 0); ctx.lineTo(origin.x, canvas.height);
        ctx.moveTo(0, origin.y); ctx.lineTo(canvas.width, origin.y);
        ctx.stroke();

        // Level Bounds
        const boundsTL = worldToScreen(level.bounds.left, level.bounds.top);
        const boundsBR = worldToScreen(level.bounds.right, level.bounds.bottom);
        ctx.strokeStyle = '#eab308';
        ctx.lineWidth = 2;
        ctx.strokeRect(boundsTL.x, boundsTL.y, boundsBR.x - boundsTL.x, boundsBR.y - boundsTL.y);

        // Draw Platforms
        level.platforms.forEach(p => {
            const s = worldToScreen(p.x, p.y);
            let color = '#a0aec0';
            if (p.style === 'jungle_floor') color = '#22c55e';
            if (p.style === 'ancient_stone') color = '#64748b';
            if (p.style === 'brick') color = '#b94e22';
            if (p.style === 'bounce') color = '#4ade80';
            
            ctx.fillStyle = color;
            ctx.fillRect(s.x, s.y, p.w * camera.zoom, p.h * camera.zoom);
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 1;
            ctx.strokeRect(s.x, s.y, p.w * camera.zoom, p.h * camera.zoom);
        });

        // Draw Current Drag
        if (currentRect) {
            const s = worldToScreen(currentRect.x, currentRect.y);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.fillRect(s.x, s.y, currentRect.w * camera.zoom, currentRect.h * camera.zoom);
            ctx.strokeStyle = 'white';
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(s.x, s.y, currentRect.w * camera.zoom, currentRect.h * camera.zoom);
            ctx.setLineDash([]);
        }

        // Draw Enemies
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `${20 * camera.zoom}px Arial`;
        level.enemies.forEach(e => {
            const s = worldToScreen(e.x, e.y);
            let icon = '👾';
            if (e.type === 'flyer') icon = '🐝';
            if (e.type === 'klaptrap') icon = '🐊';
            if (e.type === 'snake') icon = '🐍';
            ctx.fillText(icon, s.x, s.y);
        });

        // Draw Collectibles
        level.collectibles.forEach(c => {
            const s = worldToScreen(c.x, c.y);
            ctx.fillText('💰', s.x, s.y);
        });

        // Start Position
        const startS = worldToScreen(level.playerStart.x, level.playerStart.y);
        ctx.fillText('🏁', startS.x, startS.y);
        
        // Finish Zone
        if (level.finishZone) {
            const f = level.finishZone;
            const fS = worldToScreen(f.x, f.y);
            ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
            ctx.fillRect(fS.x, fS.y, f.w * camera.zoom, f.h * camera.zoom);
            ctx.strokeStyle = 'gold';
            ctx.strokeRect(fS.x, fS.y, f.w * camera.zoom, f.h * camera.zoom);
            ctx.fillStyle = 'white';
            ctx.font = `${14 * camera.zoom}px Arial`;
            ctx.fillText('GOAL', fS.x + (f.w * camera.zoom)/2, fS.y + (f.h * camera.zoom)/2);
        }

    }, [level, camera, currentRect, selectedTool]); // Re-render when these change

    const exportLevel = () => {
        console.log(JSON.stringify(level, null, 2));
        alert('Level JSON logged to console!');
    };

    return (
        <div className="absolute inset-0 bg-gray-900 flex flex-col z-50">
            {/* Header / Toolbar */}
            <div className="h-16 bg-[#5c3716] border-b-4 border-[#8B4513] flex items-center px-4 gap-4 shadow-lg text-white">
                <button onClick={onClose} className="bg-red-600 hover:bg-red-500 px-3 py-1 rounded font-bold">Exit</button>
                <div className="h-8 w-[1px] bg-white/20"></div>
                
                <div className="flex gap-2 bg-black/30 p-1 rounded">
                    <button onClick={() => setSelectedTool('platform')} className={`px-3 py-1 rounded ${selectedTool === 'platform' ? 'bg-[#fde047] text-black' : 'hover:bg-white/10'}`}>🧱 Platform</button>
                    <button onClick={() => setSelectedTool('enemy')} className={`px-3 py-1 rounded ${selectedTool === 'enemy' ? 'bg-[#fde047] text-black' : 'hover:bg-white/10'}`}>👾 Enemy</button>
                    <button onClick={() => setSelectedTool('coin')} className={`px-3 py-1 rounded ${selectedTool === 'coin' ? 'bg-[#fde047] text-black' : 'hover:bg-white/10'}`}>💰 Coin</button>
                    <button onClick={() => setSelectedTool('start')} className={`px-3 py-1 rounded ${selectedTool === 'start' ? 'bg-[#fde047] text-black' : 'hover:bg-white/10'}`}>🏁 Start</button>
                    <button onClick={() => setSelectedTool('finish')} className={`px-3 py-1 rounded ${selectedTool === 'finish' ? 'bg-[#fde047] text-black' : 'hover:bg-white/10'}`}>🏆 Goal</button>
                    <button onClick={() => setSelectedTool('eraser')} className={`px-3 py-1 rounded ${selectedTool === 'eraser' ? 'bg-red-500 text-white' : 'hover:bg-white/10'}`}>❌ Erase</button>
                </div>

                <div className="h-8 w-[1px] bg-white/20"></div>

                {/* Sub-options */}
                {selectedTool === 'platform' && (
                    <select 
                        value={selectedStyle} 
                        onChange={e => setSelectedStyle(e.target.value as any)}
                        className="bg-black/50 border border-[#8B4513] rounded px-2 py-1 text-sm"
                    >
                        <option value="jungle_floor">Grass</option>
                        <option value="ancient_stone">Stone</option>
                        <option value="brick">Brick</option>
                        <option value="treetop_branch">Branch (One-way)</option>
                        <option value="girder">Girder</option>
                        <option value="bounce">Bounce Pad</option>
                    </select>
                )}
                {selectedTool === 'enemy' && (
                    <select 
                        value={selectedEnemy} 
                        onChange={e => setSelectedEnemy(e.target.value as any)}
                        className="bg-black/50 border border-[#8B4513] rounded px-2 py-1 text-sm"
                    >
                        <option value="patrol">Kremling</option>
                        <option value="flyer">Zinger (Flyer)</option>
                        <option value="klaptrap">Klaptrap</option>
                        <option value="snake">Snake</option>
                    </select>
                )}

                <div className="flex-1"></div>
                <button onClick={exportLevel} className="bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded font-bold text-sm">Export JSON</button>
                <button onClick={() => onTestLevel(level)} className="bg-green-600 hover:bg-green-500 px-4 py-1 rounded font-bold flex items-center gap-2">
                    <span>▶</span> TEST LEVEL
                </button>
            </div>

            {/* Canvas Area */}
            <div className="flex-1 relative overflow-hidden bg-[#2d3748] cursor-crosshair">
                <canvas 
                    ref={canvasRef}
                    width={window.innerWidth}
                    height={window.innerHeight - 64}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onContextMenu={e => e.preventDefault()}
                />
                
                {/* Controls overlay */}
                <div className="absolute bottom-4 right-4 bg-black/50 p-2 rounded text-white text-xs">
                    <p>Left Click: Place/Drag</p>
                    <p>Middle/Shift+Drag: Pan</p>
                    <p>Mouse Wheel: Zoom (TODO)</p>
                </div>
            </div>
        </div>
    );
};
