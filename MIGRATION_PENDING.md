# Database Migration Pending

The schema has been updated to include the `media` table and `media_type` enum.
Also extended `media` table with enhancement fields.

However, the migration could not be applied automatically in the current environment.

Please run the following command to push the changes to the database:

```bash
npm run db:push
```

or

```bash
npx drizzle-kit push
```

## Changes

- Added `media_type` enum (IMAGE, VIDEO)
- Added `enhance_status` enum (PENDING, PROCESSING, DONE, FAILED)
- Added `media` table:
  - id (UUID)
  - userId (UUID)
  - type (media_type)
  - muxAssetId (text)
  - supabaseUrl (text)
  - thumbnailUrl (text)
  - caption (text)
  - enhancedUrl (text)
  - enhanceStatus (enhance_status)
  - enhancedAt (timestamp)
  - createdAt (timestamp)

- Added `threads` table:
  - id (UUID)
  - userId (UUID)
  - title (text)
  - createdAt (timestamp)
  - updatedAt (timestamp)

- Added `messages` table:
  - id (UUID)
  - threadId (UUID)
  - sender (text)
  - content (text)
  - createdAt (timestamp)
