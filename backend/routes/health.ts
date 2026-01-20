import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
  // Return explicit JSON and 200 OK
  res.status(200).json({ status: "ok", uptime: process.uptime() });
});

export default router;
