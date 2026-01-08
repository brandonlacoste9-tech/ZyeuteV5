# DEPRECATED: Supabase Edge Functions

**⚠️ These Edge Functions are deprecated in favor of Express backend routes.**

All functionality has been migrated to the Express backend:

- `moderate-content` → `backend/routes/moderation.ts` (POST `/api/moderation/content`)
- `transcribe-media` → `backend/routes/ai.routes.ts` (POST `/api/ai/transcribe`)
- Other functions → See `backend/routes/` directory

## Migration Status

- ✅ Content moderation migrated to Express
- ✅ Transcription migrated to Express (via Vertex AI service)
- ⚠️ Other Edge Functions should be migrated or removed

## TODO

- [ ] Remove this directory once all functions are confirmed migrated
- [ ] Update any remaining references to Edge Functions
- [ ] Clean up Deno dependencies
