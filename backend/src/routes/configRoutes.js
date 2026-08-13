import express from "express";

const router = express.Router();

router.get("/public", (_req, res) => {
  res.json({
    googleClientId: process.env.GOOGLE_CLIENT_ID || "",
    githubClientId: process.env.GITHUB_CLIENT_ID || "",
  });
});

export default router;
