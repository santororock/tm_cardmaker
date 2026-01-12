/* Debug bounds overlay for tm_cardmaker (clean single copy)
   - Draws per-layer bounding rects and optional alpha masks
*/
(function () {
  const dbg = {
    enabled: false,
    mode: 'selected',
    overlay: null,
    octx: null,
    main: null,
    init() {
      this.overlay = document.getElementById('cmcanvas_overlay');
      this.main = document.getElementById('cmcanvas');
      if (!this.overlay || !this.main) return;
      this.octx = this.overlay.getContext('2d');
      this.syncSize();
      window.addEventListener('resize', () => this.syncSize());
    },
    toggle(on) {
      this.enabled = !!on;
      if (!this.overlay) return;
      this.overlay.style.display = this.enabled ? 'block' : 'none';
      if (!this.enabled && this.octx) {
        this.octx.clearRect(0, 0, this.overlay.width, this.overlay.height);
        return;
      }
      const layers = this._currentLayerArray();
      this.drawOverlay(document.getElementById('cmcanvas'), layers, window.aLayers || {});
    },
    setMode(m) {
      if (m === 'all' || m === 'selected') this.mode = m;
      if (this.enabled) this.toggle(true);
    },
    syncSize() {
      if (!this.main || !this.overlay) return;
      const pixelW = this.main.width || this.main.clientWidth;
      const pixelH = this.main.height || this.main.clientHeight;
      this.overlay.width = pixelW;
      this.overlay.height = pixelH;
      const rect = this.main.getBoundingClientRect();
      this.overlay.style.width = rect.width + 'px';
      this.overlay.style.height = rect.height + 'px';
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

        this.octx.strokeStyle = 'red';
        this.octx.strokeRect(layer.x, layer.y, layer.width, layer.height);

        let drewMask = false;
        try {
          if (layer.type === 'block' && window.blockList && typeof layer.iNum === 'number') {
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
        this.octx.moveTo(layer.x - 6, layer.y); this.octx.lineTo(layer.x + 6, layer.y);
        this.octx.moveTo(layer.x, layer.y - 6); this.octx.lineTo(layer.x, layer.y + 6);
        this.octx.stroke();

        const label = `${layerId}${layer.name ? ' '+layer.name : ''} x:${layer.x} y:${layer.y} w:${layer.width} h:${layer.height}`;
        const textW = this.octx.measureText(label).width;
        this.octx.fillStyle = 'rgba(0,0,0,0.6)';
        const tx = layer.x; const ty = Math.max(12, layer.y - 6);
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
      dbg.toggle(newOn);
    }
  });
})();
      for (let y = 0; y < dstH; y++) {
        const rowSpans = [];
        let inSpan = false;
        let spanStart = 0;
        for (let x = 0; x < dstW; x++) {
          const a = id[(y * dstW + x) * 4 + 3];
          const opaque = a > 0;
          if (opaque && !inSpan) {
            inSpan = true;
            spanStart = x;
          } else if (!opaque && inSpan) {
            inSpan = false;
            rowSpans.push([spanStart, x]);
          }
        }
        if (inSpan) rowSpans.push([spanStart, dstW]);
        rows[y] = rowSpans.length ? rowSpans : null;
      }
      return { w: dstW, h: dstH, rows: rows };
    } catch (err) {
      // getImageData failed (likely tainted canvas) — propagate null
      return null;
    }
  }

  // Expose
  window.debugOverlay = dbg;
  window.addEventListener('load', function () { dbg.init(); });
  // Add hotkey Ctrl+Shift+D to toggle debug overlay (ignores input/textarea/select)
  window.addEventListener('keydown', function (e) {
    // Ctrl+Shift+D (cover keyCode 68 for older browsers)
    const isCtrlShiftD = (e.ctrlKey && e.shiftKey && (e.key === 'D' || e.key === 'd' || e.keyCode === 68));
    if (isCtrlShiftD) {
      const active = document.activeElement;
      const tag = active && active.tagName ? active.tagName.toLowerCase() : null;
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || (active && active.isContentEditable)) {
        return; // avoid interfering when typing
      }
      // toggle
      e.preventDefault();
      const newOn = !(dbg.enabled);
      const checkbox = document.getElementById('debugBounds');
      if (checkbox) checkbox.checked = newOn;
      dbg.toggle(newOn);
    }
  });
})();
