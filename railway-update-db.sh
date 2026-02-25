#!/bin/bash
# Update Railway DATABASE_URL with correct Supabase connection

echo "🔧 Updating Railway DATABASE_URL..."

# The correct Supabase connection URL
DATABASE_URL="postgresql://postgres.vuanulvyqkfefmjcikfk:CEKbFjymk0z3TRRc@aws-1-us-east-1.pooler.supabase.com:5432/postgres"

echo ""
echo "Run these commands to update Railway:"
echo ""
echo "1. Login to Railway:"
echo "   railway login"
echo ""
echo "2. Set the DATABASE_URL:"
echo "   railway variables --service 'zyeute-backend' --set 'DATABASE_URL=$DATABASE_URL'"
echo ""
echo "3. Redeploy:"
echo "   railway up"
echo ""
echo "✅ Your database connection will be fixed!"
