"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const manifest = require("../src/manifest.json");

test("uses Manifest V3 with only clipboard permissions", () => {
  assert.equal(manifest.manifest_version, 3);
  assert.deepEqual(manifest.permissions, ["clipboardRead", "clipboardWrite"]);
  assert.equal(Object.hasOwn(manifest, "host_permissions"), false);
  assert.equal(Object.hasOwn(manifest, "background"), false);
  assert.equal(Object.hasOwn(manifest, "content_scripts"), false);
});

test("allows only bundled scripts and same-extension workers", () => {
  const policy = manifest.content_security_policy.extension_pages;
  assert.match(policy, /script-src 'self'/);
  assert.match(policy, /worker-src 'self'/);
  assert.doesNotMatch(policy, /https?:/);
});
