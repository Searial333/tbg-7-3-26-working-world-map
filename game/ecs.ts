
import type { World, EntityId, ComponentName, Component, Vec2, GameActions, Level, Particle, VisualSettings, ParallaxLayer, CreateWorldProps } from '../types';
import type { ActorPreset } from '../types';
import { CHARACTER_PRESETS, DK_PRESET } from '../constants/characters';
import type { Kinematics, Health, StateMachine, Abilities, Transform, RendererRef, Palette, Attachments, Projectile, Jiggle, Boss, BarrelCannon, Vine } from './components';

// --- Parallax Asset Generation ---
const createSvgUrl = (svg: string) => `data:image/svg+xml;base64,${btoa(svg)}`;

const PARALLAX_LAYERS_JUNGLE_1_1: ParallaxLayer[] = [
    { id: 'sky', type: 'image', data: createSvgUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675"><defs><linearGradient id="g" x1="0.5" y1="0" x2="0.5" y2="1"><stop offset="0%" stop-color="#87CEEB"/><stop offset="100%" stop-color="#F0E68C"/></linearGradient></defs><rect width="1200" height="675" fill="url(#g)"/></svg>`), depth: 0 },
    { id: 'clouds', type: 'image', depth: 0.1, width: 1200, height: 675, data: createSvgUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675"><path d="M-100 200 Q 200 100 500 250 T 1300 220" fill="rgba(255,255,255,0.4)"/><path d="M-50 300 Q 300 200 600 350 T 1250 320" fill="rgba(255,255,255,0.3)"/></svg>`) },
    { id: 'hills1', type: 'image', depth: 0.2, width: 1200, height: 675, data: createSvgUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675"><path d="M0 450 C 200 350, 300 500, 500 430 S 700 330, 850 400 S 1000 500, 1200 450 V 675 H 0 Z" fill="#228B22"/></svg>`) },
    { id: 'hills2', type: 'image', depth: 0.4, width: 1200, height: 675, data: createSvgUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675"><path d="M0 500 C 150 450, 250 550, 450 500 S 650 450, 800 520 S 1000 600, 1200 550 V 675 H 0 Z" fill="#3CB371"/></svg>`) },
    { id: 'trees', type: 'image', depth: 0.6, width: 1200, height: 675, data: createSvgUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675">${Array.from({length: 10}).map((_, i) => `<path d="M${-80 + i * 130} 675 V ${250 + Math.sin(i*2) * 60} C ${-40 + i * 130} ${180 + Math.sin(i*2) * 60}, ${40 + i * 130} ${180 + Math.sin(i*2) * 60}, ${80 + i * 130} ${250 + Math.sin(i*2) * 60} V 675 Z" fill="#006400"/>`).join('')}</svg>`) },
    { id: 'fg_leaves', type: 'image', depth: 1.5, width: 1800, height: 675, data: createSvgUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1800 675"><path d="M1500 0 C 1400 200, 1600 300, 1550 450" fill="rgba(0,100,0,0.5)"/><path d="M100 -10 C 200 200, 50 400, 150 675" fill="rgba(0,100,0,0.4)"/></svg>`) },
];

const PARALLAX_LAYERS_WORLD_2: ParallaxLayer[] = [
    { id: 'sky_w2', type: 'image', depth: 0, data: createSvgUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675"><rect width="1200" height="675" fill="#5c94fc"/></svg>`) },
    { id: 'clouds_w2', type: 'image', depth: 0.1, width: 1200, height: 675, data: createSvgUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675">
        <path d="M100 150 Q 130 120 160 150 T 220 150 T 280 150 Q 310 180 280 210 H 130 Q 100 180 100 150" fill="white" opacity="0.9"/>
        <path d="M800 100 Q 830 70 860 100 T 920 100 T 980 100 Q 1010 130 980 160 H 830 Q 800 130 800 100" fill="white" opacity="0.9"/>
    </svg>`) },
    { id: 'hills_w2_far', type: 'image', depth: 0.2, width: 1200, height: 675, data: createSvgUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675">
        <path d="M0 675 V 500 Q 200 300 400 500 T 800 500 T 1200 450 V 675 Z" fill="#008000" stroke="black" stroke-width="2"/>
        <circle cx="200" cy="550" r="10" fill="#004d00" opacity="0.3"/>
        <circle cx="800" cy="520" r="15" fill="#004d00" opacity="0.3"/>
    </svg>`) },
    { id: 'hills_w2_near', type: 'image', depth: 0.5, width: 1200, height: 675, data: createSvgUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675">
        <path d="M-100 675 V 600 Q 100 450 300 600 T 700 600 T 1100 550 T 1300 675 Z" fill="#00c000" stroke="black" stroke-width="3"/>
        <path d="M300 600 L 280 620 M 310 610 L 290 630" stroke="black" stroke-width="2" opacity="0.2"/>
    </svg>`) },
];

const PARALLAX_LAYERS_W2_UNDERGROUND: ParallaxLayer[] = [
    { id: 'bg_w2_u', type: 'color', depth: 0, data: '#000000' },
    { id: 'pipes_bg', type: 'image', depth: 0.3, width: 1200, height: 675, data: createSvgUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675">
        <rect x="100" y="0" width="60" height="675" fill="#004d00" opacity="0.3"/>
        <rect x="500" y="0" width="80" height="675" fill="#004d00" opacity="0.3"/>
        <rect x="900" y="0" width="50" height="675" fill="#004d00" opacity="0.3"/>
    </svg>`) },
];

const PARALLAX_LAYERS_W2_CASTLE: ParallaxLayer[] = [
    { id: 'bg_w2_c', type: 'color', depth: 0, data: '#1a1a1a' },
    { id: 'castle_wall', type: 'image', depth: 0.2, width: 100, height: 100, data: createSvgUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <rect width="100" height="100" fill="#333"/>
        <rect x="5" y="5" width="40" height="20" fill="#222"/>
        <rect x="55" y="30" width="40" height="20" fill="#222"/>
        <rect x="5" y="55" width="40" height="20" fill="#222"/>
        <rect x="55" y="80" width="40" height="20" fill="#222"/>
    </svg>`) },
];

const PARALLAX_LAYERS_CONSTRUCTION_BOSS: ParallaxLayer[] = [
    // Sunset sky gradient
    { id: 'sky_boss_sunset', type: 'image', depth: 0, data: createSvgUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1800 1012.5"><defs><linearGradient id="g" x1="0.5" y1="0" x2="0.5" y2="1"><stop offset="0%" stop-color="#2d374d"/><stop offset="50%" stop-color="#f6ad55"/><stop offset="100%" stop-color="#fefcbf"/></linearGradient></defs><rect width="1800" height="1012.5" fill="url(#g)"/></svg>`) },
    // Sun
    { id: 'sun_boss', type: 'image', depth: 0.1, width: 1800, height: 1012.5, data: createSvgUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1800 1012.5"><defs><radialGradient id="sun" cx="25%" cy="70%" r="40%"><stop offset="0%" stop-color="rgba(255,255,220,0.6)"/><stop offset="20%" stop-color="rgba(255,220,180,0.3)"/><stop offset="100%" stop-color="rgba(255,220,180,0)"/></radialGradient></defs><rect width="1800" height="1012.5" fill="url(#sun)"/></svg>`) },
    // Distant city silhouette
    { id: 'city_distant_boss', type: 'image', depth: 0.2, width: 1800, height: 1012.5, data: createSvgUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1800 1012.5"><path d="M0 1012.5 V 700 L 100 650 L 150 710 L 250 680 L 300 720 L 400 600 L 550 730 L 700 690 L 800 740 L 950 620 L 1100 700 L 1200 650 L 1400 750 L 1550 680 L 1700 710 L 1800 640 V 1012.5 Z" fill="#1a202c"/></svg>`) },
    // Mid-ground cranes and structures
    { id: 'cranes_mid_boss', type: 'image', depth: 0.4, width: 1800, height: 1012.5, data: createSvgUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1800 1012.5"><g fill="#2d3748"><path d="M200 1012.5 V 200 H 500 L 480 220 H 220 V 1012.5 Z" /><path d="M1200 1012.5 V 150 H 1600" stroke="#2d3748" stroke-width="15" fill="none"/><rect x="800" y="500" width="200" height="512.5" /><rect x="750" y="450" width="300" height="50" /></g></svg>`) },
    // Foreground girders and scaffolding
    { id: 'scaffolding_fg_boss', type: 'image', depth: 1.5, width: 1800, height: 1012.5, data: createSvgUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1800 1012.5"><g fill="rgba(15, 23, 42, 0.7)"><rect x="-50" y="0" width="100" height="1012.5" /><rect x="1750" y="0" width="100" height="1012.5" /><rect x="0" y="-50" width="1800" height="100" /><path d="M-50 800 L 400 1062.5" stroke="rgba(15, 23, 42, 0.7)" stroke-width="40" /><path d="M1850 700 L 1300 1062.5" stroke="rgba(15, 23, 42, 0.7)" stroke-width="50" /></g></svg>`) },
];
const PARALLAX_LAYERS_SHOP: ParallaxLayer[] = [
     { id: 'shop_wall_hd', type: 'image', depth: 0, width: 1200, height: 675, data: createSvgUrl(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675">
            <defs>
                <linearGradient id="wallGrad" x1="0.5" y1="0" x2="0.5" y2="1">
                    <stop offset="0%" stop-color="#6B4F35"/><stop offset="100%" stop-color="#4A3725"/>
                </linearGradient>
                 <linearGradient id="plankGrad" x1="0" y1="0.5" x2="1" y2="0.5">
                    <stop offset="0%" stop-color="rgba(0,0,0,0.2)"/>
                    <stop offset="50%" stop-color="rgba(0,0,0,0)"/>
                    <stop offset="100%" stop-color="rgba(0,0,0,0.2)"/>
                </linearGradient>
                <radialGradient id="star" cx="0.5" cy="0.5" r="0.5"><stop offset="0%" stop-color="white"/><stop offset="100%" stop-color="transparent"/></radialGradient>
            </defs>
            <rect width="1200" height="675" fill="url(#wallGrad)"/>
            <!-- Vertical Planks -->
            ${[...Array(15)].map((_, i) => `<g><rect x="${i * 80}" y="0" width="80" height="675" fill="url(#plankGrad)"/><line x1="${i * 80}" y1="0" x2="${i*80}" y2="675" stroke="rgba(0,0,0,0.3)" stroke-width="2"/></g>`).join('')}
            
            <!-- Window with starry night -->
            <circle cx="900" cy="220" r="120" fill="#382314" stroke="#4a2c2a" stroke-width="12"/>
            <circle cx="900" cy="220" r="110" fill="#0c0f14"/>
            ${[...Array(100)].map((_, i) => `<circle cx="${900 + (Math.random()-0.5)*220}" cy="${220 + (Math.random()-0.5)*220}" r="${Math.random()*1.5}" fill="url(#star)" opacity="${Math.random()*0.8 + 0.2}"/>`).join('')}
            <line x1="780" y1="220" x2="1020" y2="220" stroke="#382314" stroke-width="8"/>
            <line x1="900" y1="100" x2="900" y2="340" stroke="#382314" stroke-width="8"/>

            <!-- Shelves -->
            <rect x="100" y="150" width="500" height="25" fill="#4a2c2a" rx="3"/><rect x="100" y="150" width="500" height="8" fill="#5f370e" rx="2"/>
            <rect x="110" y="175" width="40" height="20" fill="#382314" /><rect x="550" y="175" width="40" height="20" fill="#382314" />
            
            <rect x="100" y="320" width="500" height="25" fill="#4a2c2a" rx="3"/><rect x="100" y="320" width="500" height="8" fill="#5f370e" rx="2"/>
            <rect x="110" y="345" width="40" height="20" fill="#382314" /><rect x="550" y="345" width="40" height="20" fill="#382314" />
        </svg>
     `)},
     { id: 'shop_fg_hd', type: 'image', depth: 1.5, width: 1200, height: 675, data: createSvgUrl(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675">
            <defs>
                <radialGradient id="lanternGlow" cx="0.5" cy="0.5" r="0.5">
                    <stop offset="0%" stop-color="rgba(251, 191, 36, 0.5)"/>
                    <stop offset="100%" stop-color="rgba(251, 191, 36, 0)"/>
                </radialGradient>
            </defs>
            <!-- Hanging Lantern -->
            <path d="M200 0 V 80" stroke="#362204" stroke-width="6"/>
            <path d="M180 80 H 220" stroke="#422006" stroke-width="8"/>
            <rect x="185" y="80" width="30" height="50" fill="#854d0e" rx="5"/>
            <rect x="190" y="85" width="20" height="40" fill="#fcd34d"/>
            <circle cx="200" cy="105" r="50" fill="url(#lanternGlow)"/>
        </svg>
     `)}
];


export function createWorld(props: CreateWorldProps): World {
    const world: Partial<World> = {
        time: 0,
        lastTime: 0,
        dt: 1 / 60,
        status: 'playing',
        entities: new Set(),
        playerId: -1,
        components: new Map(),
        camera: { x: 0, y: 0, shakeMagnitude: 0, shakeDuration: 0, logicalWidth: props.logicalWidth, logicalHeight: props.logicalHeight },
        particles: [],
        floatingTexts: [],
        milkSplats: [],
        stinkClouds: [],
        heartPickups: [],
        bananaPickups: [],
        bananaPeels: [],
        poofEffects: [],
        shockwaves: [],
        dashGhosts: [],
        canInteract: false,
        respawnPlayer: false,
        level: props.level,
        coinsThisLevel: 0,
        activatedCheckpoints: new Set(),
        visualSettings: props.visualSettings,
        upgrades: props.upgrades,
        debugFlags: props.debugFlags,
        hasInteractedWithShop: false,
        lightningFlash: undefined,
        isTestMode: props.isTestMode ?? false,
        dialogueActive: false,
    };

    const levelName = props.level.name;
    if (levelName.includes("Bazaar") || levelName.includes("Store")) {
        world.parallaxLayers = PARALLAX_LAYERS_SHOP;
    } else if (props.level.type === 'boss') {
        world.parallaxLayers = PARALLAX_LAYERS_CONSTRUCTION_BOSS;
    } else if (props.level.background === 'W2_UNDERGROUND') {
        world.parallaxLayers = PARALLAX_LAYERS_W2_UNDERGROUND;
    } else if (props.level.background === 'W2_CASTLE') {
        world.parallaxLayers = PARALLAX_LAYERS_W2_CASTLE;
    } else if (props.level.worldId === 'W2') {
        world.parallaxLayers = PARALLAX_LAYERS_WORLD_2;
    } else {
        world.parallaxLayers = PARALLAX_LAYERS_JUNGLE_1_1; // Default
    }

    (world as World).actions = {
        onStateUpdate: props.onStateUpdate,
        createParticleBurst: (x, y, count, color, type = 'burst', options = {}) => {
            const finalCount = Math.floor(count * (world as World).visualSettings.particleDensity);
            for (let i = 0; i < finalCount; i++) {
                let angle = Math.random() * Math.PI * 2;
                let speed = Math.random() * 5 + 2;

                if (type === 'line' && options.direction) {
                    angle = (options.direction > 0 ? 0 : Math.PI) + (Math.random() - 0.5) * 0.8;
                    speed = Math.random() * 8 + 4;
                }
                
                if (type === 'trail') {
                    angle = Math.random() * Math.PI * 2;
                    speed = Math.random() * 1;
                }

                if (options.velocityMultiplier) speed *= options.velocityMultiplier;

                (world.particles as Particle[]).push({
                    x, y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    life: 1, maxLife: 1,
                    color, size: (Math.random() * 3 + 2) * (options.sizeMultiplier ?? 1), type,
                });
            }
        },
        setScreenShake: (magnitude, duration) => {
            (world.camera as World['camera']).shakeMagnitude = magnitude;
            (world.camera as World['camera']).shakeDuration = duration;
        },
        log: (message: string) => {},
        collectCoin: () => {
            if (props.onCoinCollected) {
                props.onCoinCollected();
                (world as World).coinsThisLevel++;
            }
        },
    };

    return world as World;
}

let nextEntityId = 0;
export function createEntity(w: World): EntityId {
    const id = nextEntityId++;
    w.entities.add(id);
    return id;
}

export function set<T extends Component>(w: World, name: ComponentName, e: EntityId, c: T) {
    if (!w.components.has(name)) {
        w.components.set(name, new Map());
    }
    w.components.get(name)!.set(e, c);
}

export function get<T extends Component>(w: World, name: ComponentName, e: EntityId): T | undefined {
    return w.components.get(name)?.get(e) as T | undefined;
}


export function spawnActor(w: World, preset: ActorPreset, pos: Vec2): EntityId {
    const e = createEntity(w);
    
    set<Transform>(w, 'transform', e, {
        pos: { ...pos }, vel: { x: 0, y: 0 }, size: preset.size,
        facing: 1, onGround: false, onWall: 0, groundY: -1, onLadder: false,
        lastCheckpoint: {...pos},
        zIndex: 100 // High zIndex for player to ensure visibility
    });

    const defaultPhysics = CHARACTER_PRESETS.TEDDY.physics;
    set<Kinematics>(w, 'kinematics', e, { ...defaultPhysics, ...preset.physics } as Kinematics);

    set<StateMachine>(w, 'state', e, { state: 'idle', animTime: 0, invulnFrames: 0, respawnFrames: 0, timers: {} });
    
    // PLAYER STARTS WITH 9 HEARTS
    set<Health>(w, 'health', e, { hp: 9, maxHp: 9, dead: false });
    
    const k = get<Kinematics>(w, 'kinematics', e)!;
    const hasDiaperAbility = preset.abilities.includes('diaperBomb');
    const maxDashCharges = k.maxJumps > 1 ? 1 : 0; // Allow one air-dash if player can double jump
    set<Abilities>(w, 'abilities', e, {
        available: new Set(preset.abilities),
        context: { 
            jumpsLeft: k.maxJumps,
            coyote: 0,
            rollMomentum: 0,
            dropThrough: 0,
            dashCharges: maxDashCharges,
            maxDashCharges: maxDashCharges,
            hasDiaper: hasDiaperAbility,
            diaperCooldown: 0,
            lookTarget: null,
            jumpBuffer: 0,
            wallClingTimer: 0,
        }
    });

    set<RendererRef>(w, 'renderer', e, { painterId: preset.painterId });
    set<Palette>(w, 'palette', e, preset.palette);

    if (preset.attachments) {
        set<Attachments>(w, 'attachments', e, { list: preset.attachments });
    }
    
    if (preset.jiggle) {
        const jiggleComponent: Jiggle = {};
        preset.jiggle.forEach(spec => {
             jiggleComponent[spec.id] = {
                spec,
                pos: { x: 0, y: 0 },
                vel: { x: 0, y: 0 },
                anchor: { x: 0, y: 0 },
            };
        });
        set<Jiggle>(w, 'jiggle', e, jiggleComponent);
    }


    return e;
}

export function spawnBoss(w: World, pos: Vec2, type: 'dk' | 'kong' | 'diddy' = 'dk'): EntityId {
    const e = createEntity(w);
    let preset = DK_PRESET;
    let bossType: 'dk' | 'diddy' = 'dk';
    let bossHp = 100;

    if (type === 'diddy') {
        bossType = 'diddy';
        bossHp = 60; // Mini-boss has less health
        preset = {
            ...DK_PRESET,
            id: 'DIDDY',
            size: { x: 80, y: 112 }, // UPDATED: Same size as Teddy
            physics: { 
                ...DK_PRESET.physics, 
                gravity: 3200, 
                runSpeed: 9.0 * 60, 
                jumpForce: 24 * 60, 
                dashSpeed: 26 * 60,
                dashDuration: 0.5,
            },
            painterId: 'boss:diddy',
            palette: {
                fur: '#8D6E63', fur_dark: '#5D4037', fur_light: '#A1887F',
                skin: '#FFECB3', skin_shadow: '#FFE082',
                shirt: '#D32F2F', shirt_shadow: '#B71C1C', star: '#FFEB3B',
                hat: '#D32F2F', hat_brim: '#B71C1C',
                jetpack_wood: '#5D4037', jetpack_band: '#212121', gun: '#A1887F'
            },
            attachments: [
                { 
                    id: 'tail', 
                    type: 'chain', 
                    anchor: { x: 22, y: 52 },
                    segments: 10, 
                    segmentLength: 6, 
                    widthA: 14, 
                    stiffness: 6.0, 
                    colorA: '#5D4037', 
                    colorB: '#8D6E63', 
                },
            ],
        };
    }
    
    set<Transform>(w, 'transform', e, {
        pos: { x: pos.x, y: -400 }, // Start higher for better intro
        vel: { x: 0, y: 0 }, size: preset.size,
        facing: -1, onGround: false, onWall: 0, groundY: -1, onLadder: false,
        lastCheckpoint: {...pos},
        zIndex: 50
    });

    set<Kinematics>(w, 'kinematics', e, preset.physics as Kinematics);
    set<StateMachine>(w, 'state', e, { state: 'idle', animTime: 0, invulnFrames: 0, respawnFrames: 0, timers: {} });
    set<Health>(w, 'health', e, { hp: bossHp, maxHp: bossHp, dead: false });
    set<Boss>(w, 'boss', e, {
        type: bossType,
        state: 'intro',
        stateTimer: 6.0, 
        patternCooldown: 0,
        phase: 1,
        healthThresholds: [0.75, 0.40],
    });
    set<Abilities>(w, 'abilities', e, { available: new Set(['jetpack', 'peanutGun']), context: {} });
    set<RendererRef>(w, 'renderer', e, { painterId: preset.painterId });
    set<Palette>(w, 'palette', e, preset.palette);

    if (preset.attachments) {
        set<Attachments>(w, 'attachments', e, { list: preset.attachments });
    }

    return e;
}

export function spawnBarrelCannon(w: World, pos: Vec2, type: 'manual' | 'auto', direction: number, rotateSpeed: number = 0): EntityId {
    const e = createEntity(w);
    set<Transform>(w, 'transform', e, {
        pos: { ...pos }, vel: { x: 0, y: 0 }, size: { x: 64, y: 64 },
        facing: 1, onGround: false, onWall: 0, groundY: -1, onLadder: false, lastCheckpoint: {x:0, y:0},
        zIndex: 1000 // High Z-Index to ensure visibility over platforms/background
    });
    set<BarrelCannon>(w, 'barrelCannon', e, {
        type, direction, rotateSpeed, cooldown: 0
    });
    set<RendererRef>(w, 'renderer', e, { painterId: 'barrelCannon' });
    return e;
}

export function spawnVine(w: World, pos: Vec2, length: number): EntityId {
    const e = createEntity(w);
    // The transform pos is the anchor point
    set<Transform>(w, 'transform', e, {
        pos: { ...pos }, vel: { x: 0, y: 0 }, size: { x: 20, y: length },
        facing: 1, onGround: false, onWall: 0, groundY: -1, onLadder: false, lastCheckpoint: {x:0, y:0},
        zIndex: 900 // High Z-Index, just under barrels
    });
    set<Vine>(w, 'vine', e, {
        length, anchor: { ...pos }, angle: 0, angularVelocity: 0, swingSpeed: 3
    });
    set<RendererRef>(w, 'renderer', e, { painterId: 'vine' });
    return e;
}


export function spawnMilkProjectile(w: World, ownerId: EntityId) {
    const ownerT = get<Transform>(w, 'transform', ownerId);
    if (!ownerT) return;

    const e = createEntity(w);
    const startX = ownerT.pos.x + (ownerT.facing > 0 ? 32 : ownerT.size.x - 32);
    const startY = ownerT.pos.y + 44;

    set<Transform>(w, 'transform', e, {
        pos: { x: startX, y: startY },
        vel: { x: 10 * 60 * ownerT.facing, y: -8 * 60 },
        size: { x: 16, y: 16 },
        facing: ownerT.facing, onGround: false, onWall: 0, groundY: -1, onLadder: false, lastCheckpoint: {x:0,y:0}
    });
    set<Kinematics>(w, 'kinematics', e, { gravity: 2400 } as Kinematics);
    set<Projectile>(w, 'projectile', e, { owner: ownerId, damage: 1, life: 2.0, type: 'milk' });
    set<RendererRef>(w, 'renderer', e, { painterId: 'projectile:milk' });
    set<Health>(w, 'health', e, { hp: 1, maxHp: 1, dead: false });
    set<StateMachine>(w, 'state', e, { state: 'idle', animTime: 0, invulnFrames: 0, respawnFrames: 0, timers: {}});
}

export function spawnCoconutProjectile(w: World, ownerId: EntityId) {
    const ownerT = get<Transform>(w, 'transform', ownerId);
    if (!ownerT) return;

    const e = createEntity(w);
    const startX = ownerT.pos.x + (ownerT.facing > 0 ? ownerT.size.x - 10 : 10);
    const startY = ownerT.pos.y + 40;

    const playerT = get<Transform>(w, 'transform', w.playerId);
    let velX = 8 * 60 * ownerT.facing;
    let velY = -15 * 60;
    
    // Aim slightly towards player
    if (playerT) {
        const dx = (playerT.pos.x + playerT.size.x / 2) - startX;
        const dy = (playerT.pos.y + playerT.size.y / 2) - startY;
        const dist = Math.hypot(dx, dy) || 1;
        velX = (dx / dist) * 10 * 60;
        velY = (dy / dist) * 10 * 60;
        // give it some arc
        velY = Math.min(velY, -10 * 60);
    }

    set<Transform>(w, 'transform', e, {
        pos: { x: startX, y: startY },
        vel: { x: velX, y: velY },
        size: { x: 32, y: 32 },
        facing: ownerT.facing, onGround: false, onWall: 0, groundY: -1, onLadder: false, lastCheckpoint: {x:0,y:0}
    });
    set<Kinematics>(w, 'kinematics', e, { gravity: 2800 } as Kinematics);
    set<Projectile>(w, 'projectile', e, { owner: ownerId, damage: 1, life: 5.0, type: 'coconut', bouncesLeft: 3 });
    set<RendererRef>(w, 'renderer', e, { painterId: 'projectile:coconut' });
    set<Health>(w, 'health', e, { hp: 1, maxHp: 1, dead: false });
    set<StateMachine>(w, 'state', e, { state: 'idle', animTime: 0, invulnFrames: 0, respawnFrames: 0, timers: {}});
}

export function spawnPeanutProjectile(w: World, ownerId: EntityId, targetPos: Vec2) {
    const ownerT = get<Transform>(w, 'transform', ownerId);
    if (!ownerT) return;

    const e = createEntity(w);
    const startX = ownerT.pos.x + (ownerT.facing > 0 ? ownerT.size.x : 0);
    const startY = ownerT.pos.y + 40; // Hand height roughly

    const dx = targetPos.x - startX;
    const dy = targetPos.y - startY;
    const dist = Math.hypot(dx, dy) || 1;
    const speed = 12 * 60; // Fast straight shot

    set<Transform>(w, 'transform', e, {
        pos: { x: startX, y: startY },
        vel: { x: (dx/dist) * speed, y: (dy/dist) * speed },
        size: { x: 16, y: 16 },
        facing: Math.sign(dx) as 1 | -1, onGround: false, onWall: 0, groundY: -1, onLadder: false, lastCheckpoint: {x:0,y:0}
    });
    // Low gravity for a straight shot feel
    set<Kinematics>(w, 'kinematics', e, { gravity: 500 } as Kinematics);
    set<Projectile>(w, 'projectile', e, { owner: ownerId, damage: 1, life: 3.0, type: 'peanut' });
    set<RendererRef>(w, 'renderer', e, { painterId: 'projectile:peanut' });
    set<Health>(w, 'health', e, { hp: 1, maxHp: 1, dead: false });
    set<StateMachine>(w, 'state', e, { state: 'idle', animTime: 0, invulnFrames: 0, respawnFrames: 0, timers: {}});
}

export function spawnBarrelProjectile(w: World, ownerId: EntityId, isGiant: boolean) {
    const ownerT = get<Transform>(w, 'transform', ownerId);
    if (!ownerT) return;

    const e = createEntity(w);
    const size = isGiant ? { x: 80, y: 80 } : { x: 40, y: 40 };
    const startX = ownerT.pos.x + (ownerT.facing > 0 ? ownerT.size.x - 20 : 20) - (size.x/2);
    const startY = ownerT.pos.y + 60;

    const velX = 10 * 60 * ownerT.facing;
    const velY = -10 * 60; // Pop up a bit

    set<Transform>(w, 'transform', e, {
        pos: { x: startX, y: startY },
        vel: { x: velX, y: velY },
        size: size,
        facing: ownerT.facing, onGround: false, onWall: 0, groundY: -1, onLadder: false, lastCheckpoint: {x:0,y:0}
    });
    set<Kinematics>(w, 'kinematics', e, { gravity: 2800 } as Kinematics);
    set<Projectile>(w, 'projectile', e, { owner: ownerId, damage: 1, life: 10.0, type: 'barrel', bouncesLeft: isGiant ? 0 : 1 });
    set<RendererRef>(w, 'renderer', e, { painterId: isGiant ? 'projectile:giant_barrel' : 'projectile:barrel' });
    set<Health>(w, 'health', e, { hp: isGiant ? 999 : 1, maxHp: isGiant ? 999 : 1, dead: false }); // Giant barrel is invincible
    set<StateMachine>(w, 'state', e, { state: 'idle', animTime: 0, invulnFrames: 0, respawnFrames: 0, timers: {}});
}


export function spawnDiaperBombProjectile(w: World, ownerId: EntityId) {
    const ownerT = get<Transform>(w, 'transform', ownerId);
    if (!ownerT) return;

    const e = createEntity(w);
    const startX = ownerT.pos.x + (ownerT.facing > 0 ? 40 : ownerT.size.x - 40);
    const startY = ownerT.pos.y + 50;

    set<Transform>(w, 'transform', e, {
        pos: { x: startX, y: startY },
        vel: { x: 6 * 60 * ownerT.facing, y: -12 * 60 },
        size: { x: 24, y: 24 },
        facing: ownerT.facing, onGround: false, onWall: 0, groundY: -1, onLadder: false, lastCheckpoint: {x:0,y:0}
    });
    set<Kinematics>(w, 'kinematics', e, { gravity: 2400 } as Kinematics);
    set<Projectile>(w, 'projectile', e, { owner: ownerId, damage: 0, life: 1.5, type: 'diaperBomb' });
    set<RendererRef>(w, 'renderer', e, { painterId: 'projectile:diaperBomb' });
    set<Health>(w, 'health', e, { hp: 1, maxHp: 1, dead: false });
    set<StateMachine>(w, 'state', e, { state: 'idle', animTime: 0, invulnFrames: 0, respawnFrames: 0, timers: {}});
}

export function spawnBananaProjectile(w: World, ownerId: EntityId) {
    const ownerT = get<Transform>(w, 'transform', ownerId);
    if (!ownerT) return;

    const e = createEntity(w);
    const size = { x: 24, y: 24 };
    const startX = ownerT.pos.x + (ownerT.facing > 0 ? ownerT.size.x - 20 : 20) - (size.x / 2);
    const startY = ownerT.pos.y + 60;

    const velX = (10 + Math.random() * 5) * 60 * ownerT.facing;
    const velY = (-15 + Math.random() * -5) * 60;

    set<Transform>(w, 'transform', e, {
        pos: { x: startX, y: startY },
        vel: { x: velX, y: velY },
        size: size,
        facing: ownerT.facing, onGround: false, onWall: 0, groundY: -1, onLadder: false, lastCheckpoint: {x:0,y:0}
    });
    set<Kinematics>(w, 'kinematics', e, { gravity: 2800 } as Kinematics);
    set<Projectile>(w, 'projectile', e, { owner: ownerId, damage: 0, life: 10.0, type: 'banana' });
    set<RendererRef>(w, 'renderer', e, { painterId: 'projectile:banana' });
    set<Health>(w, 'health', e, { hp: 1, maxHp: 1, dead: false });
    set<StateMachine>(w, 'state', e, { state: 'idle', animTime: 0, invulnFrames: 0, respawnFrames: 0, timers: {}});
}


export function spawnEnemyStinger(w: World, ownerId: EntityId, targetPos: Vec2) {
    const ownerT = get<Transform>(w, 'transform', ownerId);
    if (!ownerT) return;

    const e = createEntity(w);
    const startPos = {
        x: ownerT.pos.x + ownerT.size.x / 2,
        y: ownerT.pos.y + ownerT.size.y / 2,
    };

    const dx = targetPos.x - startPos.x;
    const dy = targetPos.y - startPos.y;
    const dist = Math.hypot(dx, dy) || 1;
    const speed = 8 * 60;

    set<Transform>(w, 'transform', e, {
        pos: { x: startPos.x - 8, y: startPos.y - 8 },
        vel: { x: (dx / dist) * speed, y: (dy / dist) * speed },
        size: { x: 16, y: 16 },
        facing: Math.sign(dx) as 1 | -1, onGround: false, onWall: 0, groundY: -1, onLadder: false, lastCheckpoint: {x:0,y:0}
    });
    set<Kinematics>(w, 'kinematics', e, { gravity: 0 } as Kinematics);
    set<Projectile>(w, 'projectile', e, { owner: ownerId, damage: 1, life: 3.0, type: 'enemyStinger' });
    set<RendererRef>(w, 'renderer', e, { painterId: 'projectile:enemyStinger' });
    set<Health>(w, 'health', e, { hp: 1, maxHp: 1, dead: false });
    set<StateMachine>(w, 'state', e, { state: 'idle', animTime: 0, invulnFrames: 0, respawnFrames: 0, timers: {}});
}

export function spawnVenomProjectile(w: World, ownerId: EntityId, targetPos: Vec2) {
    const ownerT = get<Transform>(w, 'transform', ownerId);
    if (!ownerT) return;

    const e = createEntity(w);
    const startX = ownerT.pos.x + (ownerT.facing > 0 ? ownerT.size.x : 0);
    const startY = ownerT.pos.y + 20;

    // Ballistic trajectory
    const dx = targetPos.x - startX;
    const dy = targetPos.y - startY;
    
    // Simple arc logic: fixed horizontal speed, adjust vertical
    const speed = 8 * 60; 
    const timeToHit = Math.abs(dx / speed);
    const gravity = 2200; // Match standard gravity
    
    // y = vy * t + 0.5 * g * t^2
    // vy = (y - 0.5 * g * t^2) / t
    const vy = (dy - 0.5 * gravity * timeToHit * timeToHit) / timeToHit;

    set<Transform>(w, 'transform', e, {
        pos: { x: startX, y: startY },
        vel: { x: Math.sign(dx) * speed, y: vy },
        size: { x: 20, y: 20 },
        facing: Math.sign(dx) as 1 | -1, onGround: false, onWall: 0, groundY: -1, onLadder: false, lastCheckpoint: {x:0,y:0}
    });
    set<Kinematics>(w, 'kinematics', e, { gravity: gravity } as Kinematics); // Gravity enabled
    set<Projectile>(w, 'projectile', e, { owner: ownerId, damage: 1, life: 4.0, type: 'venom' });
    set<RendererRef>(w, 'renderer', e, { painterId: 'projectile:venom' });
    set<Health>(w, 'health', e, { hp: 1, maxHp: 1, dead: false });
    set<StateMachine>(w, 'state', e, { state: 'idle', animTime: 0, invulnFrames: 0, respawnFrames: 0, timers: {}});
}
