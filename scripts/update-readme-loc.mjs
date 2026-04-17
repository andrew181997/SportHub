import { promises as fs } from "node:fs";
import path from "node:path";

const ROOT_DIR = process.cwd();
const README_PATH = path.join(ROOT_DIR, "README.md");

const INCLUDE_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".json",
  ".css",
  ".scss",
  ".sql",
  ".prisma",
  ".sh",
  ".yml",
  ".yaml",
]);

const EXCLUDE_DIRS = new Set([
  ".git",
  "node_modules",
  ".next",
  "dist",
  "coverage",
  "out",
  ".vercel",
  ".turbo",
]);

const START_MARKER = "<!-- LOC_STATS_START -->";
const END_MARKER = "<!-- LOC_STATS_END -->";

async function walkDirectory(dirPath, files = []) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      if (EXCLUDE_DIRS.has(entry.name)) {
        continue;
      }

      await walkDirectory(fullPath, files);
      continue;
    }

    const ext = path.extname(entry.name);
    if (INCLUDE_EXTENSIONS.has(ext)) {
      files.push(fullPath);
    }
  }

  return files;
}

function countLines(content) {
  if (!content) {
    return 0;
  }

  return content.split(/\r?\n/).length;
}

function formatNumber(value) {
  return new Intl.NumberFormat("ru-RU").format(value);
}

function buildStatsBlock(stats) {
  const generatedAt = new Date().toISOString();
  const rows = Object.entries(stats.byExtension)
    .sort((a, b) => b[1] - a[1])
    .map(([extension, lines]) => `| \`${extension}\` | ${formatNumber(lines)} |`)
    .join("\n");

  return [
    START_MARKER,
    "### Строки кода (автообновление)",
    "",
    `- Обновлено: \`${generatedAt}\``,
    `- Файлов в расчёте: **${formatNumber(stats.fileCount)}**`,
    `- Всего строк кода: **${formatNumber(stats.totalLines)}**`,
    "",
    "| Расширение | Строк |",
    "|---|---:|",
    rows || "| _нет данных_ | 0 |",
    END_MARKER,
  ].join("\n");
}

async function updateReadme() {
  const files = await walkDirectory(ROOT_DIR);

  const byExtension = {};
  let totalLines = 0;

  for (const filePath of files) {
    const ext = path.extname(filePath);
    const content = await fs.readFile(filePath, "utf8");
    const lines = countLines(content);

    byExtension[ext] = (byExtension[ext] ?? 0) + lines;
    totalLines += lines;
  }

  const stats = {
    byExtension,
    totalLines,
    fileCount: files.length,
  };

  const readme = await fs.readFile(README_PATH, "utf8");
  const statsBlock = buildStatsBlock(stats);
  const markerRegex = new RegExp(
    `${START_MARKER}[\\s\\S]*?${END_MARKER}`,
    "m",
  );

  let updatedReadme;

  if (markerRegex.test(readme)) {
    updatedReadme = readme.replace(markerRegex, statsBlock);
  } else {
    updatedReadme = `${readme.trimEnd()}\n\n---\n\n${statsBlock}\n`;
  }

  await fs.writeFile(README_PATH, updatedReadme, "utf8");

  console.log(
    `README updated: ${formatNumber(stats.totalLines)} lines across ${formatNumber(stats.fileCount)} files.`,
  );
}

updateReadme().catch((error) => {
  console.error("Failed to update README LOC stats:", error);
  process.exitCode = 1;
});
