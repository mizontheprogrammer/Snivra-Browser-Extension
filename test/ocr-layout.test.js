"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { normalizeLine, chooseOptionRecognition, assembleLines } = require("../src/ocr-layout");

test("repairs quiz option labels and common operator OCR errors", () => {
  assert.equal(normalizeLine("a. l="), "a. /=");
  assert.equal(normalizeLine("b. //"), "b. //");
  assert.equal(normalizeLine("c= /"), "c. =/");
  assert.equal(normalizeLine("d ??"), "d. ??");
  assert.equal(normalizeLine("b. 1?72/"), "b. /??/");
  assert.equal(normalizeLine("C. 7><?"), `c. ${["?", ">", "<", "?"].join("")}`);
  assert.equal(normalizeLine("d.<??>"), "d. <??>");
});

test("preserves one visual line per output line and paragraph gaps", () => {
  const text = assembleLines([
    { text: "1 Symbol for Division-assignment", height: 12, gapBefore: 0 },
    { text: "a. l=", height: 9, gapBefore: 5 },
    { text: "b. //", height: 9, gapBefore: 6 },
    { text: "2 All php scripts must enclosed with", height: 12, gapBefore: 23 },
    { text: "a?", height: 9, gapBefore: 5 }
  ]);

  assert.equal(text, [
    "1. Symbol for Division-assignment",
    "a. /=",
    "b. //",
    "",
    "2. All php scripts must enclosed with",
    "a. ??"
  ].join("\n"));
});

test("uses symbol OCR and restores option labels in visual order", () => {
  assert.equal(chooseOptionRecognition("al", "a. /="), "a. /=");
  assert.equal(chooseOptionRecognition("bl", "b. //"), "b. //");

  const text = assembleLines([
    { text: "1. Operators", height: 12, gapBefore: 0 },
    { text: "a. /=", height: 9, gapBefore: 4 },
    { text: "b. //", height: 9, gapBefore: 4 },
    { text: "c. =/", height: 9, gapBefore: 4 },
    { text: "a. ??", height: 9, gapBefore: 4 }
  ]);

  assert.equal(text, ["1. Operators", "a. /=", "b. //", "c. =/", "d. ??"].join("\n"));
});
