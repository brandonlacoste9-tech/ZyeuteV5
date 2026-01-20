console.log("🚀 Safety Loader Starting...");

const PORT = process.env.PORT || 5000;

try {
  // Try to load the main application bundle
  console.log("📦 Loading dist/index.cjs...");
  require('../dist/index.cjs'); 
  console.log("✅ Main app loaded successfully (async setup pending)");
} catch (error) {
  console.error("🔥 CRITICAL CRASH ON LOAD 🔥");
  console.error(error);
  
  // Start a fallback HTTP server so container stays UP and we can see logs
  const http = require('http');
  const server = http.createServer((req, res) => {
    const message = `
      CRITICAL STARTUP FAILURE
      ========================
      timestamp: ${new Date().toISOString()}
      error: ${error.message}
      
      stack:
      ${error.stack}
    `;
    console.error("Serving error report to client");
    res.writeHead(500, {'Content-Type': 'text/plain'});
    res.end(message);
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚑 Fallback Emergency Server listening on port ${PORT}`);
  });
}

// Keep process alive if possible via unhandled rejection handlers
process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception in Loader:', err);
    // Don't exit if we can avoid it, but might be unstable
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection in Loader:', reason);
});
