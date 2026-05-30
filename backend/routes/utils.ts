import { Router, Request, Response } from "express";
import { lookupWord } from "../utils/dictionary.js";

const router = Router();

// Dictionary lookup for Ti-Script
router.get("/dictionary/lookup/:word", async (req, res) => {
  try {
    const { word } = req.params;
    const result = await lookupWord(word);
    res.json(result);
  } catch (error: any) {
    console.error("Dictionary lookup error:", error);
    res.status(500).json({ error: "Failed to perform lookup" });
  }
});

export default router;
