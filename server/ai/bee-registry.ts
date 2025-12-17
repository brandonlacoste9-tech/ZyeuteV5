/**
 * AI Hive - Bee Registry
 * Central registry of all bees (TypeScript + Python)
 */

import type { BeeDefinition, BeeCapability, BeeCore } from './types';

export const BEE_REGISTRY: Record<string, BeeDefinition> = {
    // ======== TypeScript Bees (New) ========

    'ti-guy-chat': {
        id: 'ti-guy-chat',
        name: 'Ti-Guy Chat',
        core: 'worker',
        capabilities: ['chat'],
        description: 'Handles user chat interactions in Quebec joual',
        model: 'deepseek',
    },

    'studio-caption': {
        id: 'studio-caption',
        name: 'Studio Caption Generator',
        core: 'worker',
        capabilities: ['caption'],
        description: 'Generates captions for media content',
        model: 'deepseek',
    },

    'studio-image': {
        id: 'studio-image',
        name: 'Studio Image Generator',
        core: 'worker',
        capabilities: ['image'],
        description: 'Generates images using FAL/Flux',
        model: 'flux',
    },

    'studio-video': {
        id: 'studio-video',
        name: 'Studio Video Generator',
        core: 'worker',
        capabilities: ['video'],
        description: 'Generates videos using HunyuanVideo',
        model: 'hunyuan_video',
    },

    'post-composer': {
        id: 'post-composer',
        name: 'Post Composer',
        core: 'worker',
        capabilities: ['compose', 'caption'],
        description: 'Composes complete posts with media + caption',
        model: 'deepseek',
    },

    'media-budget': {
        id: 'media-budget',
        name: 'Media Budget Tracker',
        core: 'guardian',
        capabilities: ['budget'],
        description: 'Tracks and enforces media generation costs',
        model: 'mistral',
    },

    // ======== Python Colony Bees (Existing) ========

    'finance-bee': {
        id: 'finance-bee',
        name: 'Finance Bee',
        core: 'worker',
        capabilities: ['analytics'],
        description: 'Financial analysis and reporting',
        model: 'deepseek',
        endpoint: 'colony_tasks',
    },

    'health-bee': {
        id: 'health-bee',
        name: 'Health Bee',
        core: 'guardian',
        capabilities: ['moderation'],
        description: 'System health checks',
        model: 'deepseek',
        endpoint: 'colony_tasks',
    },

    'guardian-bee': {
        id: 'guardian-bee',
        name: 'Guardian Bee',
        core: 'guardian',
        capabilities: ['moderation'],
        description: 'Content moderation and safety',
        model: 'deepseek',
        endpoint: 'colony_tasks',
    },

    'security-bee': {
        id: 'security-bee',
        name: 'Security Bee',
        core: 'guardian',
        capabilities: ['moderation'],
        description: 'Security threat detection',
        model: 'deepseek',
        endpoint: 'colony_tasks',
    },
};

/**
 * Get bee definition by ID
 */
export function getBeeById(id: string): BeeDefinition | undefined {
    return BEE_REGISTRY[id];
}

/**
 * Get all bees with a specific capability
 */
export function getBeesByCapability(capability: BeeCapability): BeeDefinition[] {
    return Object.values(BEE_REGISTRY).filter(bee =>
        bee.capabilities.includes(capability)
    );
}

/**
 * Get all bees of a specific core type
 */
export function getBeesByCore(core: BeeCore): BeeDefinition[] {
    return Object.values(BEE_REGISTRY).filter(bee => bee.core === core);
}

/**
 * Get all TypeScript bees (no endpoint means TypeScript)
 */
export function getTypescriptBees(): BeeDefinition[] {
    return Object.values(BEE_REGISTRY).filter(bee => !bee.endpoint);
}

/**
 * Get all Python Colony bees (have endpoint)
 */
export function getPythonBees(): BeeDefinition[] {
    return Object.values(BEE_REGISTRY).filter(bee => bee.endpoint === 'colony_tasks');
}
