# Security

## Security model

- Chrome Manifest V3
- No website, active-tab, background, history, download, or storage permissions
- Only clipboard read/write permissions
- No remote scripts or remote executable code
- Same-extension worker policy
- Tesseract blob-worker wrapper disabled for Manifest V3 compatibility
- Locally bundled OCR worker, WebAssembly core, and English language data
- Accepted image types restricted to PNG, JPEG, and WebP
- Maximum input size of 25 MB

## Reporting a vulnerability

Open a private GitHub security advisory for this repository. Do not attach personal screenshots, clipboard contents, or recognized text. Use synthetic test images when possible.
