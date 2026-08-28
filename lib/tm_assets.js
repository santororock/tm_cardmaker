(function(global) {
    "use strict";
    const DB_NAME = "tm_cardmaker_user_images";
    const DB_VERSION = 1;
    const STORE = "images";
    let dbPromise = null;

    function supports() { return typeof indexedDB !== "undefined"; }
    function open() {
        if (!supports()) return Promise.resolve(null);
        if (dbPromise) return dbPromise;
        dbPromise = new Promise(function(resolve, reject) {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onupgradeneeded = function(event) {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(STORE)) {
                    const store = db.createObjectStore(STORE, { keyPath: "id" });
                    store.createIndex("updatedAt", "updatedAt", { unique: false });
                }
            };
            request.onsuccess = event => resolve(event.target.result);
            request.onerror = event => reject(event.target.error || new Error("Failed to open IndexedDB"));
        });
        return dbPromise;
    }
    function bytesToHex(bytes) {
        let output = "";
        for (const byte of bytes) output += byte.toString(16).padStart(2, "0");
        return output;
    }
    async function createId(blob) {
        if (!blob) return "img_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 10);
        const buffer = await blob.arrayBuffer();
        if (crypto && crypto.subtle && crypto.subtle.digest) {
            return "img_sha256_" + bytesToHex(new Uint8Array(await crypto.subtle.digest("SHA-256", buffer)));
        }
        let hash = 0x811c9dc5;
        for (const byte of new Uint8Array(buffer)) { hash ^= byte; hash = Math.imul(hash, 0x01000193) >>> 0; }
        return "img_fnv1a32_" + hash.toString(16).padStart(8, "0");
    }
    function put(id, filename, blob) {
        if (!id || !blob || !supports()) return Promise.resolve(false);
        return open().then(db => new Promise(function(resolve, reject) {
            const tx = db.transaction([STORE], "readwrite");
            tx.objectStore(STORE).put({ id, filename: filename || "", mimeType: blob.type || "", size: blob.size || 0, updatedAt: Date.now(), blob });
            tx.oncomplete = () => resolve(true);
            tx.onerror = event => reject(event.target.error || new Error("Failed to cache image"));
        }));
    }
    function getAll() {
        if (!supports()) return Promise.resolve([]);
        return open().then(db => new Promise(function(resolve, reject) {
            const request = db.transaction([STORE], "readonly").objectStore(STORE).getAll();
            request.onsuccess = event => resolve(event.target.result || []);
            request.onerror = event => reject(event.target.error || new Error("Failed to read cached images"));
        }));
    }
    function clear() {
        if (!supports()) return Promise.resolve(false);
        return open().then(db => new Promise(function(resolve, reject) {
            const request = db.transaction([STORE], "readwrite").objectStore(STORE).clear();
            request.onsuccess = () => resolve(true);
            request.onerror = event => reject(event.target.error || new Error("Failed to clear cached images"));
        }));
    }
    global.TMCardMakerImageCacheStorage = Object.freeze({ supports, createId, put, getAll, clear });
})(window);

// User-image cache UI and editor coordination.
const USER_IMAGE_CACHE_WARNING_MB_KEY = "tm_cm_user_image_cache_warning_mb";
var userImageCacheIndexById = {};
var userImageMetaList = [];
var userImageCacheWarningWasAbove = false;
var cacheSheetObjectUrls = [];
var cacheSheetSelectMode = false;

function supportsUserImageCache() {
    return TMCardMakerImageCacheStorage.supports();
}

async function createDeterministicCacheIdFromBlob(blob) {
    return TMCardMakerImageCacheStorage.createId(blob);
}

function canvasToBlob(canvasObj, mimeType) {
    return new Promise(function(resolve) {
        if (!canvasObj || typeof canvasObj.toBlob !== "function") {
            resolve(null);
            return;
        }
        canvasObj.toBlob(function(blob) {
            resolve(blob || null);
        }, mimeType || "image/png");
    });
}

function normalizeUserImageFilename(name) {
    if (!name) return "";
    const strName = String(name);
    const pieces = strName.split(/[\\/]/);
    const base = pieces[pieces.length - 1] || "";
    return base.trim().toLowerCase();
}

function resolveCachedUserImageIndex(layer) {
    if (!layer) return -1;

    if (layer.cacheId && (userImageCacheIndexById[layer.cacheId] !== undefined)) {
        return userImageCacheIndexById[layer.cacheId];
    }

    const wanted = normalizeUserImageFilename(layer.filename);
    if (!wanted) return -1;

    for (let i = 0; i < userImageMetaList.length; i++) {
        const meta = userImageMetaList[i];
        if (!meta) continue;
        const have = normalizeUserImageFilename(meta.filename);
        if (have && have === wanted && userImageList[i]) {
            return i;
        }
    }

    return -1;
}

