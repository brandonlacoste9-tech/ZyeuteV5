// .lighthouserc.js
// Lighthouse CI configuration for enforcing performance standards
module.exports = {
  ci: {
    collect: {
      // URLs to audit - adjust as needed
      url: ['http://localhost:3000/feed'],
      numberOfRuns: 3, // Run 3 times and take median for stability
      settings: {
        // Use mobile preset for feed (primary use case)
        preset: 'desktop', // Change to 'mobile' for mobile-first testing
        throttling: {
          // Simulate 4G connection
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
        },
      },
    },
    assert: {
      assertions: {
        // ============================================================
        // PERFORMANCE ASSERTIONS
        // ============================================================
        
        // Overall performance score must be 90+
        'categories:performance': ['error', { minScore: 0.9 }],
        
        // Cumulative Layout Shift - critical for virtualized lists
        // Prevents the "100vh vs 100dvh" regression
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        
        // Largest Contentful Paint - first video should load fast
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        
        // First Contentful Paint
        'first-contentful-paint': ['warn', { maxNumericValue: 1800 }],
        
        // Time to Interactive - feed should be scrollable quickly
        'interactive': ['warn', { maxNumericValue: 3800 }],
        
        // Total Blocking Time - virtualization should keep this low
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],
        
        // ============================================================
        // ACCESSIBILITY ASSERTIONS
        // ============================================================
        
        // Accessibility score must be 90+
        'categories:accessibility': ['warn', { minScore: 0.9 }],
        
        // ============================================================
        // BEST PRACTICES
        // ============================================================
        
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        
        // ============================================================
        // SEO
        // ============================================================
        
        'categories:seo': ['warn', { minScore: 0.9 }],
      },
    },
    upload: {
      // Use temporary public storage for CI reports
      target: 'temporary-public-storage',
    },
  },
};
