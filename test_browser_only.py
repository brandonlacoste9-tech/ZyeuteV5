import asyncio
from browser_use import Browser
import os

async def main():
    print("Testing BROWSER ONLY (no LLM)...")
    try:
        browser = Browser(headless=True)
        print("Browser instance created.")
        # Minimal interactions usually require Agent, but we can check if it even starts
        print("Success! Browser can be instantiated.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
