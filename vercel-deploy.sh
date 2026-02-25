#!/bin/bash
# Deploy Zyeuté Frontend to Vercel

echo "🚀 DEPLOYING ZYEUTÉ TO VERCEL"
echo "==============================="
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm i -g vercel
fi

echo "📦 Building frontend..."
npm run build:vercel

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo ""
echo "🚀 Deploying to Vercel..."
echo ""

# Check if user is logged in
vercel whoami &> /dev/null
if [ $? -ne 0 ]; then
    echo "🔑 Please login to Vercel:"
    vercel login
fi

# Deploy
echo ""
echo "🌐 Starting deployment..."
vercel --prod

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Make sure to set these environment variables in Vercel:"
echo "   - VITE_SUPABASE_URL"
echo "   - VITE_SUPABASE_ANON_KEY"
echo ""
