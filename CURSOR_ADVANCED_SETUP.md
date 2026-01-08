# Cursor Advanced Setup Guide

Complete guide to optimizing Cursor for your Colony OS backend architecture.

---

## 🎯 Part 1: VS Code Extensions

See `CURSOR_EXTENSIONS_SETUP.md` for complete extension list.

**Quick Install**:
1. Open Cursor Settings (`Cmd/Ctrl + ,`)
2. Go to Extensions
3. Install Priority 1 extensions (2 mins)

---

## 📁 Part 2: Modular Rules System

Instead of a single `.cursorrules` file, we use a **modular rule system** in `.cursor/rules/`.

### How It Works

Cursor automatically applies rules based on the file you're editing:

- **Editing `windows-automation-bridge.ts`** → Applies `001-bridge-protocol.mdc`
- **Editing `smart-ai-router.ts`** → Applies `002-mlops-safety.mdc`
- **Editing `synapse-bridge.ts`** → Applies `003-synapse-bridge.mdc`
- **Editing `storage.ts`** → Applies `004-database-patterns.mdc`

### Rules Created

1. **`001-bridge-protocol.mdc`** - Python ↔ TypeScript bridge patterns
2. **`002-mlops-safety.mdc`** - AI service safety & circuit breakers
3. **`003-synapse-bridge.mdc`** - Event-driven communication
4. **`004-database-patterns.mdc`** - Database ACID compliance

### Benefits

- ✅ **Context-aware**: Rules apply only to relevant files
- ✅ **Maintainable**: Each rule file is focused and specific
- ✅ **Scalable**: Add new rules without touching existing ones
- ✅ **Discoverable**: Easy to find rules for specific components

---

## 🔌 Part 3: MCP (Model Context Protocol) Setup

Connect Cursor directly to your Supabase database for real-time schema access.

### Step 1: Install MCP Server

```bash
npm install -g @modelcontextprotocol/server-postgres
```

### Step 2: Configure MCP in Cursor

1. Open Cursor Settings
2. Go to **Features** → **MCP**
3. Click **Add MCP Server**
4. Add this configuration:

```json
{
  "name": "supabase-db",
  "command": "mcp-server-postgres",
  "args": [
    "--connection-string",
    "${SUPABASE_DATABASE_URL}"
  ],
  "env": {
    "PGHOST": "${SUPABASE_HOST}",
    "PGDATABASE": "${SUPABASE_DB}",
    "PGUSER": "${SUPABASE_USER}",
    "PGPASSWORD": "${SUPABASE_PASSWORD}"
  }
}
```

### Step 3: Use MCP in Chat

Now you can ask Cursor:
- "Analyze the `windows_automation_bees` table and write a query to find bees that haven't heartbeated in 5 minutes"
- "What's the schema of the `automation_tasks` table?"
- "Write a Drizzle query to get all failed tasks from the last hour"

Cursor will query your **actual database** instead of guessing!

---

## 🤖 Part 4: Agent Mode (Composer)

**Composer** (`Cmd/Ctrl + I`) is Cursor's most powerful feature for multi-file editing.

### When to Use Composer

- **Multi-file changes**: Editing 5+ files simultaneously
- **End-to-end tasks**: "Add authentication to all routes"
- **Refactoring**: "Replace all `any` types with proper interfaces"
- **Testing**: "Fix all failing tests and update code"

### Activating Agent Mode

1. Press `Cmd/Ctrl + I` to open Composer
2. Select **Agent Mode** (Claude 3.5 Sonnet or o1-mini)
3. Give it an autonomous task:
   ```
   Run the validation scripts in MIGRATIONS_AUTOMATION.md. 
   If they fail, check the logs, fix the Drizzle schema, 
   and re-run until they pass.
   ```

### Agent Mode Benefits

- ✅ **Autonomous**: Runs terminal commands automatically
- ✅ **Iterative**: Fixes errors in a loop without your input
- ✅ **Multi-file**: Edits 10+ files simultaneously
- ✅ **Context-aware**: Understands entire codebase

---

## ⚙️ Part 5: Model Selection

Different models excel at different tasks:

| Model | Best For | When to Use |
|-------|----------|-------------|
| **Claude 3.5 Sonnet** | Coding logic, following complex instructions | Default for most tasks |
| **o1-preview / o1-mini** | Deep reasoning, complex algorithms | Architectural decisions, complex math |
| **GPT-4 Turbo** | Quick iterations, code generation | Rapid prototyping |

### Recommended Settings

**For Backend Development**:
- **Chat**: Claude 3.5 Sonnet
- **Composer**: Claude 3.5 Sonnet (Agent Mode)
- **Inline Edit**: GPT-4 Turbo (faster)

**For Complex Architecture**:
- **Composer**: o1-mini (better reasoning)
- **Chat**: Claude 3.5 Sonnet

---

## 🎯 Part 6: YOLO Mode

