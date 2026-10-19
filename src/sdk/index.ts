/**
 * Omni-Grid Host SDK
 * Barrel export for the full TypeScript SDK.
 *
 * @example
 * ```ts
 * import { omniBus, extensionRegistry, createRuntimeBridge } from '@omni-grid/sdk';
 * ```
 */

export * from './types';
export * from './event-bus';
export * from './extension-registry';
export * from './runtime';

// Re-export singleton instances for convenience
export { omniBus } from './event-bus';
export { extensionRegistry } from './extension-registry';
