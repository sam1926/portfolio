<!-- Copilot / AI contributor guidance for this project -->
# Quick instructions for AI contributors

This is a small static portfolio gallery built with vanilla HTML/CSS/JS and GSAP. The goal of this file is to give an AI coding agent the immediate, repository-specific knowledge it needs to be productive.

- Project type: static single-page site. No build step. Files of interest: `index.html`, `script.js`, `style.css`, `gsap-draggable-image-gallery.markdown`.
- Main runtime libraries: GSAP (plugins: Draggable, InertiaPlugin, CustomEase, Flip). These are used directly in `script.js` via `gsap.registerPlugin(...)`.

Key components (read `script.js`):
- PreloaderManager — creates and animates the fullscreen preloader (2s default). Look at `preloader.complete()` and the 2000ms startup delay in `DOMContentLoaded` to adjust timing.
- FashionGallery — central class that:
  - holds configuration: `config = { itemSize: 320, baseGap: 16, rows: 8, cols: 12, currentZoom: 0.6, currentGap: 32 }`;
  - generates grid items programmatically (`generateGridItems()`), uses `fashionImages` and `imageData` arrays for images/titles/descriptions;
  - manages zoom / split-screen UX via Flip, a scaling overlay and `.split-screen-container` DOM nodes;
  - handles dragging with GSAP Draggable and computes bounds in `calculateBounds()`;
  - implements keyboard shortcuts: keys `1`, `2`, `3` map to zoom levels (0.3, 0.6, 1.0) and `f` toggles fit-to-screen.

Project-specific conventions and patterns:
- No framework or bundler — modify `index.html` and `script.js` directly. If adding dependencies, update `index.html` to include the CDN script tags.
- Animation-first design: most state changes are done via GSAP timelines, Flip.fit, and CSS class toggles. When changing layout math (rows/cols/itemSize/gap) update both `script.js` (config and grid math) and `style.css` (`.grid-item` width/height and any hard-coded sizes like `image-title-overlay` widths).
- Text splitting: `splitTextIntoLines()` is a custom function in `script.js` (no SplitText plugin). Prefer reusing it when changing description rendering.
- Sound system: uses remote audio URLs and a toggled `soundSystem.enabled` flag. Audio errors are intentionally swallowed — changes to audio should respect existing guard checks.

Debugging and developer workflows:
- Quick run: open `index.html` in a browser or serve the folder with a static server (recommended to avoid CORS for some assets). On Windows PowerShell, a quick development server is:

```powershell
# from the project root
python -m http.server 8000
``` 

- Use browser DevTools to inspect GSAP/Flip/Draggable errors — missing plugin registrations will throw in the console. If animations don't run, confirm the GSAP plugin script tags are present in `index.html`.
- Unit tests: none present. Keep changes small and test in the browser. Use console.log sparingly and prefer visually verifying animations.

Important files / anchors to reference when editing:
- `script.js` — primary logic. See classes `PreloaderManager` and `FashionGallery` and methods like `generateGridItems()`, `initDraggable()`, `enterZoomMode()`, `exitZoomMode()`, and `calculateFitZoom()`.
- `index.html` — contains essential DOM IDs used by JS: `#viewport`, `#canvasWrapper`, `#gridContainer`, `#splitScreenContainer`, `#zoomTarget`, `#imageTitleOverlay`, `#closeButton`, `#controlsContainer`, `#soundToggle`, `#preloader-overlay`.
- `style.css` — layout and visual tokens. Note `:root` CSS variables and `.grid-item` fixed 320px size — change both JS and CSS together.

Quick examples to cite in suggestions:
- To change grid size: edit `config.rows` / `config.cols` in `script.js` and update `.grid-item` `width`/`height` in `style.css`.
- To add a new image/title: append to `fashionImages` (uses CodePen asset URLs) and `imageData` arrays in `initImageData()`.
- To change preloader length: update `PreloaderManager.duration` or the `setTimeout` in `DOMContentLoaded` (currently 2000ms).

Notes for safe edits:
- Preserve GSAP timelines and Flip usage; these coordinate many visual states. Removing Flip or Draggable without replacing their effects will break zoom/transition flows.
- Keep DOM IDs stable — `script.js` queries many elements by ID. If IDs change, update all query selectors accordingly.
- When changing layout math, run the site and check `calculateBounds()` / `initDraggable()` behavior to avoid off-screen content.

If anything here is unclear or you'd like the instructions to include more examples (e.g., a short checklist for adding a new feature, or tiny unit-test harness), tell me which area to expand and I'll iterate.
