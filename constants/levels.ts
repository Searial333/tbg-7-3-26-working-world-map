
import type { Level, LevelId, WorldId, WorldConfig, LevelMapNode, LevelGimmick } from '../types';

// ============================================================================
// WORLD CONFIGURATIONS
// ============================================================================

export const WORLDS: Record<WorldId, WorldConfig> = {
  'W1': {
    id: 'W1',
    name: 'Jungle Juice',
    subtitle: 'World 1',
    theme: 'jungle',
    unlockRequirement: 0,
    totalStars: 27,
    levels: ['1-1', '1-2', '1-3', '1-4', '1-5', '1-6', '1-7', '1-8', '1-9'],
    bossLevel: '1-9',
    description: 'A lush tropical paradise... but danger lurks in every vine!',
    inspiration: 'Donkey Kong Country',
    colors: { primary: '#228B22', secondary: '#8B4513' }
  },
  'W2': {
    id: 'W2',
    name: 'Plumber Pipes',
    subtitle: 'World 2',
    theme: 'pipes',
    unlockRequirement: 9,
    totalStars: 27,
    levels: ['2-1', '2-2', '2-3', '2-4', '2-5', '2-6', '2-7', '2-8', '2-9'],
    bossLevel: '2-9',
    description: 'Underground tunnels filled with pipes and peculiar plumbing!',
    inspiration: 'Super Mario Bros',
    colors: { primary: '#32CD32', secondary: '#DC143C' }
  },
  'W3': {
    id: 'W3',
    name: 'Blue Blur',
    subtitle: 'World 3',
    theme: 'speed',
    unlockRequirement: 18,
    totalStars: 27,
    levels: ['3-1', '3-2', '3-3', '3-4', '3-5', '3-6', '3-7', '3-8', '3-9'],
    bossLevel: '3-9',
    description: 'Gotta go fast through loops and springs!',
    inspiration: 'Sonic the Hedgehog',
    colors: { primary: '#1E90FF', secondary: '#FFD700' }
  },
  'W4': {
    id: 'W4',
    name: 'Munchie Madness',
    subtitle: 'World 4',
    theme: 'food',
    unlockRequirement: 27,
    totalStars: 27,
    levels: ['4-1', '4-2', '4-3', '4-4', '4-5', '4-6', '4-7', '4-8', '4-9'],
    bossLevel: '4-9',
    description: 'A delicious dreamland of candy and treats!',
    inspiration: 'Kirby',
    colors: { primary: '#FF69B4', secondary: '#FFE4B5' }
  },
  'W5': {
    id: 'W5',
    name: 'Rocking Roll',
    subtitle: 'World 5',
    theme: 'city',
    unlockRequirement: 36,
    totalStars: 27,
    levels: ['5-1', '5-2', '5-3', '5-4', '5-5', '5-6', '5-7', '5-8', '5-9'],
    bossLevel: '5-9',
    description: 'A futuristic city under robot invasion!',
    inspiration: 'Mega Man',
    colors: { primary: '#4169E1', secondary: '#C0C0C0' }
  },
  'W6': {
    id: 'W6',
    name: 'Zebes Zion',
    subtitle: 'World 6',
    theme: 'alien',
    unlockRequirement: 45,
    totalStars: 27,
    levels: ['6-1', '6-2', '6-3', '6-4', '6-5', '6-6', '6-7', '6-8', '6-9'],
    bossLevel: '6-9',
    description: 'An alien planet with strange life forms!',
    inspiration: 'Metroid',
    colors: { primary: '#9400D3', secondary: '#00FF00' }
  },
  'W7': {
    id: 'W7',
    name: "Dracula's Dream",
    subtitle: 'World 7',
    theme: 'gothic',
    unlockRequirement: 54,
    totalStars: 27,
    levels: ['7-1', '7-2', '7-3', '7-4', '7-5', '7-6', '7-7', '7-8', '7-9'],
    bossLevel: '7-9',
    description: 'A haunted castle filled with creatures of the night!',
    inspiration: 'Castlevania',
    colors: { primary: '#8B0000', secondary: '#4B0082' }
  },
  'W8': {
    id: 'W8',
    name: "Soldier's Spade",
    subtitle: 'World 8',
    theme: 'medieval',
    unlockRequirement: 63,
    totalStars: 27,
    levels: ['8-1', '8-2', '8-3', '8-4', '8-5', '8-6', '8-7', '8-8', '8-9'],
    bossLevel: '8-9',
    description: 'A kingdom in peril needs a brave hero!',
    inspiration: 'Shovel Knight',
    colors: { primary: '#DAA520', secondary: '#2F4F4F' }
  },
};

