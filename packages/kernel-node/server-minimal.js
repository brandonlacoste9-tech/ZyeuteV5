// Minimal working server for profile and auth functionality
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Basic heartbeat
app.get('/', (req, res) => {
    res.json({
        status: 'online',
        system: 'Zyeute Colony OS',
        version: '1.0.0',
        memory: process.memoryUsage()
    });
});

// System stats for dashboard
app.get('/api/stats', (req, res) => {
    res.json({
        activeWorkers: Math.floor(Math.random() * 5) + 10,
        queuedTasks: Math.floor(Math.random() * 200) + 300,
        successRate: 99.4,
        uptime: Math.floor(Math.random() * 24) + 120,
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
    });
});

// Auth endpoints for profile functionality
app.post('/auth/logout', (req, res) => {
    res.json({ success: true, message: 'Logged out successfully' });
});

app.get('/auth/me', (req, res) => {
    // Mock user data for profile page
    res.json({
        user: {
            id: 'user_123',
            username: 'demo_user',
            email: 'demo@zyeute.com',
            display_name: 'Demo User',
            avatar_url: null,
            bio: 'Demo user for Zyeuté platform',
            location: 'Quebec, Canada',
            website: 'https://zyeute.com',
            verified: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }
    });
});

// User profile endpoints
app.get('/users/:username', (req, res) => {
    const { username } = req.params;
    res.json({
        user: {
            id: 'user_123',
            username: username,
            email: `${username}@zyeute.com`,
            display_name: username.charAt(0).toUpperCase() + username.slice(1),
            avatar_url: null,
            bio: `Profile for ${username}`,
            location: 'Quebec, Canada',
            website: 'https://zyeute.com',
            verified: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }
    });
});

// Tasks and workers endpoints
app.get('/api/tasks', (req, res) => {
    res.json([
        {
            id: `task_${Date.now()}_001`,
            description: 'Quebec Joual Dialect Validation',
            status: 'executing',
            worker: 'linguist_node_01',
            priority: 'high',
            created: new Date().toISOString()
        }
    ]);
});

app.get('/api/workers', (req, res) => {
    res.json([
        {
            id: 'linguist_node_01',
            name: 'Quebec Expression Core',
            status: 'active',
            node: 'Quebec-01',
            tasksProcessed: 1247,
            uptime: '142h 12m',
            specialization: 'French Localization'
        }
    ]);
});

app.get('/api/franchise', (req, res) => {
    res.json({
        quebec: { status: 'mastered', progress: 100, activeWorkers: 8 },
        latam: { status: 'deploying', progress: 82, activeWorkers: 3 },
        useast: { status: 'provisioning', progress: 0, activeWorkers: 0 },
        timestamp: new Date().toISOString()
    });
});

// Antigravity status (mock)
app.get('/api/antigravity/status', (req, res) => {
    res.json({
        online: false,
        message: 'Antigravity Core offline - API key not configured',
        powerLevel: 'OFFLINE'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Minimal Zyeute API Server running on port ${PORT}`);
    console.log(`📡 Endpoints available for profile and auth functionality`);
    console.log(`🔧 Use this for testing profile page and logout features`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Server shutting down...');
    process.exit(0);
});