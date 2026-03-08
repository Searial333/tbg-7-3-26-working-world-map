import type { Kinematics } from '../game/components';
import type { UpgradeId } from '../types';

export interface Upgrade {
  id: UpgradeId;
  name: string;
  icon: string; // Emoji or SVG data URL
  maxLevel: number;
  costs: number[]; // Cost for level 1, 2, 3...
  effectDescription: (level: number) => string; // Function to generate description for the *next* level
  apply: (kinematics: Kinematics, level: number) => Kinematics; // Function to modify stats
}

export const LIFE_COST = 50;

const UPGRADE_DATA: Upgrade[] = [
    {
        id: 'speed',
        name: 'Runner\'s Agility',
        icon: '👟',
        maxLevel: 5,
        costs: [50, 100, 175, 250, 350],
        effectDescription: (level) => `+5% Run Speed`,
        apply: (k, level) => ({
            ...k,
            runSpeed: k.runSpeed * (1 + 0.05 * level),
        }),
    },
    {
        id: 'jump',
        name: 'Acrobat\'s Spring',
        icon: '🤸',
        maxLevel: 5,
        costs: [60, 120, 200, 280, 400],
        effectDescription: (level) => `+4% Jump Height`,
        apply: (k, level) => ({
            ...k,
            jumpForce: k.jumpForce * (1 + 0.04 * level),
        }),
    },
    {
        id: 'dash',
        name: 'Cooldown Catalyst',
        icon: '💨',
        maxLevel: 4,
        costs: [75, 150, 225, 300],
        effectDescription: (level) => `-10% Dash Cooldown`,
        apply: (k, level) => ({
            ...k,
            dashCooldown: k.dashCooldown * (1 - 0.10 * level),
        }),
    },
];

export const UPGRADES = UPGRADE_DATA.reduce((acc, upgrade) => {
    acc[upgrade.id] = upgrade;
    return acc;
}, {} as Record<UpgradeId, Upgrade>);

export const UPGRADE_ORDER: UpgradeId[] = ['speed', 'jump', 'dash'];