async function persistCanvasToUserImageCache(canvasObj, cacheId, filename) {
    if (!canvasObj || !supportsUserImageCache()) {
        return { cacheId: cacheId || "", size: 0, persisted: false };
    }

    try {
        const blob = await canvasToBlob(canvasObj, "image/png");
        if (!blob) {
            return { cacheId: cacheId || "", size: 0, persisted: false };
        }

        let resolvedCacheId = cacheId || "";
        if (!resolvedCacheId) {
            resolvedCacheId = await createDeterministicCacheIdFromBlob(blob);
        }

        await putCachedUserImage(resolvedCacheId, filename || "", blob);
        refreshUserImageCacheUsage();
        return { cacheId: resolvedCacheId, size: blob.size || 0, persisted: true };
    } catch (error) {
        console.error("Failed to cache embedded canvas image", error);
        return { cacheId: cacheId || "", size: 0, persisted: false };
    }
}

function formatByteSize(bytes) {
    if (!bytes || bytes < 0) return "0 B";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + " MB";
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
}

function sanitizeIntegerString(value) {
    if (value === undefined || value === null) return "";
    const digits = String(value).replace(/\D/g, "");
    if (!digits.length) return "";
    const parsed = parseInt(digits, 10);
    if (!isFinite(parsed) || parsed < 0) return "";
    return String(parsed);
}

function getUserImageCacheWarningThresholdMb() {
    const inputEl = document.getElementById("cacheWarningThresholdMb");
    if (inputEl) {
        const cleaned = sanitizeIntegerString(inputEl.value);
        if (cleaned !== "") return parseInt(cleaned, 10);
    }
    const stored = localStorage.getItem(USER_IMAGE_CACHE_WARNING_MB_KEY);
    const cleanedStored = sanitizeIntegerString(stored);
    if (cleanedStored === "") return 0;
    return parseInt(cleanedStored, 10);
}

function setUserImageCacheWarningThreshold(inputEl) {
    let cleaned = "";
    if (inputEl && inputEl.value !== undefined) {
        cleaned = sanitizeIntegerString(inputEl.value);
        inputEl.value = cleaned;
    } else {
        const domInput = document.getElementById("cacheWarningThresholdMb");
        if (domInput) {
            cleaned = sanitizeIntegerString(domInput.value);
            domInput.value = cleaned;
        }
    }

    if (cleaned === "") {
        localStorage.removeItem(USER_IMAGE_CACHE_WARNING_MB_KEY);
        userImageCacheWarningWasAbove = false;
    } else {
        localStorage.setItem(USER_IMAGE_CACHE_WARNING_MB_KEY, cleaned);
    }
    refreshUserImageCacheUsage();
}

function initializeUserImageCacheWarningThresholdInput() {
    const inputEl = document.getElementById("cacheWarningThresholdMb");
    if (!inputEl) return;
    const stored = localStorage.getItem(USER_IMAGE_CACHE_WARNING_MB_KEY);
    const cleaned = sanitizeIntegerString(stored);
    inputEl.value = cleaned;
}

function updateUserImageCacheWarningStatus(totalBytes) {
    const warningEl = document.getElementById("cacheWarningStatus");
    const thresholdMb = getUserImageCacheWarningThresholdMb();

    if (!warningEl) return;

    if (!thresholdMb || thresholdMb <= 0) {
        warningEl.innerText = "Warning threshold disabled";
        userImageCacheWarningWasAbove = false;
        return;
    }

    const thresholdBytes = thresholdMb * 1024 * 1024;
    const isAbove = totalBytes >= thresholdBytes;

    if (isAbove) {
        warningEl.innerText = "Warning: cache is above " + thresholdMb + " MB";
        if (!userImageCacheWarningWasAbove) {
            window.alert("Image cache warning: current cache size (" + formatByteSize(totalBytes) + ") exceeds your threshold (" + thresholdMb + " MB).");
        }
    } else {
        warningEl.innerText = "Threshold " + thresholdMb + " MB (current below limit)";
    }

    userImageCacheWarningWasAbove = isAbove;
}

function putCachedUserImage(cacheId, filename, blob) {
    return TMCardMakerImageCacheStorage.put(cacheId, filename, blob);
}

function getAllCachedUserImageRecords() {
    return TMCardMakerImageCacheStorage.getAll();
}

function clearAllCachedUserImages() {
    return TMCardMakerImageCacheStorage.clear();
}

