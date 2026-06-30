import * as esbuild from "esbuild";
import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnvFile() {
  const env = {};
  try {
    const content = readFileSync(join(__dirname, ".env"), "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      env[key] = value;
    }
  } catch {
    // .env is optional — settings can be entered in the plugin UI.
  }
  return env;
}

const env = loadEnvFile();

function loadLoaderVideoDataUrl() {
  try {
    const bytes = readFileSync(join(__dirname, "assets/loader.webm"));
    return `data:video/webm;base64,${bytes.toString("base64")}`;
  } catch {
    return "";
  }
}

const llmDefines = {
  __LLM_API_URL__: JSON.stringify(env.LLM_API_URL ?? ""),
  __LLM_TOKEN__: JSON.stringify(env.LLM_TOKEN ?? ""),
  __LLM_MODEL__: JSON.stringify(env.LLM_MODEL ?? "gemma27b"),
  __LOADER_VIDEO_DATA_URL__: JSON.stringify(loadLoaderVideoDataUrl()),
};

const commonOptions = {
  bundle: true,
  platform: "browser",
  format: "iife",
  target: ["es2019"],
};

function writeUiHtml() {
  const uiJs = readFileSync(join(__dirname, "ui.js"), "utf8");
  const uiCss = readFileSync(join(__dirname, "ui.css"), "utf8");
  const safeJs = uiJs.replace(/<\/script>/gi, "<\\/script>");

  const html = `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8"/>
  <title>Design Lead is on vacation</title>
  <style>${uiCss}</style>
</head>
<body>
  <div id="app">
    <div id="mode-content"></div>
  </div>
  <script>${safeJs}</script>
</body>
</html>`;

  writeFileSync(join(__dirname, "ui.html"), html);
}

function inlineUiHtmlPlugin() {
  return {
    name: "inline-ui-html",
    setup(build) {
      build.onEnd((result) => {
        if (result.errors.length === 0) writeUiHtml();
      });
    },
  };
}

const watch = process.argv.includes("--watch");
const buildOptions = { ...commonOptions, minify: false, legalComments: "eof" };

if (watch) {
  const codeCtx = await esbuild.context({
    ...buildOptions,
    entryPoints: [join(__dirname, "code.ts")],
    outfile: join(__dirname, "code.js"),
  });
  const uiCtx = await esbuild.context({
    ...buildOptions,
    entryPoints: [join(__dirname, "ui.ts")],
    outfile: join(__dirname, "ui.js"),
    define: llmDefines,
    plugins: [inlineUiHtmlPlugin()],
  });
  await Promise.all([codeCtx.watch(), uiCtx.watch()]);
  writeUiHtml();
} else {
  await Promise.all([
    esbuild.build({
      ...buildOptions,
      entryPoints: [join(__dirname, "code.ts")],
      outfile: join(__dirname, "code.js"),
    }),
    esbuild.build({
      ...buildOptions,
      entryPoints: [join(__dirname, "ui.ts")],
      outfile: join(__dirname, "ui.js"),
      define: llmDefines,
      plugins: [inlineUiHtmlPlugin()],
    }),
  ]);
}
