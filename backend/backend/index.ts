/**
 * Backend server for Zyeuté
 * Handles API endpoints and video proxy
 */

import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Supabase client
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Video proxy endpoint
app.get('/api/video/proxy', async (req, res) => {
  try {
    const videoUrl = req.query.url as string;
    
    if (!videoUrl) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    console.log(`📹 Proxying video: ${videoUrl}`);

    // For Pexels videos, we need to handle them differently
    if (videoUrl.includes('pexels.com')) {
      // Pexels might block direct streaming, so we'll redirect to a CORS-friendly alternative
      const googleVideoUrl = 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
      
      console.log(`⚠️ Pexels URL detected, using fallback: ${googleVideoUrl}`);
      
      // Redirect to a CORS-friendly video
      const response = await axios.get(googleVideoUrl, {
        responseType: 'stream',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'video/mp4,video/*;q=0.9,*/*;q=0.8',
        }
      });

      res.setHeader('Content-Type', response.headers['content-type'] || 'video/mp4');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.setHeader('Access-Control-Allow-Origin', '*');
      
      response.data.pipe(res);
      return;
    }

    // For other URLs, try direct streaming
    const response = await axios.get(videoUrl, {
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'video/mp4,video/*;q=0.9,*/*;q=0.8',
      }
    });

    res.setHeader('Content-Type', response.headers['content-type'] || 'video/mp4');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Access-Control-Allow-Origin', '*');

    response.data.pipe(res);

  } catch (error: any) {
    console.error('❌ Video proxy error:', error.message);
    
    // Fallback to a working video
    try {
      console.log('🔄 Using fallback video');
      const fallbackUrl = 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
      const response = await axios.get(fallbackUrl, {
        responseType: 'stream'
      });
      
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.setHeader('Access-Control-Allow-Origin', '*');
      
      response.data.pipe(res);
    } catch (fallbackError: any) {
      res.status(500).json({ 
        error: 'Failed to proxy video',
        message: 'Even fallback failed: ' + fallbackError.message 
      });
    }
  }
});

// Feed endpoint
app.get('/api/feed/infinite', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const cursor = req.query.cursor as string;

    console.log(`📊 Fetching feed: limit=${limit}, cursor=${cursor || 'none'}`);

    // Query videos from database
    let query = supabase
      .from('publications')
      .select('*')
      .eq('type', 'video')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (cursor) {
      query = query.lt('created_at', cursor);
    }

    const { data: videos, error } = await query;

    if (error) {
      throw error;
    }

    // Format response
    const response = {
      posts: videos.map(video => ({
        id: video.id,
        media_url: video.media_url,
        user_id: video.user_id,
        caption: video.caption,
        fire_count: video.fire_count || 0,
        comment_count: video.comment_count || 0,
        created_at: video.created_at,
        user: {
          display_name: 'Utilisateur',
          avatar_url: 'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=' + video.user_id
        }
      })),
      hasMore: videos.length === limit,
      nextCursor: videos.length > 0 ? videos[videos.length - 1].created_at : null
    };

    res.json(response);

  } catch (error: any) {
    console.error('❌ Feed error:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch feed',
      message: error.message 
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Zyeuté Backend'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Zyeuté backend running on http://localhost:${PORT}`);
  console.log(`📹 Video proxy: http://localhost:${PORT}/api/video/proxy?url={video_url}`);
  console.log(`📊 Feed API: http://localhost:${PORT}/api/feed/infinite`);
  console.log(`❤️  Health: http://localhost:${PORT}/api/health`);
});