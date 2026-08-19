# Card Maker JavaScript Architecture

The application is being migrated incrementally from the original `tm_cm.js`
monolith. It remains a no-build, static web application suitable for GitHub
Pages.

## Current module boundaries

- `tm_project.js`: layer defaults, authoritative stacking order, undo/redo,
  project loading compatibility, and serialization.
- `tm_rendering.js`: image adjustments and all canvas layer rendering.
- `tm_layers.js`: layer-list rows, selection, ordering, visibility, and the
  history-facing layer UI workflow.
- `tm_assets.js`: asset-set loading and filtering, thumbnails, and IndexedDB
  user-image caching.
- `tm_templates.js`: card template definitions and template loading.
- `tm_cm.js`: application startup, property editing, project reconstruction,
  canvas interaction, and high-level coordination.
- `tm_export.js`: layered export formats; consumes the shared layer model.

The extracted files currently expose frozen APIs on `window.TMCardMaker*`. This
is a compatibility stage: inline HTML event handlers and the existing exporter
still depend on classic-script globals. New subsystem code should be added to
the appropriate module rather than returned to `tm_cm.js`.

## Dependency direction

```text
tm_cm.js (controller)
  -> project
  -> rendering
  -> layers
  -> assets
  -> templates

tm_export.js
  -> layer model
```

Rendering modules must not autosave, query the layer-list DOM, or modify undo
history. The controller supplies ordered layers and rendering dependencies,
then coordinates autosave and debug overlays after rendering.

## Next migration milestones

Keep this six-script application structure. Further cleanup should improve the
existing boundaries rather than create additional small modules. Removing
inline HTML handlers can be considered separately after the controller has
stabilized.
