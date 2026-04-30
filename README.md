# GifCap React

A client-side screen recording to GIF converter built with React, TypeScript, and Vite.

## Features

- **Screen Recording** — Capture any window, tab, or entire screen using the browser's Screen Capture API
- **Frame Rate Control** — Choose between 5, 10, 15, 20, or 30 FPS
- **Trim** — Interactive dual-handle slider to select the exact portion to export
- **Crop** — Drag to select a crop region on the preview canvas
- **Live Preview** — Animated preview of the trimmed frames before export
- **GIF Encoding** — Client-side GIF generation via gif.js with Web Worker support
- **Download** — One-click download of the generated GIF
- **100% Client-Side** — No server, no uploads. All processing happens in your browser

## Tech Stack

- **React 18** with TypeScript
- **Vite** for build tooling
- **gif.js** for GIF encoding (Web Workers + WASM)
- **Screen Capture API** (`getDisplayMedia`) for recording

## Getting Started

### Prerequisites

- Node.js 18+

### Install Dependencies

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
```

Output is in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## How It Works

1. **Record** — Click "Start Recording" and select a screen/window/tab in the browser dialog
2. **Stop** — Click the "Stop Recording" button when done
3. **Trim** — Drag the two handles on the slider to select the portion to export
4. **Crop** (optional) — Click "Select Crop Region" and drag on the preview to select an area
5. **Generate** — Click "Generate GIF" to encode the selected frames
6. **Download** — Click "Download GIF" to save the file

## Project Structure

```
src/
├── components/
│   ├── Recorder.tsx/css     # Screen recording UI
│   ├── Preview.tsx/css      # Frame preview, trim, crop, export
│   └── RangeSlider.tsx/css  # Dual-handle trim slider
├── hooks/
│   └── useScreenCapture.ts  # getDisplayMedia + canvas frame capture
├── utils/
│   └── gifEncoder.ts       # GIF encoding via gif.js
├── types.ts                  # TypeScript type definitions
├── App.tsx / App.css
├── main.tsx
└── index.css
```

## Browser Support

Requires a modern browser with support for:

- `getDisplayMedia` (Screen Capture API)
- Canvas API
- Web Workers

Chrome, Firefox, Edge, and Safari (latest versions) are supported.

## License

MIT
