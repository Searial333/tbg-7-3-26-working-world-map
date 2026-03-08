

import type { ActorPreset } from '../types';
import type { Kinematics } from '../game/components';

const BASE_PHYSICS: Partial<Kinematics> = {
    gravity: 2400,
    runSpeed: 10 * 60,
    runAcceleration: 80 * 60,
    runFriction: 0.85,
    maxRollSpeed: 15 * 60,
    rollSpeedBoost: 5 * 60,
    rollDeceleration: 10 * 60,
    rollMinSpeed: 5 * 60,
    wallSlideSpeed: 5 * 60,
    jumpForce: 20 * 60,
    wallJumpXBoost: 12 * 60,
    wallJumpYForce: 18 * 60,
    airAcceleration: 50 * 60,
    airFriction: 0.96,
    maxAirSpeed: 12 * 60,
    coyoteFrames: 6,
    jumpBufferFrames: 6,
    maxJumps: 2,
    dashSpeed: 25 * 60,
    dashDuration: 0.2,
    dashCooldown: 0.8,
    bottleChargeTime: 0.75,
    bottleLaserDuration: 1.5,
};

export const CHARACTER_PRESETS: Record<string, ActorPreset> = {
    TEDDY: {
        id: 'TEDDY',
        size: { x: 80, y: 112 },
        physics: BASE_PHYSICS,
        abilities: ['doubleJump', 'dash', 'roll', 'wallSlide', 'slam', 'bottleBlaster', 'diaperBomb'],
        painterId: 'pixel:teddy',
        palette: {
            body: '#A0522D',
            body_shadow: '#804224',
            body_light: '#CD853F',
            vest: '#F5DEB3', // Belly patch
            vest_shadow: '#DEB887',
            vest_light: '#FFF8E1',
            bandana: '#7B1FA2', // Purple
            bandana_dark: '#4A148C',
            bandana_highlight: '#9C27B0',
            snout: '#F5DEB3',
            snout_dark: '#DEB887',
            nose: '#5C4033',
            eye: '#000000',
        },
        attachments: [
            { id: 'tailA', type: 'ribbon', anchor: { x: 20, y: 32 }, segments: 6, segmentLength: 8, colorA: '#7B1FA2', colorB: '#9C27B0', widthA: 8, widthB: 4, stiffness: 2, damping: 0.9, gravityFactor: 0.3, waveAmplitude: 3, waveFrequency: 6 },
            { id: 'tailB', type: 'ribbon', anchor: { x: 32, y: 32 }, segments: 6, segmentLength: 8, colorA: '#7B1FA2', colorB: '#9C27B0', widthA: 8, widthB: 4, stiffness: 2, damping: 0.9, gravityFactor: 0.3, waveAmplitude: -3, waveFrequency: 6 },
        ],
    },
    TBG_V2: {
        id: 'TBG_V2',
        size: { x: 80, y: 112 },
        physics: BASE_PHYSICS,
        abilities: ['doubleJump', 'dash', 'roll', 'wallSlide', 'slam', 'diaperBomb'],
        painterId: 'tbg:v2',
        palette: {
            body: '#8D6E63',
            body_shadow: '#6D4C41',
            body_light: '#A1887F',
            strap: '#4E342E',
            strap_dark: '#3E2723',
            bandana: '#7B1FA2',
            bandana_dark: '#4A148C',
            bandana_highlight: '#9C27B0',
            snout: '#F5DEB3',
            snout_dark: '#DEB887',
            nose: '#5C4033',
            eye: '#FFFFFF',
        },
    },
    CHIBI_MALE: {
        id: 'CHIBI_MALE',
        size: { x: 64, y: 80 },
        physics: { ...BASE_PHYSICS, runSpeed: 9 * 60, jumpForce: 19 * 60 },
        abilities: ['doubleJump', 'dash'],
        painterId: 'chibi:male',
        palette: {
            skin: '#FFDBAC', skin_shadow: '#E0AC69',
            hair: '#3D2314',
            eyes: '#000000',
        },
    },
    CHIBI_FEMALE: {
        id: 'CHIBI_FEMALE',
        size: { x: 64, y: 80 },
        physics: { ...BASE_PHYSICS, runSpeed: 9 * 60, jumpForce: 19 * 60 },
        abilities: ['doubleJump', 'dash'],
        painterId: 'chibi:female',
        palette: {
            skin: '#FFDBAC', skin_shadow: '#E0AC69',
            hair: '#B565A7',
            eyes: '#000000',
        },
        attachments: [
            { id: 'hairL', type: 'ribbon', anchor: { x: 20, y: 24 }, segments: 5, segmentLength: 8, colorA: '#B565A7', colorB: '#D187C1', stiffness: 2, damping: 0.9, gravityFactor: 0.5, waveAmplitude: 2, waveFrequency: 5 },
            { id: 'hairR', type: 'ribbon', anchor: { x: 44, y: 24 }, segments: 5, segmentLength: 8, colorA: '#B565A7', colorB: '#D187C1', stiffness: 2, damping: 0.9, gravityFactor: 0.5, waveAmplitude: 2, waveFrequency: 5 },
        ]
    },
    FEMALE_V2: {
        id: 'FEMALE_V2',
        size: { x: 96, y: 128 },
        physics: { ...BASE_PHYSICS, runSpeed: 11 * 60 },
        abilities: ['doubleJump', 'dash', 'wallSlide'],
        painterId: 'v2:female',
        palette: {
            skin: '#FFDBAC', skin_shadow: '#E0AC69',
            hair: '#C95C6D', hair_shadow: '#A23B4E',
            top: '#4B5563', top_shadow: '#374151',
            pants: '#F3F4F6', pants_shadow: '#D1D5DB',
            shoes: '#1F2937', shoes_shadow: '#111827',
            eyes: '#374151',
        },
        jiggle: [
            { id: 'chest', stiffness: 2.5, damping: 0.6, mass: 1 },
            { id: 'buttL', stiffness: 2.5, damping: 0.6, mass: 1 },
            { id: 'buttR', stiffness: 2.5, damping: 0.6, mass: 1 },
        ],
        attachments: [
            { id: 'hairBackL', type: 'ribbon', anchor: { x: 30, y: 30 }, segments: 6, segmentLength: 10, colorA: '#C95C6D', colorB: '#A23B4E', stiffness: 3, damping: 0.8, gravityFactor: 0.6, waveAmplitude: 3, waveFrequency: 4 },
            { id: 'hairBackR', type: 'ribbon', anchor: { x: 66, y: 30 }, segments: 6, segmentLength: 10, colorA: '#C95C6D', colorB: '#A23B4E', stiffness: 3, damping: 0.8, gravityFactor: 0.6, waveAmplitude: 3, waveFrequency: 4 },
        ]
    },
    NEVLIN: {
        id: 'NEVLIN',
        size: { x: 144, y: 160 },
        physics: { ...BASE_PHYSICS, runSpeed: 12 * 60, gravity: 2200 },
        abilities: ['doubleJump', 'dash', 'wallSlide'],
        painterId: 'hd:nevlin',
        palette: {
            skin: '#FFDBAC', skin_shadow: '#E0AC69',
            top: '#9333ea', top_shadow: '#7e22ce', top_sleeve: '#a855f7', top_sleeve_s: '#9333ea',
            skirt: '#166534', skirt_shadow: '#14532d', skirt_lines: '#15803d',
            boots: '#1e293b', boots_shadow: '#0f172a',
            eyes: '#a855f7',
            choker: '#0f172a'
        },
        jiggle: [
            { id: 'chest', stiffness: 2.5, damping: 0.6, mass: 1.2 },
            { id: 'buttL', stiffness: 2.5, damping: 0.6, mass: 1.2 },
        ],
        attachments: [
            { id: 'nevlin_hair_pink', type: 'ribbon', anchor: { x: 72, y: 60 }, segments: 8, segmentLength: 14, colorA: '#ec4899', colorB: '#db2777', widthA: 18, widthB: 8, stiffness: 2, damping: 0.9, gravityFactor: 0.4, waveAmplitude: 5, waveFrequency: 3 },
            { id: 'nevlin_hair_blue', type: 'ribbon', anchor: { x: 72, y: 60 }, segments: 8, segmentLength: 14, colorA: '#3b82f6', colorB: '#2563eb', widthA: 18, widthB: 8, stiffness: 2, damping: 0.9, gravityFactor: 0.4, waveAmplitude: -5, waveFrequency: 3.5 },
        ]
    },
    SHINOBI: {
        id: 'SHINOBI',
        size: { x: 72, y: 96 },
        physics: { ...BASE_PHYSICS, runSpeed: 13 * 60, jumpForce: 21 * 60, dashSpeed: 28 * 60 },
        abilities: ['doubleJump', 'dash', 'wallSlide'],
        painterId: 'ninja:shinobi',
        palette: {
            skin: '#FFDBAC', skin_shadow: '#E0AC69',
            outfit: '#374151', outfit_shadow: '#1F2937',
            eyes: '#DC2626',
        },
        attachments: [
            { id: 'scarf', type: 'ribbon', anchor: { x: 36, y: 48 }, segments: 10, segmentLength: 12, colorA: '#DC2626', colorB: '#B91C1C', widthA: 16, widthB: 4, stiffness: 2, damping: 0.9, gravityFactor: 0.2, waveAmplitude: 8, waveFrequency: 8 },
        ]
    },
};

export const DK_PRESET: ActorPreset = {
    id: 'DK',
    size: { x: 320, y: 280 },
    physics: {
        gravity: 2800,
        runSpeed: 12 * 60,
        jumpForce: 25 * 60,
    },
    abilities: [],
    painterId: 'boss:dk',
    palette: {
        fur_shadow: '#593a1a',
        fur_dark: '#8c5a2b',
        fur_mid: '#a26b3a',
        skin_shadow: '#c9955d',
        skin: '#e6c58d',
        skin_light: '#fef3c7',
        eye_white: '#FFFFFF',
        eye_pupil: '#000000',
        mouth_dark: '#4e342e',
        tooth: '#FFFFFF',
        tie_shadow: '#b91c1c',
        tie: '#ef4444',
        tie_highlight: '#f87171',
    },
    attachments: [
        {
            id: 'tie',
            type: 'ribbon',
            anchor: { x: 160, y: 120 }, // Centered on chest
            segments: 8,
            segmentLength: 12,
            colorA: '#ef4444',
            colorB: '#ef4444',
            widthA: 24, // Narrower at the top
            widthB: 48, // Wider at the bottom
            stiffness: 10,
            damping: 0.95,
            gravityFactor: 1.2,
        }
    ]
};