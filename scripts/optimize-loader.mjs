import { spawnSync } from "child_process";
import { existsSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import ffmpegPath from "ffmpeg-static";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const source =
  process.argv[2] ?? join(process.env.HOME ?? "", "Downloads/iridescence-1782847465325.webm");
const output = join(root, "assets/loader.webm");

if (!ffmpegPath) {
  console.error("ffmpeg-static binary not found");
  process.exit(1);
}

if (!existsSync(source)) {
  console.error(`Source video not found: ${source}`);
  process.exit(1);
}

mkdirSync(join(root, "assets"), { recursive: true });

const args = [
  "-y",
  "-i",
  source,
  "-an",
  "-vf",
  "scale=480:-2,fps=24",
  "-c:v",
  "libvpx-vp9",
  "-crf",
  "38",
  "-b:v",
  "0",
  "-row-mt",
  "1",
  "-cpu-used",
  "4",
  output,
];

const result = spawnSync(ffmpegPath, args, { stdio: "inherit" });
if (result.status !== 0) process.exit(result.status ?? 1);

console.log(`Optimized loader saved to ${output}`);
