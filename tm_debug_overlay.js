/* 
  ================================================================================
  DEBUG OVERLAY - tm_debug_overlay.js
  ================================================================================
  
  Purpose:
    Provides visual debugging tools for the card maker:
    - Draw bounding boxes around layers
    - Show grid coordinates
    - Display layer boundaries
    - Toggle between "selected only" and "all layers" visualization
    
  Architecture:
    - Standalone overlay canvas placed on top of main card canvas
    - Uses IIFE (Immediately Invoked Function Expression) pattern
    - Non-intrusive: Can be toggled on/off without affecting main app
    - Synchronized with main canvas dimensions
    
  How It Works:
    1. Maintains separate overlay canvas (#cmcanvas_overlay)
    2. Draws debug visuals using Canvas 2D API
    3. Syncs size with main canvas on resize events
    4. Redraws when layers change or mode changes
    
  Use Cases:
    - Testing layer positioning accuracy
    - Visualizing invisible layers (text boxes, effects)
    - Debugging canvas coordinate system issues
    - Performance analysis (seeing all layer boundaries)
    
  Canvas Coordinate System (Important):
    - Origin (0,0) at top-left
    - X increases rightward
    - Y increases downward
    - This differs from traditional math (Y-up) coordinate system
    - Always remember: canvas.height = internal pixel height,
      CSS height = display size (different from canvas rendering size)
    
  Browser APIs Used:
    - Canvas 2D Context: Line drawing, rectangles, text
    - window.getComputedStyle(): Retrieving CSS values
    - addEventListener(): Listening for resize and layer changes
    - JavaScript Objects: Encapsulation using IIFE scope
    
  Learning Resources:
    - Canvas API: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API
    - IIFE Pattern: https://developer.mozilla.org/en-US/docs/Glossary/IIFE
    - requestAnimationFrame: For efficient rendering loops
    
  Notes on Deprecated Code:
    This file was partially refactored during development. Some commented-out
    sections show experimental features that may be useful references for
    future enhancements (layer highlighting, coordinate display, etc.)
    
  Performance Considerations:
    - Drawing happens on every change (synchronous)
    - For large numbers of layers (>100), consider throttling
    - Canvas drawing is GPU-accelerated on modern browsers
    - Clearing rect is faster than redrawing: ctx.clearRect(0,0,w,h)
*/

// Deprecated helper file left during debugging. The app now loads `tm_debug_overlay.js`.
// Keeping this lightweight stub for backwards compatibility; it intentionally does nothing.

/* 
  IIFE (Immediately Invoked Function Expression) Pattern
  
  Syntax: (function() { ... })()
  
  What it does:
    1. Defines a function
    2. Immediately invokes it
    3. Creates private scope (dbg object is not global)
  
  Why use IIFE?
    - Prevents polluting global namespace
    - Creates private variables that persist across calls
    - Allows module pattern (public methods via return)
    - Useful for initialization code that runs once
    
  Alternative (ES6): Could use class or module instead
  
  Reference: https://developer.mozilla.org/en-US/docs/Glossary/IIFE
*/

