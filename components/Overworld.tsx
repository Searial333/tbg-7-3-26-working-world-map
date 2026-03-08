
import React, { useState } from 'react';
import type { LevelProgress, LevelId, WorldId, WorldConfig, LevelMapNode } from '../types';
import { WORLDS, WORLD_1_MAP } from '../constants/levels';

interface OverworldProps {
    levelProgress: LevelProgress;
    onSelectLevel: (levelId: LevelId) => void;
    onGenerateLevel: (prompt: string) => void;
    isGenerating: boolean;
    onOpenEditor?: () => void;
}

// --- WORLD SELECT COMPONENTS ---

const WorldIsland: React.FC<{ 
    config: WorldConfig; 
    x: string; 
    y: string; 
    isLocked: boolean; 
    onClick: () => void 
}> = ({ config, x, y, isLocked, onClick }) => {
    
    // Procedural "Island" Icon based on theme
    const renderIslandIcon = () => {
        switch(config.theme) {
            case 'jungle':
                return (
                    <svg viewBox="0 0 100 80" className="w-full h-full drop-shadow-xl">
                        <path d="M10 60 Q 50 80 90 60 Q 95 50 85 45 Q 50 30 15 45 Q 5 50 10 60" fill="#eab308" /> {/* Sand */}
                        <path d="M20 45 Q 50 25 80 45 Q 75 55 50 55 Q 25 55 20 45" fill="#22c55e" /> {/* Grass */}
                        {/* Tree */}
                        <rect x="45" y="20" width="10" height="30" fill="#8B4513" rx="2" />
                        <path d="M25 25 Q 50 -10 75 25" fill="#22c55e" />
                        {/* Hut */}
                        <rect x="60" y="35" width="15" height="15" fill="#8B4513" />
                        <path d="M55 35 L 67.5 20 L 80 35" fill="#ca8a04" />
                    </svg>
                );
            case 'pipes':
                return (
                    <svg viewBox="0 0 100 80" className="w-full h-full drop-shadow-xl">
                        <ellipse cx="50" cy="55" rx="40" ry="20" fill="#4ade80" />
                        <rect y="55" width="80" height="20" x="-40" fill="#86efac" rx="10" transform="translate(50,0)" />
                        {/* Pipe */}
                        <rect x="20" y="25" width="20" height="30" fill="#22c55e" stroke="#14532d" strokeWidth="2" />
                        <rect x="15" y="20" width="30" height="10" fill="#22c55e" stroke="#14532d" strokeWidth="2" />
                        {/* Mushroom */}
                        <path d="M60 40 Q 75 20 90 40" fill="#ef4444" />
                        <circle cx="68" cy="32" r="3" fill="white" />
                        <circle cx="82" cy="32" r="3" fill="white" />
                        <rect x="70" y="40" width="10" height="10" fill="#fde047" />
                    </svg>
                );
            case 'speed':
                return (
                    <svg viewBox="0 0 100 80" className="w-full h-full drop-shadow-xl">
                        <rect x="10" y="40" width="80" height="30" fill="#4ade80" transform="skewX(-20)" />
                        <rect x="10" y="40" width="80" height="5" fill="#22c55e" transform="skewX(-20)" />
                        {/* Loop */}
                        <path d="M30 40 Q 30 10 50 10 Q 70 10 70 40" fill="none" stroke="#eab308" strokeWidth="8" />
                        {/* Ring */}
                        <circle cx="50" cy="25" r="5" stroke="#fbbf24" strokeWidth="2" fill="none" />
                    </svg>
                );
            case 'food':
                return (
                    <svg viewBox="0 0 100 80" className="w-full h-full drop-shadow-xl">
                        <path d="M10 50 Q 30 30 50 50 T 90 50" fill="#fce7f3" stroke="#fbcfe8" strokeWidth="2" />
                        {/* Blocks */}
                        <rect x="30" y="30" width="15" height="15" fill="#fbbf24" stroke="#d97706" strokeWidth="2" />
                        <rect x="50" y="20" width="15" height="15" fill="#f472b6" stroke="#db2777" strokeWidth="2" />
                        {/* Tree */}
                        <circle cx="75" cy="30" r="12" fill="#4ade80" />
                        <rect x="73" y="40" width="4" height="10" fill="#8B4513" />
                    </svg>
                );
            case 'city':
                return (
                    <svg viewBox="0 0 100 80" className="w-full h-full drop-shadow-xl">
                        <path d="M10 50 L 50 70 L 90 50 L 50 30 Z" fill="#1e3a8a" stroke="#60a5fa" />
                        {/* Buildings */}
                        <rect x="30" y="15" width="15" height="30" fill="#3b82f6" />
                        <rect x="33" y="18" width="3" height="3" fill="#93c5fd" />
                        <rect x="33" y="24" width="3" height="3" fill="#93c5fd" />
                        <rect x="55" y="25" width="20" height="20" fill="#60a5fa" />
                    </svg>
                );
            case 'alien':
                return (
                    <svg viewBox="0 0 100 80" className="w-full h-full drop-shadow-xl">
                        <path d="M10 60 Q 50 80 90 60 Q 90 20 50 20 Q 10 20 10 60" fill="#4c1d95" />
                        <path d="M30 60 Q 50 50 70 60 Q 60 70 40 70" fill="#22c55e" opacity="0.8" /> {/* Slime */}
                        <rect x="60" y="30" width="10" height="20" fill="#a855f7" rx="5" />
                    </svg>
                );
            case 'gothic':
                return (
                    <svg viewBox="0 0 100 80" className="w-full h-full drop-shadow-xl">
                        <ellipse cx="50" cy="60" rx="40" ry="15" fill="#374151" />
                        {/* Castle */}
                        <rect x="35" y="30" width="30" height="20" fill="#1f2937" />
                        <polygon points="35,30 35,15 50,25" fill="#4c1d95" />
                        <polygon points="65,30 65,15 50,25" fill="#4c1d95" />
                        <circle cx="80" cy="20" r="8" fill="#fef3c7" opacity="0.8" />
                    </svg>
                );
            default: // Medieval
                return (
                    <svg viewBox="0 0 100 80" className="w-full h-full drop-shadow-xl">
                        <rect x="20" y="40" width="60" height="30" fill="#78350f" />
                        <rect x="20" y="40" width="60" height="10" fill="#4ade80" />
                        <rect x="40" y="20" width="20" height="20" fill="#9ca3af" />
                        <polygon points="40,20 45,15 50,20 55,15 60,20" fill="#9ca3af" />
                    </svg>
                );
        }
    };

    return (
        <div 
            className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 group cursor-pointer ${isLocked ? 'grayscale opacity-60' : 'hover:scale-110 z-10'}`}
            style={{ left: x, top: y, width: '12%', height: '12%' }}
            onClick={() => !isLocked && onClick()}
        >
            {renderIslandIcon()}
            {/* Label */}
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                {config.name}
            </div>
            {!isLocked && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 animate-bounce">
                    <span className="text-2xl drop-shadow-md">👇</span>
                </div>
            )}
        </div>
    );
};

const DashedPath: React.FC<{ points: {x: number, y: number}[] }> = ({ points }) => {
    const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    
    return (
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            <path d={pathData} fill="none" stroke="#5c3716" strokeWidth="6" strokeDasharray="10 10" opacity="0.6" />
        </svg>
    );
};

const WorldSelectScreen: React.FC<{ onSelectWorld: (id: WorldId) => void }> = ({ onSelectWorld }) => {
    // Coordinate positions for the winding path (in percentages)
    const POSITIONS: Record<WorldId, {x: number, y: number}> = {
        'W1': { x: 15, y: 70 },
        'W2': { x: 30, y: 55 },
        'W3': { x: 50, y: 75 },
        'W4': { x: 65, y: 50 },
        'W5': { x: 45, y: 30 },
        'W6': { x: 65, y: 20 },
        'W7': { x: 85, y: 35 },
        'W8': { x: 85, y: 75 },
    };

    const totalStars = 24; // Dummy progress

    return (
        <div className="w-full h-full bg-[#fde68a] relative overflow-hidden flex flex-col">
            {/* Vintage Map Background */}
            <div className="absolute inset-0 opacity-30" style={{ 
                backgroundImage: 'radial-gradient(#d4b996 1px, transparent 1px)', 
                backgroundSize: '20px 20px',
                filter: 'sepia(0.5)' 
            }}></div>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')] opacity-50"></div>

            {/* Header */}
            <div className="relative z-20 pt-8 text-center">
                <div className="bg-[#5c3716] text-[#fde047] inline-block px-12 py-4 rounded-lg shadow-[0_10px_0_rgba(0,0,0,0.3)] transform -rotate-1 border-4 border-[#8B4513]">
                    <h1 className="ui-title text-5xl m-0 drop-shadow-md">WORLD SELECT</h1>
                </div>
            </div>

            {/* Map Area */}
            <div className="flex-1 relative">
                {/* Dashed Line Path */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                    <path 
                        d={`M ${POSITIONS['W1'].x}% ${POSITIONS['W1'].y}% 
                           Q 20% 50% ${POSITIONS['W2'].x}% ${POSITIONS['W2'].y}%
                           T ${POSITIONS['W3'].x}% ${POSITIONS['W3'].y}%
                           T ${POSITIONS['W4'].x}% ${POSITIONS['W4'].y}%
                           T ${POSITIONS['W5'].x}% ${POSITIONS['W5'].y}%
                           T ${POSITIONS['W6'].x}% ${POSITIONS['W6'].y}%
                           T ${POSITIONS['W7'].x}% ${POSITIONS['W7'].y}%
                           T ${POSITIONS['W8'].x}% ${POSITIONS['W8'].y}%`}
                        fill="none" 
                        stroke="#8B4513" 
                        strokeWidth="4" 
                        strokeDasharray="12 8" 
                        opacity="0.5"
                    />
                </svg>

                {Object.entries(WORLDS).map(([id, config]) => (
                    <WorldIsland 
                        key={id}
                        config={config}
                        x={`${POSITIONS[id as WorldId].x}%`}
                        y={`${POSITIONS[id as WorldId].y}%`}
                        isLocked={config.unlockRequirement > 0} // Simplistic lock check
                        onClick={() => onSelectWorld(id as WorldId)}
                    />
                ))}
            </div>

            {/* Footer */}
            <div className="relative z-20 pb-4 text-center">
                <div className="inline-flex items-center gap-2 bg-black/60 px-6 py-2 rounded-full text-white font-bold border-2 border-[#fde047]">
                    <span className="text-2xl">⭐</span>
                    <span className="text-xl">STARS: 0/{totalStars}</span>
                </div>
            </div>
        </div>
    );
};

// --- LEVEL SELECT COMPONENT ---

const LevelNode: React.FC<{ 
    id: LevelId; 
    x: string; 
    y: string; 
    status: 'locked' | 'unlocked' | 'completed';
    onClick: () => void;
}> = ({ id, x, y, status, onClick }) => {
    const isLocked = status === 'locked';
    const isBoss = id.includes('9');
    const isShop = id === 'SHOP';

    // Custom Icon Logic
    const renderIcon = () => {
        if (isShop) return '🛒';
        if (isBoss) return '💀';
        if (id.includes('1')) return '🍌';
        if (id.includes('2')) return '💣';
        if (id.includes('3')) return '🐊';
        if (id.includes('7')) return '🪵';
        return id.split('-')[1];
    };

    return (
        <div 
            className={`absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer group z-10 transition-transform duration-200 ${isLocked ? 'opacity-50 grayscale' : 'hover:scale-110'}`}
            style={{ left: x, top: y }}
            onClick={() => !isLocked && onClick()}
        >
            {/* Circle Base */}
            <div className={`
                w-16 h-16 rounded-full border-4 flex items-center justify-center shadow-lg relative bg-gradient-to-br
                ${isBoss ? 'from-red-600 to-red-800 border-red-900' : 
                  isShop ? 'from-blue-400 to-blue-600 border-blue-800' :
                  'from-green-400 to-green-600 border-green-800'}
            `}>
                {status === 'completed' && (
                    <div className="absolute -top-2 -right-2 bg-yellow-400 rounded-full p-1 border-2 border-orange-500 z-20">
                        <span className="text-xs">⭐</span>
                    </div>
                )}
                <span className="text-2xl drop-shadow-md filter">{renderIcon()}</span>
            </div>
            
            {/* Label */}
            <div className="mt-1 bg-[#fde68a] px-2 py-0.5 rounded border border-[#8B4513] shadow-sm transform scale-0 group-hover:scale-100 transition-transform origin-top">
                <span className="text-xs font-bold text-[#5c3716] whitespace-nowrap">{WORLDS['W1'].levels.find(l => l === id) ? (WORLDS['W1'].levels.find(l => l === id) === id ? WORLDS['W1'].levels.find(l => l === id) : id) : (isShop ? "Funky's" : "Level " + id)}</span>
            </div>
            
            {/* Level Number Badge */}
            {!isShop && !isBoss && (
                <div className="absolute -bottom-3 bg-[#5c3716] text-[#fde047] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#fde047]">
                    {id.split('-')[1]}
                </div>
            )}
        </div>
    );
};

const AICreatorModal: React.FC<{ onClose: () => void; onGenerate: (prompt: string) => void; isGenerating: boolean }> = ({ onClose, onGenerate, isGenerating }) => {
    const [prompt, setPrompt] = useState('');

    return (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 animate-fade-in backdrop-blur-sm" onClick={onClose}>
            <div className="ui-panel w-full max-w-lg p-6 flex flex-col gap-4" onClick={e => e.stopPropagation()}>
                <h2 className="ui-title text-3xl text-center">AI LEVEL ARCHITECT</h2>
                <p className="text-[#fde047] text-center italic">"Describe a treacherous path, and I shall build it!"</p>
                
                <textarea 
                    className="w-full h-32 bg-[#5c3716] border-2 border-[#8B4513] rounded p-2 text-white placeholder-white/50 focus:outline-none focus:border-[#fde047] resize-none"
                    placeholder="e.g., A vertical tower climb with many floating islands and angry bees..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    disabled={isGenerating}
                />
                
                <div className="flex justify-end gap-2 mt-2">
                    <button onClick={onClose} className="ui-button bg-gray-600 border-gray-500" disabled={isGenerating}>Cancel</button>
                    <button 
                        onClick={() => onGenerate(prompt)} 
                        className="ui-button !bg-purple-600 !border-purple-400 hover:!bg-purple-500"
                        disabled={isGenerating || !prompt.trim()}
                    >
                        {isGenerating ? 'Building...' : '✨ Generate'}
                    </button>
                </div>
                {isGenerating && (
                    <div className="text-center text-white animate-pulse">
                        Summoning platforms from the ether...
                    </div>
                )}
            </div>
        </div>
    );
};

const LevelSelectScreen: React.FC<OverworldProps & { worldId: WorldId, onBack: () => void }> = ({ levelProgress, onSelectLevel, onGenerateLevel, isGenerating, worldId, onBack, onOpenEditor }) => {
    const world = WORLDS[worldId];
    // Cast mapData to explicit type to fix 'unknown' type errors when accessing properties
    const mapData: Record<string, LevelMapNode> = worldId === 'W1' ? WORLD_1_MAP : {};
    const [showAIModal, setShowAIModal] = useState(false);
    
    // Draw SVG connections
    const connections = Object.entries(mapData).flatMap(([id, node]) => 
        node.connections.map(targetId => {
            const targetNode = mapData[targetId];
            if (!targetNode) return null;
            return (
                <path 
                    key={`${id}-${targetId}`}
                    d={`M ${node.x} ${node.y} L ${targetNode.x} ${targetNode.y}`}
                    stroke="white" 
                    strokeWidth="6" 
                    strokeLinecap="round"
                    strokeDasharray="10 15"
                    className="opacity-80 drop-shadow-md"
                />
            );
        })
    );

    return (
        <div className="w-full h-full relative bg-[#2d3748] overflow-hidden flex flex-col items-center justify-center">
            {/* Background Image (Jungle Map Style) */}
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundColor: '#2E8B57' }}>
                {/* Simulated Map Illustration */}
                <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path d="M0 0 L 100 0 L 100 20 Q 50 40 0 20 Z" fill="#87CEEB" /> {/* Sky/Water top */}
                    <path d="M0 100 L 100 100 L 100 80 Q 50 60 0 80 Z" fill="#8B4513" /> {/* Ground bottom */}
                    <path d="M 40 40 Q 60 60 80 40 T 120 40" stroke="#4ade80" strokeWidth="20" fill="none" opacity="0.2"/>
                </svg>
            </div>

            {/* Parchment Frame */}
            <div className="relative w-[95%] h-[90%] bg-[#fef3c7] rounded-sm shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden border-8 border-[#5c3716]">
                {/* Scroll Rolls */}
                <div className="absolute top-0 left-0 bottom-0 w-8 bg-gradient-to-r from-[#d4b996] to-[#fde68a] border-r border-[#8B4513] z-20 shadow-xl rounded-l-sm"></div>
                <div className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-l from-[#d4b996] to-[#fde68a] border-l border-[#8B4513] z-20 shadow-xl rounded-r-sm"></div>

                {/* Map Header */}
                <div className="bg-[#8B4513] text-[#fde047] p-2 text-center border-b-4 border-[#5c3716] relative z-10 mx-8 mt-4 rounded shadow-md flex justify-between items-center px-4">
                    <button onClick={onBack} className="bg-[#a16207] hover:bg-[#ca8a04] text-white px-3 py-1 rounded text-sm font-bold shadow-sm">
                        ◀ BACK
                    </button>
                    <h2 className="text-2xl font-bold uppercase tracking-widest drop-shadow-md">{world.name}</h2>
                    <div className="flex gap-2">
                        {onOpenEditor && (
                            <button onClick={onOpenEditor} className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-sm font-bold shadow-sm flex items-center gap-1">
                                🛠️ EDITOR
                            </button>
                        )}
                        <button onClick={() => setShowAIModal(true)} className="bg-purple-700 hover:bg-purple-600 text-white px-3 py-1 rounded text-sm font-bold shadow-sm flex items-center gap-1">
                            ✨ AI CREATE
                        </button>
                    </div>
                </div>

                {/* Nodes Container */}
                <div className="flex-1 relative mx-12 my-4 bg-[#86efac] rounded-lg border-2 border-[#166534] shadow-inner overflow-hidden">
                    {/* Inner Map Art */}
                    <div className="absolute inset-0 opacity-40 pointer-events-none" style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 100 Q 50 50 100 100 T 200 100' stroke='%2315803d' stroke-width='40' fill='none' /%3E%3C/svg%3E")`,
                        backgroundSize: 'cover'
                    }}></div>

                    {/* Start Portal Graphic */}
                    <div className="absolute" style={{ left: '8%', top: '50%', transform: 'translate(-50%, -50%)' }}>
                        <div className="w-20 h-20 bg-blue-400 rounded-full blur-xl opacity-50 animate-pulse"></div>
                        <div className="relative text-center">
                            <div className="w-12 h-4 bg-gray-600 rounded-full mx-auto mb-1 border-2 border-gray-400 shadow-lg"></div>
                            <span className="text-white font-bold text-lg drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">START</span>
                        </div>
                    </div>

                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                        {connections}
                    </svg>

                    {Object.entries(mapData).map(([id, node]) => {
                        const status = levelProgress[id] || 'locked';
                        const effectiveStatus = (id === '1-1' && status === 'locked') ? 'unlocked' : status;
                        
                        return (
                            <LevelNode
                                key={id}
                                id={id}
                                x={node.x}
                                y={node.y}
                                status={effectiveStatus}
                                onClick={() => onSelectLevel(id)}
                            />
                        );
                    })}
                </div>
            </div>
            
            {showAIModal && (
                <AICreatorModal 
                    onClose={() => setShowAIModal(false)}
                    onGenerate={onGenerateLevel}
                    isGenerating={isGenerating}
                />
            )}
        </div>
    );
};

const Overworld: React.FC<OverworldProps> = (props) => {
    const [selectedWorld, setSelectedWorld] = useState<WorldId | null>(null);

    if (selectedWorld) {
        return (
            <LevelSelectScreen 
                {...props} 
                worldId={selectedWorld} 
                onBack={() => setSelectedWorld(null)} 
            />
        );
    }

    return <WorldSelectScreen onSelectWorld={setSelectedWorld} />;
};

export default Overworld;
