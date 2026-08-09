# Privacy policy

Snivra Browser Extension is local-first.

## Data processing

- PNG, JPEG, and WebP screenshots are processed inside the extension popup.
- English OCR uses scripts, WebAssembly, and a language model bundled during the extension build.
- Screenshots and recognized text are not uploaded to Snivra or any third party.
- The extension does not save screenshots or recognized text to extension storage.

## Clipboard

- Clipboard image access occurs when the user selects **Paste screenshot**.
- Direct `Ctrl + V` uses the browser's normal paste event.
- Recognized text is written to the clipboard only when the user selects **Copy text**.
- Other applications on the device may be able to read clipboard contents.

## Network and tracking

Snivra has no accounts, analytics, advertising, telemetry, or remote executable code. The built extension does not require a network connection for OCR.

## Removing data

Close the extension popup to discard the selected screenshot and recognized text. Snivra does not maintain a capture history.
