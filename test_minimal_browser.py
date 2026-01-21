import asyncio
from browser_use import Agent, Browser
from langchain_openai import ChatOpenAI
import os
from dotenv import load_dotenv

load_dotenv()

async def main():
    print("Testing minimal browser-use...")
    llm = ChatOpenAI(
        model="deepseek-chat",
        api_key=os.getenv("DEEPSEEK_API_KEY"),
        base_url="https://api.deepseek.com",
    )
    print("Initializing Browser (headless=True)...")
    try:
        browser = Browser(headless=True)
        print("Browser instance created.")
        
        print("Creating Agent...")
        agent = Agent(task="Wait 2 seconds then say hello", llm=llm, browser=browser)
        print("Agent created. Starting run...")
        
        result = await agent.run()
        print("Result:", result.final_result())
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
