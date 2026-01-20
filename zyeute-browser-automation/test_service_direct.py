import asyncio
import os
from zyeute_automation_service import browser_service

async def main():
    print("🧪 Testing Service Directly...")
    try:
        result = await browser_service.discover_quebec_trends(platform="google", region="montreal")
        print("Result:", result)
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