export const WORLD_ORDER: WorldId[] = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8'];

export const LEVEL_ORDER: LevelId[] = [
    '1-1', '1-2', '1-3', '1-4', '1-5', '1-6', '1-7', '1-8', '1-9',
    '2-1', '2-2', '2-3', '2-4', '2-5', '2-6', '2-7', '2-8', '2-9'
];

export const WORLD_1_MAP: Record<string, LevelMapNode> = {
    '1-1': { x: '10%', y: '80%', connections: ['1-2'] },
    '1-2': { x: '22%', y: '70%', connections: ['1-3'] },
    '1-3': { x: '28%', y: '55%', connections: ['SHOP', '1-4'] },
    'SHOP': { x: '38%', y: '45%', connections: [] },
    '1-4': { x: '25%', y: '40%', connections: ['1-5'] },
    '1-5': { x: '40%', y: '30%', connections: ['1-6'] },
    '1-6': { x: '55%', y: '35%', connections: ['1-7'] },
    '1-7': { x: '70%', y: '50%', connections: ['1-8'] },
    '1-8': { x: '80%', y: '65%', connections: ['1-9'] },
    '1-9': { x: '90%', y: '80%', connections: [] },
};

// ============================================================================
// LEVEL DEFINITIONS
// ============================================================================

export const LEVELS: Record<LevelId, Level> = {
  // ========== WORLD 1: JUNGLE JUICE ==========
  '1-1': {
    id: '1-1',
    worldId: 'W1',
    name: 'Banana Cove',
    subtitle: 'Welcome to the Jungle',
    type: 'normal',
    gimmick: 'standard',
    difficulty: 1,
    playerStart: { x: 100, y: 800 },
    bounds: { left: 0, right: 4000, top: 0, bottom: 1400 },
    background: 'JUNGLE_BEACH',
    music: 'jungle_1',
    platforms: [
      { style: 'jungle_floor', type: 'solid', x: 0, y: 1000, w: 1000, h: 400 },
      { style: 'treetop_branch', type: 'oneway', x: 600, y: 800, w: 200, h: 30 },
      { style: 'treetop_branch', type: 'oneway', x: 900, y: 700, w: 200, h: 30 },
      { style: 'jungle_floor', type: 'solid', x: 1200, y: 1000, w: 80, h: 400 },
      { style: 'bounce', type: 'bounce', x: 1800, y: 1000, w: 100, h: 50 },
      { style: 'treetop_branch', type: 'solid', x: 1300, y: 500, w: 400, h: 40 },
      { style: 'jungle_floor', type: 'solid', x: 2200, y: 900, w: 2300, h: 500 },
      { style: 'ancient_stone', type: 'solid', x: 2500, y: 550, w: 300, h: 50 },
      { style: 'ancient_stone', type: 'solid', x: 3000, y: 650, w: 100, h: 250 },
    ],
    zones: [
        { type: 'lava', x: 950, y: 1300, w: 300, h: 200 }
    ],
    collectibles: [
      { type: 'coin', id: 'c1', x: 700, y: 750 },
      { type: 'coin', id: 'c2', x: 1500, y: 450 },
      { type: 'coin', id: 'c3', x: 2650, y: 700 },
      { type: 'coin', id: 'c4', x: 3500, y: 800 },
    ],
    enemies: [
      { type: 'klaptrap', x: 500, y: 940, id: 'e1', patrolBounds: {left: 300, right: 800}, variant: 'blue' },
      { type: 'flyer', x: 1600, y: 800, id: 'f1', variant: 'yellow' },
      { type: 'patrol', x: 2800, y: 830, id: 'e2', patrolBounds: {left: 2300, right: 2900}, variant: 'green' },
      { type: 'klaptrap', x: 3800, y: 840, id: 'k1', variant: 'blue' },
      { type: 'snake', x: 3300, y: 820, id: 's1', variant: 'green' }
    ],
    checkpoints: [{ id: 'cp1', x: 2100, y: 900, w: 50, h: 100 }],
    npcs: [],
    finishZone: { x: 3800, y: 800, w: 100, h: 200 },
    starRequirements: { bronze: 50, silver: 100, gold: 150 },
    parTime: 90,
  },
  '1-2': {
    id: '1-2',
    worldId: 'W1',
    name: 'Barrel Blast',
    subtitle: 'Launch into Action',
    type: 'normal',
    gimmick: 'barrel_blast',
    difficulty: 2,
    playerStart: { x: 100, y: 1400 },
    bounds: { left: 0, right: 3500, top: 0, bottom: 2000 },
    background: 'JUNGLE_CANOPY',
    music: 'jungle_1',
    platforms: [
        { style: 'jungle_floor', type: 'solid', x: 0, y: 1600, w: 600, h: 400 },
        { style: 'ancient_stone', type: 'solid', x: 2000, y: 1400, w: 400, h: 50 },
        // Moving Platform
        { style: 'wood', type: 'solid', x: 800, y: 1500, w: 200, h: 30, moving: { path: [{x: 800, y: 1500}, {x: 1200, y: 1500}], speed: 100 } },
        { style: 'jungle_floor', type: 'solid', x: 3000, y: 1400, w: 600, h: 600 },
    ],
    zones: [
        { type: 'lava', x: 600, y: 1900, w: 2400, h: 100 }
    ],
    barrels: [
        { id: 'b1', x: 500, y: 1400, type: 'manual', direction: 0, rotateSpeed: 0 },
        { id: 'b2', x: 1000, y: 1200, type: 'auto', direction: 45 },
        { id: 'b3', x: 1500, y: 1300, type: 'manual', direction: 0, rotateSpeed: 60 },
        { id: 'b4', x: 2500, y: 1200, type: 'manual', direction: -45, rotateSpeed: 45 },
    ],
    collectibles: [
        { type: 'coin', id: 'c1', x: 1250, y: 1100 },
        { type: 'coin', id: 'c2', x: 2800, y: 1100 },
    ],
    enemies: [
        { type: 'flyer', id: 'f1', x: 1200, y: 1300, variant: 'red' },
        { type: 'flyer', id: 'f2', x: 2700, y: 1200, variant: 'yellow' },
        { type: 'snake', id: 's1', x: 2200, y: 1320, variant: 'purple' },
    ],
    checkpoints: [{ id: 'cp1', x: 2100, y: 1400, w: 50, h: 100 }],
    npcs: [],
    finishZone: { x: 3300, y: 1200, w: 100, h: 200 },
    starRequirements: { bronze: 60, silver: 120, gold: 180 },
    parTime: 120,
  },
  '1-3': {
    id: '1-3',
    worldId: 'W1',
    name: 'Vine Valley',
    subtitle: 'Swing Through the Trees',
    type: 'normal',
    gimmick: 'vine_swing',
    difficulty: 2,
    playerStart: { x: 100, y: 1600 },
    bounds: { left: 0, right: 4500, top: 0, bottom: 2200 },
    background: 'JUNGLE_VINES',
    music: 'jungle_2',
    platforms: [
        { style: 'jungle_floor', type: 'solid', x: 0, y: 1800, w: 500, h: 400 },
        { style: 'ancient_stone', type: 'solid', x: 1400, y: 1900, w: 200, h: 300 },
        { style: 'ancient_stone', type: 'solid', x: 2600, y: 1800, w: 200, h: 400 },
        { style: 'jungle_floor', type: 'solid', x: 3600, y: 1700, w: 600, h: 500 },
    ],
    zones: [
        { type: 'lava', x: 500, y: 2100, w: 3100, h: 100 }
    ],
    vines: [
        { id: 'v1', x: 700, y: 1100, length: 500 },
        { id: 'v2', x: 1100, y: 1150, length: 450 },
        { id: 'v3', x: 2000, y: 1100, length: 550 },
        { id: 'v4', x: 2400, y: 1100, length: 500 },
        { id: 'v5', x: 3100, y: 1050, length: 600 },
    ],
    collectibles: [{type:'coin', id:'c1', x: 1200, y: 1450}, {type:'coin', id:'c2', x: 3100, y: 1300}],
    enemies: [
        {type: 'flyer', id: 'f1', x: 900, y: 1400, variant: 'red'},
        {type: 'flyer', id: 'f2', x: 2200, y: 1300, variant: 'yellow'},
        {type: 'klaptrap', id: 'k1', x: 3800, y: 1640, variant: 'purple'}
    ],
    checkpoints: [{id: 'cp1', x: 1450, y: 1900, w: 50, h: 100}],
    npcs: [],
    finishZone: { x: 4300, y: 1600, w: 100, h: 100 },
    starRequirements: { bronze: 70, silver: 140, gold: 210 },
    parTime: 150,
  },
  '1-4': {
    id: '1-4',
    worldId: 'W1',
    name: 'Crocodile Isle',
    subtitle: 'Watch Your Step',
    type: 'normal',
    gimmick: 'water',
    difficulty: 3,
    playerStart: { x: 100, y: 800 },
    bounds: { left: 0, right: 5000, top: 0, bottom: 1800 },
    background: 'JUNGLE_SWAMP',
    music: 'jungle_2',
    platforms: [
        { style: 'jungle_floor', type: 'solid', x: 0, y: 1200, w: 600, h: 600 },
        { style: 'coral_reef', type: 'solid', x: 1000, y: 1400, w: 200, h: 400 },
        { style: 'coral_reef', type: 'solid', x: 1600, y: 1200, w: 200, h: 600 },
        { style: 'coral_reef', type: 'solid', x: 2400, y: 1500, w: 200, h: 300 },
        { style: 'ancient_stone', type: 'solid', x: 3000, y: 1100, w: 400, h: 50 },
        { style: 'jungle_floor', type: 'solid', x: 3600, y: 1200, w: 1400, h: 600 },
    ],
    zones: [
        { type: 'water', x: 600, y: 1300, w: 3000, h: 500 },
    ],
    collectibles: [
        { type: 'coin', id: 'c1', x: 1700, y: 1100 },
        { type: 'coin', id: 'c2', x: 3200, y: 1000 },
    ],
    enemies: [
        { type: 'flyer', x: 2000, y: 1400, id: 'f1', variant: 'blue' },
        { type: 'klaptrap', x: 3700, y: 1130, id: 'k1', variant: 'blue'}
    ],
    checkpoints: [],
    npcs: [],
    finishZone: { x: 4800, y: 1100, w: 100, h: 100 },
    starRequirements: { bronze: 80, silver: 160, gold: 240 },
    parTime: 180,
  },
  '1-5': {
    id: '1-5',
    worldId: 'W1',
    name: 'Temple Run',
    subtitle: 'Ancient Secrets Await',
    type: 'normal',
    gimmick: 'chase',
    difficulty: 3,
    playerStart: { x: 100, y: 800 },
    bounds: { left: 0, right: 6000, top: 0, bottom: 1600 },
    background: 'JUNGLE_TEMPLE',
    music: 'jungle_tense',
    platforms: [
        { style: 'ancient_stone', type: 'solid', x: 0, y: 1200, w: 6000, h: 400 },
        { style: 'ancient_stone', type: 'solid', x: 800, y: 1000, w: 100, h: 200 },
        { style: 'ancient_stone', type: 'solid', x: 1600, y: 1000, w: 100, h: 200 },
        { style: 'ancient_stone', type: 'solid', x: 2200, y: 900, w: 400, h: 300 },
    ],
    zones: [
        { type: 'lava', x: 3000, y: 1200, w: 500, h: 20 }
    ],
    collectibles: [{type:'coin', id:'c1', x: 2400, y: 800}],
    enemies: [
        { type: 'klaptrap', x: 1200, y: 1150, id: 'k1', variant: 'red', patrolBounds: {left: 1000, right: 1400} },
        { type: 'klaptrap', x: 4000, y: 1130, id: 'k2', variant: 'purple' }
    ],
    checkpoints: [],
    npcs: [],
    finishZone: { x: 5800, y: 800, w: 100, h: 200 },
    starRequirements: { bronze: 90, silver: 180, gold: 270 },
    parTime: 120,
  },
  '1-6': {
    id: '1-6',
    worldId: 'W1',
    name: 'Peanut Popgun Panic',
    subtitle: "Diddy's Stadium",
    type: 'boss',
    gimmick: 'boss',
    difficulty: 4,
    playerStart: { x: 200, y: 1200 },
    bounds: { left: 0, right: 2000, top: 0, bottom: 2000 },
    background: 'JUNGLE_TREETOP',
    music: 'boss_jungle',
    platforms: [
        { style: 'jungle_floor', type: 'solid', x: 0, y: 1500, w: 2000, h: 500 }, // Floor
        { style: 'shop_interior', type: 'solid', x: 0, y: 0, w: 100, h: 1500 }, // Left Boundary Wall
        { style: 'shop_interior', type: 'solid', x: 1900, y: 0, w: 100, h: 1500 }, // Right Boundary Wall
        { style: 'treetop_branch', type: 'oneway', x: 400, y: 1300, w: 300, h: 30 },
        { style: 'treetop_branch', type: 'oneway', x: 1300, y: 1300, w: 300, h: 30 },
        { style: 'treetop_branch', type: 'oneway', x: 850, y: 1100, w: 300, h: 30 },
        { style: 'treetop_branch', type: 'oneway', x: 100, y: 900, w: 400, h: 30 },
        { style: 'treetop_branch', type: 'oneway', x: 1500, y: 900, w: 400, h: 30 },
    ],
    zones: [],
    collectibles: [],
    enemies: [],
    checkpoints: [],
    npcs: [],
    bossSpawns: [{ id: 'boss_diddy', type: 'diddy', x: 1000, y: 1200 }],
    finishZone: { x: 1800, y: 1400, w: 100, h: 100, initiallyHidden: true },
    starRequirements: { bronze: 1, silver: 1, gold: 1 },
    parTime: 120,
  },
  '1-7': {
    id: '1-7',
    worldId: 'W1',
    name: 'River Raft',
    subtitle: 'Ride the Rapids',
    type: 'normal',
    gimmick: 'autoscroll',
    difficulty: 4,
    playerStart: { x: 100, y: 600 },
    bounds: { left: 0, right: 8000, top: 0, bottom: 1400 },
    background: 'JUNGLE_RIVER',
    music: 'jungle_action',
    platforms: [
        { style: 'jungle_floor', type: 'solid', x: 0, y: 1000, w: 300, h: 300 },
        { style: 'jungle_floor', type: 'solid', x: 7500, y: 1000, w: 500, h: 300 },
        { style: 'wood', type: 'solid', x: 300, y: 1050, w: 200, h: 20, moving: { path: [{x: 300, y: 1050}, {x: 7300, y: 1050}], speed: 200 } },
        { style: 'ancient_stone', type: 'solid', x: 1200, y: 900, w: 100, h: 200 },
        { style: 'ancient_stone', type: 'solid', x: 2500, y: 800, w: 100, h: 300 },
    ],
    zones: [
        { type: 'water', x: 300, y: 1100, w: 7200, h: 300 }
    ],
    collectibles: [{type:'coin', id:'c1', x: 2550, y: 750}],
    enemies: [{ type: 'flyer', x: 2000, y: 900, id: 'f1', variant: 'blue' }],
    checkpoints: [],
    npcs: [],
    finishZone: { x: 7800, y: 900, w: 100, h: 200 },
    starRequirements: { bronze: 110, silver: 220, gold: 330 },
    parTime: 200,
  },
  '1-8': {
    id: '1-8',
    worldId: 'W1',
    name: 'Jungle Drums',
    subtitle: 'Feel the Beat',
    type: 'normal',
    gimmick: 'standard',
    difficulty: 4,
    playerStart: { x: 100, y: 1400 },
    bounds: { left: 0, right: 5000, top: 0, bottom: 2000 },
    background: 'JUNGLE_NIGHT',
    music: 'jungle_drums',
    platforms: [
        { style: 'jungle_floor', type: 'solid', x: 0, y: 1700, w: 500, h: 300 },
        { style: 'bounce', type: 'bounce', x: 600, y: 1700, w: 100, h: 50 },
        { style: 'bounce', type: 'bounce', x: 900, y: 1600, w: 100, h: 50 },
        { style: 'bounce', type: 'bounce', x: 1200, y: 1500, w: 100, h: 50 },
        { style: 'bounce', type: 'bounce', x: 1600, y: 1400, w: 150, h: 50 },
        { style: 'jungle_floor', type: 'solid', x: 2000, y: 1700, w: 1000, h: 300 },
    ],
    zones: [
        { type: 'lava', x: 500, y: 1900, w: 1500, h: 100 }
    ],
    collectibles: [{type:'coin', id:'c1', x: 1650, y: 1200}],
    enemies: [{ type: 'flyer', x: 1050, y: 1400, id: 'f1' }],
    checkpoints: [],
    npcs: [],
    finishZone: { x: 2800, y: 1600, w: 100, h: 100 },
    starRequirements: { bronze: 120, silver: 240, gold: 360 },
    parTime: 210,
  },
  '1-9': {
    id: '1-9',
    worldId: 'W1',
    name: "Kong's Treehouse",
    subtitle: 'The King of the Jungle',
    type: 'boss',
    gimmick: 'boss',
    difficulty: 5,
    playerStart: { x: 200, y: 1300 },
    bounds: { left: 0, right: 2400, top: 0, bottom: 2000 },
    background: 'JUNGLE_BOSS',
    music: 'boss_jungle',
    platforms: [
        { style: 'construction_grate', type: 'solid', x: 0, y: 1700, w: 2400, h: 300 },
        { style: 'construction_beam', type: 'oneway', x: 400, y: 1500, w: 400, h: 30 },
        { style: 'construction_beam', type: 'oneway', x: 1600, y: 1500, w: 400, h: 30 },
    ],
    zones: [],
    collectibles: [],
    enemies: [],
    checkpoints: [],
    npcs: [],
    bossSpawns: [{ id: 'boss_kong', type: 'kong', x: 1200, y: 1500 }],
    finishZone: { x: 2200, y: 1500, w: 100, h: 200, initiallyHidden: true },
    starRequirements: { bronze: 1, silver: 1, gold: 1 },
    parTime: 300,
  },

  // ========== WORLD 2: PLUMBER PIPES ==========
  '2-1': {
    id: '2-1',
    worldId: 'W2',
    name: 'Pipe Plains',
    subtitle: 'It\'s-a me, a level!',
    type: 'normal',
    gimmick: 'standard',
    difficulty: 2,
    playerStart: { x: 100, y: 1000 },
    bounds: { left: 0, right: 6000, top: 0, bottom: 1500 },
    background: 'W2_OVERWORLD',
    music: 'jungle_1', // Placeholder
    platforms: [
        { style: 'grass', type: 'solid', x: 0, y: 1200, w: 1500, h: 300 },
        // Pipe 1
        { style: 'pipe_body', type: 'solid', x: 600, y: 1100, w: 80, h: 100 },
        { style: 'pipe_top', type: 'solid', x: 590, y: 1060, w: 100, h: 40 },
        // Pipe 2
        { style: 'pipe_body', type: 'solid', x: 900, y: 1050, w: 80, h: 150 },
        { style: 'pipe_top', type: 'solid', x: 890, y: 1010, w: 100, h: 40 },
        // Pit
        { style: 'grass', type: 'solid', x: 1700, y: 1200, w: 1000, h: 300 },
        // Question Blocks
        { style: 'question', type: 'solid', x: 2000, y: 900, w: 60, h: 60 },
        { style: 'brick', type: 'solid', x: 2060, y: 900, w: 60, h: 60 },
        { style: 'question', type: 'solid', x: 2120, y: 900, w: 60, h: 60 },
        { style: 'question', type: 'solid', x: 2060, y: 700, w: 60, h: 60 },
        // Stairs
        { style: 'hard_block', type: 'solid', x: 3000, y: 1140, w: 60, h: 60 },
        { style: 'hard_block', type: 'solid', x: 3060, y: 1080, w: 60, h: 120 },
        { style: 'hard_block', type: 'solid', x: 3120, y: 1020, w: 60, h: 180 },
        { style: 'hard_block', type: 'solid', x: 3180, y: 960, w: 60, h: 240 },
        { style: 'grass', type: 'solid', x: 3240, y: 1200, w: 2000, h: 300 },
    ],
    zones: [],
    collectibles: [{type:'coin', id:'c21_1', x: 2030, y: 750}, {type:'coin', id:'c21_2', x: 2150, y: 750}],
    enemies: [
        { type: 'patrol', x: 800, y: 1100, id: 'g1', variant: 'green', patrolBounds: {left: 700, right: 880} },
        { type: 'patrol', x: 2300, y: 1100, id: 'g2', variant: 'green' }
    ],
    npcs: [],
    checkpoints: [],
    finishZone: { x: 5500, y: 1100, w: 50, h: 100 }, // Flagpole base
    starRequirements: { bronze: 50, silver: 100, gold: 150 },
    parTime: 100,
  },
  '2-2': {
    id: '2-2',
    worldId: 'W2',
    name: 'Sewer Slide',
    subtitle: 'Down the tubes',
    type: 'normal',
    gimmick: 'standard',
    difficulty: 3,
    playerStart: { x: 100, y: 200 },
    bounds: { left: 0, right: 4000, top: 0, bottom: 1500 },
    background: 'W2_UNDERGROUND',
    music: 'jungle_tense',
    platforms: [
        // Entry Pipe
        { style: 'pipe_body', type: 'solid', x: 50, y: 0, w: 100, h: 400 },
        { style: 'brick', type: 'solid', x: 0, y: 1200, w: 4000, h: 300 }, // Floor
        { style: 'brick', type: 'solid', x: 0, y: 0, w: 4000, h: 100 }, // Ceiling
        // Obstacles
        { style: 'hard_block', type: 'solid', x: 600, y: 1000, w: 100, h: 200 },
        { style: 'hard_block', type: 'solid', x: 900, y: 900, w: 100, h: 300 },
        { style: 'pipe_body', type: 'solid', x: 1400, y: 800, w: 100, h: 400 }, // Hanging pipe
        { style: 'pipe_top', type: 'solid', x: 1390, y: 1180, w: 120, h: 40 },
    ],
    zones: [],
    collectibles: [{type:'coin', id:'c22_1', x: 700, y: 900}],
    enemies: [
        { type: 'patrol', x: 1100, y: 1100, id: 'b1', variant: 'blue' }, // Buzzy Beetle
        { type: 'snake', x: 2000, y: 1100, id: 'p1', variant: 'purple' } // Piranha plant sub
    ],
    npcs: [],
    checkpoints: [{ id: 'cp22', x: 2000, y: 1100, w: 50, h: 100 }],
    finishZone: { x: 3800, y: 1100, w: 100, h: 100 },
    starRequirements: { bronze: 50, silver: 100, gold: 150 },
    parTime: 120,
  },
  '2-3': {
    id: '2-3',
    worldId: 'W2',
    name: 'Pipe Dreams',
    subtitle: 'Tangled Tunnels',
    type: 'normal',
    difficulty: 3,
    playerStart: { x: 100, y: 1000 },
    bounds: { left: 0, right: 4000, top: 0, bottom: 2000 },
    background: 'W2_OVERWORLD',
    platforms: [
        {style:'grass', type:'solid', x:0, y:1200, w:1000, h:300},
        {style:'pipe_body', type:'solid', x:500, y:1000, w:80, h:200},
        {style:'pipe_top', type:'solid', x:490, y:960, w:100, h:40},
        {style:'pipe_body', type:'solid', x:800, y:900, w:80, h:300},
        {style:'pipe_top', type:'solid', x:790, y:860, w:100, h:40},
        {style:'grass', type:'solid', x:1200, y:1200, w:2800, h:300},
    ],
    zones: [], collectibles: [], enemies: [], npcs: [], checkpoints: [],
    finishZone: {x:3800, y:1100, w:100, h:100}
  },
  '2-4': {
    id: '2-4',
    worldId: 'W2',
    name: 'Sky High',
    subtitle: 'Athletic Clouds',
    type: 'normal',
    difficulty: 4,
    playerStart: { x: 100, y: 1000 },
    bounds: { left: 0, right: 4000, top: 0, bottom: 2000 },
    background: 'W2_OVERWORLD',
    platforms: [
        {style:'mushroom_cap', type:'solid', x:0, y:1200, w:500, h:100},
        {style:'mushroom_cap', type:'solid', x:600, y:1100, w:300, h:100},
        {style:'mushroom_cap', type:'solid', x:1200, y:1000, w:400, h:100},
        {style:'bounce', type:'bounce', x: 1400, y: 1000, w: 100, h: 50},
        {style:'wood', type:'solid', x: 2000, y: 900, w: 200, h: 30, moving: { path: [{x: 2000, y: 900}, {x: 2500, y: 900}], speed: 150 }},
        {style:'mushroom_cap', type:'solid', x:2800, y:900, w:1000, h:100}
    ],
    zones: [], collectibles: [], enemies: [], npcs: [], checkpoints: [],
    finishZone: {x:3600, y:800, w:100, h:100}
  },
  '2-5': { id: '2-5', worldId: 'W2', name: 'Pipe Maze', type: 'normal', playerStart: { x: 100, y: 1000 }, bounds: { left: 0, right: 3000, top: 0, bottom: 1500 }, background: 'W2_UNDERGROUND', platforms: [{style:'brick', type:'solid', x:0, y:1200, w:3000, h:300}], zones: [], collectibles: [], enemies: [], npcs: [], checkpoints: [], finishZone: {x:2800, y:1100, w:100, h:100} },
  '2-6': { id: '2-6', worldId: 'W2', name: 'Cheep Cheep Beach', type: 'normal', playerStart: { x: 100, y: 1000 }, bounds: { left: 0, right: 3000, top: 0, bottom: 1500 }, background: 'W2_OVERWORLD', platforms: [{style:'grass', type:'solid', x:0, y:1200, w:3000, h:300}], zones: [], collectibles: [], enemies: [], npcs: [], checkpoints: [], finishZone: {x:2800, y:1100, w:100, h:100} },
  '2-7': { id: '2-7', worldId: 'W2', name: 'Underground Complex', type: 'normal', playerStart: { x: 100, y: 1000 }, bounds: { left: 0, right: 3000, top: 0, bottom: 1500 }, background: 'W2_UNDERGROUND', platforms: [{style:'brick', type:'solid', x:0, y:1200, w:3000, h:300}], zones: [], collectibles: [], enemies: [], npcs: [], checkpoints: [], finishZone: {x:2800, y:1100, w:100, h:100} },
  '2-8': { id: '2-8', worldId: 'W2', name: 'Bullet Barrage', type: 'normal', playerStart: { x: 100, y: 1000 }, bounds: { left: 0, right: 3000, top: 0, bottom: 1500 }, background: 'W2_OVERWORLD', platforms: [{style:'grass', type:'solid', x:0, y:1200, w:3000, h:300}], zones: [], collectibles: [], enemies: [], npcs: [], checkpoints: [], finishZone: {x:2800, y:1100, w:100, h:100} },
  '2-9': { 
      id: '2-9', worldId: 'W2', name: 'Koopa Castle', subtitle: 'The Final Showdown?', type: 'boss', 
      playerStart: { x: 100, y: 1000 }, bounds: { left: 0, right: 2000, top: 0, bottom: 1500 }, 
      background: 'W2_CASTLE', 
      platforms: [
          {style:'hard_block', type:'solid', x:0, y:1200, w:2000, h:300},
          {style:'hard_block', type:'solid', x:500, y:1000, w:1000, h:50} // Bridge
      ], 
      zones: [{type:'lava', x:500, y:1250, w:1000, h:50}], 
      collectibles: [], enemies: [], npcs: [], checkpoints: [], 
      bossSpawns: [{id: 'bowser', type: 'kong', x: 1200, y: 900}], // Re-use Kong AI for now
      finishZone: {x:1800, y:1100, w:100, h:100, initiallyHidden: true} 
  },

  // ========== SHOP (Special) ==========
  'SHOP': {
    id: 'SHOP',
    worldId: 'W1',
    name: "Funky's Items",
    subtitle: 'Spend your coins!',
    type: 'shop',
    gimmick: 'standard',
    difficulty: 0,
    playerStart: { x: 200, y: 500 },
    bounds: { left: 0, right: 1200, top: 0, bottom: 675 }, // Single screen
    background: 'SHOP',
    music: 'shop_theme',
    platforms: [
        { style: 'shop_interior', type: 'solid', x: 0, y: 600, w: 1200, h: 75 },
    ],
    zones: [],
    collectibles: [],
    enemies: [],
    npcs: [
        { type: 'shopkeeper', x: 800, y: 600, id: 'shopkeeper_1' },
        { type: 'counter', x: 600, y: 600, id: 'counter_1' }
    ],
    checkpoints: [],
    finishZone: { x: -100, y: -100, w: 0, h: 0 },
    starRequirements: { bronze: 0, silver: 0, gold: 0 },
    parTime: 0,
  }
};
