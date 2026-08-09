"use strict";

const fileInput = document.querySelector("#image-file");
const picker = document.querySelector("#picker");
const pasteButton = document.querySelector("#paste-image");
const dropZone = document.querySelector("#drop-zone");
const dropHelp = dropZone.querySelector("small");
const workspace = document.querySelector("#workspace");
const preview = document.querySelector("#preview");
const fileName = document.querySelector("#file-name");
const confidence = document.querySelector("#confidence");
const message = document.querySelector("#message");
const progress = document.querySelector("#progress");
const output = document.querySelector("#result");
const copyButton = document.querySelector("#copy");
const downloadButton = document.querySelector("#download");
const newImageButton = document.querySelector("#new-image");
let previewUrl = "";
let worker = null;

pasteButton.addEventListener("click", pasteFromClipboard);

document.addEventListener("paste", (event) => {
  if (event.target === output) return;
  const item = Array.from(event.clipboardData && event.clipboardData.items || []).find((entry) => entry.kind === "file" && entry.type.startsWith("image/"));
  if (!item) {
    showUploadError("The clipboard does not contain a screenshot.");
    return;
  }
  event.preventDefault();
  const blob = item.getAsFile();
  if (blob) recognizeFile(asNamedFile(blob));
});

fileInput.addEventListener("change", () => {
  const file = fileInput.files && fileInput.files[0];
  if (file) recognizeFile(file);
});

for (const eventName of ["dragenter", "dragover"]) {
  dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropZone.classList.add("dragging");
  });
}

for (const eventName of ["dragleave", "drop"]) {
  dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropZone.classList.remove("dragging");
  });
}

dropZone.addEventListener("drop", (event) => {
  const file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
  if (file) recognizeFile(file);
});

newImageButton.addEventListener("click", reset);

copyButton.addEventListener("click", async () => {
  await navigator.clipboard.writeText(output.value);
  copyButton.textContent = "Copied";
  setTimeout(() => { copyButton.textContent = "Copy text"; }, 1200);
});

downloadButton.addEventListener("click", () => {
  const url = URL.createObjectURL(new Blob([output.value], { type: "text/plain;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${baseName(fileName.textContent) || "snivra-text"}.txt`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
});

async function recognizeFile(file) {
  if (!/^image\/(png|jpeg|webp)$/.test(file.type)) {
    showUploadError("Choose a PNG, JPEG, or WebP screenshot.");
    return;
  }
  if (file.size > 25 * 1024 * 1024) {
    showUploadError("Choose a screenshot smaller than 25 MB.");
    return;
  }

  setWorkspace(file);
  try {
    worker = await Tesseract.createWorker("eng", 1, {
      workerPath: chrome.runtime.getURL("vendor/worker.min.js"),
      workerBlobURL: false,
      corePath: chrome.runtime.getURL("vendor/tesseract-core-simd-lstm.wasm.js"),
      langPath: chrome.runtime.getURL("vendor/lang-data"),
      gzip: true,
      logger(update) {
        const value = Number.isFinite(update.progress) ? Math.round(update.progress * 100) : 0;
        progress.value = value;
        message.textContent = `${humanize(update.status)}${value ? ` ${value}%` : ""}`;
      }
    });
    const result = await worker.recognize(file);
    output.value = (result.data.text || "").trim();
    confidence.textContent = Number.isFinite(result.data.confidence) ? `${Math.round(result.data.confidence)}% OCR confidence` : "";
    message.textContent = output.value ? "Text is ready" : "No text was found";
    progress.value = 100;
    copyButton.disabled = !output.value;
    downloadButton.disabled = !output.value;
  } catch (error) {
    showResultError(error);
  } finally {
    if (worker) await worker.terminate().catch(() => {});
    worker = null;
  }
}

function setWorkspace(file) {
  dropHelp.textContent = "PNG, JPEG, or WebP · maximum 25 MB";
  dropHelp.style.color = "";
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = URL.createObjectURL(file);
  preview.src = previewUrl;
  fileName.textContent = file.name;
  confidence.textContent = "";
  output.value = "";
  message.textContent = "Preparing local OCR…";
  message.classList.remove("error");
  progress.value = 0;
  copyButton.disabled = true;
  downloadButton.disabled = true;
  picker.hidden = true;
  workspace.hidden = false;
}

function reset() {
  if (worker) return;
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = "";
  fileInput.value = "";
  output.value = "";
  workspace.hidden = true;
  picker.hidden = false;
}

async function pasteFromClipboard() {
  try {
    const items = await navigator.clipboard.read();
    for (const item of items) {
      const type = item.types.find((candidate) => /^image\/(png|jpeg|webp)$/.test(candidate));
      if (!type) continue;
      const blob = await item.getType(type);
      await recognizeFile(asNamedFile(blob));
      return;
    }
    showUploadError("The clipboard does not contain a PNG, JPEG, or WebP screenshot.");
  } catch (error) {
    showUploadError("Clipboard access was blocked. Press Ctrl + V or choose a screenshot file.");
  }
}

function asNamedFile(blob) {
  const extension = blob.type === "image/jpeg" ? "jpg" : blob.type.split("/")[1] || "png";
  return new File([blob], `pasted-screenshot.${extension}`, { type: blob.type });
}

function showUploadError(text) {
  dropHelp.textContent = text;
  dropHelp.style.color = "#b42318";
}

function showResultError(error) {
  message.textContent = String(error && error.message ? error.message : error);
  message.classList.add("error");
  progress.value = 0;
}

function humanize(value) {
  if (!value) return "Working";
  return value.charAt(0).toUpperCase() + value.slice(1).replaceAll("_", " ");
}

function baseName(name) {
  return name.replace(/\.[^.]+$/, "").replace(/[^a-z0-9_-]+/gi, "-");
}
