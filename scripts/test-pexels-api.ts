import fetch from 'node-fetch';

async function testPexels() {
  const url = 'http://localhost:5000/api/pexels/curated';
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log('Pexels Curated Data:', JSON.stringify(data, null, 2).substring(0, 500) + '...');
  } catch (err) {
    console.error('Failed to fetch Pexels:', err.message);
  }
}

testPexels();
