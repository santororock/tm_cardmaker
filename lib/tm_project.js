(function(global) {
    "use strict";

    function create() {
        let layersById = {};
        let layerOrder = [];

        function getLayers() {
            return layersById;
        }

        function getOrder() {
            return layerOrder.slice();
        }

        function getLayer(id) {
            return layersById[id];
        }

        function getOrderedLayers() {
            return layerOrder.map(function(id) {
                return layersById[id];
            }).filter(Boolean);
        }

        function add(id, layer) {
            layersById[id] = layer;
            if (layerOrder.indexOf(id) === -1) layerOrder.push(id);
            return layer;
        }

        function remove(id) {
            delete layersById[id];
            layerOrder = layerOrder.filter(function(layerId) {
                return layerId !== id;
            });
        }

        function reorder(orderedIds) {
            const knownIds = orderedIds.filter(function(id) {
                return !!layersById[id];
            });
            const missingIds = layerOrder.filter(function(id) {
                return knownIds.indexOf(id) === -1 && !!layersById[id];
            });
            layerOrder = knownIds.concat(missingIds);
        }

        function reset() {
            layersById = {};
            layerOrder = [];
            return layersById;
        }

        function replace(layers, orderedIds) {
            layersById = layers || {};
            layerOrder = [];
            reorder((orderedIds && orderedIds.length) ? orderedIds : Object.keys(layersById));
            return layersById;
        }

        return Object.freeze({
            getLayers,
            getOrder,
            getLayer,
            getOrderedLayers,
            add,
            remove,
            reorder,
            reset,
            replace
        });
    }

    global.TMCardMakerProjectState = Object.freeze({ create });
})(window);

// Shared layer defaults used by the editor, renderer, and exporter.
(function(global) {
    "use strict";

    const DEFAULT_OPACITY_PERCENT = 100;

    function isVisible(layer) {
        return !layer || layer.visible !== false;
    }

    function getOpacity(layer) {
        if (!layer || layer.alpha === undefined || layer.alpha === "") return 1;
        const alpha = Number(layer.alpha);
        if (!Number.isFinite(alpha)) return 1;
        return Math.max(0, Math.min(1, alpha / 100));
    }

    function normalize(layer) {
        if (!layer) return layer;
        if (layer.visible === undefined) layer.visible = true;
        if (layer.alpha === undefined || layer.alpha === "") layer.alpha = DEFAULT_OPACITY_PERCENT;
        return layer;
    }

    function clone(layer) {
        return normalize(JSON.parse(JSON.stringify(layer)));
    }

    global.TMCardMakerLayerModel = Object.freeze({
        DEFAULT_OPACITY_PERCENT,
        isVisible,
        getOpacity,
        normalize,
        clone
    });
})(window);

// Undo and redo snapshots for project layers and their stacking order.
(function(global) {
    "use strict";

    function create(options) {
        let entries = [];
        let index = -1;
        let maxSteps = options.maxSteps || 50;

        function clone(value) { return JSON.parse(JSON.stringify(value)); }
        function current() { return index >= 0 ? entries[index] : null; }
        function clear() { entries = []; index = -1; }
        function capture(layers, layerOrder, label) {
            const previous = current();
            if (previous &&
                JSON.stringify(previous.layers) === JSON.stringify(layers) &&
                JSON.stringify(previous.layerOrder) === JSON.stringify(layerOrder)) return false;
            if (index < entries.length - 1) entries = entries.slice(0, index + 1);
            entries.push({ layers: clone(layers), layerOrder: layerOrder.slice(), label: label || "Action" });
            if (entries.length > maxSteps) entries.shift();
            else index++;
            return true;
        }
        function undo() {
            if (index <= 0) return null;
            index--;
            return clone(current());
        }
        function redo() {
            if (index >= entries.length - 1) return null;
            index++;
            return clone(current());
        }
        function setMaxSteps(value) {
            maxSteps = value;
            if (entries.length > maxSteps) {
                const excess = entries.length - maxSteps;
                entries = entries.slice(excess);
                index = Math.max(-1, index - excess);
            }
        }
        function getCurrent() { return current() ? clone(current()) : null; }
        function getInfo() { return { index, length: entries.length, maxSteps }; }

        return Object.freeze({ clear, capture, undo, redo, setMaxSteps, getCurrent, getInfo });
    }

    global.TMCardMakerHistory = Object.freeze({ create });
})(window);

