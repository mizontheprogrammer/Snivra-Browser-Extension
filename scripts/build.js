"use strict";

const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const source = path.join(root, "src");
const target = path.join(root, "dist", "snivra-browser-extension");

fs.rmSync(target, { recursive: true, force: true });
fs.cpSync(source, target, { recursive: true });

copy("node_modules/tesseract.js/dist/tesseract.min.js", "vendor/tesseract.min.js");
copy("node_modules/tesseract.js/dist/worker.min.js", "vendor/worker.min.js");
copy("node_modules/tesseract.js-core/tesseract-core-simd-lstm.wasm.js", "vendor/tesseract-core-simd-lstm.wasm.js");
copy("node_modules/tesseract.js-core/tesseract-core-simd-lstm.wasm", "vendor/tesseract-core-simd-lstm.wasm");
copy("node_modules/@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz", "vendor/lang-data/eng.traineddata.gz");

console.log(`Snivra Browser Extension built at ${target}`);

function copy(from, to) {
  const sourcePath = path.join(root, from);
  const targetPath = path.join(target, to);
  if (!fs.existsSync(sourcePath)) throw new Error(`Missing build dependency: ${sourcePath}`);
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.copyFileSync(sourcePath, targetPath);
}