function cachedBlobToImage(blob) {
    return new Promise(function(resolve, reject) {
        if (!(blob instanceof Blob)) {
            reject(new Error("Invalid blob record"));
            return;
        }
        const objectUrl = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = function() {
            URL.revokeObjectURL(objectUrl);
            resolve(img);
        };
        img.onerror = function(err) {
            URL.revokeObjectURL(objectUrl);
            reject(err || new Error("Failed to decode cached image"));
        };
        img.src = objectUrl;
    });
}

async function refreshUserImageCacheUsage() {
    const statusEl = document.getElementById("cacheStatus");
    const sizeEl = document.getElementById("cacheSize");
    const clearBtn = document.getElementById("clearImageCacheBtn");
    const viewBtn = document.getElementById("viewCachedImagesBtn");

    if (!statusEl && !sizeEl && !clearBtn) return;

    if (!supportsUserImageCache()) {
        if (statusEl) statusEl.innerText = "IndexedDB not available";
        if (sizeEl) sizeEl.innerText = "Size: n/a";
        if (clearBtn) clearBtn.disabled = true;
        if (viewBtn) viewBtn.disabled = true;
        updateUserImageCacheWarningStatus(0);
        return;
    }

    try {
        const records = await getAllCachedUserImageRecords();
        let total = 0;
        for (let i = 0; i < records.length; i++) {
            const rec = records[i] || {};
            if (rec.size !== undefined && rec.size !== null) {
                total += Number(rec.size) || 0;
            } else if (rec.blob && rec.blob.size) {
                total += rec.blob.size;
            }
        }

        if (statusEl) {
            const label = (records.length === 1) ? "image" : "images";
            statusEl.innerText = records.length + " cached " + label;
        }
        if (sizeEl) {
            sizeEl.innerText = "Size: " + formatByteSize(total);
        }
        if (clearBtn) {
            clearBtn.disabled = (records.length === 0);
        }
        if (viewBtn) {
            viewBtn.disabled = (records.length === 0);
        }
        updateUserImageCacheWarningStatus(total);
    } catch (error) {
        if (statusEl) statusEl.innerText = "Cache status unavailable";
        if (sizeEl) sizeEl.innerText = "Size: n/a";
        if (clearBtn) clearBtn.disabled = false;
        if (viewBtn) viewBtn.disabled = false;
        updateUserImageCacheWarningStatus(0);
        console.error("Failed to refresh image cache usage", error);
    }
}

function hideCachedImageContactSheet(resetMode) {
    const modal = document.getElementById("cacheSheetModal");
    const grid = document.getElementById("cacheSheetGrid");
    const summary = document.getElementById("cacheSheetSummary");

    if (resetMode === undefined) resetMode = true;

    for (let i = 0; i < cacheSheetObjectUrls.length; i++) {
        try {
            URL.revokeObjectURL(cacheSheetObjectUrls[i]);
        } catch (error) {}
    }
    cacheSheetObjectUrls = [];

    if (grid) grid.innerHTML = "";
    if (summary) summary.innerText = "";
    if (resetMode) cacheSheetSelectMode = false;

    if (modal) {
        modal.classList.remove("w3-show");
        modal.classList.add("w3-nodisplay");
    }
}

function addCachedImageLayerByRecord(record) {
    if (!record || !record.id) return;

    function createLayerFromIndex(idx) {
        const imgObj = userImageList[idx];
        if (!imgObj) return;

        const layer = {
            type: "userFile",
            iNum: idx,
            x: 0,
            y: 0,
            width: imgObj.width,
            height: imgObj.height,
            alpha: 100,
            angle: 0,
            hue: 0,
            saturation: 100,
            lightness: 100,
            gamma: 100,
            sx: 0,
            sy: 0,
            swidth: imgObj.width,
            sheight: imgObj.height,
            params: "allimages clipimages allangle blockcolor",
            filename: record.filename || "Cached image",
            cacheId: record.id
        };

        addLayer("Local:" + layer.filename, layer);
        drawProject();
    }

    const knownIndex = userImageCacheIndexById[record.id];
    if (knownIndex !== undefined && knownIndex !== null && userImageList[knownIndex]) {
        createLayerFromIndex(knownIndex);
        return;
    }

    if (!record.blob) return;
    cachedBlobToImage(record.blob).then(function(imageObj) {
        const idx = userImageList.length;
        userImageList.push(imageObj);
        userImageCacheIndexById[record.id] = idx;
        userImageMetaList[idx] = {
            cacheId: record.id,
            filename: record.filename || "",
            size: Number(record.size || (record.blob && record.blob.size) || 0),
            persisted: true
        };
        createLayerFromIndex(idx);
    }).catch(function(error) {
        console.error("Failed to decode cached image for layer insertion", error);
        window.alert("Failed to load cached image.");
    });
}

