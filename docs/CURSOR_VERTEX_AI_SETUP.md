# Use Vertex AI Credits in Cursor (Zyeuté Main Hive)

This guide explains how to route **Cursor** through your **Google Cloud Vertex AI** endpoint so that AI features in your IDE use your **$1,300 Vertex AI credits** instead of Cursor’s default models (or other API keys).

---

## Why use Vertex in Cursor?

- **Credits:** Use your existing GCP/Vertex credits instead of burning Cursor subscription or other APIs.
- **Privacy:** Code stays in your GCP project; Google does not use it to train base models.
- **Context:** With Gemini 1.5 Pro’s large context window, Cursor can reason over your full Zyeuté codebase and Colony OS architecture.
- **Quebec/Joual:** Pro models handle nuanced Quebec French and Joual better than smaller “flash” models.

---

## 1. Create a Service Account in GCP (do this in Console)

You **must** create the key in your own Google Cloud project. Never use a key from someone else or commit real key JSON to the repo.

1. Open [Google Cloud Console](https://console.cloud.google.com/) and select your project (e.g. the one used for Zyeuté / Vertex AI).
2. Go to **IAM & Admin → Service Accounts**.
3. Click **Create Service Account**:
   - **Name:** e.g. `cursor-vertex-ide`
   - **Description:** e.g. “Cursor IDE Vertex AI access”
4. Click **Create and Continue**. Under **Grant this service account access to project**, add:
   - **Vertex AI User** (`roles/aiplatform.user`) — required for Vertex AI / Gemini.
   - Optionally **Storage Object Viewer** if you ever want Cursor to use GCS from this identity (e.g. RAG over bucket data).
5. Click **Done**.
6. Open the new service account → **Keys** tab → **Add Key → Create new key** → **JSON** → **Create**.  
   The JSON file is downloaded to your machine. **Keep it secret;** do not commit it or share it.

---

## 2. What the Service Account Key File Looks Like (structure only)

When you download the key from GCP, the file is a single JSON object with fields like these (values are placeholders; yours will differ):

```json
{
  "type": "service_account",
  "project_id": "your-gcp-project-id",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "cursor-vertex-ide@your-gcp-project-id.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "..."
}
```

- **Do not** paste this file (or `private_key` / `client_email`) into docs or chat.
- Use it only in Cursor (path or paste as per Cursor’s UI) and in local `.env` if you reference it for the Zyeuté app (e.g. `GOOGLE_APPLICATION_CREDENTIALS`).

---

## 3. Configure Cursor to Use Vertex AI

1. Open Cursor: **Ctrl + Shift + J** (or **Settings → Models**).
2. Find the **Google** section and turn it **On**.
3. Use **Vertex AI** (not only “AI Studio”):
   - If Cursor asks for a **key**, use your **GCP Service Account key**:
     - Either **path** to the downloaded JSON file (e.g. `C:\Users\You\.config\gcp\cursor-vertex-key.json`), or
     - If Cursor supports “paste JSON”, paste the **contents** of that file (then store the file somewhere safe and restrict permissions).
   - Do **not** use a Gemini API key from AI Studio if you want usage to go through **Vertex** and your credits.
4. **Model:** Choose **Gemini 1.5 Pro** (or the Vertex model name Cursor exposes) to get the large context window.

Cursor’s UI may label this as “Google” or “Vertex”; the important part is that authentication is via **Service Account JSON** so that requests go to Vertex AI and bill to your GCP project.

---

## 4. Quick Health Check (billing and project)

To confirm Cursor is using your GCP project and that billing is attached:

1. **List billing accounts** (optional; to find the ID):
   ```powershell
   gcloud billing accounts list
   ```
2. **Describe the billing account** (replace with your ID from Billing in Cloud Console):
   ```powershell
   gcloud billing accounts describe YOUR_BILLING_ACCOUNT_ID
   ```
3. In [Cloud Console → Billing](https://console.cloud.google.com/billing), check that your project is linked to that account and that Vertex AI usage appears there after you use Cursor with Vertex.

---

## 5. Security Reminders

- **Do not** commit the service account JSON to the repo or put it under `ZyeuteV5/`. Add it to `.gitignore` if you ever copy it into the project folder.
- Prefer a **dedicated** service account for Cursor (e.g. `cursor-vertex-ide`) with only the roles it needs (e.g. Vertex AI User).
- Rotate keys periodically; create a new key in GCP, update Cursor, then disable or delete the old key.

---

## 6. Relation to Zyeuté Backend

The Zyeuté **backend** already uses Vertex AI via:

- `GOOGLE_CLOUD_PROJECT`
- `GOOGLE_APPLICATION_CREDENTIALS` (path to a service account JSON) or `GOOGLE_SERVICE_ACCOUNT_JSON` (inline JSON)

That can be the **same** GCP project and even the same service account as Cursor, or a different one. Using the same project ensures both Cursor and your app consume the same Vertex AI credits and quota.

---

**Summary:** Create the key in GCP Console, download the JSON, point Cursor’s Google/Vertex integration at that key (path or paste), and select Gemini 1.5 Pro. Then use the billing check above to confirm usage is on your account.

---

## 7. Preserve your context window (`.cursorignore`)

To avoid wasting your **2M-token Vertex context** on `node_modules`, lockfiles, and temp files, add a **`.cursorignore`** at the project root (same idea as `.gitignore`). Cursor will not index paths listed there.

**Create `.cursorignore`** in the repo root and paste something like this (tweak as needed):

```gitignore
# Dependencies
node_modules
**/node_modules

# Build & output
dist
**/dist
build
server/public

# Lockfiles (huge; use package.json for dep context)
package-lock.json
**/package-lock.json
yarn.lock
pnpm-lock.yaml

# Env & secrets
.env
.env.*
!.env.example
!.env.production.template
!.env.vercel.example

# Test & coverage
coverage
**/coverage
playwright-report
test-results
*.lcov

# Logs & temp
*.log
.cache
tmp
temp
*.tar.gz
build_log.txt
tsc_*.txt
video-diag-output.txt

# Python
__pycache__
**/__pycache__
*.pyc
venv
**/venv

# Credentials (never in context)
zyeute-ai-key.json
google-credentials.json

# External repos: keep skill content, ignore their node_modules
external/*/node_modules
external/*/dist
external/*/.git

# VCS
.git
```

**Important:** Do **not** ignore the whole `external/` folder—you want Cursor to read `external/antigravity-awesome-skills/skills/`, `external/antigravity-manager`, and `external/ui-ux-pro-max-skill-external` for the Trinity and Mad Ass. Only ignore `external/*/node_modules` and similar bloat.
