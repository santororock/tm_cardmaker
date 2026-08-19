(function(global) {
    "use strict";

    const defaults = Object.freeze({
        hue: 0,
        saturation: 100,
        lightness: 100,
        gamma: 100
    });

    function numberOrDefault(value, defaultValue) {
        const num = Number(value);
        return Number.isFinite(num) ? num : defaultValue;
    }

    function isUserImageLayer(layer) {
        return !!layer && (layer.type === "userFile" || layer.type === "embedded" || layer.type === "webFile");
    }

    function ensureDefaults(layer) {
        if (!layer || (layer.type !== "block" && !isUserImageLayer(layer))) return;
        for (const key in defaults) {
            if (layer[key] === undefined || layer[key] === "") layer[key] = defaults[key];
        }
    }

    function getFilter(layer) {
        const hue = numberOrDefault(layer.hue, defaults.hue);
        const saturation = numberOrDefault(layer.saturation, defaults.saturation);
        const lightness = numberOrDefault(layer.lightness, defaults.lightness);
        if (hue === 0 && saturation === 100 && lightness === 100) return "none";
        return "hue-rotate(" + hue + "deg) saturate(" + saturation + "%) brightness(" + lightness + "%)";
    }

    function getGamma(layer) {
        return Math.max(1, numberOrDefault(layer.gamma, defaults.gamma));
    }

    function applyGamma(canvas, gammaPercent) {
        if (gammaPercent === 100) return;
        const gamma = gammaPercent / 100;
        const ctx = canvas.getContext("2d");
        let imageData;
        try {
            imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        } catch (error) {
            return;
        }
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            data[i] = 255 * Math.pow(data[i] / 255, gamma);
            data[i + 1] = 255 * Math.pow(data[i + 1] / 255, gamma);
            data[i + 2] = 255 * Math.pow(data[i + 2] / 255, gamma);
        }
        ctx.putImageData(imageData, 0, 0);
    }

    function createAdjustedCanvas(width, height, layer, drawSource) {
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(width));
        canvas.height = Math.max(1, Math.round(height));
        const ctx = canvas.getContext("2d");
        ctx.filter = getFilter(layer);
        drawSource(ctx, canvas.width, canvas.height);
        ctx.filter = "none";
        applyGamma(canvas, getGamma(layer));
        return canvas;
    }

    global.TMCardMakerImageAdjustments = Object.freeze({
        defaults,
        numberOrDefault,
        isUserImageLayer,
        ensureDefaults,
        getFilter,
        getGamma,
        applyGamma,
        createAdjustedCanvas
    });
})(window);