// Conversion between live layers and save-safe project JSON.
(function(global) {
    "use strict";

    function toJson(data) {
        return JSON.stringify(data).replace(/[\u007F-\uFFFF]/g, function(chr) {
            return "\\u" + ("0000" + chr.charCodeAt(0).toString(16)).slice(-4);
        });
    }

    function makeSaveableLayers(layers, dependencies) {
        const saved = [];
        for (const layer of layers) {
            const copy = Object.assign({}, layer);
            if (copy.type === "block") {
                if (copy.iNum !== undefined && copy.iNum !== null && copy.iNum !== -1) {
                    const src = dependencies.resolveBlockSrc(copy.iNum);
                    if (src) copy.src = src;
                }
                delete copy.iNum;
            } else if (copy.type === "userFile" || copy.type === "embedded") {
                if (copy.iNum !== undefined && copy.iNum !== null && copy.iNum !== -1) {
                    const meta = dependencies.getUserImageMeta(copy.iNum);
                    if (meta) {
                        if (!copy.cacheId && meta.cacheId) copy.cacheId = meta.cacheId;
                        if (!copy.filename && meta.filename) copy.filename = meta.filename;
                    }
                }
            }
            saved.push(copy);
        }
        return saved;
    }

    function serializeLayers(layers, dependencies) {
        return toJson(makeSaveableLayers(layers, dependencies));
    }

    global.TMCardMakerProjectSerializer = Object.freeze({
        toJson,
        makeSaveableLayers,
        serializeLayers
    });
})(window);

// Saved-project validation and compatibility helpers.
(function(global) {
    "use strict";

    const GENERATED_LAYER_TYPES = Object.freeze(["block", "text", "production", "effect", "line"]);
    const IMAGE_LAYER_TYPES = Object.freeze(["embedded", "webFile", "userFile"]);

    function getSavedLayers(savedProject) {
        if (Array.isArray(savedProject)) return savedProject;
        if (savedProject && Array.isArray(savedProject.layers)) return savedProject.layers;
        if (savedProject && savedProject.project && Array.isArray(savedProject.project.layers)) {
            return savedProject.project.layers;
        }
        throw new TypeError("Project data must contain a layers array.");
    }

    function normalize(savedProject) {
        return getSavedLayers(savedProject).map(function(savedLayer) {
            const layer = Object.assign({}, savedLayer);
            return global.TMCardMakerLayerModel.normalize(layer);
        });
    }

    function getLayerKind(layer) {
        if (!layer) return "invalid";
        if (GENERATED_LAYER_TYPES.indexOf(layer.type) !== -1) return "generated";
        if (IMAGE_LAYER_TYPES.indexOf(layer.type) !== -1) return "image";
        if (layer.type === "base") return "base";
        return "invalid";
    }

    function getBlockReference(layer) {
        if (layer.src !== undefined && layer.src !== null) return layer.src;
        if (typeof layer.iNum === "number") return layer.iNum;
        return layer.iNum || layer.src;
    }

    function copyProperties(target, source, options) {
        const settings = options || {};
        const ignored = settings.ignored || [];
        const scale = settings.scale || {};
        Object.keys(source).forEach(function(key) {
            if (ignored.indexOf(key) !== -1) return;
            target[key] = scale[key] ? scale[key] * source[key] : source[key];
        });
        return target;
    }

    function hasLegacyCardSize(layer) {
        return Object.keys(layer).some(function(key) {
            return layer[key] == 1050;
        });
    }

    global.TMCardMakerProjectLoader = Object.freeze({
        GENERATED_LAYER_TYPES,
        IMAGE_LAYER_TYPES,
        normalize,
        getLayerKind,
        getBlockReference,
        copyProperties,
        hasLegacyCardSize
    });
})(window);
