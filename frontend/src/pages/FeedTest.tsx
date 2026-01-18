// ULTIMATE BUG TEST - Absolute minimal feed with hardcoded data
// This bypasses ALL complexity to isolate the rendering issue

export default function FeedTest() {
    // Hardcoded test data - no API, no hooks, no nothing
    const testVideos = [
        { id: 1, title: "Test Video 1", color: "#ff6b6b" },
        { id: 2, title: "Test Video 2", color: "#4ecdc4" },
        { id: 3, title: "Test Video 3", color: "#ffe66d" },
    ];

    console.log("🧪 FeedTest component MOUNTED - React is working!");

    return (
        <div style={{
            width: '100vw',
            height: '100vh',
            background: '#0a0a0a',
            color: 'white',
            padding: '20px',
            fontFamily: 'system-ui, sans-serif',
            overflow: 'auto'
        }}>
            <h1 style={{ color: '#ffd700', marginBottom: '10px' }}>🧪 ULTIMATE BUG TEST</h1>
            <p style={{ color: '#888' }}>If you can see this, React is working and routing is correct.</p>

            <div style={{
                marginTop: '20px',
                border: '2px solid #ff00ff',
                padding: '15px',
                borderRadius: '8px',
                background: '#1a1a1a'
            }}>
                <h3 style={{ color: '#ff00ff', marginTop: 0 }}>Test Videos (Hardcoded Data)</h3>
                {testVideos.map(video => (
                    <div
                        key={video.id}
                        style={{
                            border: `2px solid ${video.color}`,
                            padding: '20px',
                            margin: '10px 0',
                            background: '#222',
                            borderRadius: '8px'
                        }}
                    >
                        <h2 style={{ color: video.color, margin: 0 }}>Video #{video.id}</h2>
                        <p style={{ margin: '5px 0 0' }}>{video.title}</p>
                    </div>
                ))}
            </div>

            <div style={{
                marginTop: '30px',
                padding: '15px',
                background: '#1a1a1a',
                borderRadius: '8px',
                border: '1px solid #333'
            }}>
                <h3 style={{ color: '#4ecdc4', marginTop: 0 }}>Diagnostic Results:</h3>
                <p style={{ color: '#4ecdc4' }}>✅ If you see 3 colored boxes above, rendering works</p>
                <p style={{ color: '#ff6b6b' }}>❌ If this page is black/blank, React is crashing before mount</p>
                <p style={{ color: '#ffe66d' }}>⚠️ Check browser console for errors (F12)</p>
            </div>

            <div style={{
                marginTop: '20px',
                padding: '10px',
                background: '#333',
                borderRadius: '4px',
                fontSize: '12px',
                color: '#888'
            }}>
                <strong>Next Steps if this works:</strong>
                <ol style={{ margin: '10px 0', paddingLeft: '20px' }}>
                    <li>Add react-window List (test virtualization)</li>
                    <li>Add API fetch (test network)</li>
                    <li>Add auth context (test auth)</li>
                    <li>Narrow down which layer breaks</li>
                </ol>
            </div>
        </div>
    );
}
