import asyncio
import os
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from typing import List, Optional
from browser_use import Agent, Browser, Controller
from langchain_openai import ChatOpenAI

load_dotenv()


class Trend(BaseModel):
    title: str
    description: str


class TrendList(BaseModel):
    trends: List[Trend]


async def main():
    llm = ChatOpenAI(
        model="deepseek-chat",
        api_key=os.getenv("DEEPSEEK_API_KEY"),
        base_url="https://api.deepseek.com",
        temperature=0.0,
    )

    # Relax Pydantic validation
    llm.model_config["extra"] = "allow"
    object.__setattr__(llm, "provider", "openai")
    object.__setattr__(llm, "model_name", "deepseek-chat")

    browser = Browser(headless=True)
    agent = Agent(
        task="Find 1 trending topic on Montreal Gazette and return as JSON",
        llm=llm,
        browser=browser,
        result_type=TrendList,
    )

    history = await agent.run()
    result = history.final_result()
    print(f"Result type: {type(result)}")
    print(f"Result: {result}")

    await browser.close()


if __name__ == "__main__":
    asyncio.run(main())
