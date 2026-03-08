
import type { Kinematics, Health, StateMachine, Abilities, Attachments, Transform, Input, RendererRef, Palette, Projectile, Boss, BarrelCannon, Vine } from './game/components';

// Core Types
export type EntityId = number;
export interface Vec2 { x: number; y: number; }
export type Facing = 1 | -1;
export type GameStatus = 'playing' | 'levelComplete' | 'gameOver' | 'bossDefeated' | 'respawning' | 'editor' | 'cinematic';
export type LevelId = string;
export type WorldId = 'W1' | 'W2' | 'W3' | 'W4' | 'W5' | 'W6' | 'W7' | 'W8';
export type LevelProgressState = 'locked' | 'unlocked' | 'completed';
export type LevelProgress = Record<LevelId, LevelProgressState>;
export type UpgradeId = 'speed' | 'jump' | 'dash';
export type UpgradesState = Record<UpgradeId, number>;

export type WorldTheme = 'jungle' | 'pipes' | 'speed' | 'food' | 'city' | 'alien' | 'gothic' | 'medieval';
export type LevelGimmick = 'standard' | 'barrel_blast' | 'vine_swing' | 'water' | 'minecart' | 'chase' | 'autoscroll' | 'darkness' | 'boss' | 'rising_hazard' | 'wind' | 'ice' | 'gravity_flip' | 'speed_boost' | 'transformation' | 'stealth';

export interface DebugFlags {
    godMode: boolean;
    showHitboxes: boolean;
    freeCam: boolean;
}

// Level Structure
export interface Platform {
  style: string;
  type: 'solid' | 'oneway' | 'bounce' | 'invisible' | 'ramp_up' | 'ramp_down';
  x: number;
  y: number;
  w: number;
  h: number;
  moving?: {
    path: Vec2[];
    speed: number;
    currentIndex?: number;
    progress?: number;
  };
}

export interface Zone {
  type: 'ladder' | 'water' | 'lava' | 'wind';
  x: number;
  y: number;
  w: number;
  h: number;
  properties?: {
      force?: Vec2; // For wind
      damage?: number; // For lava
  }
}

export interface BarrelSpawn {
    id: string;
    x: number;
    y: number;
    type: 'manual' | 'auto';
    direction: number;
    rotateSpeed?: number;
}

export interface VineSpawn {
    id: string;
    x: number;
    y: number;
    length: number;
}

export interface Collectible {
    type: 'coin';
    x: number;
    y: number;
    id: string;
}

export interface EnemySpawn {
    type: 'patrol' | 'flyer' | 'klaptrap' | 'snake';
    variant?: 'red' | 'blue' | 'purple' | 'green' | 'gold' | 'yellow'; 
    x: number;
    y: number;
    id: string;
    patrolBounds?: { left: number, right: number };
}

export interface NPCSpawn {
    type: 'shopkeeper' | 'counter';
    x: number;
    y: number;
    id: string;
}

export interface BossSpawn {
    type: 'dk' | 'kong' | 'diddy'; // kong is alias for dk
    x: number;
    y: number;
    id: string;
}

export interface Teleporter {
    x: number;
    y: number;
    w: number;
    h: number;
    targetLevel?: string; // If defined, teleports to another level
}

export interface Checkpoint {
    id: string;
    x: number;
    y: number;
    w: number;
    h: number;
}

export interface Level {
  id: LevelId;
  worldId: WorldId;
  name: string;
  subtitle?: string;
  type?: 'normal' | 'boss' | 'shop';
  gimmick?: LevelGimmick;
  difficulty?: number;
  starRequirements?: { bronze: number; silver: number; gold: number };
  parTime?: number;
  
  playerStart: Vec2;
  bounds: { top: number; right: number; bottom: number; left: number; };
  background?: string;
  music?: string;
  
  platforms: Platform[];
  zones: Zone[];
  barrels?: BarrelSpawn[];
  vines?: VineSpawn[];
  collectibles: Collectible[];
  enemies: EnemySpawn[];
  npcs: NPCSpawn[];
  bossSpawns?: BossSpawn[];
  checkpoints: Checkpoint[];
  finishZone: { x: number; y: number; w: number; h: number; initiallyHidden?: boolean; } | null;
  teleporters?: Teleporter[];
}

export interface WorldConfig {
    id: WorldId;
    name: string;
    subtitle: string;
    theme: WorldTheme;
    description: string;
    inspiration: string;
    levels: LevelId[];
    bossLevel: LevelId;
    unlockRequirement: number; // Stars/Coins to unlock world
    totalStars: number;
    colors: { primary: string, secondary: string };
}

export interface LevelMapNode {
    x: string; 
    y: string;
    connections: LevelId[];
}

// Visual Settings
export interface VisualSettings {
  pixelPerfect: boolean;
  screenShake: boolean;
  particleDensity: number;
  floatingText: boolean;
  backgroundEffects: boolean;
  characterAttachments: boolean;
  touchControlsOpacity: number;
  showTouchControls: boolean;
}

