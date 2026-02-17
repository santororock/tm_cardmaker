# Copilot instructions for TM_Cardmaker

Purpose: Help an AI coding agent become productive quickly in this static, client-side web app.

- **Project shape**: single-page, 100% client-side app. Entry point: `tm_cardmaker.html`. The rendering/behavior engine is `tm_cm.js` (core runtime). Assets live in folders like `templates/`, `resources/`, `tags/`, `fonts/`, `tiles/`, `VPs/`.

- **Key runtime data structures** (read `tm_cm.js`):
  - `blockList` — canonical list of image assets; entries have `putUnder` (folder) and `src` (basename). Images are loaded from `{putUnder}/{src}.png`.
  - `blockDefaults` & `megaTemplates` — provide presets and full templates used to create initial layer sets.
  - `aLayers` — runtime map of layered objects (layer types include `base`, `block`, `text`, `production`, `effect`, `line`, `embedded`, `webFile`, `userFile`).
  - `userImageList`, `otherBgList`, `fontList` — registries for user images, alternate backgrounds, and loaded fonts.
  - **Layer properties**: common properties include `x`, `y`, `width`, `height`. Text and line layers support `angle` (rotation in degrees).

- **Important functions to inspect/modify**:
  - `drawProject()` — paints the canvas from `aLayers` (central rendering loop).
  - `addBlock()`, `addTextBox()`, `addProduction()` — factories for new layers.
  - `fetchBlock()` / `onBlockLoad()` — image loading logic and CORS handling (note: `crossOrigin` set only for http/https).
  - `loadFrom()` / `autoSave()` / `projectDataToJson()` — save/load and project-embedding logic (projects are embedded in PNGs using signature `tm_cmV01`).
  - `calculateTextBounds()` — computes bounding box for text layers (handles rotation via AABB); used by debug overlay and hit testing.
  - `clickIsWithinText()` — hit testing for text layers (applies inverse rotation to click coordinates).

- **Dev / run workflow** (non-obvious):
  - Serve the folder over HTTP to avoid CORS/tainted-canvas issues when exporting (see `README.md`): e.g. `python -m http.server 8000` or `npx http-server -p 8000`. Then open `/tm_cardmaker.html`.
  - Use browser devtools console for debugging; `tm_cm.js` uses `console.log` and `console.error` widely.

- **Conventions & gotchas** (observed patterns):
  - Saved projects convert numeric `iNum` references to `src` strings so saves are index-independent. Prefer using `src` when authoring exported JSON.
  - Image hit-testing checks pixel alpha via a temporary canvas (`getImageData`) — changing that logic affects click/drag hit tests and must keep CORS/privacy considerations in mind.
  - When adding fonts, `loadFont(url)` appends a `<link>` and records the mapping in `fontList` (key is the family name parsed from the URL).
  - `crossOrigin` is set only when `window.location.protocol` is `http:` or `https:`. Do not set it for `file://` (browser will block requests).

- **Common edits & examples** (copy/paste actionable snippets):
  - Add a new image asset folder entry: add a PNG `my_image.png` to `resources/` and append `{putUnder:"resources", src:"my_image"}` to `blockList`.
  - Add a new template: extend `megaTemplates` with a `layers` array following existing examples (see `megaTemplates.green_normal` in `tm_cm.js`).

- **Testing & validation**:
  - Manual: serve locally, open UI, create a small project, then `File -> Save as Project` to verify export and that embedded project data roundtrips (`File -> Clear & Load Project`).
  - Automated tests: none present; prefer lightweight manual checks and browser console assertions.

- **When changing JS**:
  - Keep global variable names (`aLayers`, `blockList`, `megaTemplates`, `blockDefaults`, `userImageList`) stable — many functions depend on them by global name.
  - Preserve the PNG-embedding signature `tm_cmV01` if altering save/load format, or add a clear migration path in `loadFrom()`.

If anything important is missing or unclear, tell me what you'd like emphasized or an example you'd like added and I'll iterate.
