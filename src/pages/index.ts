import { promises } from "dns";
import { IQueueItem } from "../../types";
import { humanize } from "../utils";
import { config } from "./../environment/config";
import {
  usernameSelector,
  isVerifiedSelector,
  fullnameSelector,
  avatarUrlSelector,
  followingCountSelector,
  followersCountSelector,
  likesCountSelector,
  userBioSelector,
  externalUrlSelector,
  videosSelector,
} from "./userTemplate";
import { resolve } from "path";
import { setTimeout } from "timers";
import puppeteer from "puppeteer";

// scrape page details
async function scrapeTiktok(browser: any, queue: IQueueItem[]): Promise<void> {
  // Go through every item in the queue and open page in the browser
  while (queue.length > 0) {
    let queueItem: IQueueItem = queue.shift() as IQueueItem;
    console.log(queueItem);
    let identifier = queueItem.identifier;

    const data = await scrapeProfile(browser, identifier.identifier);

    console.log(`// Data: ${JSON.stringify(data, null, 2)}`);
  }

  await browser.close();
}

// helper: random delay
function randomDelay(min: number = 3000, max: number = 7000): Promise<void> {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, delay));
}

// scrape profile details
async function scrapeProfile(
  browser: any,
  username: string,
  proxyAuth: { username: string; password: string } | null = null,
): Promise<any> {
  let page = await browser.newPage();

  // Autentikasi proxy jika ada kredensial
  if (proxyAuth) {
    await page.authenticate(proxyAuth);
  }

  // Configure the navigation timeout & Interception request
  await page.setDefaultNavigationTimeout(config.timeout);

  let url = config.endpoint + "@" + username;
  console.log(`// Current Page URL: ${url}`);
  await randomDelay(config.min_delay, config.max_delay);
  await page.goto(url, { waitUntil: "networkidle2" });

  let data: any = {};

  // username
  let usernameText = await page.evaluate((selector: string) => {
    let text = document.querySelector(selector);
    if (text instanceof HTMLElement) {
      return text.innerText.trim();
    } else {
      return null;
    }
  }, usernameSelector);
  data.username = usernameText;

  // Verified
  data.is_verified = await page.evaluate((selector: string) => {
    return document.querySelectorAll(selector).length > 0;
  }, isVerifiedSelector);

  // Fullname
  let fullname = await page.evaluate((selector: string) => {
    let text = document.querySelector(selector);
    if (text instanceof HTMLElement) {
      return text.innerText.trim();
    } else {
      return null;
    }
  }, fullnameSelector);
  data.fullname = fullname;

  // Avatar link
  let avatarUrl = await page.evaluate((selector: string) => {
    let img = document.querySelector(selector);
    if (img instanceof HTMLImageElement) {
      return img.src;
    } else {
      return null;
    }
  }, avatarUrlSelector);
  data.avatar_url = avatarUrl;

  // Following Count
  let followings = await page.evaluate((selector: string) => {
    let img = document.querySelector(selector);
    if (img instanceof HTMLElement) {
      return img.innerText.trim();
    } else {
      return null;
    }
  }, followingCountSelector);
  data.followings = humanize(followings);

  // followers Count
  let followers = await page.evaluate((selector: string) => {
    let text = document.querySelector(selector);
    if (text instanceof HTMLElement) {
      return text.innerText.trim();
    } else {
      return null;
    }
  }, followersCountSelector);
  data.followers = humanize(followers);

  // likes Count
  let likes = await page.evaluate((selector: string) => {
    let text = document.querySelector(selector);
    if (text instanceof HTMLElement) {
      return text.innerText.trim();
    } else {
      return null;
    }
  }, likesCountSelector);
  data.likes = humanize(likes);

  let bio = await page.evaluate((selector: string) => {
    let text = document.querySelector(selector);
    if (text instanceof HTMLElement) {
      return text.innerText.trim();
    } else {
      return null;
    }
  }, userBioSelector);
  data.bio = bio;

  let externalLink = await page.evaluate((selector: string) => {
    let text = document.querySelector(selector);
    if (text instanceof HTMLElement) {
      return text.innerText.trim();
    } else {
      return null;
    }
  }, externalUrlSelector);
  data.external_url = externalLink;

  // videos
  let videos = await page.evaluate((selector: string) => {
    const allVideos = document.querySelectorAll(selector);

    return Array.from(allVideos)
      .map(function (item) {
        const videoLink = item?.querySelector("a");
        const videoViews = item?.querySelector(
          "strong[data-e2e='video-views']",
        );
        const videoPinned = item?.querySelector(
          "div[data-e2e='video-card-badge']",
        );
        const imgSrc = item?.querySelector("img");

        if (videoLink instanceof HTMLElement) {
          return {
            link: videoLink?.href,
            pic_url: imgSrc?.src,
            short_description: (imgSrc as HTMLImageElement)?.alt,
            views_count: (videoViews as HTMLElement)?.innerHTML,
            is_pinned: videoPinned?.innerHTML === "Pinned",
          };
        } else {
          return {};
        }
      })
      .filter(function (item) {
        return item.link != null;
      });
  }, videosSelector);
  data.videos = videos;

  await page.close();
  return data;
}

export { scrapeTiktok, scrapeProfile };
