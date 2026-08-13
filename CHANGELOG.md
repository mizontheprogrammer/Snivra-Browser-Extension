# Changelog

## 0.4.1

- Added a second symbol-only OCR pass for punctuation-heavy answers
- Restored multiple-choice labels in visual `a.` through `d.` order
- Added regression tests for missing periods and misread option labels
- Added a visual usage guide to the README

## 0.4.0

- Added layout-aware, per-line OCR for screenshots and quizzes
- Preserved question numbering, answer-option periods, wrapped lines, and paragraph spacing
- Added conservative correction for short code and operator answers
- Enlarged small text before recognition for improved punctuation accuracy

## 0.3.1

- Added copied-screenshot support through a Paste button and `Ctrl + V`
- Kept PNG, JPEG, and WebP file selection and drag-and-drop
- Added editable OCR results, clipboard copy, and `.txt` download
- Switched Tesseract to a direct extension-owned worker for Manifest V3 compatibility
- Reduced permissions to clipboard read and write only
