import { DeepSeekSwarm } from './controllers/swarm-controller';

async function main() {
    console.log('🐝 Initializing DeepSeek V3 Swarm...');
    const swarm = new DeepSeekSwarm();

    // Simulate environment variables
    process.env.DSK_MASTER = 'mock_key_master';
    process.env.DSK_TACTICAL = 'mock_key_tactical';
    process.env.DSK_ANALYTICAL = 'mock_key_analyst';

    console.log('🚀 Sending test task: "Optimize Login Endpoint"');
    const result = await swarm.processTask("Optimize the API login latency");

    console.log('\n📊 Task Result:');
    console.log(JSON.stringify(result, null, 2));
}

main().catch(console.error);
