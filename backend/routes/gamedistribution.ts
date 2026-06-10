import { Router } from "express";
import axios from "axios";

const router = Router();

router.get("/rss", async (req, res) => {
  try {
    // Fetch high-quality Action, Racing, and Shooter games
    const url = "https://catalog.api.gamedistribution.com/api/v2.0/rss/All/?collection=all&categories=Action,Racing,Shooter&type=html5&amount=12&page=1&format=json";
    const response = await axios.get(url, { timeout: 8000 });
    res.json(response.data);
  } catch (error: any) {
    console.error("GameDistribution Proxy Error:", error.message);
    
    // Fallback data in case the API hangs or fails
    res.json([
      {
        Title: "Spot Differences",
        Md5: "079bd6ba427749a3bd1bae2c9c17c566",
        Description: "Spot Differences: Bird Adventure",
        Url: "https://html5.gamedistribution.com/079bd6ba427749a3bd1bae2c9c17c566/",
        Asset: ["https://img.gamedistribution.com/079bd6ba427749a3bd1bae2c9c17c566-512x384.jpg"],
        Category: ["Puzzle"]
      },
      {
        Title: "SKYHILL",
        Md5: "2f6ba268fd224e13b30c2b22bdd65606",
        Description: "Escape From the Skyscraper!",
        Url: "https://html5.gamedistribution.com/2f6ba268fd224e13b30c2b22bdd65606/",
        Asset: ["https://img.gamedistribution.com/2f6ba268fd224e13b30c2b22bdd65606-512x384.jpg"],
        Category: ["Adventure"]
      },
      {
        Title: "Football Superstars 2026",
        Md5: "dba31dd236944415a71960309ff0d1c3",
        Description: "Ready for your next football challenge?",
        Url: "https://html5.gamedistribution.com/dba31dd236944415a71960309ff0d1c3/",
        Asset: ["https://img.gamedistribution.com/dba31dd236944415a71960309ff0d1c3-512x384.jpg"],
        Category: ["Football"]
      },
      {
        Title: "Bubble Blasters",
        Md5: "5d8d11e9919245939a57378a02b8fc8b",
        Description: "Bubble Blasters is a colorful side-scrolling adventure",
        Url: "https://html5.gamedistribution.com/5d8d11e9919245939a57378a02b8fc8b/",
        Asset: ["https://img.gamedistribution.com/5d8d11e9919245939a57378a02b8fc8b-512x384.jpg"],
        Category: ["Adventure"]
      }
    ]);
  }
});

export default router;
