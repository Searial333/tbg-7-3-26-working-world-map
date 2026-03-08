
import type { Vec2, Facing, AttachmentSpec, EntityId, JiggleSpec } from '../types';

export interface Transform {
  pos: Vec2;
  vel: Vec2;
  size: Vec2;
  facing: Facing;
  onGround: boolean;
  onWall: -1 | 0 | 1;
  groundY: number;
  onLadder: boolean;
  lastCheckpoint: Vec2;
  zIndex?: number;
  groundSlope?: number;
  rotation?: number; // rotation in degrees
}

export interface Kinematics {
  gravity: number;
  runSpeed: number;
  runAcceleration: number;
  runFriction: number;
  maxRollSpeed: number;
  rollSpeedBoost: number;
  rollDeceleration: number;
  rollMinSpeed: number;
  wallSlideSpeed: number;
  jumpForce: number;
  wallJumpXBoost: number;
  wallJumpYForce: number;
  airAcceleration: number;
  airFriction: number;
  maxAirSpeed: number;
  coyoteFrames: number;
  jumpBufferFrames: number;
  maxJumps: number;
  dashSpeed: number;
  dashDuration: number;
  dashCooldown: number;
  bottleChargeTime: number;
  bottleLaserDuration: number;
}

export interface StateMachine {
  state: string;
  animTime: number;
  invulnFrames: number;
  respawnFrames: number;
  timers: Record<string, number>;
  enemyId?: string;
  patrolBounds?: { left: number, right: number };
  attachedToId?: EntityId; // For barrels and vines
  variant?: string;
}

export interface Health {
  hp: number;
  maxHp: number;
  dead: boolean;
}

export interface Abilities {
  active?: string;
  available: Set<string>;
  context: Record<string, any>; // jumpsLeft, coyote, rollMomentum, dashCharges, wallClingTimer etc.
}

export interface Input {
  left: boolean; right: boolean; up: boolean; down: boolean;
  jump: boolean; roll: boolean;
  jumpDown: boolean; rollDown: boolean; downDown: boolean;
}

export interface RendererRef {
  painterId: string;
}

export interface Palette {
  [name: string]: string;
}

export interface Attachments {
  list: AttachmentSpec[];
}

export interface Projectile {
    owner: EntityId;
    damage: number;
    life: number;
    type: string;
    bouncesLeft?: number;
}

export interface NPC {
    type: 'shopkeeper' | 'counter';
    interactionState: 'idle' | 'prompting';
}

// A single jiggle point's state
export interface JigglePoint {
    spec: JiggleSpec;
    pos: Vec2;
    vel: Vec2;
    anchor: Vec2;
}

// The component attached to an entity, which can hold multiple jiggle points
export type Jiggle = Record<string, JigglePoint>;

// The component for a boss entity
export interface Boss {
    type: 'dk' | 'diddy';
    state: 'intro' | 'idle' | 'roll_charge' | 'barrel_throw' | 'jumping' | 'pounding_anticipation' | 'pounding' | 'coconut_toss' | 'hurt' | 'dying' | 'banana_throw' | 'jetpack_hover' | 'peanut_shot' | 'monkey_flip';
    stateTimer: number;
    patternCooldown: number;
    phase: 1 | 2 | 3;
    targetPos?: Vec2 | null;
    shotsLeft?: number;
    healthThresholds: number[];
    didAction?: boolean;
    jetpackFuel?: number; // Added for Diddy mechanics
}

export interface BarrelCannon {
    type: 'manual' | 'auto';
    direction: number; // Angle in degrees
    rotateSpeed: number; // Degrees per second
    cooldown: number;
}

export interface Vine {
    length: number;
    anchor: Vec2;
    angle: number;
    angularVelocity: number;
    swingSpeed: number;
}


export type Component = Transform | Kinematics | StateMachine | Health | Abilities | Input | RendererRef | Palette | Attachments | Projectile | Jiggle | NPC | Boss | BarrelCannon | Vine;
