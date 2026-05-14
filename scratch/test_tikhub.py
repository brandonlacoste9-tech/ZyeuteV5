import requests
import json

API_TOKEN = "gYsfWd4o3nOBuFyYF7nF8RjgPDmgQdxO0ifo632jRs6x2nqyJXmHLWK7bA=="

def fetch_search_video(keyword):
    url = "https://api.tikhub.io/api/v1/tiktok/web/fetch_user_profile"
    headers = {
        "Authorization": f"Bearer {API_TOKEN}",
        "Content-Type": "application/json"
    }
    params = {
        "unique_id": "tiktok"
    }
    
    print(f"Requesting {url} with unique_id=tiktok")
    response = requests.get(url, headers=headers, params=params)
    print("Status:", response.status_code)
    try:
        print(json.dumps(response.json(), indent=2)[:500])
    except Exception as e:
        print("Raw response:", response.text)

if __name__ == "__main__":
    fetch_search_video("quebec")
