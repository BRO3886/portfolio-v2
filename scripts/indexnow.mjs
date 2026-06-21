#!/usr/bin/env node
// IndexNow submission script for sidv.dev
// Usage:
//   node scripts/indexnow.mjs               — submit all URLs from sitemap
//   node scripts/indexnow.mjs <url> [...]   — submit specific URLs only

const HOST = "sidv.dev";
const KEY = "85b9b886157bfea1cf85c8b64bbf7705";
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;
const SITEMAP_INDEX = `https://${HOST}/sitemap-index.xml`;
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

function extractLocs(xml) {
  const matches = [];
  const re = /<loc>\s*(https?:\/\/[^\s<]+)\s*<\/loc>/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    matches.push(m[1].trim());
  }
  return matches;
}

async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: HTTP ${res.status}`);
  }
  return res.text();
}

async function collectSitemapUrls() {
  console.log(`Fetching sitemap index: ${SITEMAP_INDEX}`);
  const indexXml = await fetchText(SITEMAP_INDEX);
  const childSitemaps = extractLocs(indexXml);

  if (childSitemaps.length === 0) {
    throw new Error("No child sitemaps found in sitemap index.");
  }

  console.log(`Found ${childSitemaps.length} child sitemap(s): ${childSitemaps.join(", ")}`);

  const allUrls = new Set();
  for (const sitemapUrl of childSitemaps) {
    console.log(`Fetching child sitemap: ${sitemapUrl}`);
    const xml = await fetchText(sitemapUrl);
    for (const loc of extractLocs(xml)) {
      allUrls.add(loc);
    }
  }

  return [...allUrls];
}

function validateUrls(urls) {
  const invalid = urls.filter((u) => {
    try {
      return new URL(u).hostname !== HOST;
    } catch {
      return true;
    }
  });
  if (invalid.length > 0) {
    throw new Error(`URLs with unexpected host (expected ${HOST}):\n  ${invalid.join("\n  ")}`);
  }
}

async function submit(urlList) {
  const payload = {
    host: HOST,
    key: KEY,
    keyLocation: KEY_LOCATION,
    urlList,
  };

  console.log(`\nSubmitting ${urlList.length} URL(s) to IndexNow...`);

  const res = await fetch(INDEXNOW_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(payload),
  });

  if (res.status === 200 || res.status === 202) {
    console.log(`Success (HTTP ${res.status}). IndexNow submission accepted.`);
    return;
  }

  let hint = "";
  if (res.status === 403) {
    hint = `\nHint: HTTP 403 means the key file is unreachable or its contents are wrong.\n` +
      `Confirm the key file is deployed and accessible:\n  ${KEY_LOCATION}`;
  }

  const body = await res.text().catch(() => "");
  console.error(`IndexNow submission failed: HTTP ${res.status}${body ? `\n${body}` : ""}${hint}`);
  process.exit(1);
}

async function main() {
  const cliUrls = process.argv.slice(2);

  let urlList;
  if (cliUrls.length > 0) {
    console.log(`Submitting ${cliUrls.length} explicitly provided URL(s).`);
    urlList = cliUrls;
  } else {
    urlList = await collectSitemapUrls();
    console.log(`Collected ${urlList.length} URL(s) from sitemap.`);
  }

  validateUrls(urlList);
  console.log("URLs to submit:");
  for (const u of urlList) {
    console.log(`  ${u}`);
  }

  await submit(urlList);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
