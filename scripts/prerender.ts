import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const API_URL = process.env.VITE_API_URL || "https://hub.cm-ss13.com";
const DIST_DIR = "dist";
const SITE_URL = process.env.SITE_URL || "https://hub.cm-ss13.com";

type GameServer = {
  address: string;
  name: string;
  status: string;
  players: number;
  online: boolean;
};

async function fetchServers(): Promise<GameServer[]> {
  const response = await fetch(`${API_URL}/servers`);
  if (!response.ok) {
    throw new Error(`Failed to fetch servers: ${response.status}`);
  }
  return response.json();
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function generateMetaTags(server: GameServer): string {
  const title = escapeHtml(server.name);
  const description = server.online
    ? `${server.players} players online`
    : "Server offline";
  const [ip, port] = server.address.split(":");
  const url = `${SITE_URL}/s/${ip}/${port}`;

  return `
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${title} - SS13 Hub" />
    <meta property="og:description" content="${description}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:site_name" content="SS13 Hub" />
    <meta property="og:image" content="/ss13.png" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="${title} - SS13 Hub" />
    <meta name="twitter:description" content="${description}" />
    <meta name="description" content="${description}" />`;
}

function stripDefaultMetaTags(html: string): string {
  return html
    .replace(/<meta\s+property="og:[^"]*"\s+content="[^"]*"\s*\/?\s*>\s*/g, "")
    .replace(/<meta\s+name="twitter:[^"]*"\s+content="[^"]*"\s*\/?\s*>\s*/g, "")
    .replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/?\s*>\s*/g, "");
}

function generateServerHtml(
  templateHtml: string,
  server: GameServer,
): string {
  const metaTags = generateMetaTags(server);
  const title = `${escapeHtml(server.name)} - SS13 Hub`;

  const strippedHtml = stripDefaultMetaTags(templateHtml);
  return strippedHtml
    .replace("<title>SS13 Hub</title>", `<title>${title}</title>${metaTags}`);
}

async function main() {
  console.log("Fetching servers from API...");

  let servers: GameServer[];
  try {
    servers = await fetchServers();
  } catch (error) {
    console.warn("Warning: Could not fetch servers from API:", error instanceof Error ? error.message : error);
    console.warn("Skipping server page pre-rendering. Pages will still work via client-side routing.");
    return;
  }

  console.log(`Found ${servers.length} servers`);

  const templatePath = join(DIST_DIR, "index.html");
  if (!existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}. Run 'vite build' first.`);
  }

  const templateHtml = readFileSync(templatePath, "utf-8");

  let generated = 0;
  for (const server of servers) {
    const [ip, port] = server.address.split(":");
    const serverDir = join(DIST_DIR, "s", ip, port);

    mkdirSync(serverDir, { recursive: true });

    const html = generateServerHtml(templateHtml, server);
    const outputPath = join(serverDir, "index.html");
    writeFileSync(outputPath, html);
    generated++;
  }

  console.log(`Generated ${generated} server pages`);

  const statsDir = join(DIST_DIR, "stats");
  mkdirSync(statsDir, { recursive: true });
  const strippedTemplate = stripDefaultMetaTags(templateHtml);
  const statsHtml = strippedTemplate.replace(
    "<title>SS13 Hub</title>",
    `<title>Global Statistics - SS13 Hub</title>
    <meta property="og:type" content="website" />
    <meta property="og:title" content="Global Statistics - SS13 Hub" />
    <meta property="og:description" content="Player statistics across all SS13 servers" />
    <meta property="og:url" content="${SITE_URL}/stats" />
    <meta property="og:image" content="/ss13.png" />
    <meta property="og:site_name" content="SS13 Hub" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="Global Statistics - SS13 Hub" />
    <meta name="twitter:description" content="Player statistics across all SS13 servers" />
    <meta name="description" content="Player statistics across all SS13 servers" />`
  );
  writeFileSync(join(statsDir, "index.html"), statsHtml);
  console.log("Generated stats page");

  console.log("Pre-rendering complete!");
}

main().catch((error) => {
  console.error("Pre-render failed:", error);
  process.exit(1);
});
