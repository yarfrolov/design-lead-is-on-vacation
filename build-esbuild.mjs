import * as esbuild from "esbuild";
import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

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
      plugins: [inlineUiHtmlPlugin()],
    }),
  ]);
}