/* tm_debug_overlay_fixed.js — restored working debug overlay (single IIFE)
   This is a snapshot of the cleaned overlay implementation used during debugging.
*/
(function () {
  /* 
    Private Namespace Object Pattern
    
    The 'dbg' object encapsulates all debug overlay state and methods
    Benefits:
      - Prevents global scope pollution
      - Organized related functionality together
      - Can be exposed to global scope if needed (e.g., window.dbg)
      
    Properties:
      - enabled: Boolean toggle for overlay visibility
      - mode: 'selected' (show only selected layer) or 'all' (show all)
      - overlay: Reference to overlay canvas element
      - octx: 2D rendering context for drawing
      - main: Reference to main canvas element
  */
  const dbg = {
    enabled: false,
    mode: 'selected',
    overlay: null,
    octx: null,
    main: null,
    
    /* 
      Initialization Method
      
      Responsibilities:
        1. Get DOM references (overlay canvas, main canvas)
        2. Initialize 2D context for drawing
        3. Setup event listeners (resize events)
      
      Pattern: Called once on page load (or when needed)
      
      Error Handling: Returns early if elements not found (graceful degradation)
    */
    init() {
      this.overlay = document.getElementById('cmcanvas_overlay');
      this.main = document.getElementById('cmcanvas');
      if (!this.overlay || !this.main) return;  // Exit if elements don't exist
      this.octx = this.overlay.getContext('2d');  // Get 2D drawing context
      this.syncSize();  // Sync canvas sizes
      
      /* 
        Event Listener: Resize Handler
        
        Why needed?
          - When user resizes window, canvas must be resized too
          - Otherwise overlay and main canvas get out of sync
          
        Arrow Function: => preserves 'this' context (bound automatically)
        Without arrow function, 'this' would refer to window, not dbg object
        
        Old way: window.addEventListener('resize', this.syncSize.bind(this))
        New way: window.addEventListener('resize', () => this.syncSize())
      */
      window.addEventListener('resize', () => this.syncSize());
    },
    
    /* 
      Toggle Overlay Visibility
      
      Parameters:
        on (boolean): true to show, false to hide
        
      Side Effects:
        - Shows/hides overlay canvas via CSS display property
        - Clears canvas if hiding
        - Redraws if showing
        
      Implementation Notes:
        - !!on: Ensures boolean type (converts truthy/falsy to boolean)
        - octx.clearRect(): Clears all pixels in rectangle
          (0, 0, width, height) clears entire canvas
    */
    toggle(on) {
      this.enabled = !!on;  // Convert to boolean
      if (!this.overlay) return;
      this.overlay.style.display = this.enabled ? 'block' : 'none';
      if (!this.enabled && this.octx) {
        // Clear canvas when hiding (remove previous drawings)
        this.octx.clearRect(0, 0, this.overlay.width, this.overlay.height);
        return;
      }
      // Redraw if showing
      const layers = this._currentLayerArray();
      this.drawOverlay(document.getElementById('cmcanvas'), layers, window.aLayers || {});
    },
    
    /* 
      Change Visualization Mode
      
      Modes:
        - 'selected': Show only the currently selected layer (cleaner view)
        - 'all': Show all layers (identify collisions, overlaps)
      
      Validation: Only accepts valid mode strings
    */
    setMode(m) {
      if (m === 'all' || m === 'selected') this.mode = m;
      if (this.enabled) this.toggle(true);  // Redraw with new mode
    },
    
    /* 
      Synchronize Canvas Dimensions
      
      Critical Issue:
        HTML Canvas has TWO separate size concepts:
        1. INTERNAL PIXEL SIZE: canvas.width and canvas.height (rendering resolution)
        2. DISPLAY SIZE: CSS width/height (screen pixels shown)
        
      Common Mistake:
        If you only set CSS size, canvas content stretches/distorts
        Must set BOTH for correct rendering
      
      Canvas Size Calculation:
        - Get main canvas internal pixel dimensions (canvas.width, canvas.height)
        - Copy to overlay canvas (render at same resolution)
        - Don't set CSS width/height (let parent CSS handle display)
        - Account for wrapper padding and borders when calculating display size
      
      Why this matters:
        - Drawing coordinates are in canvas pixel space (internal size)
        - If internal size != display size, coordinates get wrong scale
        - This causes misalignment between overlay and main canvas
        
      Reference: Excellent article on canvas sizing:
        https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial
    */
    syncSize() {
      if (!this.main || !this.overlay) return;
      
      // Match the overlay canvas dimensions to the main canvas internal dimensions
      const pixelW = this.main.width;   // Internal pixel width
      const pixelH = this.main.height;  // Internal pixel height
      this.overlay.width = pixelW;
      this.overlay.height = pixelH;
      
      // Don't set CSS width/height - let the canvas use its natural size
      // Both canvases will scale together via the parent's transform
      this.overlay.style.width = '';
      this.overlay.style.height = '';
      
      // Account for parent wrapper padding and main canvas border
      const wrapper = this.main.parentElement;
      const wrapperStyle = wrapper ? window.getComputedStyle(wrapper) : null;
      const mainStyle = window.getComputedStyle(this.main);
      
      const wrapperPaddingLeft = wrapperStyle ? (parseInt(wrapperStyle.paddingLeft) || 0) : 0;
      const wrapperPaddingTop = wrapperStyle ? (parseInt(wrapperStyle.paddingTop) || 0) : 0;
      const borderLeft = parseInt(mainStyle.borderLeftWidth) || 0;
      const borderTop = parseInt(mainStyle.borderTopWidth) || 0;
      
      this.overlay.style.left = (wrapperPaddingLeft + borderLeft) + 'px';
      this.overlay.style.top = (wrapperPaddingTop + borderTop) + 'px';
      if (this.octx) this.octx.setTransform(1, 0, 0, 1, 0, 0);
    },
    drawOverlay(mainCanvas, layersArray, allLayersObj) {
      if (!this.overlay || !this.octx) return;
      this.syncSize();
      this.octx.clearRect(0, 0, this.overlay.width, this.overlay.height);
      if (!this.enabled) return;

      this.octx.save();
      this.octx.lineWidth = 2;
      this.octx.font = '12px sans-serif';

      const selDiv = document.querySelector('.divRec.selected');
      const selId = selDiv ? selDiv.id : null;

      const targets = (this.mode === 'selected' && selId && allLayersObj[selId]) ? [allLayersObj[selId]] : (Array.isArray(layersArray) ? layersArray.slice() : []);

      for (let layer of targets) {
        let layerId = null;
        for (let id in allLayersObj) if (allLayersObj[id] === layer) { layerId = id; break; }
        if (!layerId) continue;
        if (layer.x === undefined || layer.y === undefined || layer.width === undefined || layer.height === undefined) continue;

        // For text layers, use the calculated bounds that encompass all wrapped lines
        let bounds = layer;
        if (layer.type === 'text' && window.calculateTextBounds) {
          bounds = window.calculateTextBounds(layer);
        }

        this.octx.strokeStyle = 'red';
        this.octx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);

        let drewMask = false;
        try {
          // Text layers don't have image masks, so skip mask drawing for them
          if (layer.type === 'text') {
            drewMask = true;  // Mark as drawn so we don't show the "mask unavailable" overlay
          } else if (layer.type === 'block' && window.blockList && typeof layer.iNum === 'number') {
            const b = window.blockList[layer.iNum];
            if (b && b.obj && b.obj.complete) {
              const mask = getAlphaMask(b.obj, 0, 0, b.obj.width, b.obj.height, Math.max(1, Math.round(layer.width)), Math.max(1, Math.round(layer.height)));
              if (mask) { drawMaskOnOverlay(this.octx, mask, layer.x, layer.y); drewMask = true; }
            }
          } else if ((layer.type === 'webFile' || layer.type === 'userFile' || layer.type === 'embedded') && window.userImageList && typeof layer.iNum === 'number' && layer.iNum >= 0) {
            const img = window.userImageList[layer.iNum];
            if (img && img.complete) {
              const sx = (layer.sx !== undefined) ? layer.sx : 0;
              const sy = (layer.sy !== undefined) ? layer.sy : 0;
              const sw = (layer.swidth && layer.swidth > 0) ? layer.swidth : img.width;
              const sh = (layer.sheight && layer.sheight > 0) ? layer.sheight : img.height;
              const mask = getAlphaMask(img, sx, sy, sw, sh, Math.max(1, Math.round(layer.width)), Math.max(1, Math.round(layer.height)));
              if (mask) { drawMaskOnOverlay(this.octx, mask, layer.x, layer.y); drewMask = true; }
            }
          }
        } catch (err) { console.error('debugOverlay: mask error', err); }

        if (!drewMask) {
          this.octx.save(); this.octx.setLineDash([6,4]); this.octx.strokeStyle = 'orange'; this.octx.strokeRect(layer.x, layer.y, layer.width, layer.height); this.octx.setLineDash([]); this.octx.restore();
        }

        this.octx.beginPath();
        this.octx.moveTo(bounds.x - 6, bounds.y); this.octx.lineTo(bounds.x + 6, bounds.y);
        this.octx.moveTo(bounds.x, bounds.y - 6); this.octx.lineTo(bounds.x, bounds.y + 6);
        this.octx.stroke();

        const label = `${layerId}${layer.name ? ' '+layer.name : ''} x:${Math.round(bounds.x)} y:${Math.round(bounds.y)} w:${Math.round(bounds.width)} h:${Math.round(bounds.height)}`;
        const textW = this.octx.measureText(label).width;
        this.octx.fillStyle = 'rgba(0,0,0,0.6)';
        const tx = bounds.x; const ty = Math.max(12, bounds.y - 6);
        this.octx.fillRect(tx - 2, ty - 12, textW + 6, 14);
        this.octx.fillStyle = 'white'; this.octx.fillText(label, tx + 1, ty - 1);
      }

      this.octx.restore();
    }
  };

  dbg._currentLayerArray = function () {
    const arr = [];
    const layerDivs = document.getElementsByClassName('divRec');
    for (let i = 0; i < layerDivs.length; i++) {
      const id = layerDivs[i].id;
      if (window.aLayers && window.aLayers[id]) arr.push(window.aLayers[id]);
    }
    return arr;
  };

  function drawMaskOnOverlay(octx, mask, x0, y0) {
    octx.save(); octx.fillStyle = 'rgba(0,200,0,0.18)';
    for (let y = 0; y < mask.h; y++) {
      const spans = mask.rows[y]; if (!spans) continue;
      for (let s = 0; s < spans.length; s++) { const st = spans[s][0]; const en = spans[s][1]; octx.fillRect(x0 + st, y0 + y, en - st, 1); }
    }
    octx.restore();
  }

  function getAlphaMask(img, sx, sy, sw, sh, dstW, dstH) {
    try {
      const cvs = document.createElement('canvas'); cvs.width = dstW; cvs.height = dstH; const ctx = cvs.getContext('2d');
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, dstW, dstH);
      const id = ctx.getImageData(0, 0, dstW, dstH).data; const rows = new Array(dstH);
      for (let y = 0; y < dstH; y++) {
        const rowSpans = []; let inSpan = false; let spanStart = 0;
        for (let x = 0; x < dstW; x++) {
          const a = id[(y * dstW + x) * 4 + 3]; const opaque = a > 0;
          if (opaque && !inSpan) { inSpan = true; spanStart = x; }
          else if (!opaque && inSpan) { inSpan = false; rowSpans.push([spanStart, x]); }
        }
        if (inSpan) rowSpans.push([spanStart, dstW]); rows[y] = rowSpans.length ? rowSpans : null;
      }
      return { w: dstW, h: dstH, rows: rows };
    } catch (err) { return null; }
  }

  window.debugOverlay = dbg;
  window.addEventListener('load', function () { dbg.init(); });
  window.addEventListener('keydown', function (e) {
    const isCtrlShiftD = (e.ctrlKey && e.shiftKey && (e.key === 'D' || e.key === 'd' || e.keyCode === 68));
    if (isCtrlShiftD) {
      const active = document.activeElement; const tag = active && active.tagName ? active.tagName.toLowerCase() : null;
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || (active && active.isContentEditable)) return;
      e.preventDefault(); const newOn = !(dbg.enabled); const checkbox = document.getElementById('debugBounds'); if (checkbox) checkbox.checked = newOn; dbg.toggle(newOn);
    }
  });
})();
