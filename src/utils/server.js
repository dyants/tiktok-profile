import express from "express";
import { scrapeUser } from "./build/index.js";

const app = express();
const port = 3000;

app.get("/api/profile", async (req, res) => {
  try {
    const username = req.query.username;

    if (!username) {
      return res.status(400).json({ error: "Username Required" });
    }

    const data = await scrapeUser(username); //letak fungsi scarpin

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.massage });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${port}`);
});