// Drawing routines for generated text, production, effect, and line layers.
(function(global) {
    "use strict";

    function drawText(ctx, layer) {
        ctx.save();
        ctx.textAlign = layer.justify;
        if (!layer.style) layer.style = "normal";
        ctx.font = layer.style + " " + layer.weight + " " + layer.height + "px " + layer.font;
        ctx.fillStyle = layer.color;
        if (layer.angle && layer.angle !== 0) {
            ctx.translate(layer.x, layer.y);
            ctx.rotate(Math.PI * layer.angle / 180);
        }
        const lines = layer.data.split("\n");
        let count = 0;
        for (let line = 0; line < lines.length; line++) {
            const words = lines[line].split(" ");
            while (words.length) {
                let output = words.shift();
                while (words.length && ctx.measureText(output + " " + words[0]).width < layer.width) {
                    output += " " + words.shift();
                }
                if (layer.angle && layer.angle !== 0) ctx.fillText(output, 0, (layer.height + layer.lineSpace) * count);
                else ctx.fillText(output, layer.x, layer.y + (layer.height + layer.lineSpace) * count);
                count++;
            }
        }
        ctx.restore();
    }

    function drawProduction(ctx, layer, tileImage) {
        const size = 20;
        const border = 3;
        const xPos = Number(layer.x);
        const yPos = Number(layer.y);
        const width = Number(layer.width);
        const height = Number(layer.height);
        const remainderWidth = width % size;
        const remainderHeight = height % size;
        for (let x = xPos; x <= xPos + width; x += size) {
            for (let y = yPos; y <= yPos + height; y += size) {
                if (x <= xPos + width - size && y <= yPos + height - size) ctx.drawImage(tileImage, x, y, size, size);
                else if (x > xPos + width - size && y > yPos + height - size) ctx.drawImage(tileImage, 0, 0, remainderWidth, remainderHeight, x, y, remainderWidth, remainderHeight);
                else if (x > xPos + width - size) ctx.drawImage(tileImage, 0, 0, remainderWidth, size, x, y, remainderWidth, size);
                else if (y > yPos + height - size) ctx.drawImage(tileImage, 0, 0, size, remainderHeight, x, y, size, remainderHeight);
            }
        }
        let gradient = ctx.createLinearGradient(0, yPos, 0, yPos + height);
        gradient.addColorStop(0, "#9d6c43");
        gradient.addColorStop(1, "#5a412c");
        ctx.fillStyle = gradient;
        ctx.fillRect(xPos, yPos + border, width, border);
        ctx.fillRect(xPos, yPos + height - border * 2, width, border);
        ctx.fillRect(xPos + border, yPos, border, height);
        ctx.fillRect(xPos + width - border * 2, yPos, border, height);
        gradient = ctx.createLinearGradient(0, yPos, 0, yPos + height);
        gradient.addColorStop(0, "#505050");
        gradient.addColorStop(1, "#c0c0c0");
        ctx.fillStyle = gradient;
        ctx.fillRect(xPos, yPos, width, border);
        ctx.fillRect(xPos, yPos + height - border, width, border);
        ctx.fillRect(xPos, yPos, border, height);
        ctx.fillRect(xPos + width - border, yPos, border, height);
    }

    function drawEffect(ctx, layer) {
        const border = 5;
        const xPos = Number(layer.x);
        const yPos = Number(layer.y);
        const width = Number(layer.width);
        const height = Number(layer.height);
        let gradient = ctx.createLinearGradient(xPos, yPos, xPos + width, yPos);
        const borderStops = [0, 0.1, 0.2, 0.3, 0.4, 0.6, 0.68, 0.76, 0.84, 0.92];
        const colors = ["#333333", "#999999"];
        for (let i = 0; i < borderStops.length; i++) gradient.addColorStop(borderStops[i], colors[i % 2]);
        gradient.addColorStop(1, "#777777");
        ctx.fillStyle = gradient;
        ctx.fillRect(xPos, yPos, width, height);
        gradient = ctx.createLinearGradient(xPos + border, yPos + border, xPos + width - border, yPos + height - border);
        const centerStops = [0, 0.07, 0.25, 0.6, 0.85, 1.0];
        const centerColors = ["#ffffff", "#999999"];
        for (let i = 0; i < centerStops.length; i++) gradient.addColorStop(centerStops[i], centerColors[i % 2]);
        ctx.fillStyle = gradient;
        ctx.fillRect(xPos + border, yPos + border, width - 2 * border, height - 2 * border);
    }

    function drawLine(ctx, layer) {
        ctx.lineWidth = layer.width;
        ctx.strokeStyle = layer.color;
        ctx.translate(layer.x, layer.y);
        ctx.rotate(Math.PI * layer.angle / 180);
        ctx.moveTo(0, 0);
        ctx.lineTo(layer.len, 0);
        ctx.stroke();
    }

    global.TMCardMakerCanvasPrimitives = Object.freeze({ drawText, drawProduction, drawEffect, drawLine });
})(window);

