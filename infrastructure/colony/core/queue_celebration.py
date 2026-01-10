
import os
import sys
from dotenv import load_dotenv
from supabase import create_client

# Path setup to load env from root
script_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.abspath(os.path.join(script_dir, '../../../'))
load_dotenv(os.path.join(root_dir, '.env'))

url = os.environ.get("VITE_SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_KEY")

if not url or not key:
    print("❌ Missing Supabase credentials")
    # For debugging, print what we have (masked)
    print(f"URL: {url}")
    print(f"KEY: {key[:5]}..." if key else "KEY: None")
    exit(1)

try:
    supabase = create_client(url, key)

    task = {
        "command": "generate_image",
        "metadata": {
            "prompt": "A legendary cyberpunk party in Montreal, neon lights, Mount Royal at night, 8k resolution v3",
            "target_bee": "fal_bee" 
        },
        "status": "pending"
    }

    print("🚀 Queuing celebration task...")
    data = supabase.table("colony_tasks").insert(task).execute()
    
    if data.data:
        print(f"✅ Queued task ID: {data.data[0]['id']}")
        print(f"   Command: {data.data[0]['command']}")
        print(f"   Status: {data.data[0]['status']}")
    else:
        print("⚠️ Task insert returned no data")

except Exception as e:
    print(f"❌ Error queuing task: {e}")