function clickLoadCachedImage() {
    if (!supportsUserImageCache()) {
        window.alert("IndexedDB is not available in this browser.");
        return;
    }
    cacheSheetSelectMode = true;
    showCachedImageContactSheet();
}

async function showCachedImageContactSheet() {
    const modal = document.getElementById("cacheSheetModal");
    const grid = document.getElementById("cacheSheetGrid");
    const summary = document.getElementById("cacheSheetSummary");

    if (!modal || !grid || !summary) return;
    if (!supportsUserImageCache()) {
        window.alert("IndexedDB is not available in this browser.");
        return;
    }

    hideCachedImageContactSheet(false);
    modal.classList.remove("w3-nodisplay");
    modal.classList.add("w3-show");
    summary.innerText = "Loading cached images...";

    try {
        const records = await getAllCachedUserImageRecords();
        let total = 0;
        for (let i = 0; i < records.length; i++) {
            const rec = records[i] || {};
            total += Number(rec.size || (rec.blob && rec.blob.size) || 0);
        }

        if (!records.length) {
            summary.innerText = "No cached images found.";
            return;
        }

        if (cacheSheetSelectMode) {
            summary.innerText = "Select an image to add as a layer • " + records.length + " image" + (records.length === 1 ? "" : "s") + " • " + formatByteSize(total);
        } else {
            summary.innerText = records.length + " image" + (records.length === 1 ? "" : "s") + " • " + formatByteSize(total);
        }

        records.sort(function(a, b) {
            return Number(b.updatedAt || 0) - Number(a.updatedAt || 0);
        });

        for (let i = 0; i < records.length; i++) {
            const rec = records[i];
            if (!rec || !rec.blob) continue;

            const card = document.createElement("div");
            card.className = "cached-image-card";
            card.style.padding = "6px";
            if (cacheSheetSelectMode) {
                card.style.cursor = "pointer";
                card.onclick = function() {
                    addCachedImageLayerByRecord(rec);
                    hideCachedImageContactSheet();
                };
            }

            const url = URL.createObjectURL(rec.blob);
            cacheSheetObjectUrls.push(url);

            const img = document.createElement("img");
            img.src = url;
            img.alt = rec.filename || rec.id;
            img.style.width = "100%";
            img.style.height = "110px";
            img.style.objectFit = "contain";
            img.style.display = "block";

            const name = document.createElement("div");
            name.style.fontSize = "11px";
            name.style.wordBreak = "break-word";
            name.innerText = rec.filename || rec.id;

            const meta = document.createElement("div");
            meta.style.fontSize = "10px";
            meta.innerText = formatByteSize(Number(rec.size || (rec.blob && rec.blob.size) || 0));

            card.appendChild(img);
            card.appendChild(name);
            card.appendChild(meta);
            grid.appendChild(card);
        }
    } catch (error) {
        summary.innerText = "Failed to load cached images.";
        console.error("showCachedImageContactSheet failed", error);
    }
}

async function initializeUserImageCache() {
    initializeUserImageCacheWarningThresholdInput();

    if (!supportsUserImageCache()) {
        refreshUserImageCacheUsage();
        return;
    }

    try {
        const records = await getAllCachedUserImageRecords();
        for (let i = 0; i < records.length; i++) {
            const record = records[i];
            if (!record || !record.id || !record.blob) continue;
            try {
                const imageObj = await cachedBlobToImage(record.blob);
                const idx = userImageList.length;
                userImageList.push(imageObj);
                userImageCacheIndexById[record.id] = idx;
                userImageMetaList[idx] = {
                    cacheId: record.id,
                    filename: record.filename || "",
                    size: record.size || (record.blob && record.blob.size) || 0,
                    persisted: true
                };
            } catch (decodeError) {
                console.error("Failed to restore cached image", record.id, decodeError);
            }
        }
    } catch (error) {
        console.error("Failed to initialize user image cache", error);
    }

    refreshUserImageCacheUsage();
}

async function clearCachedUserImages() {
    if (!supportsUserImageCache()) {
        window.alert("IndexedDB is not available in this browser.");
        return;
    }
    if (!confirm("Clear cached user images from browser storage?")) return;

    try {
        await clearAllCachedUserImages();
        hideCachedImageContactSheet();
        userImageCacheIndexById = {};
        for (let i = 0; i < userImageMetaList.length; i++) {
            if (!userImageMetaList[i]) continue;
            userImageMetaList[i].cacheId = "";
            userImageMetaList[i].persisted = false;
        }
        for (let k in aLayers) {
            const layer = aLayers[k];
            if (!layer || layer.type !== "userFile") continue;
            delete layer.cacheId;
        }
        refreshUserImageCacheUsage();
        drawProject();
    } catch (error) {
        window.alert("Failed to clear cached images.");
        console.error("clearCachedUserImages failed", error);
    }
}

