/*
  Layered export helpers for Terraforming Mars Card Maker.

  Phase one intentionally keeps this file independent from third-party
  libraries. ZIP export uses stored entries, and PSD export writes raster
  layers with raw channel data.
*/

(function() {
    const EXPORT_VERSION = 1;

    function utf8Bytes(str) {
        return new TextEncoder().encode(String(str || ""));
    }

    function sanitizeFilePart(name, fallback) {
        const cleaned = String(name || fallback || "layer")
            .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_")
            .replace(/\s+/g, " ")
            .trim();
        return (cleaned || fallback || "layer").slice(0, 80);
    }

    function padNumber(num, size) {
        let out = String(num);
        while (out.length < size) out = "0" + out;
        return out;
    }

    function downloadBlob(blob, filename) {
        const link = document.getElementById("projectlink") || document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("download", filename);
        link.setAttribute("href", url);
        link.click();
        setTimeout(function() {
            URL.revokeObjectURL(url);
        }, 1000);
    }

    function canvasToPngBytes(canvas) {
        return new Promise(function(resolve, reject) {
            canvas.toBlob(function(blob) {
                if (!blob) {
                    reject(new Error("Could not encode PNG layer."));
                    return;
                }
                blob.arrayBuffer().then(function(buffer) {
                    resolve(new Uint8Array(buffer));
                }).catch(reject);
            }, "image/png");
        });
    }

    function getOrderedProjectLayersForExport() {
        const layerDivs = document.getElementsByClassName("divRec");
        const layers = [];
        for (let i = 0; i < layerDivs.length; i++) {
            const id = layerDivs[i].id;
            if (aLayers[id]) {
                layers.push({ id: id, layer: aLayers[id] });
            }
        }
        return layers;
    }

    function getExportSize(orderedLayers) {
        for (let i = 0; i < orderedLayers.length; i++) {
            const layer = orderedLayers[i].layer;
            if (layer && layer.type === "base") {
                return {
                    width: Math.max(1, Math.round(Number(layer.width) || 1)),
                    height: Math.max(1, Math.round(Number(layer.height) || 1))
                };
            }
        }
        const c = document.getElementById("cmcanvas");
        return {
            width: Math.max(1, Math.round(Number(c && c.width) || 1)),
            height: Math.max(1, Math.round(Number(c && c.height) || 1))
        };
    }

    function cloneCanvas(width, height) {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        return canvas;
    }

    function getLayerName(entry, index) {
        const layer = entry.layer || {};
        return layer.name || layer.filename || (layer.type ? layer.type : "Layer") + " " + (index + 1);
    }

    function getLayerOpacity(layer) {
        if (!layer) return 1;
        if (layer.type === "userFile" || layer.type === "embedded" || layer.type === "webFile") {
            if (layer.alpha === undefined) return 1;
            return Math.max(0, Math.min(1, Number(layer.alpha) / 100));
        }
        if (layer.opacity !== undefined) {
            return Math.max(0, Math.min(1, Number(layer.opacity)));
        }
        return 1;
    }

    function renderTextLayer(ctx, layer) {
        ctx.save();
        ctx.textAlign = layer.justify;
        if (!layer.style) layer.style = "normal";
        ctx.font = layer.style + " " + layer.weight + " " + layer.height + "px " + layer.font;
        ctx.fillStyle = layer.color;

        if (layer.angle && layer.angle !== 0) {
            ctx.translate(layer.x, layer.y);
            ctx.rotate(Math.PI * layer.angle / 180);
        }

        const lines = String(layer.data || "").split("\n");
        let cnt = 0;
        for (let ln = 0; ln < lines.length; ln++) {
            const spl = lines[ln].split(" ");
            let o = "";
            while (spl.length) {
                o = spl.shift();
                while (spl.length && (ctx.measureText(o + " " + spl[0]).width < layer.width)) {
                    o += " " + spl.shift();
                }
                if (layer.angle && layer.angle !== 0) {
                    ctx.fillText(o, 0, (layer.height + layer.lineSpace) * cnt);
                } else {
                    ctx.fillText(o, layer.x, layer.y + (layer.height + layer.lineSpace) * cnt);
                }
                cnt++;
            }
        }
        ctx.restore();
    }

    function renderProductionLayer(ctx, layer) {
        const sz = 20;
        const border = 3;
        const xpos = Number(layer.x);
        const ypos = Number(layer.y);
        const width = Number(layer.width);
        const height = Number(layer.height);
        const img = blockList[hiddenImage["prod_nxn"]].obj;
        const w = width % sz;
        const h = height % sz;

        if (img && img.complete) {
            for (let x = xpos; x <= xpos + width; x += sz) {
                for (let y = ypos; y <= ypos + height; y += sz) {
                    if ((x <= xpos + width - sz) && (y <= ypos + height - sz)) {
                        ctx.drawImage(img, x, y, sz, sz);
                    } else if (x > xpos + width - sz) {
                        if (y > ypos + height - sz) {
                            ctx.drawImage(img, 0, 0, w, h, x, y, w, h);
                        } else {
                            ctx.drawImage(img, 0, 0, w, sz, x, y, w, sz);
                        }
                    } else if (y > ypos + height - sz) {
                        ctx.drawImage(img, 0, 0, sz, h, x, y, sz, h);
                    } else {
                        ctx.drawImage(img, 0, 0, sz, sz, x, y, sz, sz);
                    }
                }
            }
        }

        let gradient = ctx.createLinearGradient(0, ypos, 0, ypos + height);
        gradient.addColorStop(0, "#9d6c43");
        gradient.addColorStop(1, "#5a412c");
        ctx.fillStyle = gradient;
        ctx.fillRect(xpos, ypos + border, width, border);
        ctx.fillRect(xpos, ypos + height - border * 2, width, border);
        ctx.fillRect(xpos + border, ypos, border, height);
        ctx.fillRect(xpos + width - border * 2, ypos, border, height);

        gradient = ctx.createLinearGradient(0, ypos, 0, ypos + height);
        gradient.addColorStop(0, "#505050");
        gradient.addColorStop(1, "#c0c0c0");
        ctx.fillStyle = gradient;
        ctx.fillRect(xpos, ypos, width, border);
        ctx.fillRect(xpos, ypos + height - border, width, border);
        ctx.fillRect(xpos, ypos, border, height);
        ctx.fillRect(xpos + width - border, ypos, border, height);
    }

    function renderEffectLayer(ctx, layer) {
        const border = 5;
        const xpos = Number(layer.x);
        const ypos = Number(layer.y);
        const width = Number(layer.width);
        const height = Number(layer.height);
        let grd = ctx.createLinearGradient(xpos, ypos, xpos + width, ypos);
        let stops = [0, 0.1, 0.2, 0.3, 0.4, 0.6, 0.68, 0.76, 0.84, 0.92];
        let stopColors = ["#333333", "#999999"];
        for (let s = 0; s < stops.length; s++) {
            grd.addColorStop(stops[s], stopColors[s % 2]);
        }
        grd.addColorStop(1, "#777777");
        ctx.fillStyle = grd;
        ctx.fillRect(xpos, ypos, layer.width, layer.height);

        grd = ctx.createLinearGradient(xpos + border, ypos + border, xpos + layer.width - border, ypos + layer.height - border);
        stops = [0, 0.07, 0.25, 0.6, 0.85, 1.0];
        stopColors = ["#ffffff", "#999999"];
        for (let s = 0; s < stops.length; s++) {
            grd.addColorStop(stops[s], stopColors[s % 2]);
        }
        ctx.fillStyle = grd;
        ctx.fillRect(xpos + border, ypos + border, layer.width - 2 * border, layer.height - 2 * border);
    }

    function numberOrDefault(value, defaultValue) {
        const num = Number(value);
        return Number.isFinite(num) ? num : defaultValue;
    }

    function getBlockColorFilter(layer) {
        const hue = numberOrDefault(layer.hue, 0);
        const saturation = numberOrDefault(layer.saturation, 100);
        const lightness = numberOrDefault(layer.lightness, 100);
        if ((hue === 0) && (saturation === 100) && (lightness === 100)) return "none";
        return "hue-rotate(" + hue + "deg) saturate(" + saturation + "%) brightness(" + lightness + "%)";
    }

    function getLayerGamma(layer) {
        return Math.max(1, numberOrDefault(layer.gamma, 100));
    }

    function applyGammaToCanvas(canvas, gammaPercent) {
        if (gammaPercent === 100) return;
        const gamma = gammaPercent / 100;
        const gctx = canvas.getContext("2d");
        let imageData;
        try {
            imageData = gctx.getImageData(0, 0, canvas.width, canvas.height);
        } catch (error) {
            return;
        }
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            data[i] = 255 * Math.pow(data[i] / 255, gamma);
            data[i + 1] = 255 * Math.pow(data[i + 1] / 255, gamma);
            data[i + 2] = 255 * Math.pow(data[i + 2] / 255, gamma);
        }
        gctx.putImageData(imageData, 0, 0);
    }

    function createAdjustedLayerCanvas(width, height, layer, drawSource) {
        const offscreen = cloneCanvas(Math.max(1, Math.round(width)), Math.max(1, Math.round(height)));
        const offctx = offscreen.getContext("2d");
        offctx.filter = getBlockColorFilter(layer);
        drawSource(offctx, offscreen.width, offscreen.height);
        offctx.filter = "none";
        applyGammaToCanvas(offscreen, getLayerGamma(layer));
        return offscreen;
    }

    function getOtherBgImage(otherBgRef) {
        if (!otherBgRef) return null;
        if (otherBgList[otherBgRef]) return otherBgList[otherBgRef];
        for (let i = 0; i < blockList.length; i++) {
            const block = blockList[i];
            if (!block) continue;
            if (block.text == otherBgRef || block.src == otherBgRef || block.filename == otherBgRef || block.id == otherBgRef) {
                return block.obj || null;
            }
        }
        return null;
    }

    function renderUserImageLayer(ctx, layer) {
        if (layer.iNum === -1 || !userImageList[layer.iNum]) return;
        const angle = Number(layer.angle) || 0;
        const x = Number(layer.x) || 0;
        const y = Number(layer.y) || 0;
        const width = Number(layer.width) || 0;
        const height = Number(layer.height) || 0;
        const spritePadX = Number(thisBlock.otherbgPadX);
        const spritePadY = Number(thisBlock.otherbgPadY);
        const layerPadX = Number(layer.obgPadX);
        const layerPadY = Number(layer.obgPadY);
        const padX = (layer.obg && thisBlock.otherbg) ? (Number.isFinite(layerPadX) ? layerPadX : (Number.isFinite(spritePadX) ? spritePadX : 3)) : 0;
        const padY = (layer.obg && thisBlock.otherbg) ? (Number.isFinite(layerPadY) ? layerPadY : (Number.isFinite(spritePadY) ? spritePadY : 3)) : 0;

        ctx.save();
        ctx.globalAlpha = getLayerOpacity(layer);
        if (angle !== 0) {
            ctx.translate(x + width / 2, y + height / 2);
            ctx.rotate(Math.PI * angle / 180);
        }

        if (getLayerGamma(layer) !== 100) {
            const adjusted = createAdjustedLayerCanvas(width, height, layer, function(targetCtx, targetWidth, targetHeight) {
                targetCtx.drawImage(userImageList[layer.iNum], layer.sx, layer.sy, layer.swidth, layer.sheight, 0, 0, targetWidth, targetHeight);
            });
            if (angle !== 0) {
                ctx.drawImage(adjusted, -width / 2, -height / 2, width, height);
            } else {
                ctx.drawImage(adjusted, x, y, width, height);
            }
        } else {
            ctx.filter = getBlockColorFilter(layer);
            if (angle !== 0) {
                ctx.drawImage(userImageList[layer.iNum], layer.sx, layer.sy, layer.swidth, layer.sheight, -width / 2, -height / 2, width, height);
            } else {
                ctx.drawImage(userImageList[layer.iNum], layer.sx, layer.sy, layer.swidth, layer.sheight, x, y, width, height);
            }
        }
        ctx.restore();
    }

    function renderBlockLayer(ctx, layer) {
        const thisBlock = blockList[layer.iNum] || {};
        const angle = Number(layer.angle) || 0;
        const x = Number(layer.x) || 0;
        const y = Number(layer.y) || 0;
        const width = Number(layer.width) || 0;
        const height = Number(layer.height) || 0;

        ctx.save();
        if (angle !== 0) {
            ctx.translate(x + width / 2, y + height / 2);
            ctx.rotate(Math.PI * angle / 180);
            ctx.translate(-width / 2, -height / 2);
        } else {
            ctx.translate(x, y);
        }

        function drawBlockContents(targetCtx) {
            if (layer.obg && thisBlock.otherbg) {
                const otherBg = getOtherBgImage(thisBlock.otherbg);
                if (otherBg && otherBg.complete) {
                    targetCtx.drawImage(otherBg, -padX, -padY, width + 2 * padX, height + 2 * padY);
                }
            }

            if (thisBlock.obj && thisBlock.obj.complete) {
                targetCtx.drawImage(thisBlock.obj, 0, 0, width, height);
            }
        }

        if (getLayerGamma(layer) !== 100) {
            const adjusted = createAdjustedLayerCanvas(width + 2 * padX, height + 2 * padY, layer, function(targetCtx) {
                targetCtx.save();
                targetCtx.translate(padX, padY);
                drawBlockContents(targetCtx);
                targetCtx.restore();
            });
            ctx.drawImage(adjusted, -padX, -padY, width + 2 * padX, height + 2 * padY);
        } else {
            ctx.filter = getBlockColorFilter(layer);
            drawBlockContents(ctx);
        }
        ctx.restore();
    }

    function renderSingleLayerToContext(ctx, layer) {
        switch (layer.type) {
            case "base":
                ctx.fillStyle = layer.color;
                ctx.fillRect(0, 0, layer.width, layer.height);
                break;
            case "block":
                renderBlockLayer(ctx, layer);
                break;
            case "text":
                renderTextLayer(ctx, layer);
                break;
            case "production":
                renderProductionLayer(ctx, layer);
                break;
            case "effect":
                renderEffectLayer(ctx, layer);
                break;
            case "userFile":
            case "embedded":
            case "webFile":
                renderUserImageLayer(ctx, layer);
                break;
            case "line":
                ctx.save();
                ctx.lineWidth = layer.width;
                ctx.strokeStyle = layer.color;
                ctx.translate(layer.x, layer.y);
                ctx.rotate(Math.PI * layer.angle / 180);
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(layer.len, 0);
                ctx.stroke();
                ctx.restore();
                break;
            default:
                throw new Error("Invalid layer type: " + layer.type);
        }
    }

    function renderLayerCanvas(layer, size) {
        const canvas = cloneCanvas(size.width, size.height);
        const ctx = canvas.getContext("2d");
        renderSingleLayerToContext(ctx, layer);
        return canvas;
    }

    function renderCompositeCanvas(orderedLayers, size) {
        const canvas = cloneCanvas(size.width, size.height);
        const ctx = canvas.getContext("2d");
        for (let i = 0; i < orderedLayers.length; i++) {
            renderSingleLayerToContext(ctx, orderedLayers[i].layer);
        }
        return canvas;
    }

    async function buildLayerExportDocument() {
        const orderedLayers = getOrderedProjectLayersForExport();
        const size = getExportSize(orderedLayers);
        const exportLayers = [];

        for (let i = 0; i < orderedLayers.length; i++) {
            const entry = orderedLayers[i];
            const layer = entry.layer;
            const name = getLayerName(entry, i);
            exportLayers.push({
                id: entry.id,
                index: i,
                name: name,
                type: layer.type,
                opacity: getLayerOpacity(layer),
                blendMode: "normal",
                visible: true,
                canvas: renderLayerCanvas(layer, size),
                source: sanitizeLayerForManifest(layer)
            });
        }

        return {
            format: "tm-cardmaker-layer-export",
            version: EXPORT_VERSION,
            width: size.width,
            height: size.height,
            createdAt: new Date().toISOString(),
            layers: exportLayers,
            preview: renderCompositeCanvas(orderedLayers, size)
        };
    }

    function sanitizeLayerForManifest(layer) {
        const copy = {};
        for (const key in layer) {
            const value = layer[key];
            if (key === "obj") continue;
            if (typeof value === "function") continue;
            copy[key] = value;
        }
        return copy;
    }

    function buildManifest(exportDoc, layerFiles, previewFile) {
        return {
            format: exportDoc.format,
            version: exportDoc.version,
            width: exportDoc.width,
            height: exportDoc.height,
            createdAt: exportDoc.createdAt,
            preview: previewFile,
            layers: exportDoc.layers.map(function(layer, index) {
                return {
                    file: layerFiles[index],
                    name: layer.name,
                    type: layer.type,
                    index: layer.index,
                    visible: layer.visible,
                    opacity: layer.opacity,
                    blendMode: layer.blendMode,
                    source: layer.source
                };
            })
        };
    }

    let crcTable = null;

    function getCrcTable() {
        if (crcTable) return crcTable;
        crcTable = new Uint32Array(256);
        for (let n = 0; n < 256; n++) {
            let c = n;
            for (let k = 0; k < 8; k++) {
                c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
            }
            crcTable[n] = c >>> 0;
        }
        return crcTable;
    }

    function crc32(bytes) {
        const table = getCrcTable();
        let crc = 0xFFFFFFFF;
        for (let i = 0; i < bytes.length; i++) {
            crc = table[(crc ^ bytes[i]) & 0xFF] ^ (crc >>> 8);
        }
        return (crc ^ 0xFFFFFFFF) >>> 0;
    }

    function pushU16LE(out, value) {
        out.push(value & 0xFF, (value >>> 8) & 0xFF);
    }

    function pushU32LE(out, value) {
        out.push(value & 0xFF, (value >>> 8) & 0xFF, (value >>> 16) & 0xFF, (value >>> 24) & 0xFF);
    }

    function dosDateTime(date) {
        const year = Math.max(1980, date.getFullYear());
        const time = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
        const day = (year - 1980) << 9 | ((date.getMonth() + 1) << 5) | date.getDate();
        return { time: time, date: day };
    }

    function buildZip(entries) {
        const now = dosDateTime(new Date());
        const localParts = [];
        const centralParts = [];
        let offset = 0;

        for (let i = 0; i < entries.length; i++) {
            const nameBytes = utf8Bytes(entries[i].name);
            const data = entries[i].data;
            const crc = crc32(data);
            const local = [];
            pushU32LE(local, 0x04034B50);
            pushU16LE(local, 20);
            pushU16LE(local, 0x0800);
            pushU16LE(local, 0);
            pushU16LE(local, now.time);
            pushU16LE(local, now.date);
            pushU32LE(local, crc);
            pushU32LE(local, data.length);
            pushU32LE(local, data.length);
            pushU16LE(local, nameBytes.length);
            pushU16LE(local, 0);
            localParts.push(new Uint8Array(local), nameBytes, data);

            const central = [];
            pushU32LE(central, 0x02014B50);
            pushU16LE(central, 20);
            pushU16LE(central, 20);
            pushU16LE(central, 0x0800);
            pushU16LE(central, 0);
            pushU16LE(central, now.time);
            pushU16LE(central, now.date);
            pushU32LE(central, crc);
            pushU32LE(central, data.length);
            pushU32LE(central, data.length);
            pushU16LE(central, nameBytes.length);
            pushU16LE(central, 0);
            pushU16LE(central, 0);
            pushU16LE(central, 0);
            pushU16LE(central, 0);
            pushU32LE(central, 0);
            pushU32LE(central, offset);
            centralParts.push(new Uint8Array(central), nameBytes);

            offset += local.length + nameBytes.length + data.length;
        }

        const centralSize = centralParts.reduce(function(sum, part) { return sum + part.length; }, 0);
        const end = [];
        pushU32LE(end, 0x06054B50);
        pushU16LE(end, 0);
        pushU16LE(end, 0);
        pushU16LE(end, entries.length);
        pushU16LE(end, entries.length);
        pushU32LE(end, centralSize);
        pushU32LE(end, offset);
        pushU16LE(end, 0);

        return new Blob(localParts.concat(centralParts, [new Uint8Array(end)]), { type: "application/zip" });
    }

    function pushAscii(out, text) {
        for (let i = 0; i < text.length; i++) out.push(text.charCodeAt(i) & 0xFF);
    }

    function pushU16BE(out, value) {
        out.push((value >>> 8) & 0xFF, value & 0xFF);
    }

    function pushI16BE(out, value) {
        if (value < 0) value = 0x10000 + value;
        pushU16BE(out, value);
    }

    function pushU32BE(out, value) {
        out.push((value >>> 24) & 0xFF, (value >>> 16) & 0xFF, (value >>> 8) & 0xFF, value & 0xFF);
    }

    function pushI32BE(out, value) {
        if (value < 0) value = 0x100000000 + value;
        pushU32BE(out, value >>> 0);
    }

    function concatUint8Arrays(parts) {
        const total = parts.reduce(function(sum, part) { return sum + part.length; }, 0);
        const out = new Uint8Array(total);
        let pos = 0;
        for (let i = 0; i < parts.length; i++) {
            out.set(parts[i], pos);
            pos += parts[i].length;
        }
        return out;
    }

    function psdPascalName(name) {
        const bytes = utf8Bytes(name).slice(0, 255);
        const total = 1 + bytes.length;
        const padded = total + ((4 - (total % 4)) % 4);
        const out = new Uint8Array(padded);
        out[0] = bytes.length;
        out.set(bytes, 1);
        return out;
    }

    function imageDataChannels(canvas) {
        const ctx = canvas.getContext("2d");
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        const count = canvas.width * canvas.height;
        const channels = [
            new Uint8Array(count),
            new Uint8Array(count),
            new Uint8Array(count),
            new Uint8Array(count)
        ];
        for (let i = 0, p = 0; i < count; i++, p += 4) {
            channels[0][i] = imageData[p];
            channels[1][i] = imageData[p + 1];
            channels[2][i] = imageData[p + 2];
            channels[3][i] = imageData[p + 3];
        }
        return channels;
    }

    function rawChannelPart(channel) {
        const header = new Uint8Array(2);
        return [header, channel];
    }

    function buildPsd(exportDoc) {
        const width = exportDoc.width;
        const height = exportDoc.height;
        const layerRecords = [];
        const layerPixelParts = [];
        // Card Maker stores layers in draw order: bottom/base first, topmost last.
        // Keep that order for Photoshop so each later layer is placed above the previous one.
        const psdLayers = exportDoc.layers.slice();
        const channelByteLength = width * height;

        for (let i = 0; i < psdLayers.length; i++) {
            const layer = psdLayers[i];
            const record = [];
            pushI32BE(record, 0);
            pushI32BE(record, 0);
            pushI32BE(record, height);
            pushI32BE(record, width);
            pushU16BE(record, 4);
            pushI16BE(record, 0);
            pushU32BE(record, 2 + channelByteLength);
            pushI16BE(record, 1);
            pushU32BE(record, 2 + channelByteLength);
            pushI16BE(record, 2);
            pushU32BE(record, 2 + channelByteLength);
            pushI16BE(record, -1);
            pushU32BE(record, 2 + channelByteLength);
            pushAscii(record, "8BIM");
            pushAscii(record, "norm");
            record.push(255);
            record.push(0);
            record.push(0);
            record.push(layer.visible ? 0 : 2);

            const extraParts = [];
            const emptyLength = new Uint8Array(4);
            extraParts.push(emptyLength, emptyLength, psdPascalName(layer.name));
            const extraData = concatUint8Arrays(extraParts);
            pushU32BE(record, extraData.length);
            layerRecords.push(new Uint8Array(record), extraData);

            const channels = imageDataChannels(layer.canvas);
            for (let ch = 0; ch < channels.length; ch++) {
                const parts = rawChannelPart(channels[ch]);
                layerPixelParts.push(parts[0], parts[1]);
            }
        }

        const layerInfoBody = [];
        const layerCount = [];
        pushI16BE(layerCount, psdLayers.length);
        layerInfoBody.push(new Uint8Array(layerCount));
        Array.prototype.push.apply(layerInfoBody, layerRecords);
        Array.prototype.push.apply(layerInfoBody, layerPixelParts);
        let layerInfo = concatUint8Arrays(layerInfoBody);
        if (layerInfo.length % 2) {
            layerInfo = concatUint8Arrays([layerInfo, new Uint8Array(1)]);
        }

        const layerMaskParts = [];
        const layerInfoLength = [];
        pushU32BE(layerInfoLength, layerInfo.length);
        layerMaskParts.push(new Uint8Array(layerInfoLength), layerInfo, new Uint8Array(4));
        const layerMaskBody = concatUint8Arrays(layerMaskParts);

        const header = [];
        pushAscii(header, "8BPS");
        pushU16BE(header, 1);
        header.push(0, 0, 0, 0, 0, 0);
        pushU16BE(header, 4);
        pushU32BE(header, height);
        pushU32BE(header, width);
        pushU16BE(header, 8);
        pushU16BE(header, 3);

        const emptySection = new Uint8Array(4);
        const layerMaskLength = [];
        pushU32BE(layerMaskLength, layerMaskBody.length);

        const compositeChannels = imageDataChannels(exportDoc.preview);
        const compositeParts = [new Uint8Array(2)];
        for (let i = 0; i < compositeChannels.length; i++) {
            compositeParts.push(compositeChannels[i]);
        }

        return concatUint8Arrays([
            new Uint8Array(header),
            emptySection,
            emptySection,
            new Uint8Array(layerMaskLength),
            layerMaskBody
        ].concat(compositeParts));
    }

    async function clickExportLayerPngZip() {
        try {
            const exportDoc = await buildLayerExportDocument();
            const entries = [];
            const layerFiles = [];
            const previewFile = "preview.png";

            entries.push({
                name: previewFile,
                data: await canvasToPngBytes(exportDoc.preview)
            });

            for (let i = 0; i < exportDoc.layers.length; i++) {
                const layer = exportDoc.layers[i];
                const file = "layers/" + padNumber(i, 3) + "-" + sanitizeFilePart(layer.name, "layer") + ".png";
                layerFiles.push(file);
                entries.push({
                    name: file,
                    data: await canvasToPngBytes(layer.canvas)
                });
            }

            entries.unshift({
                name: "manifest.json",
                data: utf8Bytes(JSON.stringify(buildManifest(exportDoc, layerFiles, previewFile), null, 2))
            });

            downloadBlob(buildZip(entries), "card-layers.zip");
        } catch (error) {
            console.error("Layer PNG ZIP export failed", error);
            window.alert("Layer PNG ZIP export failed: " + error.message);
        }
    }

    async function clickExportPsd() {
        try {
            const exportDoc = await buildLayerExportDocument();
            const psdBytes = buildPsd(exportDoc);
            downloadBlob(new Blob([psdBytes], { type: "image/vnd.adobe.photoshop" }), "card-layers.psd");
        } catch (error) {
            console.error("PSD export failed", error);
            window.alert("PSD export failed: " + error.message);
        }
    }

    window.tmExport = {
        buildLayerExportDocument: buildLayerExportDocument,
        clickExportLayerPngZip: clickExportLayerPngZip,
        clickExportPsd: clickExportPsd
    };
    window.clickExportLayerPngZip = clickExportLayerPngZip;
    window.clickExportPsd = clickExportPsd;
})();