// Game State & World
export interface GameState {
  status: GameStatus;
  paused: boolean;
  playerHealth: number;
  playerMaxHealth: number;
  currentLevelId: LevelId | null;
  shopOpen: boolean;
  canInteract: boolean;
  playerDiaperCooldown: number;
  levelStats?: {
      coins: number;
  }
  hasInteractedWithShop: boolean;
  bossInfo?: {
      hp: number;
      maxHp: number;
      name: string;
      state: string;
  };
  dialogue?: {
      speaker: string;
      text: string;
  } | null;
}

// ... (Previous interfaces remain unchanged)
export interface GameActions {
  onStateUpdate: (newState: Partial<GameState>) => void;
  createParticleBurst: (x: number, y: number, count: number, color: string, type?: string, options?: any) => void;
  setScreenShake: (magnitude: number, duration: number) => void;
  log: (message: string) => void;
  collectCoin: () => void;
}

export interface ParallaxLayer {
    id: string;
    type: 'color' | 'image';
    depth: number;
    data: string;
    width?: number;
    height?: number;
    yOffset?: number;
}

export interface FloatingText { text: string; x: number; y: number; life: number; maxLife: number; color: string; vy: number; }
export interface MilkSplat { x: number; y: number; life: number; maxLife: number; radius: number; }
export interface StinkCloud { x: number; y: number; radius: number; life: number; maxLife: number; height: number; }
export interface HeartPickup { x: number; y: number; w: number; h: number; life: number; vy: number; onGround: boolean; }
export interface BananaPickup { x: number; y: number; w: number; h: number; life: number; vy: number; onGround: boolean; }
export interface BananaPeel { x: number; y: number; w: number; h: number; life: number; }
export interface PoofEffect { x: number; y: number; life: number; maxLife: number; radius: number; }
export interface Shockwave { x: number; y: number; radius: number; maxRadius: number; life: number; maxLife: number; height: number; }
export interface DashGhost { x: number; y: number; life: number; maxLife: number; facing: Facing; size: Vec2; painterId: string; palette: Palette; state: string; animTime: number; }

export interface CreateWorldProps {
    onStateUpdate: (newState: Partial<GameState>) => void;
    onCoinCollected: () => void;
    level: Level;
    visualSettings: VisualSettings;
    upgrades: UpgradesState;
    debugFlags: DebugFlags;
    isTestMode?: boolean;
    logicalWidth: number;
    logicalHeight: number;
}

export interface World {
  time: number;
  lastTime: number;
  dt: number;
  status: GameStatus;
  actions: GameActions;
  level: Level;
  coinsThisLevel: number;
  parallaxLayers: ParallaxLayer[];
  entities: Set<EntityId>;
  playerId: EntityId;
  components: Map<string, Map<EntityId, any>>;
  camera: { x: number; y: number; shakeMagnitude: number; shakeDuration: number; logicalWidth: number; logicalHeight: number; };
  particles: Particle[];
  floatingTexts: FloatingText[];
  milkSplats: MilkSplat[];
  stinkClouds: StinkCloud[];
  heartPickups: HeartPickup[];
  bananaPickups: BananaPickup[];
  bananaPeels: BananaPeel[];
  poofEffects: PoofEffect[];
  shockwaves: Shockwave[];
  dashGhosts: DashGhost[];
  canInteract: boolean;
  respawnPlayer: boolean;
  activatedCheckpoints: Set<string>;
  visualSettings: VisualSettings;
  upgrades: UpgradesState;
  debugFlags: DebugFlags;
  targetIndicator?: { x: number, y: number, radius: number, life: number } | null;
  bossDefeatedFlag?: boolean;
  hasInteractedWithShop: boolean;
  lightningFlash?: { life: number, maxLife: number };
  isTestMode: boolean;
  dialogueActive: boolean;
}

export interface InputState {
  left: boolean; right: boolean; up: boolean; down: boolean;
  jump: boolean; roll: boolean; dash: boolean; shoot: boolean; throw: boolean; interact: boolean;
  jumpDown: boolean; rollDown: boolean; downDown: boolean; dashDown: boolean; shootDown: boolean; throwDown: boolean; interactDown: boolean;
}

export interface ActorPreset {
  id: string;
  size: Vec2;
  physics: Partial<Kinematics>;
  abilities: string[];
  painterId: string;
  palette: Palette;
  attachments?: AttachmentSpec[];
  jiggle?: JiggleSpec[];
}

export interface AttachmentSpec {
  id: string;
  type: 'chain' | 'ribbon';
  anchor: Vec2;
  segments: number;
  segmentLength: number;
  colorA: string;
  colorB: string;
  widthA?: number;
  widthB?: number;
  gravityFactor?: number;
  stiffness?: number;
  damping?: number;
  bounciness?: number;
  waveAmplitude?: number;
  waveFrequency?: number;
}

export interface JiggleSpec { id: string; stiffness: number; damping: number; mass: number; }
export type ComponentName = 'transform' | 'kinematics' | 'state' | 'health' | 'abilities' | 'input' | 'renderer' | 'palette' | 'attachments' | 'projectile' | 'jiggle' | 'npc' | 'boss' | 'barrelCannon' | 'vine';
export interface Particle { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; color: string; size: number; type: string; }
export type Component = any;
