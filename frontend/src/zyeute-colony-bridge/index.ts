/**
 * 🌉 Zyeuté ↔ Colony OS Bridge
 *
 * Integration layer connecting Zyeuté's frontend to Colony OS swarm intelligence.
 *
 * Architecture:
 * ┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
 * │  Zyeuté UI     │────▶│ TiGuySwarmAdapter │────▶│  Colony OS      │
 * │  (React)       │     │ (Orchestrator)    │     │  (Worker Bees)  │
 * └─────────────────┘     └──────────────────┘     └─────────────────┘
 *                                │
 *                                ▼
 *                      ┌──────────────────┐
 *                      │  Circuit Breaker │
 *                      │  (Fault Tolerance)│
 *                      └──────────────────┘
 *
 * Key Components:
 * - TiGuySwarmAdapter: Main orchestrator for AI interactions
 * - ColonyClient: Supabase client for task queue operations
 * - CircuitBreaker: Fault tolerance for external services
 * - SwarmHealthDashboard: Real-time monitoring UI
 */

// Core Types
export * from "./types";

// Colony Client - Task queue operations
export { ColonyClient } from "./ColonyClient";
export { colonyClient } from "./ColonyClient";

// Ti-Guy Swarm Adapter - Main orchestrator
export { TiGuySwarmAdapter } from "./TiGuySwarmAdapter";
export { tiGuySwarm } from "./TiGuySwarmAdapter";

// Circuit Breaker - Fault tolerance
export {
  CircuitBreaker,
  CircuitBreakerOpenError,
  supabaseCircuit,
  externalApiCircuit,
} from "./CircuitBreaker";
export { deepSeekCircuit, swarmCircuit } from "./CircuitBreaker";
export type {
  CircuitState,
  CircuitBreakerConfig,
  CircuitBreakerStats,
} from "./CircuitBreaker";

// UI Components
export { SwarmVisualizer } from "./SwarmVisualizer";
export { SwarmHealthDashboard } from "./SwarmHealthDashboard";