// Asset catalog, filtering, menus, and thumbnails.
var maxToLoad;
var numLoaded;
var hiddenImage = {};
const sidebarCategoryOrder = [
    "blocks/templates",
    "blocks/tags",
    "blocks/globalparameters",
    "blocks/misc",
    "blocks/parties",
    "blocks/requisites",
    "blocks/resources",
    "blocks/productionboxes",
    "blocks/expansions",
    "blocks/tiles",
    "blocks/VPs"
];

// Asset data loaded from assets.json
var blockList = [];
var blockDefaults = {};
var assetSets = [];           // schema v2: array of set definition objects
var assetSchemaVersion = 1;   // schema v2: version number from assets.json

// ---------------------------------------------------------------------------
// Asset set filtering helpers (schema v2)
// ---------------------------------------------------------------------------
const ASSET_SETS_STORAGE_KEY = "tm_cardmaker_enabled_asset_sets";
const ASSET_SETS_KNOWN_STORAGE_KEY = "tm_cardmaker_known_asset_sets";

function canonicalizeSetToken(value) {
    return String(value || "")
        .trim()
        .replace(/^['\"]+|['\"]+$/g, "")
        .toLowerCase();
}

function slugifySetToken(value) {
    return canonicalizeSetToken(value)
        .replace(/[_\s]+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
}

function normalizeAssetSetValues(rawSets) {
    if (Array.isArray(rawSets)) {
        return rawSets
            .map(v => String(v || "").trim())
            .filter(Boolean);
    }
    if (typeof rawSets === "string") {
        const s = rawSets.trim();
        if (!s) return [];

        // Accept malformed legacy strings like "['Core']" and proper JSON arrays.
        if ((s.startsWith("[") && s.endsWith("]")) || (s.startsWith("(") && s.endsWith(")"))) {
            try {
                const normalizedJson = s.replace(/'/g, '"').replace(/^\(/, "[").replace(/\)$/, "]");
                const parsed = JSON.parse(normalizedJson);
                if (Array.isArray(parsed)) {
                    return parsed
                        .map(v => String(v || "").trim())
                        .filter(Boolean);
                }
            } catch (e) {
                // Fall through to comma split.
            }
        }

        return s
            .split(",")
            .map(v => v.trim())
            .filter(Boolean)
            .map(v => v.replace(/^['\"]+|['\"]+$/g, ""));
    }
    return [];
}

function buildSetLookup(sets) {
    const lookup = new Map();
    sets.forEach(function(setDef) {
        if (!setDef || !setDef.id) return;
        const keys = [
            setDef.id,
            setDef.name,
            canonicalizeSetToken(setDef.id),
            canonicalizeSetToken(setDef.name),
            slugifySetToken(setDef.id),
            slugifySetToken(setDef.name)
        ];
        keys.forEach(function(key) {
            if (key) lookup.set(key, setDef.id);
        });
    });
    return lookup;
}

function deriveAssetSets(declaredSets, assets) {
    const result = [];
    const usedIds = new Set();

    (Array.isArray(declaredSets) ? declaredSets : []).forEach(function(setDef) {
        const baseId = slugifySetToken(setDef && setDef.id ? setDef.id : setDef && setDef.name ? setDef.name : "");
        if (!baseId || usedIds.has(baseId)) return;
        usedIds.add(baseId);
        result.push({
            id: baseId,
            name: (setDef && setDef.name) ? setDef.name : baseId,
            description: (setDef && setDef.description) ? setDef.description : "",
            locked: !!(setDef && setDef.locked),
            official: !!(setDef && setDef.official),
            color: (setDef && setDef.color) ? setDef.color : "#888888"
        });
    });

    const lookup = buildSetLookup(result);
    const discovered = [];

    (Array.isArray(assets) ? assets : []).forEach(function(asset) {
        normalizeAssetSetValues(asset && asset.sets).forEach(function(rawSet) {
            const candidates = [
                rawSet,
                canonicalizeSetToken(rawSet),
                slugifySetToken(rawSet)
            ].filter(Boolean);

            let canonicalId = null;
            for (const c of candidates) {
                if (lookup.has(c)) {
                    canonicalId = lookup.get(c);
                    break;
                }
            }

            if (canonicalId) return;

            const autoId = slugifySetToken(rawSet);
            if (!autoId || usedIds.has(autoId)) return;

            usedIds.add(autoId);
            const autoDef = {
                id: autoId,
                name: String(rawSet).trim(),
                description: "Auto-discovered from blockList",
                locked: false,
                official: false,
                color: "#888888"
            };
            discovered.push(autoDef);
            lookup.set(autoId, autoId);
            lookup.set(canonicalizeSetToken(autoDef.name), autoId);
            lookup.set(slugifySetToken(autoDef.name), autoId);
        });
    });

    return result.concat(discovered);
}

function resolveSetId(rawSet) {
    const lookup = buildSetLookup(assetSets);
    const candidates = [
        rawSet,
        canonicalizeSetToken(rawSet),
        slugifySetToken(rawSet)
    ].filter(Boolean);
    for (const c of candidates) {
        if (lookup.has(c)) return lookup.get(c);
    }
    return null;
}

/** Initialise enabledAssetSets from localStorage; locked sets are always on. */
function initEnabledAssetSets() {
    let stored;
    try { stored = JSON.parse(localStorage.getItem(ASSET_SETS_STORAGE_KEY)); } catch(e) { stored = null; }

    let knownStored;
    try { knownStored = JSON.parse(localStorage.getItem(ASSET_SETS_KNOWN_STORAGE_KEY)); } catch(e) { knownStored = null; }

    const storedSet = new Set();
    if (Array.isArray(stored)) {
        stored.forEach(function(v) {
            const canonical = resolveSetId(v);
            if (canonical) storedSet.add(canonical);
        });
    }

    const knownSet = new Set();
    if (Array.isArray(knownStored)) {
        knownStored.forEach(function(v) {
            const canonical = resolveSetId(v);
            if (canonical) knownSet.add(canonical);
        });
    }

    const firstRun = knownSet.size === 0;

    for (const s of assetSets) {
        // Always enable locked sets.
        // For non-locked sets:
        // - first run: enable all by default
        // - later runs: only auto-enable newly discovered sets
        if (s.locked || firstRun || !knownSet.has(s.id)) {
            storedSet.add(s.id);
        }
        knownSet.add(s.id);
    }

    localStorage.setItem(ASSET_SETS_STORAGE_KEY, JSON.stringify([...storedSet]));
    localStorage.setItem(ASSET_SETS_KNOWN_STORAGE_KEY, JSON.stringify([...knownSet]));
}

/** Sync checkbox elements in the Asset Sets UI to match current localStorage state. */
function syncAssetSetsUI() {
    const enabled = getEnabledSets();
    if (typeof assetSets === "undefined") return;
    assetSets.forEach(function(setDef) {
        const cb = document.getElementById("assetset_" + setDef.id);
        if (cb) cb.checked = enabled.has(setDef.id);
    });
}

/** Returns the currently enabled set IDs as a Set. */
function getEnabledSets() {
    try {
        const stored = JSON.parse(localStorage.getItem(ASSET_SETS_STORAGE_KEY));
        if (Array.isArray(stored)) {
            const canonicalStored = new Set();
            stored.forEach(function(v) {
                const canonical = resolveSetId(v);
                if (canonical) canonicalStored.add(canonical);
            });
            return canonicalStored;
        }
    } catch(e) {}
    return new Set(assetSets.map(s => s.id));
}

/**
 * Persist a toggle of a single set id.
 * @param {string} setId
 * @param {boolean} enabled
 */
function setAssetSetEnabled(setId, enabled) {
    const current = getEnabledSets();
    // Never disable a locked set
    const setDef = assetSets.find(s => s.id === setId);
    if (setDef && setDef.locked) return;
    if (enabled) current.add(setId); else current.delete(setId);
    localStorage.setItem(ASSET_SETS_STORAGE_KEY, JSON.stringify([...current]));
    rebuildBlockMenu();
}


/**
 * Returns true when a sprite should appear in menus given current enabled sets.
 * Rules:
 *  1. debug usage → always visible (never filtered)
 *  2. hidden otherbg sprites → never in menu regardless
 *  3. legacy sprites (no sets field) → always visible (backward compat)
 *  4. sprite.sets must intersect with enabled sets
 */
function isAssetVisible(asset) {
    // debug sprites are always accessible
    if (Array.isArray(asset.usage) && asset.usage.includes("debug")) return true;
    // hidden sprites never appear in menu
    if (asset.hidden) return false;
    // schema v2 sets filtering
    const normalizedAssetSets = normalizeAssetSetValues(asset.sets);
    if (assetSchemaVersion >= 2 && normalizedAssetSets.length > 0) {
        const enabled = getEnabledSets();
        return normalizedAssetSets.some(function(rawSet) {
            const canonicalId = resolveSetId(rawSet);
            // Unknown sets are visible by default so user-added expansions don't vanish.
            return canonicalId ? enabled.has(canonicalId) : true;
        });
    }
    // legacy / no sets field → treat as always visible
    return true;
}

/** Rebuild the entire Add Block menu and File→New from Template list. */
function rebuildBlockMenu() {
    // Save which accordion sections are currently open so we can restore them
    const openCategories = new Set();
    const menuContainer = document.getElementById("blocksMenu");
    if (menuContainer) {
        menuContainer.querySelectorAll(".w3-bar-block.w3-show").forEach(function(el) {
            openCategories.add(el.id);
        });
    }

    // Clear existing menu items and template links
    if (menuContainer) menuContainer.innerHTML = "";
    const fromTemplate = document.getElementById("fromTemplate");
    if (fromTemplate) fromTemplate.innerHTML = "";

    // Re-build category accordion headers
    buildBlockMenu();

    // Re-add menu items respecting current visibility
    for (let i = 0; i < blockList.length; i++) {
        addBlockMenuItem(i);
    }

    // Restore previously open accordion sections
    openCategories.forEach(function(catId) {
        const catEl = document.getElementById(catId);
        if (catEl) {
            catEl.classList.remove("w3-hide");
            catEl.classList.add("w3-show");
            if (catId.startsWith("blocks/")) loadCategoryThumbnails(catId);
        }
    });

    // Reload lazy thumbnails for visible items
    if (typeof setupLazyThumbnails === "function") setupLazyThumbnails();
}

/**
 * Load assets from external JSON file
 * 
 * This async function fetches the assets.json file and populates the global
 * blockList and blockDefaults variables. Using an external JSON file makes it
 * easier to manage assets without editing JavaScript code.
 * 
 * @returns {Promise<boolean>} True if loading succeeded, false otherwise
 */
async function loadAssets() {
    try {
        // fetch() is a modern browser API for making HTTP requests
        // It returns a Promise that resolves to the Response object
        const response = await fetch('assets.json');

        // Check if the HTTP request was successful (status 200-299)
        if (!response.ok) {
            throw new Error(`Failed to load assets.json: ${response.status} ${response.statusText}`);
        }

        // Parse the JSON response body into a JavaScript object
        const data = await response.json();

        // Extract blockList and blockDefaults from the loaded data
        // The || [] and || {} provide fallback empty values if properties don't exist
        blockList = data.blockList || [];
        blockDefaults = data.blockDefaults || {};

        // Schema v2: capture top-level asset sets and schema version
        assetSchemaVersion = data.schemaVersion || 1;
        assetSets = deriveAssetSets(data.sets || [], blockList);

        // Initialise enabled sets from localStorage (default: all locked sets + core enabled)
        initEnabledAssetSets();

        buildBlockMenu();

        console.log(`Loaded ${blockList.length} assets from assets.json`);
        return true;
    } catch (error) {
        // Catch any errors during fetch, parsing, or processing
        console.error('Error loading assets:', error);
        alert('Failed to load assets.json. Please make sure the file exists and is valid JSON.');
        return false;
    }
}

function formatCategoryLabel(categoryId) {
    if (!categoryId) return "Blocks";
    const slug = categoryId.replace(/^blocks\//, "");
    const labelOverrides = {
        "globalparameters": "Global Params",
        "requisites": "Requirements",
        "productionboxes": "Production Boxes",
        "VPs": "VPs"
    };
    if (labelOverrides[slug]) return labelOverrides[slug];
    return slug
        .replace(/_/g, " ")
        .replace(/\b\w/g, (m) => m.toUpperCase());
}

function buildBlockMenu() {
    const container = document.getElementById("blocksMenu");
    if (!container) return;

    const seen = new Set();
    const categories = [];
    for (let i = 0; i < blockList.length; i++) {
        const putUnder = blockList[i].putUnder;
        if (!putUnder || seen.has(putUnder)) continue;
        seen.add(putUnder);
        categories.push(putUnder);
    }

    const ordered = sidebarCategoryOrder.filter((c) => seen.has(c));
    const remaining = categories.filter((c) => ordered.indexOf(c) === -1);
    const finalOrder = ordered.concat(remaining);

    container.innerHTML = "";

    finalOrder.forEach((categoryId) => {
        const label = formatCategoryLabel(categoryId);

        const header = document.createElement("a");
        header.onclick = function() { myAccFunc(categoryId); };
        header.href = "javascript:void(0)";
        header.className = "w3-button w3-block w3-white w3-left-align";
        header.innerHTML = `${label} <i class="fa fa-caret-down"></i>`;

        const list = document.createElement("div");
        list.id = categoryId;
        list.className = "w3-bar-block w3-hide w3-padding-large w3-medium";

        container.appendChild(header);
        container.appendChild(list);
    });
}

/**
 * Get thumbnail URL for a block sprite
 * @param {string} src - Block source name (e.g., "templates__green_normal")
 * @param {string} putUnder - Category path (e.g., "blocks/templates")
 * @param {number} size - Thumbnail size in pixels (32, 64, 128, 256)
 * @returns {string} URL to thumbnail image
 */
function getThumbnailUrl(src, putUnder, size = 64) {
    // Structure: blocks/{category}/{blockname}/{blockname}_{size}.png
    // Example: blocks/templates/templates__green_normal/templates__green_normal_64.png
    if (!src || !putUnder) return null;

    // Normalize putUnder path
    let category = putUnder.replace(/^blocks\//, '').replace(/\\/g, '/');
    return `${putUnder}/${src}/${src}_${size}.png`;
}

/**
 * Load and cache thumbnail for a menu item
 * Uses sessionStorage to avoid repeated fetches
 * Automatically selects appropriate resolution based on device pixel ratio
 * @param {Element} thumbContainer - DOM element to populate
 * @param {string} src - Block source name
 * @param {string} putUnder - Category path
 * @param {number} blockIndex - Index in blockList (for data attribute)
 */
async function loadThumbnail(thumbContainer, src, putUnder, blockIndex) {
    if (!thumbContainer || !src) return;

    // Adaptive resolution based on device pixel ratio (Retina display support)
    // Menu thumbnails display at 40x40 CSS pixels
    // devicePixelRatio: 1 = standard display, 2 = Retina, 3 = high-DPI mobile
    const pixelRatio = window.devicePixelRatio || 1;
    let size;

    if (pixelRatio >= 3) {
        size = 128; // High-DPI mobile devices
    } else if (pixelRatio >= 2) {
        size = 128; // Retina displays (2x) - provides crisp rendering
    } else if (pixelRatio >= 1.5) {
        size = 64; // Some laptops with 1.5x scaling
    } else {
        size = 64; // Standard 1x displays
    }

    const cacheKey = `thumbnail_${src}_${size}`;

    // Check sessionStorage cache first
    let cachedUrl = sessionStorage.getItem(cacheKey);
    if (cachedUrl) {
        displayThumbnail(thumbContainer, cachedUrl);
        return;
    }

    // Try to load thumbnail at selected resolution
    const thumbUrl = getThumbnailUrl(src, putUnder, size);
    if (!thumbUrl) return;

    try {
        const response = await fetch(thumbUrl, { method: 'HEAD' });
        if (response.ok) {
            // Thumbnail exists, cache and display it
            sessionStorage.setItem(cacheKey, thumbUrl);
            displayThumbnail(thumbContainer, thumbUrl);
        } else {
            // Fallback to 64px if higher resolution not found
            if (size > 64) {
                const fallbackUrl = getThumbnailUrl(src, putUnder, 64);
                const fallbackResponse = await fetch(fallbackUrl, { method: 'HEAD' });
                if (fallbackResponse.ok) {
                    sessionStorage.setItem(cacheKey, fallbackUrl);
                    displayThumbnail(thumbContainer, fallbackUrl);
                }
            }
        }
    } catch (error) {
        // Thumbnail not found, leave placeholder
        console.debug(`Thumbnail not found: ${thumbUrl}`);
    }
}

/**
 * Display thumbnail image in container
 * @param {Element} container - DOM element to populate
 * @param {string} imageUrl - URL to thumbnail image
 */
function displayThumbnail(container, imageUrl) {
    if (!container) return;

    const img = document.createElement("img");
    img.src = imageUrl;
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "contain";
    img.style.padding = "2px";

    container.innerHTML = "";
    container.appendChild(img);
}

/**
 * Load all thumbnails in a category (called when category expands)
 * @param {string} categoryId - HTML id of category div (e.g., "blocks/templates")
 */
async function loadCategoryThumbnails(categoryId) {
    const categoryDiv = document.getElementById(categoryId);
    if (!categoryDiv) return;

    const containers = categoryDiv.querySelectorAll('.thumbnail-container[data-block-index]');
    const promises = [];

    for (const container of containers) {
        const blockIndex = parseInt(container.dataset.blockIndex);
        const block = blockList[blockIndex];

        if (block && block.src) {
            // Load thumbnail asynchronously (don't wait)
            promises.push(
                loadThumbnail(container, block.src, block.putUnder, blockIndex)
            );
        }
    }

    // Fire off all loads in parallel but don't block
    Promise.all(promises).catch(err => console.debug('Thumbnail loading errors:', err));
}
