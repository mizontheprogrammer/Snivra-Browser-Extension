(function exposeSnivraOcr(root) {
  "use strict";

  function normalizeLine(rawLine) {
    let line = String(rawLine || "").replace(/\s+/g, " ").trim();
    if (!line) return "";

    line = line.replace(/^(\d+)\s*[.)]?\s+/, "$1. ");

    const option = line.match(/^([a-dA-D])\s*[.)]?\s*(.*)$/);
    if (option) {
      let answer = option[2].trim();
      if (isSymbolAnswer(answer)) answer = repairSymbolAnswer(answer);
      line = `${option[1].toLowerCase()}. ${answer}`.trimEnd();
    }

    return line;
  }

  function isSymbolAnswer(value) {
    const compact = value.replace(/\s/g, "");
    return compact.length > 0
      && compact.length <= 8
      && /[?/=<>!|]/.test(compact)
      && /^[lI1i7Z2?/=<>!|.'"“”‘’]+$/.test(compact);
  }

  function repairSymbolAnswer(value) {
    let answer = value.replace(/\s/g, "")
      .replace(/[“”‘’'"`]/g, "?")
      .replace(/[lIi1]/g, "/")
      .replace(/[7Z2]/g, "?");
    answer = answer.replace(/\/\?{3,}\//g, "/??/");
    if (answer === "?") answer = "??";
    return answer;
  }

  function looksLikeOptionLine(value) {
    const compact = String(value || "").replace(/\s/g, "");
    return compact.length > 0
      && compact.length <= 12
      && (/^[a-dA-D]/.test(compact) || /^[?/=<>!|.'"]+$/.test(compact));
  }

  function chooseOptionRecognition(primary, symbols) {
    const choices = [primary, symbols].map((value) => String(value || "").trim()).filter(Boolean);
    if (!choices.length) return "";
    return choices.sort((left, right) => optionScore(right) - optionScore(left))[0];
  }

  function optionScore(value) {
    const compact = value.replace(/\s/g, "");
    const answer = compact.replace(/^[a-dA-D][.)]?/, "");
    const symbolCount = (answer.match(/[?/=<>!|.]/g) || []).length;
    const letterCount = (answer.match(/[a-z]/gi) || []).length;
    return (/^[a-dA-D]/.test(compact) ? 5 : 0) + symbolCount * 4 - letterCount * 3;
  }

  function assembleLines(lines) {
    if (!Array.isArray(lines) || lines.length === 0) return "";
    const heights = lines.map((line) => Number(line.height) || 0).filter((height) => height > 0).sort((a, b) => a - b);
    const medianHeight = heights.length ? heights[Math.floor(heights.length / 2)] : 12;
    const paragraphGap = Math.max(14, medianHeight * 1.35);
    const output = [];
    let expectedOption = null;

    for (let index = 0; index < lines.length; index += 1) {
      let text = normalizeLine(lines[index].text);
      if (!text) continue;
      if (/^\d+\.\s/.test(text)) expectedOption = 0;
      else if (expectedOption !== null && expectedOption < 4 && looksLikeOptionLine(lines[index].text)) {
        const rawAnswer = text.replace(/^[a-d]\.\s*/i, "");
        text = `${String.fromCharCode(97 + expectedOption)}. ${repairSymbolAnswer(rawAnswer)}`.trimEnd();
        expectedOption += 1;
      } else if (expectedOption !== null) {
        expectedOption = null;
      }
      if (output.length && Number(lines[index].gapBefore) > paragraphGap) output.push("");
      output.push(text);
    }
    return output.join("\n").trim();
  }

  async function prepareLineImages(file) {
    const image = await loadImage(file);
    const analysis = document.createElement("canvas");
    analysis.width = image.width;
    analysis.height = image.height;
    const context = analysis.getContext("2d", { willReadFrequently: true });
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, analysis.width, analysis.height);
    context.drawImage(image, 0, 0);
    if (typeof image.close === "function") image.close();

    const pixels = context.getImageData(0, 0, analysis.width, analysis.height);
    const runs = findTextRows(pixels);
    if (runs.length < 2 || runs.length > 160) return [];

    let previousBottom = -1;
    return runs.map((run) => {
      const bounds = findHorizontalBounds(pixels, run);
      const padX = 7;
      const padY = 3;
      const x = Math.max(0, bounds.left - padX);
      const y = Math.max(0, run.top - padY);
      const width = Math.min(analysis.width - x, bounds.right - bounds.left + 1 + padX * 2);
      const height = Math.min(analysis.height - y, run.bottom - run.top + 1 + padY * 2);
      const scale = Math.max(3, Math.min(5, Math.ceil(52 / height)));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, width * scale);
      canvas.height = Math.max(1, height * scale);
      const lineContext = canvas.getContext("2d");
      lineContext.fillStyle = "#ffffff";
      lineContext.fillRect(0, 0, canvas.width, canvas.height);
      lineContext.imageSmoothingEnabled = true;
      lineContext.imageSmoothingQuality = "high";
      lineContext.drawImage(analysis, x, y, width, height, 0, 0, canvas.width, canvas.height);
      const gapBefore = previousBottom < 0 ? 0 : run.top - previousBottom - 1;
      previousBottom = run.bottom;
      return { canvas, gapBefore, height: run.bottom - run.top + 1 };
    });
  }

  function findTextRows(imageData) {
    const { data, width, height } = imageData;
    const active = new Array(height).fill(false);
    for (let y = 0; y < height; y += 1) {
      let ink = 0;
      for (let x = 0; x < width; x += 2) {
        const offset = (y * width + x) * 4;
        if (data[offset + 3] > 40 && luminance(data, offset) < 205) ink += 1;
      }
      active[y] = ink >= 1;
    }

    const runs = [];
    let start = -1;
    for (let y = 0; y <= height; y += 1) {
      if (y < height && active[y] && start < 0) start = y;
      if ((y === height || !active[y]) && start >= 0) {
        const bottom = y - 1;
        if (bottom - start >= 2) runs.push({ top: start, bottom });
        start = -1;
      }
    }
    return runs;
  }

  function findHorizontalBounds(imageData, run) {
    const { data, width } = imageData;
    let left = width - 1;
    let right = 0;
    for (let y = run.top; y <= run.bottom; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const offset = (y * width + x) * 4;
        if (data[offset + 3] > 40 && luminance(data, offset) < 215) {
          left = Math.min(left, x);
          right = Math.max(right, x);
        }
      }
    }
    return right >= left ? { left, right } : { left: 0, right: width - 1 };
  }

  function luminance(data, offset) {
    return data[offset] * 0.2126 + data[offset + 1] * 0.7152 + data[offset + 2] * 0.0722;
  }

  async function loadImage(file) {
    if (typeof createImageBitmap === "function") return createImageBitmap(file);
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const image = new Image();
      image.onload = () => {
        URL.revokeObjectURL(url);
        resolve(image);
      };
      image.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("The screenshot could not be opened."));
      };
      image.src = url;
    });
  }

  const api = { normalizeLine, repairSymbolAnswer, looksLikeOptionLine, chooseOptionRecognition, assembleLines, prepareLineImages };
  root.SnivraOcr = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
