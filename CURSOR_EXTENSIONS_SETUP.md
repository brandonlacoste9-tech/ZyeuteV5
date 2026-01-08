# Cursor Extensions Setup Guide

Essential VS Code extensions to optimize Cursor's AI assistance for your Colony OS backend.

## 🚀 Quick Install

1. Open Cursor Settings (`Cmd/Ctrl + ,`)
2. Go to Extensions
3. Search for each extension below
4. Click "Install"

Or use the Command Palette (`Cmd/Ctrl + Shift + P`):
```
Extensions: Show Recommended Extensions
```

---

## 📋 Essential Extensions

### 1. **Error Lens** ⭐⭐⭐⭐⭐
**Extension ID**: `usernamehw.errorlens`

**Why**: Highlights errors instantly in your code. Copy-paste errors directly into Cursor chat for quick fixes.

**Best For**:
- Debugging TypeScript compilation errors
- Finding syntax issues in Python bridge service
- Quick error identification in React components

**Usage**: Errors appear inline - just copy the red text and ask Cursor to fix it!

---

### 2. **Docker** ⭐⭐⭐⭐⭐
**Extension ID**: `ms-azuretools.vscode-docker`

**Why**: Helps Cursor write and debug containerization scripts with real-time file access.

**Best For**:
- Video worker Dockerfile
- Deployment configurations
- Container debugging

**Usage**: Right-click Dockerfile → Ask Cursor to optimize it

---

### 3. **Prisma** ⭐⭐⭐⭐
**Extension ID**: `Prisma.prisma`

**Why**: Database client and schema visualization. Helps Cursor understand your database patterns (even though we use Drizzle).

**Best For**:
- Understanding Supabase schema
- Writing SQL migrations
- Database query optimization

**Usage**: View database schema visually, then ask Cursor to write Drizzle queries

---

### 4. **REST Client** ⭐⭐⭐⭐⭐
**Extension ID**: `humao.rest-client`

**Why**: Test APIs within editor, then ask Cursor to write fetch logic based on responses.

**Best For**:
- Testing Synapse Bridge endpoints
- Testing Python bridge `/execute` endpoint
- Validating API responses before writing frontend code

**Usage**:
1. Create `.http` file with API calls
2. Run requests from editor
3. Ask Cursor: "Write the fetch logic for this endpoint based on the response"

---

### 5. **Tailwind CSS IntelliSense** ⭐⭐⭐⭐
**Extension ID**: `bradlc.vscode-tailwindcss`

**Why**: Autocomplete for Tailwind classes. Improves Cursor's suggestions for UI code.

**Best For**:
- Vertical feed components
- Dashboard styling
- Responsive design patterns

**Usage**: Cursor will suggest correct Tailwind classes as you type

---

### 6. **Python** ⭐⭐⭐⭐⭐
**Extension ID**: `ms-python.python`

**Why**: Essential for Windows-Use bridge service. Helps Cursor understand Python syntax.

**Best For**:
- `bridge_service.py` development
- Python bridge debugging
- FastAPI route optimization

**Usage**: Set Python interpreter, then ask Cursor to write Python code

---

### 7. **Pylance** ⭐⭐⭐⭐
**Extension ID**: `ms-python.vscode-pylance`

**Why**: Python language server for better type checking and IntelliSense.

**Best For**:
- Type hints in Python bridge
- Import resolution
- Code navigation

**Usage**: Works automatically - improves Cursor's Python suggestions

---

### 8. **ESLint** ⭐⭐⭐⭐
**Extension ID**: `dbaeumer.vscode-eslint`

**Why**: Catches TypeScript/JavaScript errors before runtime.

**Best For**:
- Backend route validation
- Frontend component linting
- Code quality enforcement

**Usage**: Errors show inline - ask Cursor to fix them

---

### 9. **Jest** ⭐⭐⭐
**Extension ID**: `Orta.vscode-jest`

**Why**: Run tests from editor. Cursor can watch test output and fix failing tests.

**Best For**:
- Integration tests
- Unit test debugging
- Test-driven development

**Usage**: Run tests, see failures, ask Cursor to fix them

---

### 10. **TypeScript Nightly** ⭐⭐⭐⭐
**Extension ID**: `ms-vscode.vscode-typescript-next`

**Why**: Latest TypeScript features. Essential for strict typing.

**Best For**:
- Synapse Bridge type safety
- Colony OS type definitions
- Advanced TypeScript patterns

**Usage**: Enable in workspace settings for latest TS features

---

## 🎯 Installation Priority

### **Priority 1** (Install First - 2 mins)
1. Error Lens
2. REST Client
3. Python + Pylance

### **Priority 2** (Essential - 3 mins)
4. Docker
5. Prisma
6. ESLint

### **Priority 3** (Helpful - 2 mins)
7. Tailwind CSS IntelliSense
8. Jest
9. TypeScript Nightly

**Total Time**: ~7 minutes

---

## ⚙️ Configuration

### Error Lens Settings
Add to `.vscode/settings.json`:
```json
{
  "errorLens.enabled": true,
  "errorLens.enabledDiagnosticLevels": ["error", "warning"]
}
```

### REST Client Settings
Create `test.http` file in root:
```http
### Test Synapse Bridge
GET http://localhost:10000/health

### Test Python Bridge
GET http://localhost:8001/health

### Test Automation Task
POST http://localhost:8001/execute
Content-Type: application/json

{
  "id": "test-123",
  "action": "Navigate to vertical feed",
  "parameters": {}
}
```

### Python Settings
Add to `.vscode/settings.json`:
```json
{
  "python.defaultInterpreterPath": "${workspaceFolder}/Windows-Use/.venv/bin/python",
  "python.analysis.typeCheckingMode": "basic"
}
```

---

## 🔥 Pro Tips

1. **Use Error Lens with Cursor**: See errors instantly, copy into chat
2. **Test APIs with REST Client**: Then ask Cursor to write fetch code
3. **Docker + Cursor**: Right-click Dockerfile → "Optimize this with Cursor"
4. **Prisma Schema View**: Visualize DB, then ask Cursor to write Drizzle queries
5. **Run Tests in Editor**: See failures, ask Cursor to fix automatically

---

## ✅ Verification

After installing extensions:

1. **Error Lens**: Open a file with errors - should see inline highlights
2. **REST Client**: Create `.http` file, should see "Send Request" above code
3. **Docker**: Should see Docker icon in sidebar
4. **Python**: Open `.py` file, should see Python interpreter in status bar

---

**Next Step**: Install Priority 1 extensions, then proceed to Modular Rules setup!