// Drawing routines for block art and user-supplied images.
(function(global) {
    "use strict";

    function drawBlock(ctx, layer, dependencies) {
        const block = dependencies.blocks[layer.iNum] || {};
        const angle = Number(layer.angle) || 0;
        const x = Number(layer.x) || 0;
        const y = Number(layer.y) || 0;
        const width = Number(layer.width) || 0;
        const height = Number(layer.height) || 0;
        const spritePadX = Number(block.otherbgPadX);
        const spritePadY = Number(block.otherbgPadY);
        const layerPadX = Number(layer.obgPadX);
        const layerPadY = Number(layer.obgPadY);
        const padX = layer.obg && block.otherbg ? (Number.isFinite(layerPadX) ? layerPadX : (Number.isFinite(spritePadX) ? spritePadX : 3)) : 0;
        const padY = layer.obg && block.otherbg ? (Number.isFinite(layerPadY) ? layerPadY : (Number.isFinite(spritePadY) ? spritePadY : 3)) : 0;
        ctx.save();
        if (angle !== 0) {
            ctx.translate(x + width / 2, y + height / 2);
            ctx.rotate(Math.PI * angle / 180);
            ctx.translate(-width / 2, -height / 2);
        } else ctx.translate(x, y);

        function drawContents(targetCtx) {
            if (layer.obg && block.otherbg) {
                const background = dependencies.getOtherBackground(block.otherbg);
                if (!background) {
                    const index = dependencies.findOtherBackgroundIndex(block.otherbg);
                    if (index !== -1) dependencies.fetchBlock(index);
                    else console.warn("otherbg image not found for", block.otherbg, block);
                } else if (background.complete) targetCtx.drawImage(background, -padX, -padY, width + 2 * padX, height + 2 * padY);
            }
            if (!block.obj) dependencies.fetchBlock(layer.iNum);
            else if (block.obj.complete) targetCtx.drawImage(block.obj, 0, 0, width, height);
        }

        if (dependencies.adjustments.getGamma(layer) !== 100) {
            const adjusted = dependencies.adjustments.createAdjustedCanvas(width + 2 * padX, height + 2 * padY, layer, function(targetCtx) {
                targetCtx.save();
                targetCtx.translate(padX, padY);
                drawContents(targetCtx);
                targetCtx.restore();
            });
            ctx.drawImage(adjusted, -padX, -padY, width + 2 * padX, height + 2 * padY);
        } else {
            ctx.filter = dependencies.adjustments.getFilter(layer);
            drawContents(ctx);
        }
        ctx.restore();
    }

    function drawUserImage(ctx, layer, dependencies) {
        if (layer.iNum === -1 || !dependencies.userImages[layer.iNum]) return;
        dependencies.adjustments.ensureDefaults(layer);
        if (layer.angle === undefined) layer.angle = 0;
        const angle = Number(layer.angle) || 0;
        const x = Number(layer.x) || 0;
        const y = Number(layer.y) || 0;
        const width = Number(layer.width) || 0;
        const height = Number(layer.height) || 0;
        ctx.save();
        if (angle !== 0) {
            ctx.translate(x + width / 2, y + height / 2);
            ctx.rotate(Math.PI * angle / 180);
        }
        if (dependencies.adjustments.getGamma(layer) !== 100) {
            const adjusted = dependencies.adjustments.createAdjustedCanvas(width, height, layer, function(targetCtx, targetWidth, targetHeight) {
                targetCtx.drawImage(dependencies.userImages[layer.iNum], layer.sx, layer.sy, layer.swidth, layer.sheight, 0, 0, targetWidth, targetHeight);
            });
            ctx.drawImage(adjusted, angle !== 0 ? -width / 2 : x, angle !== 0 ? -height / 2 : y, width, height);
        } else {
            ctx.filter = dependencies.adjustments.getFilter(layer);
            ctx.drawImage(dependencies.userImages[layer.iNum], layer.sx, layer.sy, layer.swidth, layer.sheight, angle !== 0 ? -width / 2 : x, angle !== 0 ? -height / 2 : y, width, height);
        }
        ctx.restore();
    }

    global.TMCardMakerCanvasImages = Object.freeze({ drawBlock, drawUserImage });
})(window);

// Ordered compositing of every supported layer type onto the card canvas.
(function(global) {
    "use strict";

    function renderProject(options) {
        const canvas = options.canvas;
        const ctx = canvas.getContext("2d");
        const layers = options.layers;
        const model = global.TMCardMakerLayerModel;
        const primitives = global.TMCardMakerCanvasPrimitives;
        const images = global.TMCardMakerCanvasImages;
        for (let i = 0; i < layers.length; i++) {
            const layer = layers[i];
            if (layer.type === "base") {
                canvas.height = layer.height;
                canvas.width = layer.width;
                if (model.isVisible(layer) && model.getOpacity(layer) > 0) {
                    ctx.save();
                    ctx.globalAlpha = model.getOpacity(layer);
                    ctx.fillStyle = layer.color;
                    ctx.fillRect(0, 0, layer.width, layer.height);
                    ctx.restore();
                }
                continue;
            }
            if (layer.type === "block" && i === 0) {
                canvas.height = layer.height;
                canvas.width = layer.width;
                ctx.save();
                ctx.beginPath();
                ctx.rect(0, 0, layer.width, layer.height);
                ctx.clip();
            }
            if (!model.isVisible(layer) || model.getOpacity(layer) <= 0) continue;
            ctx.save();
            ctx.globalAlpha = model.getOpacity(layer);
            switch (layer.type) {
                case "block": images.drawBlock(ctx, layer, options.imageDependencies); break;
                case "text": primitives.drawText(ctx, layer); break;
                case "production": primitives.drawProduction(ctx, layer, options.productionTile); break;
                case "effect": primitives.drawEffect(ctx, layer); break;
                case "userFile":
                case "embedded":
                case "webFile": images.drawUserImage(ctx, layer, options.imageDependencies); break;
                case "line": primitives.drawLine(ctx, layer); break;
                default: options.onInvalidLayer(layer); break;
            }
            ctx.restore();
        }
        ctx.restore();
    }

    global.TMCardMakerCanvasRenderer = Object.freeze({ renderProject });
})(window);
