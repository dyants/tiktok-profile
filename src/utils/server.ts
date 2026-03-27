import express, { Request, Response } from "express";
import path from "path";
import { scrapeProfile } from "../pages/index";
import { config } from "../environment/config";

// import puppeteer library
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

puppeteer.use(StealthPlugin());

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "../../public")));

app.get("/api/profile", async (req: Request, res: Response) => {
  try {
    const username = req.query.username as string;

    if (!username) {
      return res.status(400).json({ error: "Username Required" });
    }

    // Launch browser for each request - or consider managing a browser instance globally if high traffic
    const userDataDir = `/tmp/chrome-user-data-${Math.floor(
      Math.random() * 100000,
    )}`;
    const args = [
      `--user-agent=${config.user_agent}`,
      " --disable-background-timer-throttling",
      " --disable-backgrounding-occluded-windows",
      " --disable-renderer-backgrounding",
      `--user-data-dir=${userDataDir}`,
      " --no-sandbox",
      " --disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-blink-features=AutomationControlled",
      "--lang=en-US,en",
      "--window-size=1920,1080",
    ];

    // https://dashboard.webshare.io/
    // pilih proxy secara random dari config
    const proxies = config.proxies;
    let proxyServer: string | null = null;
    let proxyAuth: { username: string; password: string } | null = null;

    if (proxies.length > 0) {
      const proxyUrl = proxies[Math.floor(Math.random() * proxies.length)];
      try {
        const parsed = new URL(proxyUrl);
        // Chromium hanya menerima protocol://host:port (tanpa credentials)
        proxyServer = `${parsed.protocol}//${parsed.hostname}:${parsed.port}`;
        if (parsed.username && parsed.password) {
          proxyAuth = {
            username: decodeURIComponent(parsed.username),
            password: decodeURIComponent(parsed.password),
          };
        }
        console.log(`// Using proxy: ${proxyServer}`);
      } catch {
        console.error(`// Invalid proxy URL: ${proxyUrl}`);
      }
    }

    const browser = await puppeteer.launch({
      headless: config.headless,
      devtools: config.devtools,
      args: proxyServer ? [...args, `--proxy-server=${proxyServer}`] : args,
    });

    try {
      const data = await scrapeProfile(browser, username, proxyAuth);
      await browser.close();
      res.json(data);
    } catch (error) {
      await browser.close();
      if (error instanceof Error) {
        res.status(500).json({ error: error.message });
      } else {
        res
          .status(500)
          .json({ error: "An unknown error occurred during scraping." });
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: "An unknown error occurred." });
    }
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
