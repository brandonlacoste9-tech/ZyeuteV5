import { DeepSeekSwarm } from './controllers/swarm-controller';

console.log("🔥 LAUNCHING DEEPSEEK SWARM: EMERGENCY PROTOCOL 🔥");
const swarm = new DeepSeekSwarm();
swarm.runEmergencyMode('loading').catch(console.error);
