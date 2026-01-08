# Cursor Advanced Setup - Quick Start

**Total Time**: ~30 minutes | **Priority Order**: Essential → Advanced

---

## ⚡ Phase 1: Essential Setup (10 mins)

### Step 1: Install Extensions (5 mins)
1. Open Cursor → Settings → Extensions
2. Install these **Priority 1** extensions:
   - **Error Lens** (`usernamehw.errorlens`)
   - **REST Client** (`humao.rest-client`)
   - **Python** (`ms-python.python`)
   - **Pylance** (`ms-python.vscode-pylance`)

**Verify**: Open a TypeScript file with errors - should see inline highlights

---

### Step 2: Enable Modular Rules (1 min)
✅ **Already Created!** Files in `.cursor/rules/`:
- `001-bridge-protocol.mdc` - Python ↔ TypeScript bridge
- `002-mlops-safety.mdc` - AI service safety
- `003-synapse-bridge.mdc` - Event-driven communication
- `004-database-patterns.mdc` - Database ACID compliance

**Test**: Edit `windows-automation-bridge.ts` - Cursor should suggest bridge patterns

---

### Step 3: Index Cursor @Docs (4 mins)
1. Type `@Docs` in chat
2. Add **Priority 1** docs from `CURSOR_DOCS_QUICK_REFERENCE.txt`:
   - Drizzle ORM: `https://orm.drizzle.team/docs/overview`
   - Express.js: `https://expressjs.com/en/api.html`
   - Socket.io: `https://socket.io/docs/v4/`
   - Vertex AI: `https://cloud.google.com/vertex-ai/docs`
   - FastAPI: `https://fastapi.tiangolo.com/`

**Verify**: Ask Cursor "Using @Drizzle ORM, show transaction syntax" - should show correct syntax

---

## 🚀 Phase 2: Advanced Setup (20 mins)

### Step 4: MCP Database Connection (10 mins)

#### Option A: Automatic (Recommended)
1. Copy `.cursor/mcp-config.json` to Cursor settings
2. Replace `${SUPABASE_HOST}`, etc. with actual values
3. Restart Cursor

#### Option B: Manual
1. Settings → Features → MCP
2. Add MCP Server → Postgres
3. Configure Supabase connection string

**Test**: Ask Cursor "What's the schema of `automation_tasks`?" - should query your database

---

### Step 5: Install Remaining Extensions (5 mins)
**Priority 2**:
- Docker (`ms-azuretools.vscode-docker`)
- Prisma (`Prisma.prisma`)
- ESLint (`dbaeumer.vscode-eslint`)

**Priority 3**:
- Tailwind CSS IntelliSense (`bradlc.vscode-tailwindcss`)
- Jest (`Orta.vscode-jest`)
- TypeScript Nightly (`ms-vscode.vscode-typescript-next`)

---

### Step 6: Configure Agent Mode (3 mins)
1. Press `Cmd/Ctrl + I` to open Composer
2. Select **Agent Mode** (Claude 3.5 Sonnet)
3. Test with: "Fix all TypeScript errors in `backend/`"

**Verify**: Cursor should automatically fix errors and run checks

---

### Step 7: Enable YOLO Mode (2 mins) ⚠️ OPTIONAL
1. Settings → Cursor Agent → **YOLO Mode**
2. Toggle **ON**
3. **Warning**: Cursor can now run destructive commands!

**Test**: "Run all tests and fix failures" - Cursor will run tests automatically

---

### Step 8: Create Notepads (5 mins)
1. Press `Cmd/Ctrl + L` → **Notepads**
2. Create "Colony OS Architecture"
3. Add key patterns from `CURSOR_ADVANCED_SETUP.md`

**Test**: Ask "Using @Colony OS Architecture, explain Synapse Bridge"

---

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] **Error Lens**: Errors show inline in files
- [ ] **REST Client**: Can create `.http` files with API calls
- [ ] **Python**: Python files have syntax highlighting
- [ ] **Modular Rules**: Editing bridge files shows bridge-specific suggestions
- [ ] **@Docs**: Cursor knows latest Drizzle/Express/Socket.io syntax
- [ ] **MCP**: Can query database schema from chat
- [ ] **Agent Mode**: Can fix multiple files autonomously
- [ ] **Notepads**: Architecture notes are accessible

---

## 🎯 Quick Commands to Test

### Test Extensions
```typescript
// Type this (with an error) - Error Lens should highlight it
const x: string = 123; // Error should show inline
```

### Test Modular Rules
```
// Edit windows-automation-bridge.ts
// Ask Cursor: "Add health check polling"
// Should suggest patterns from 001-bridge-protocol.mdc
```

### Test @Docs
```
Using @Drizzle ORM, show me how to write a transaction
```

### Test MCP
```
What's the schema of the automation_tasks table?
```

### Test Agent Mode
```
Cmd/Ctrl + I → "Fix all TypeScript errors in backend/"
```

---

## 📚 Full Documentation

- **Extensions**: `CURSOR_EXTENSIONS_SETUP.md`
- **Advanced Setup**: `CURSOR_ADVANCED_SETUP.md`
- **@Docs Guide**: `CURSOR_DOCS_GUIDE.md`
- **Quick Reference**: `CURSOR_DOCS_QUICK_REFERENCE.txt`

---

## 🚨 Troubleshooting

### Rules Not Applying?
- Verify `.cursor/rules/` directory exists
- Check file extensions are `.mdc`
- Restart Cursor

### MCP Not Connecting?
- Verify database credentials in `.cursor/mcp-config.json`
- Check Supabase connection string format
- Ensure MCP server is installed: `npm install -g @modelcontextprotocol/server-postgres`

### Agent Mode Not Working?
- Verify Claude 3.5 Sonnet is selected
- Check Agent Mode toggle is ON
- Try simpler tasks first

### @Docs Not Indexing?
- Wait a few minutes after adding
- Verify URL is correct (should be main docs page)
- Test with simple question first

---

## 🎉 Success Criteria

You're ready when:
- ✅ Extensions show errors inline
- ✅ Cursor suggests correct patterns for bridge files
- ✅ @Docs queries return up-to-date syntax
- ✅ MCP can query your database
- ✅ Agent Mode can fix multiple files

---

**Next**: Complete configuration (5 mins) → Apply migrations → Test end-to-end!
