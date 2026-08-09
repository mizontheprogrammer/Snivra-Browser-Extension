"use strict";

const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const root = path.join(__dirname, "..", "src");
const html = fs.readFileSync(path.join(root, "popup.html"), "utf8");
const script = fs.readFileSync(path.join(root, "popup.js"), "utf8");

test("contains paste, file, OCR, copy, and download controls", () => {
  for (const id of ["paste-image", "image-file", "drop-zone", "result", "copy", "download"]) {
    assert.match(html, new RegExp(`id=["']${id}["']`));
  }
  assert.match(script, /navigator\.clipboard\.read\(\)/);
  assert.match(script, /addEventListener\(["']paste["']/);
  assert.match(script, /worker\.recognize\(file\)/);
});

test("uses a direct worker and contains no webpage capture code", () => {
  assert.match(script, /workerBlobURL:\s*false/);
  assert.doesNotMatch(html + script, /captureVisibleTab|activeTab|content_scripts/);
});
