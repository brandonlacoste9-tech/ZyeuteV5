# 🎬 Video Generation Setup Guide

## Overview
ColonyOS now includes AI-powered video generation using Stable Video Diffusion via Replicate's API. This allows you to create videos from text prompts with cinematic quality.

## Setup Instructions

### 1. Get Replicate API Token
1. Visit [Replicate.com](https://replicate.com/account/api-tokens)
2. Sign up for a free account (first 100 credits are free)
3. Generate an API token
4. Add it to your environment variables

### 2. Environment Configuration
Create or update your `.env` file in the `packages/kernel-node` directory:

```bash
# Add this line to your .env file
REPLICATE_API_TOKEN=r8_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### 3. Install Dependencies
The Replicate package is already installed. If you need to reinstall:

```bash
cd packages/kernel-node
npm install replicate
```

### 4. Start the System
```bash
# Terminal 1: Start the API server
npm run dev

# Terminal 2: Open dashboard
# Open zyeute_dashboard.html in browser
```

### 5. Generate Your First Video
1. Open the dashboard
2. Click "Video Studio" in the sidebar
3. Enter a prompt like: "A majestic eagle soaring over mountain peaks at sunset"
4. Click "Generate Video (2-3 min)"
5. Wait for processing to complete
6. Click "View" to see your generated video

## Video Generation Features

### Text-to-Video
- **Model**: Stable Video Diffusion 1.1
- **Duration**: 14 frames (2.3 seconds at 6fps)
- **Resolution**: Variable (maintains aspect ratio)
- **Style**: Cinematic, high-quality

### Parameters You Can Control
- **Prompt**: Main description of the video scene
- **Negative Prompt**: What to avoid (blurry, distorted, etc.)
- **Motion Style**: From minimal to high motion
- **Seed**: For reproducible results

### Example Prompts
- "A serene lake with mountains reflecting in crystal clear water"
- "Cyberpunk city street at night with neon lights and flying cars"
- "A butterfly emerging from its chrysalis in slow motion"
- "Abstract geometric shapes morphing and flowing in space"

## Troubleshooting

### "REPLICATE_API_TOKEN not configured"
- Make sure you added the token to your `.env` file
- Restart the server after adding the token

### "Video generation failed"
- Check your internet connection
- Verify your Replicate account has credits
- Try a simpler prompt

### Videos Not Loading
- Videos are hosted on Replicate's CDN
- If a video doesn't load, try generating again
- Check browser console for errors

## Cost Information

- **Free Tier**: 100 credits (enough for ~10-20 videos)
- **Cost per video**: ~10-15 credits depending on parameters
- **Upgrade**: Paid plans start at $5/month for more credits

## Advanced Usage

### Image-to-Video
Future updates will support starting with an image and generating motion.

### Custom Models
The system can be extended to use other Replicate models for different styles.

---

**Ready to create cinematic videos with AI?** Follow the setup steps above and start generating! 🎬✨