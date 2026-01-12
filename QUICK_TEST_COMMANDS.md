# 🚀 Quick Test Commands

## Windows PowerShell Commands

### Check CSP Headers

```powershell
curl -sI https://www.zyeute.com | Select-String -Pattern "content-security-policy" -CaseSensitive:$false
```

### Check Backend Health

```powershell
curl https://zyeutev5-production.up.railway.app/api/health
```

### Test Pexels Endpoint

```powershell
curl "https://zyeutev5-production.up.railway.app/api/pexels/curated?per_page=1&page=1" | ConvertFrom-Json | Select-Object -First 5
```

---

## Expected Results

### CSP Header Should Contain:

- `media-src 'self' https://videos.pexels.com`
- `img-src ... https://images.pexels.com`
- `connect-src ... https://api.pexels.com`

### Health Check Should Return:

```json
{ "status": "healthy", "message": "Zyeuté Live", "timestamp": "..." }
```

### Pexels Should Return:

```json
{"page":1,"per_page":1,"videos":[...],"total_results":...}
```

---

## Browser Console Quick Check

1. Open `https://www.zyeute.com`
2. Press `F12` (DevTools)
3. Go to **Console** tab
4. Look for:
   - ✅ No CSP errors
   - ✅ No 500 errors
   - ✅ No "Session in future" errors
   - ✅ Videos loading from `videos.pexels.com`