**YOLO Mode** lets Cursor run terminal commands without asking for permission.

### When to Use

- **Testing**: Run tests automatically
- **Migrations**: Apply database changes
- **Builds**: Compile TypeScript
- **Git**: Commit, push, pull

### Activation

1. Settings → **Cursor Agent** → **YOLO Mode**
2. Toggle **ON**
3. Be careful - Cursor can now run destructive commands!

### Example Usage

```
Apply the database migrations in MIGRATIONS_AUTOMATION.md,
run the validation script, and if it passes, commit the changes.
```

Cursor will:
1. Apply migrations
2. Run validation
3. If passes → commit
4. If fails → fix and retry

---

## 📝 Part 7: Notepads

**Notepads** store long-term "memories" about your architecture.

### Creating a Notepad

1. Press `Cmd/Ctrl + L` to open chat
2. Click **Notepads** in sidebar
3. Click **+ New Notepad**
4. Name it: "Colony OS Architecture"

### Example Notepad Content

```
# Colony OS Architecture Notes

## Component Responsibilities

### Synapse Bridge
- Real-time Socket.io connection to Colony OS kernel
- Event publishing: post.created, ai.usage
- Task delegation to automation bees

### Windows-Use Bridge
- Python FastAPI service on port 8001
- Executes GUI automation tasks
- Returns performance metrics

### Bee System
- Registry: BEE_REGISTRY in bee-registry.ts
- Task assignment: Round-robin load balancing
- Status tracking: idle, running, error

## Key Patterns
- Always use Promise.allSettled() for parallel bridge calls
- Never use `any` types in Synapse Bridge
- Always validate Python bridge responses with Zod
```

### Using Notepads

When asking Cursor about architecture:
```
Using @Colony OS Architecture, explain how task delegation works
```

Cursor will reference your notepad for context!

---

## 🔍 Part 8: Codebase Indexing

Ensure Cursor can search your entire project.

### Enable Codebase Indexing

1. Settings → **Features** → **Codebase Indexing**
2. Toggle **ON**
3. Wait for initial index (may take a few minutes)

### Using @Codebase

In chat, use `@Codebase` to search:

```
@Codebase Where is the AutomationBridgeError defined?
```

```
@Codebase Show me all files that use Promise.allSettled()
```

```
@Codebase Find all places where we call the Python bridge
```

---

## ✅ Complete Setup Checklist

### Phase 1: Extensions (7 mins)
- [ ] Install Priority 1 extensions (Error Lens, REST Client, Python)
- [ ] Install Priority 2 extensions (Docker, Prisma, ESLint)
- [ ] Install Priority 3 extensions (Tailwind, Jest, TypeScript Nightly)

### Phase 2: Modular Rules (2 mins)
- [ ] Verify `.cursor/rules/` directory exists
- [ ] Review rule files (001-004)
- [ ] Test rule application on relevant files

### Phase 3: MCP Setup (5 mins)
- [ ] Install MCP Postgres server
- [ ] Configure Supabase connection
- [ ] Test with database query

### Phase 4: Agent Mode (3 mins)
- [ ] Test Composer with Agent Mode
- [ ] Run a simple multi-file task
- [ ] Verify autonomous execution

### Phase 5: Model Selection (2 mins)
- [ ] Set Claude 3.5 Sonnet as default
- [ ] Configure o1-mini for complex tasks
- [ ] Test model selection

### Phase 6: YOLO Mode (Optional - 2 mins)
- [ ] Enable YOLO Mode
- [ ] Test with safe commands
- [ ] Use with caution!

### Phase 7: Notepads (5 mins)
- [ ] Create "Colony OS Architecture" notepad
- [ ] Add key patterns and component notes
- [ ] Test notepad reference in chat

### Phase 8: Codebase Indexing (Automatic)
- [ ] Verify indexing is enabled
- [ ] Wait for initial index
- [ ] Test @Codebase searches

---

## 🎯 Total Setup Time

- **Essential Setup**: ~15 minutes (Extensions + Rules + MCP)
- **Full Setup**: ~30 minutes (All features)
- **Return on Investment**: Months of productivity gains!

---

## 🔥 Pro Tips

1. **Start with Extensions + Rules**: Biggest immediate impact
2. **Use MCP for Database**: Real schema = better suggestions
3. **Agent Mode for Multi-file**: Saves hours on refactoring
4. **Notepads for Architecture**: Context for complex systems
5. **@Codebase for Discovery**: Find code faster

---

## 📚 Additional Resources

- **Cursor Workspaces**: [Video Guide](https://www.youtube.com/watch?v=E_kOAvmeTJ0)
- **MCP Documentation**: [Model Context Protocol](https://modelcontextprotocol.io)
- **Composer Guide**: Press `Cmd/Ctrl + I` → Click "Learn More"

---

**Next Step**: Install Priority 1 extensions and verify modular rules are working!
