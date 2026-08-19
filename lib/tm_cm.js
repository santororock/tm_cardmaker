var projectState = TMCardMakerProjectState.create();
var aLayers = projectState.getLayers();

var userImageList = [];
var otherBgList = {};
var type2FuncList = {};
// var groupList = [];
var fontList = {
    Prototype: "",
    Pagella: "",
    times: ""
};

const TM_SERIF_BODY_FONT = '"Palatino Linotype", "Palatino", "Book Antiqua", serif';

const CARD_TEXT_FONT_GROUPS = [
    {
        label: "Existing",
        options: [
            { label: "Prototype", value: "Prototype", family: "Prototype" },
            { label: "Palatino-like", value: "Pagella", family: "Pagella" },
            { label: "Times New Roman", value: "times", family: "'Times New Roman'" }
        ]
    },
    {
        label: "Terraforming Mars / Serif",
        options: [
            { label: "Palatino", value: '"Palatino", "Palatino Linotype", "Book Antiqua", serif' },
            { label: "Palatino Linotype", value: TM_SERIF_BODY_FONT },
            { label: "Palatino LT Std", value: '"Palatino LT Std", "Palatino Linotype", "Palatino", "Book Antiqua", serif' },
            { label: "Book Antiqua", value: '"Book Antiqua", "Palatino Linotype", "Palatino", serif' },
            { label: "TeX Gyre Pagella", value: '"TeX Gyre Pagella", "Palatino Linotype", "Book Antiqua", serif' },
            { label: "URW Palladio L", value: '"URW Palladio L", "Palatino Linotype", "Book Antiqua", serif' },
            { label: "Georgia", value: '"Georgia", "Times New Roman", serif' }
        ]
    }
];

var layerToDrag;
var dragOffsetX;
var dragOffsetY;
var keyFocusLayer;

// Undo system
var maxUndoSteps = 50;
var isRestoringState = false;
var historyStore = TMCardMakerHistory.create({ maxSteps: maxUndoSteps });

var ddcount = 0;

var domInputfont = document.getElementById("inputfont");

function registerFontOption(fontValue) {
    if (fontList[fontValue] === undefined) {
        fontList[fontValue] = "";
    }
}

function populateCardTextFontSelect() {
    if (!domInputfont) return;

    domInputfont.innerHTML = "";

    for (let group of CARD_TEXT_FONT_GROUPS) {
        let container = domInputfont;
        if (group.label) {
            container = document.createElement("optgroup");
            container.label = group.label;
            domInputfont.appendChild(container);
        }

        for (let option of group.options) {
            let domOpt = document.createElement("option");
            domOpt.value = option.value;
            domOpt.style.fontFamily = option.family || option.value;
            domOpt.innerText = option.label;
            container.appendChild(domOpt);
            registerFontOption(option.value);
        }
    }
}

populateCardTextFontSelect();

// Remove params from fixed position and make it movable within layer list
var domParams = document.getElementById("params").parentNode.removeChild(document.getElementById("params"));
domParams.classList.remove("w3-hide");

function syncOtherBgPadInputs(layer) {
    const padXInput = document.getElementById("inputobgPadX");
    const padYInput = document.getElementById("inputobgPadY");
    if (!padXInput || !padYInput) return;

    const enabled = !!(layer && layer.obg);
    padXInput.disabled = !enabled;
    padYInput.disabled = !enabled;
}

function resetProject(loadautosave) {
    clearUndoHistory();
    document.getElementById("layerlist").innerHTML = "";
    ddcount = 0;
    aLayers = projectState.reset();
    document.getElementById("xcanvases").innerHTML = "";
    aCanvases = [];
    addLayer("Base", { type: "base", color: "#ffffff", height: 1126, width: 826, params: "color" });

    maxToLoad = 0;
    for (let i = 0; i < blockList.length; i++) {
        if (!blockList[i].obj) {
            maxToLoad++;
            addBlockMenuItem(i);
        }
    }
    // if (maxToLoad) {
    //   numLoaded = 0;
    //   document.getElementById("files").max = maxToLoad;
    //   document.getElementById("files").value = numLoaded;
    //   document.getElementById("loadprogress").style.display = "block";
    //   document.getElementById("cmcanvas").style.display = "none";
    // } else {
    allLoadingDone(loadautosave);
    // }
}

function fetchBlock(num) {
    let imageObj = new Image();
    // Allow cross-origin requests so canvas stays exportable when server
    // provides appropriate CORS headers. Must be set before assigning `src`.
    // Do NOT set `crossOrigin` when running from the local filesystem
    // (file://), as browsers will block those requests when CORS is used.
    try {
        if (window && window.location && (window.location.protocol === 'http:' || window.location.protocol === 'https:')) {
            imageObj.crossOrigin = "Anonymous";
        }
    } catch (err) {
        // ignore and proceed without crossOrigin
    }
    imageObj.onload = onBlockLoad;
    // Try the new prefixed filename first (e.g. "resources__animal"),
    // then fall back to the original unprefixed name if the first fails.
    (function(img, idx) {
        const entry = blockList[idx] || {};
        const base = entry.src || "";
        const prefixed = (base.indexOf('__') === -1) ? (entry.putUnder + '__' + base) : base;
        const prefixedPath = entry.putUnder + '/' + prefixed + '.png';
        const fallbackPath = entry.putUnder + '/' + base + '.png';
        img._fetchAttempts = 0;
        img.onerror = function(e) {
            if (this._fetchAttempts === 0 && prefixedPath !== fallbackPath) {
                this._fetchAttempts++;
                console.warn('fetchBlock: primary image failed, trying fallback', fallbackPath);
                this.src = fallbackPath;
                return;
            }
            try {
                console.error("fetchBlock: image load error", this.src, this.dataindex, e);
            } catch (err) {
                console.error("fetchBlock: image load error (no details)", err);
            }
        };
        console.log("fetchBlock: requesting", idx, prefixedPath);
        img.src = prefixedPath;
    })(imageObj, num);
    imageObj.dataindex = num;
    blockList[num].obj = imageObj;
    if (isOtherBgBlock(blockList[num])) {
        registerOtherBgImage(blockList[num], imageObj);
    }
}

function isOtherBgBlock(block) {
    if (!block) return false;
    const values = [block.text, block.src, block.filename, block.id].filter(Boolean);
    return values.some(function(value) {
        return String(value).toLowerCase().indexOf("otherbg") !== -1;
    });
}

function registerOtherBgImage(block, imageObj) {
    // Store by every stable identifier because asset metadata has used both
    // display text and src-style ids for otherbg references.
    for (let key of [block.text, block.src, block.filename, block.id]) {
        if (key) otherBgList[key] = imageObj;
    }
}

function findOtherBgBlockIndex(otherBgRef) {
    if (!otherBgRef) return -1;
    for (let j = 0; j < blockList.length; j++) {
        const block = blockList[j];
        if (!block) continue;
        if (block.text == otherBgRef || block.src == otherBgRef || block.filename == otherBgRef || block.id == otherBgRef) {
            return j;
        }
    }
    return -1;
}

function getOtherBgImage(otherBgRef) {
    return otherBgList[otherBgRef];
}

function resolveBlockIndex(idOrSrc) {
    if (idOrSrc === undefined || idOrSrc === null) return -1;
    if (typeof idOrSrc === 'number') return idOrSrc;
    // numeric string?
    if ((typeof idOrSrc === 'string') && idOrSrc.match(/^\d+$/)) return Number(idOrSrc);
    // search by src
    for (let i = 0; i < blockList.length; i++) {
        // exact match
        if (blockList[i].src === idOrSrc) return i;
        // support matching when filenames were prefixed with "putUnder__basename"
        if (typeof blockList[i].src === 'string' && blockList[i].src.indexOf('__') !== -1) {
            const parts = blockList[i].src.split('__');
            const suffix = parts[parts.length - 1];
            if (suffix === idOrSrc) return i;
        }
        if (blockList[i].text && (blockList[i].text === idOrSrc)) return i;
    }
    return -1;
}

function addBlockMenuItem(num) {

    if (!isAssetVisible(blockList[num])) {
        // hidden / filtered-out images don't get menu items
        if (blockList[num].hidden) {
            hiddenImage[blockList[num].text] = num;
        }
    } else {
        let tmpText = blockList[num].text;
        if (!tmpText) {
            tmpText = blockList[num].src;
            tmpText = tmpText.replace(/_/g, ' ');
            tmpText = tmpText.replace(tmpText.charAt(0), tmpText.charAt(0).toUpperCase());
            blockList[num].text = tmpText;
        }
        // add menu item for image
        // <a onclick="addBlock('template:green')" href="#" class="w3-bar-item w3-button">Green Card</a>
        if (!document.getElementById("image" + num)) {
            let toAdd = document.createElement("a");
            toAdd.onclick = addBlock;
            toAdd.classList.add("w3-bar-item");
            toAdd.classList.add("w3-button");
            toAdd.classList.add("thumbnail-menu-item");
            toAdd.href = "#";
            toAdd.id = "image" + num;
            toAdd.style.display = "flex";
            toAdd.style.alignItems = "center";
            toAdd.style.gap = "10px";
            toAdd.style.padding = "5px 10px";

            // Create thumbnail container
            let thumbContainer = document.createElement("div");
            thumbContainer.style.flexShrink = "0";
            thumbContainer.style.width = "40px";
            thumbContainer.style.height = "40px";
            thumbContainer.style.backgroundColor = "#f0f0f0";
            thumbContainer.style.border = "1px solid #ccc";
            thumbContainer.style.borderRadius = "3px";
            thumbContainer.style.overflow = "hidden";
            thumbContainer.style.display = "flex";
            thumbContainer.style.alignItems = "center";
            thumbContainer.style.justifyContent = "center";
            thumbContainer.className = "thumbnail-container";
            thumbContainer.dataset.blockIndex = num;
            thumbContainer.dataset.src = blockList[num].src;

            // Add placeholder text
            thumbContainer.innerText = "…";
            thumbContainer.style.color = "#999";
            thumbContainer.style.fontSize = "18px";

            // Create text container
            let textContainer = document.createElement("span");
            textContainer.innerText = tmpText;
            textContainer.style.flex = "1";
            textContainer.style.overflow = "hidden";
            textContainer.style.textOverflow = "ellipsis";
            textContainer.style.whiteSpace = "nowrap";

            toAdd.appendChild(thumbContainer);
            toAdd.appendChild(textContainer);

            const categoryContainer = document.getElementById(blockList[num].putUnder);
            if (!categoryContainer) {
                console.warn("addBlockMenuItem: missing category container", blockList[num].putUnder);
                return;
            }
            categoryContainer.appendChild(toAdd);

            if (blockList[num].putUnder == "blocks/templates") {
                // Add project templates (use the src suffix as the catalog key).
                toAdd = document.createElement("a");
                toAdd.onclick = TMCardMakerTemplates.loadSelectedTemplate;
                toAdd.innerText = tmpText;
                toAdd.classList.add("w3-bar-item");
                toAdd.classList.add("w3-button");
                toAdd.href = "#";
                // normalize id to "mega" + template key (remove "templates__" prefix if present)
                let megaKey = blockList[num].src || "";
                if (megaKey.indexOf("templates__") === 0) {
                    megaKey = megaKey.slice("templates__".length);
                }
                toAdd.id = "mega" + megaKey;
                document.getElementById("fromTemplate").appendChild(toAdd);
            }
        }
    }
}



const blockColorNumberInputIds = {
    inputalpha: "alphaNumber",
    inputhue: "hueNumber",
    inputsaturation: "saturationNumber",
    inputlightness: "lightnessNumber",
    inputgamma: "gammaNumber"
};

function isUserImageLayer(layer) {
    return TMCardMakerImageAdjustments.isUserImageLayer(layer);
}

function ensureBlockColorDefaults(layer) {
    TMCardMakerImageAdjustments.ensureDefaults(layer);
}

function syncLinkedBlockColorInput(input) {
    const numberInputId = blockColorNumberInputIds[input.id];
    if (!numberInputId) return;
    const numberInput = input.parentNode ? input.parentNode.querySelector("#" + numberInputId) : document.getElementById(numberInputId);
    if (numberInput) numberInput.value = input.value;
}

function drawProject() {
    if (reloading) return;
    const canvas = document.getElementById("cmcanvas");
    const orderedLayers = projectState.getOrderedLayers();

    TMCardMakerCanvasRenderer.renderProject({
        canvas: canvas,
        layers: orderedLayers,
        productionTile: blockList[hiddenImage["prod_nxn"]] ? blockList[hiddenImage["prod_nxn"]].obj : null,
        imageDependencies: {
            blocks: blockList,
            userImages: userImageList,
            adjustments: TMCardMakerImageAdjustments,
            getOtherBackground: getOtherBgImage,
            findOtherBackgroundIndex: findOtherBgBlockIndex,
            fetchBlock: fetchBlock
        },
        onInvalidLayer: function(layer) {
            window.alert("Invalid layer type:" + layer.type);
        }
    });

    autoSave(orderedLayers);
    if (window.debugOverlay && typeof window.debugOverlay.drawOverlay === 'function') {
        try {
            window.debugOverlay.drawOverlay(canvas, orderedLayers, aLayers);
        } catch (err) {
            console.error('debugOverlay draw error', err);
        }
    }
}

var lastAutoSave = "";

function autoSave(layers) {
    lastAutoSave = TMCardMakerProjectSerializer.serializeLayers(layers, {
        resolveBlockSrc: function(reference) {
            const idx = resolveBlockIndex(reference);
            return idx !== -1 && blockList[idx] ? blockList[idx].src : null;
        },
        getUserImageMeta: function(index) {
            return userImageMetaList[index] || null;
        }
    });
    try {
        if (typeof(Storage) !== "undefined") {
            localStorage.setItem("autosave", lastAutoSave);
        }

    } catch (error) {
        window.alert("Error with autosave");
    }
}

const arAlt = {
    width: ["height", "lar"],
    height: ["width", "lar"],
    swidth: ["sheight", "slar"],
    sheight: ["swidth", "slar"]
};

function getLayerNodeForParamInput(th) {
    return th.parentNode.parentNode.parentNode.parentNode;
}

function applyValueToLayer(th, captureUndo) {
    // called after user updates a value
    // OR after user select preset (reloading==true, in this case)
    let layer = getLayerNodeForParamInput(th);
    let layerName = layer.id;
    let fieldName = th.id.slice(5);

    if ((th.type == "number") || (th.type == "range")) {
        let newValue = Number(th.value);
        // deal with group moves
        if ((fieldName == "x") || (fieldName == "y")) {
            // check if part of group
            if (layer.getElementsByClassName("groupcheck")[0].checked) {
                // adjust all other members of group by same amount
                let thisgroup = document.getElementsByClassName("groupcheck");
                let diff = newValue - aLayers[layerName][fieldName];
                for (let x = 0; x < thisgroup.length; x++) {
                    if (!thisgroup[x].checked) continue;
                    let groupLayerId = thisgroup[x].parentNode.id;
                    aLayers[groupLayerId][fieldName] += diff;
                }
            }
        }
        if (arAlt[fieldName] && !reloading && (aLayers[layerName].type != "text")) {
            // it is width/height/swidth/sheight field
            if (document.getElementById(arAlt[fieldName][1]).checked) {
                // lar or slar (as appropriate) is checked
                // compute otherValue (e.g. if fieldname = width, otherValue = newValue * height/width)
                let otherValue = newValue * aLayers[layerName][arAlt[fieldName][0]] / aLayers[layerName][fieldName];
                otherValue = Math.round(otherValue * 1000) / 1000;
                if ((otherValue) && (Math.abs(otherValue - Math.round(otherValue)) < 0.01)) otherValue = Math.round(otherValue);
                aLayers[layerName][arAlt[fieldName][0]] = otherValue;
                document.getElementById("input" + arAlt[fieldName][0]).value = otherValue;
            }
        }
        aLayers[layerName][fieldName] = newValue;
        syncLinkedBlockColorInput(th);
    } else if (th.type == "checkbox") {
        aLayers[layerName][fieldName] = th.checked;
        if (fieldName == "obg") {
            syncOtherBgPadInputs(aLayers[layerName]);
        }
    } else {
        if (th.id == "inputfont") {
            aLayers[layerName].filename = fontList[th.value];
        }
        aLayers[layerName][fieldName] = th.value;
    }
    drawProject();
    if (captureUndo && !reloading) {
        console.log(`[UNDO] updateValue called: field="${fieldName}" (reloading=${reloading})`);
        captureState("Update: " + fieldName);
    }
}

function updateValue(th) {
    applyValueToLayer(th, true);
}

function updateLiveValue(th) {
    if (!th.dataset.liveUndoStarted && !reloading) {
        const fieldName = th.id.slice(5);
        console.log(`[UNDO] live slider begin: field="${fieldName}"`);
        th.dataset.liveUndoStarted = "1";
    }
    applyValueToLayer(th, false);
}

function commitLiveValue(th) {
    if (th.dataset.liveUndoStarted) {
        applyValueToLayer(th, true);
        delete th.dataset.liveUndoStarted;
    } else {
        applyValueToLayer(th, true);
    }
}

function updateLinkedValue(th, rangeId) {
    const range = document.getElementById(rangeId);
    if (!range) return;
    range.value = th.value;
    updateValue(range);
    th.value = range.value;
}


function setPresets(th) {
    let selVal = document.getElementById("presets").value;
    if (!selVal) return;
    let sel = Number(selVal.slice(9));
    let layerDom = th.parentNode.parentNode.parentNode.parentNode;
    let layer = aLayers[layerDom.id];

    let dName = "";
    if (layer.type == "block") {
        let a = layer.iNum;
        let b = blockList[a];
        dName = b.putUnder;
        // Strip "blocks/" prefix if present to match blockDefaults keys
        if (dName && dName.indexOf("blocks/") === 0) {
            dName = dName.slice(7);
        }
    } else if (layer.type == "text") {
        dName = "text";
    } else if (layer.type == "production") {
        dName = "production";
    }

    if (dName) {
        reloading = true;
        for (let v in blockDefaults[dName][sel]) {
            // fill in presets
            if (v == "label") continue;
            document.getElementById("input" + v).value = blockDefaults[dName][sel][v];
            if (dName == "tiles") {
                reloading = false;
            }
            updateValue(document.getElementById("input" + v));
        }
        if (dName == "templates") {
            aLayers["dragdropdiv0"].height = blockDefaults[dName][sel].height;
            aLayers["dragdropdiv0"].width = blockDefaults[dName][sel].width;
        }
        reloading = false;
    }
    drawProject();
}

function onBlockLoad() {
    console.log("onBlockLoad: loaded", this.dataindex, blockList[this.dataindex] && blockList[this.dataindex].src, this.src);
    if (blockList[this.dataindex].hidden) {
        // hidden images don't get menu items
        hiddenImage[blockList[this.dataindex].text] = this.dataindex;
    } else {
        let tmpText = blockList[this.dataindex].text;
        if (!tmpText) {
            tmpText = blockList[this.dataindex].src;
            tmpText = tmpText.replace(/_/g, ' ');
            tmpText = tmpText.replace(tmpText.charAt(0), tmpText.charAt(0).toUpperCase());
            blockList[this.dataindex].text = tmpText;
        }
        // add menu item for image
        // <a onclick="addBlock('template:green')" href="#" class="w3-bar-item w3-button">Green Card</a>
        if (!document.getElementById("image" + this.dataindex)) {
            let toAdd = document.createElement("a");
            toAdd.onclick = addBlock;
            toAdd.innerText = tmpText;
            toAdd.classList.add("w3-bar-item");
            toAdd.classList.add("w3-button");
            toAdd.href = "#";
            toAdd.id = "image" + this.dataindex;
            document.getElementById(blockList[this.dataindex].putUnder).appendChild(toAdd);
            if (blockList[this.dataindex].putUnder == "blocks/templates") {
                // add Super Templates
                toAdd = document.createElement("a");
                toAdd.onclick = TMCardMakerTemplates.loadSelectedTemplate;
                toAdd.innerText = tmpText;
                toAdd.classList.add("w3-bar-item");
                toAdd.classList.add("w3-button");
                toAdd.href = "#";
                // normalize id to "mega" + template key (remove putUnder__ prefix if present)
                let megaKey = blockList[this.dataindex].src || "";
                const prefix = blockList[this.dataindex].putUnder + "__";
                if (megaKey.indexOf(prefix) === 0) megaKey = megaKey.slice(prefix.length);
                toAdd.id = "mega" + megaKey;
                document.getElementById("fromTemplate").appendChild(toAdd);
            }
        }
    }
    // numLoaded++;
    // document.getElementById("files").value = numLoaded;
    // if (numLoaded == maxToLoad) {
    //   allLoadingDone();
    // }
    for (let l in aLayers) {
        if ((aLayers[l].type == "block") && (aLayers[l].iNum == this.dataindex)) {
            let imgW = blockList[this.dataindex].obj.width;
            let imgH = blockList[this.dataindex].obj.height;
            // scale so the largest side is at most 100px (preserve aspect ratio)
            let scale = Math.min(1, 100 / Math.max(imgW, imgH));
            let scaledW = Math.max(1, Math.round(imgW * scale));
            let scaledH = Math.max(1, Math.round(imgH * scale));

            // Apply scaled size for layers that are using the placeholder/default
            // dimensions (we use height==100 as our placeholder indicator), or
            // when neither dimension was set.
            if ((!aLayers[l].width && !aLayers[l].height) || (aLayers[l].height === 100 && !aLayers[l].width)) {
                aLayers[l].width = scaledW;
                aLayers[l].height = scaledH;
            } else if (!aLayers[l].width && aLayers[l].height) {
                // compute width to preserve aspect ratio for given height
                aLayers[l].width = Math.round(imgW * aLayers[l].height / imgH);
                // if computed width exceeds 100, scale down to max 100
                if (aLayers[l].width > 100 && aLayers[l].height <= 100) {
                    let s = 100 / aLayers[l].width;
                    aLayers[l].width = Math.round(aLayers[l].width * s);
                    aLayers[l].height = Math.round(aLayers[l].height * s);
                }
            } else if (aLayers[l].width && !aLayers[l].height) {
                // compute height to preserve aspect ratio for given width
                aLayers[l].height = Math.round(imgH * aLayers[l].width / imgW);
                if (aLayers[l].height > 100 && aLayers[l].width <= 100) {
                    let s = 100 / aLayers[l].height;
                    aLayers[l].width = Math.round(aLayers[l].width * s);
                    aLayers[l].height = Math.round(aLayers[l].height * s);
                }
            }
        }
    }
    drawProject();
}

var reloading = false;

function allLoadingDone(loadautosave) {
    document.getElementById("loadprogress").style.display = "none";
    document.getElementById("cmcanvas").style.display = "block";
    try {
        if (loadautosave) {
            loadFrom(JSON.parse(localStorage.getItem("autosave")), true);
        } else {
            drawProject();
        }
    } catch (error) {
        // no autosave file
    }

    // Reset canvas view (center and scale) after loading
    if (typeof zoomCanvasReset === 'function') {
        zoomCanvasReset();
    }

    refreshUserImageCacheUsage();
}

function loadFrom(saved, autoload) {
    // load autosave file
    reloading = true;
    unreloadable = false;
    let resize = false;
    let scale = { x: 1, y: 1, width: 1, height: 1 };
    try {
        const savedLayers = TMCardMakerProjectLoader.normalize(saved);
        for (let layer of savedLayers) {
            let ignore = ["type", "params"];
            let newLayer = {};
            switch (layer.type) {
                case "block":
                case "text":
                case "production":
                case "effect":
                case "line":
                    if (layer.type == "block") {
                        const blockRef = TMCardMakerProjectLoader.getBlockReference(layer);
                        newLayer = addBlock(blockRef);
                        // don't copy saved index or src over the runtime layer
                        ignore.push("iNum");
                        ignore.push("src");
                    } else if (layer.type == "text") {
                        if (layer.filename && !fontList[layer.font]) {
                            // this font has not been reloaded
                            loadFont(layer.filename);
                        }
                        newLayer = addTextBox(layer.data);
                        // } else if (layer.type == "effect") {
                        //   newLayer = addEffectBox();
                        // } else if (layer.type == "line") {
                        //   newLayer = addLine();
                    } else {
                        newLayer = type2FuncList[layer.type]();
                        //   newLayer = addProduction();
                    }

                    TMCardMakerProjectLoader.copyProperties(newLayer, layer, {
                        ignored: ignore,
                        scale
                    });
                    break;
                    // case "group":
                    //   addLayer(layer.name, layer);
                    //   break;
                case "embedded":
                    if (autoload) {
                        const cachedIndex = resolveCachedUserImageIndex(layer);
                        if (cachedIndex !== -1) {
                            layer.iNum = cachedIndex;
                            const matchedMeta = userImageMetaList[cachedIndex];
                            if (matchedMeta && matchedMeta.cacheId && !layer.cacheId) {
                                layer.cacheId = matchedMeta.cacheId;
                            }
                            if (layer.name) {
                                addLayer(layer.name, layer);
                            } else {
                                addLayer("embed" + layer.iNum, layer);
                            }
                        } else {
                            unreloadable = true;
                        }
                        break;
                    }
                    if (layer.name) {
                        addLayer(layer.name, layer);
                    } else {
                        addLayer("embed" + layer.iNum, layer);
                    }
                    break;

                case "webFile":
                    reloadWebImage(layer.filename);
                    layer.iNum = -1;
                    addLayer("Web:" + layer.filename, layer);
                    break;
                case "userFile":
                    if (autoload) {
                        const cachedIndex = resolveCachedUserImageIndex(layer);
                        if (cachedIndex !== -1) {
                            layer.iNum = cachedIndex;
                            const matchedMeta = userImageMetaList[cachedIndex];
                            if (matchedMeta && matchedMeta.cacheId && !layer.cacheId) {
                                layer.cacheId = matchedMeta.cacheId;
                            }
                            addLayer("Local:" + layer.filename, layer);
                        } else {
                            unreloadable = true;
                        }
                        break;
                    }
                    layer.iNum = -1;
                    addLayer("Local:" + layer.filename, layer);
                    //newLayer = addUserFile(layer);
                    break;
                case "base":
                    newLayer = aLayers.dragdropdiv0;
                    TMCardMakerProjectLoader.copyProperties(newLayer, layer, {
                        ignored: ignore
                    });
                    if (TMCardMakerProjectLoader.hasLegacyCardSize(layer) &&
                        confirm("Looks like data saved at old size. Do you want to automatically resize?")) {
                        resize = true;
                        newLayer.height = 1126;
                        newLayer.width = 826;
                        scale.x = 826 / 750;
                        scale.width = scale.x;
                        scale.y = 1126 / 1050;
                        scale.height = scale.y;
                    }
                    break;

                default:
                    window.alert("Invalid layer type:" + layer.type);
                    break;
            }
            // Layer rows are created before saved properties are copied above.
            // Refresh visibility after the complete saved layer has been applied.
            const loadedLayerNode = document.getElementById("dragdropdiv" + (ddcount - 1));
            if (loadedLayerNode && aLayers[loadedLayerNode.id]) {
                updateLayerVisibilityUI(loadedLayerNode, aLayers[loadedLayerNode.id]);
            }
            if (layer.name) {
                document.getElementById("layername" + (ddcount - 1)).value = layer.name;
            }
        }
    } catch (error) {
        console.error("Could not load project:", error);
    }
    if (unreloadable) window.alert("User local files not reloaded. You must do this manually.");
    reloading = false;
    drawProject();

    // Capture initial state after loading (but not for autoload)
    if (!autoload) {
        captureInitialState("Load project");

        // Auto-select the first layer after loading to populate properties panel
        // Use setTimeout to ensure DOM has updated with all layers
        setTimeout(function() {
            const layerList = document.getElementById("layerlist");
            if (layerList && layerList.children.length > 0) {
                // Select the first non-base layer (dragdropdiv1 if it exists)
                const firstLayer = layerList.children[0];
                if (firstLayer && firstLayer.id !== "dragdropdiv0") {
                    selectLayerById(firstLayer.id);
                }
            }
        }, 0);
    }

}

type2FuncList.block = addBlock;

function addBlock(th) {
    console.log("[ADDBLOCK] Called with:", th, "type:", typeof th);
    let layer = { type: "block", name: "", iNum: 0, x: 0, y: 0, width: 0, height: 0, angle: 0, hue: 0, saturation: 100, lightness: 100, gamma: 100, params: "allimages allangle blockcolor" };
    let myIndex = 0;
    if ((typeof th == "number")) {
        myIndex = th;
    } else if (typeof th == "string") {
        // if string is numeric, convert, otherwise resolve by src/text
        myIndex = resolveBlockIndex(th);
        console.log("[ADDBLOCK] Resolved", th, "to index:", myIndex);
        if (myIndex == -1) myIndex = this.id ? this.id.slice(5) : 0;
    } else {
        myIndex = this.id ? this.id.slice(5) : 0;
    }
    layer.iNum = Number(myIndex);
    let thisBlock = blockList[layer.iNum];
    console.log("[ADDBLOCK] Using block at index", layer.iNum, ":", thisBlock);
    if (thisBlock.otherbg) {
        layer.params += " " + thisBlock.otherbg;
        layer.obg = false;
        const defaultPadX = Number(thisBlock.otherbgPadX);
        const defaultPadY = Number(thisBlock.otherbgPadY);
        layer.obgPadX = Number.isFinite(defaultPadX) ? defaultPadX : 3;
        layer.obgPadY = Number.isFinite(defaultPadY) ? defaultPadY : 3;
    }
    // Strip "blocks/" prefix if present to match blockDefaults keys
    let defaultsKey = thisBlock.putUnder;
    if (defaultsKey && defaultsKey.indexOf("blocks/") === 0) {
        defaultsKey = defaultsKey.slice(7);
    }
    if (blockDefaults[defaultsKey]) {
        layer.params += " allpreset";
    }
    // layer.width = thisBlock.obj.width;
    // layer.height = thisBlock.obj.height;
    let newLayer = addLayer(thisBlock.text, layer);
    // If the image is already loaded and complete, use its real size.
    // Otherwise, start loading it and give the layer a sensible default size
    // so it can be clicked/dragged immediately. onBlockLoad() will update
    // the real dimensions once the image finishes loading.
    if (thisBlock.obj && thisBlock.obj.complete) {
        if (!newLayer.width) newLayer.width = thisBlock.obj.width;
        if (!newLayer.height) newLayer.height = thisBlock.obj.height;
    } else {
        // Trigger loading (this will replace blockList[i].obj when loaded).
        fetchBlock(layer.iNum);
        // Set only a default height so we can maintain the image's aspect
        // ratio when the real image finishes loading. onBlockLoad() will
        // compute the missing dimension.
        if (!newLayer.height) newLayer.height = 100;
        // leave width undefined so onBlockLoad can compute it proportionally
    }
    drawProject();

    return newLayer;
}

/**
 * Load a mega template (complete card layout preset)
 * 
 * Mega templates provide full starting layouts for different card types.
 * This function clears the current project and loads all layers from the template.
 * 
 * Key enhancement: supports both static layer arrays and dynamic layer generation functions.
 * 
 * Why this matters:
 * - Static templates are simple arrays defined at parse time
 * - Function-based templates generate layers at runtime (e.g., debug_sprite_sheet)
 * - Function-based approach allows dynamic content based on loaded data (blockList from assets.json)
 * 
 * Pattern demonstrated:
 * - Type checking with typeof to handle different data structures
 * - Lazy evaluation: functions run when called, not when parsed
 * - Polymorphism: same interface supports multiple data types
 */


type2FuncList.text = addTextBox;

function addTextBox(th) {
    let layer = {
        type: "text",
        data: "",
        x: 0,
        y: 0,
        width: 110,
        height: 26,
        color: "#000000",
        font: "Prototype",
        style: "normal",
        weight: "normal",
        lineSpace: 4,
        justify: "center",
        angle: 0,
        params: "allimages color alltext allangle allpreset"
    };
    if ((typeof th == "string") || (typeof th == "number")) {
        layer.data = th;
    } else {
        layer.data = "Replace this text!";
    }
    let c = document.getElementById("cmcanvas");
    layer.x = Math.round(c.width / 2);
    layer.y = Math.round(c.height / 2);
    layer.width = c.width;
    let newLayer = addLayer("Text:" + layer.data.substr(0, 10), layer);
    drawProject();
    return newLayer;
}

var mostRecentFile = { file: null, name: "", cacheId: "" };

async function addUserFile(th) {
    if (!th.value) return;
    try {
        let file = th.files[0];
        // Check if the file is an image.
        if (file.type && file.type.indexOf('image') === -1) {
            window.alert('File is not an image.');
            return;
        }
        const deterministicCacheId = await createDeterministicCacheIdFromBlob(file);
        // load a local file
        mostRecentFile = {
            file: file,
            name: file.name,
            cacheId: deterministicCacheId
        };
        const reader = new FileReader();
        reader.addEventListener('load', function() {
            let newI = new Image();
            newI.onload = userImageLoaded;
            newI.src = reader.result;
            newI.crossOrigin = "Anonymous";
        });
        reader.readAsDataURL(file);

    } catch (error) {
        projectLoad = false;
        window.alert("Something went wrong loading file.")
    }
    th.value = "";
}

function getImageFromUrl(url, callback) {
    var img = new Image();
    img.setAttribute('crossOrigin', 'anonymous');
    img.onload = function(a) {
        var canvas = document.createElement("canvas");
        canvas.width = this.width;
        canvas.height = this.height;
        var ctx = canvas.getContext("2d");
        ctx.drawImage(this, 0, 0);

        var dataURI = canvas.toDataURL("image/jpg");

        // convert base64/URLEncoded data component to raw binary data held in a string
        var byteString;
        if (dataURI.split(',')[0].indexOf('base64') >= 0)
            byteString = atob(dataURI.split(',')[1]);
        else
            byteString = unescape(dataURI.split(',')[1]);

        // separate out the mime component
        var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

        // write the bytes of the string to a typed array
        var ia = new Uint8Array(byteString.length);
        for (var i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }

        return callback(new Blob([ia], { type: mimeString }));
    }

    img.src = url;
}

function loadInitialProject(url) {
    projectLoad = true;
    try {
        getImageFromUrl(url, function(blobImage) {
            const reader = new FileReader();
            reader.addEventListener('load', function() {
                let newI = new Image();
                newI.onload = userImageLoaded;
                newI.src = reader.result;
                newI.crossOrigin = "Anonymous";
            });
            reader.readAsDataURL(blobImage);
        });
    } catch (error) {
        projectLoad = false;
        window.alert("Something went wrong loading initial project." + error)
    }
}

var oLoadedProject;

function userImageLoaded() {
    // this = image object
    if (projectLoad) {
        // verify image is a project (we support)
        try {
            let c = document.getElementById("cmcanvas");
            let ctx = c.getContext("2d");
            // set canvas size to hold image
            c.width = this.width;
            c.height = this.height;
            // put image on canvas
            ctx.drawImage(this, 0, 0);
            oLoadedProject = this;

            // need to wait until canvas drawn
            setTimeout(async function() {
                try {
                    // now we can access the image
                    let c = document.getElementById("cmcanvas");
                    let ctx = c.getContext("2d");
                    let imgData = ctx.getImageData(0, 0, c.width, c.height);
                    let tmp = "tm_cmV01";
                    let p = 0;

                    let ob = array2string(imgData.data, p, 8);
                    if (ob.str != tmp) throw "project";
                    p = ob.pos;

                    // get image pos data
                    ob = array2string(imgData.data, p, 0);
                    let posStr = ob.str;
                    p = ob.pos;

                    // get layer data
                    ob = array2string(imgData.data, p, 0);
                    let layerStr = ob.str;
                    //p = ob.pos;

                    // parse pos data and extract images
                    let pos = JSON.parse(posStr);
                    // if (pos.length) window.alert("User files not yet supported. :(");
                    let aCanvases = [];
                    for (let i = 0; i < pos.length; i++) {
                        // draw images on new canvases, use canvas{i} for each
                        // later we could retrieve 'i' if needed
                        let cvs = document.createElement("CANVAS");
                        cvs.id = "canvas" + i;
                        cvs.width = pos[i].width;
                        cvs.height = pos[i].height;
                        let nctx = cvs.getContext("2d");
                        nctx.drawImage(oLoadedProject, pos[i].x, pos[i].y, pos[i].width, pos[i].height, 0, 0, pos[i].width, pos[i].height);
                        // add cvs to DOM (needed, I think, or they won't draw)
                        //document.getElementById("xcanvases").appendChild(cvs);
                        aCanvases.push(cvs);

                        // TBD put canvases into a temporary array
                        // when we first try to draw them, we will pull them out in the order they went in.

                        // // use setTimeout to ensure image is drawn before we extract it
                        // setTimeout(function (oCvs, num) {
                        //   // oCvs is canvas object
                        //   // num should match up with iNum of save layer
                        //   userImageList[num] = oCvs.toDataURL("image/png");
                        //   // disappear this canvas
                        //   oCvs.style.display = "none";
                        // },0,cvs, i);
                        // TBD
                    }

                    // parse layer data
                    let newLayers = JSON.parse(layerStr);
                    for (let i = 0; i < newLayers.length; i++) {
                        // update dragdropdiv0 and remove that newLayer (if it existed)
                        let layer;
                        if ((newLayers[0].type == "base") && (aLayers["dragdropdiv0"])) {
                            layer = aLayers["dragdropdiv0"];
                            layer.width = newLayers[0].width;
                            layer.height = newLayers[0].height;
                            layer.color = newLayers[0].color;
                            newLayers.shift();
                        }
                        // normally userFile cannot reload but here we have userFile data embedded
                        // so change from userFile to embedded if needed
                        if ((newLayers[i].type == "userFile") || (newLayers[i].type == "embedded")) {
                            let cacheId = newLayers[i].cacheId || "";
                            const fileName = newLayers[i].filename || ("Embedded image " + (i + 1));
                            newLayers[i].iNum = userImageList.length;
                            newLayers[i].filename = fileName;
                            // set iNum above to point to canvas we add to userImageList below
                            const nextCanvas = aCanvases.shift();
                            if (!cacheId) {
                                const blobForHash = await canvasToBlob(nextCanvas, "image/png");
                                cacheId = await createDeterministicCacheIdFromBlob(blobForHash);
                            }
                            newLayers[i].cacheId = cacheId;
                            userImageList.push(nextCanvas);
                            const layerImageIndex = newLayers[i].iNum;
                            userImageMetaList[newLayers[i].iNum] = {
                                cacheId: cacheId,
                                filename: fileName,
                                size: 0,
                                persisted: false
                            };
                            userImageCacheIndexById[cacheId] = newLayers[i].iNum;
                            persistCanvasToUserImageCache(nextCanvas, cacheId, fileName).then(function(cacheResult) {
                                if (!cacheResult || !cacheResult.cacheId) return;
                                userImageCacheIndexById[cacheResult.cacheId] = layerImageIndex;
                                if (userImageMetaList[layerImageIndex]) {
                                    userImageMetaList[layerImageIndex].cacheId = cacheResult.cacheId;
                                    userImageMetaList[layerImageIndex].size = cacheResult.size || userImageMetaList[layerImageIndex].size || 0;
                                    userImageMetaList[layerImageIndex].persisted = !!cacheResult.persisted;
                                }
                            });
                            newLayers[i].type = "embedded";
                        }
                    }
                    // load the rest of newLayers using loadFrom
                    loadFrom(newLayers);
                    projectLoad = false;
                    // redraw project
                    setTimeout(drawProject, 100);
                } catch (error) {
                    // end up here for a variety of reasons
                    projectLoad = false;
                    if (error == "project") {
                        // doesn't look like a project file, or one we support
                        console.log("Not a valid project file");
                    } else {
                        // probably a JSON parse error, just call it parse error
                        console.error("Error loading project:", error);
                    }
                }
            }, 50);


        } catch (error) {
            // end up here for a variety of reasons
            projectLoad = false;
            if (error == "project") {
                // doesn't look like a project file, or one we support
            } else {
                // probably a JSON parse error, just call it parse error
            }

        }


        // TBD
    } else {
        let layer = {
            type: "userFile",
            iNum: 0,
            x: 0,
            y: 0,
            width: 1,
            height: 1,
            alpha: 100,
            angle: 0,
            hue: 0,
            saturation: 100,
            lightness: 100,
            gamma: 100,
            sx: 0,
            sy: 0,
            swidth: 0,
            sheight: 0,
            params: "allimages clipimages allangle blockcolor"
        };
        layer.iNum = userImageList.length;
        layer.filename = mostRecentFile.name;
        if (mostRecentFile.cacheId) {
            layer.cacheId = mostRecentFile.cacheId;
        }
        layer.width = this.width;
        layer.height = this.height;
        layer.swidth = this.width;
        layer.sheight = this.height;

        userImageList.push(this);
        userImageMetaList[layer.iNum] = {
            cacheId: layer.cacheId || "",
            filename: layer.filename,
            size: (mostRecentFile.file && mostRecentFile.file.size) ? mostRecentFile.file.size : 0,
            persisted: false
        };
        if (layer.cacheId && mostRecentFile.file) {
            putCachedUserImage(layer.cacheId, layer.filename, mostRecentFile.file)
                .then(function() {
                    userImageCacheIndexById[layer.cacheId] = layer.iNum;
                    if (userImageMetaList[layer.iNum]) userImageMetaList[layer.iNum].persisted = true;
                    refreshUserImageCacheUsage();
                })
                .catch(function(error) {
                    console.error("Failed to cache user image", error);
                    refreshUserImageCacheUsage();
                });
        } else {
            refreshUserImageCacheUsage();
        }
        let newLayer = addLayer("Local:" + layer.filename, layer);
        drawProject();
    }
}

function array2string(arr, aPos, len) {
    // convert part of array to string of length len(if len is 0, it is a zero terminated string)
    // start at array position pos
    let str = "";
    let pos = aPos;
    do {
        let n = 0;
        for (let j = 0; j < 8; j++) {
            if (pos % 4 == 3) pos++;
            let v = arr[pos];
            if (v > 127) {
                n |= 1 << j;
            }
            pos++;
        }
        if (!n) break;
        str += String.fromCharCode(n);
    } while (str.length != len);
    return { str: str, pos: pos };
}

function string2array(str, arr, aPos, zeroTerminate) {
    // assume array is a image data array
    let pos = aPos;
    for (let i = 0; i < str.length; i++) {
        for (let j = 0; j < 8; j++) {
            if (pos % 4 == 3) pos++;
            arr[pos] = (str.charCodeAt(i) & (1 << j)) ? 0xff : 0;
            pos++;
        }
    }
    if (pos % 4 == 3) pos++;
    if (zeroTerminate) {
        for (let j = 0; j < 8; j++) {
            if (pos % 4 == 3) pos++;
            arr[pos] = 0;
            pos++;
        }
    }
    return pos;
}

type2FuncList.production = addProduction;

function addProduction() {
    let layer = {
        type: "production",
        x: 200,
        y: 643,
        width: 130,
        height: 130,
        params: "allimages allpreset"
    };
    let newLayer = addLayer("Production", layer);
    let thisBlock = blockList[hiddenImage["prod_nxn"]];
    if (thisBlock.obj) {
        drawProject();
    } else {
        fetchBlock(hiddenImage["prod_nxn"]);
    }
    return newLayer;
}

type2FuncList.effect = addEffectBox;

function addEffectBox() {
    let layer = {
        type: "effect",
        x: 600,
        y: 300,
        width: 400,
        height: 300,
        params: "allimages allpreset"
    };
    let newLayer = addLayer("Effect Box", layer);
    drawProject();
    return newLayer;
}

function addEmbed() {
    let layer = {
        type: "embedded",
        iNum: -1,
        x: 0,
        y: 0,
        width: 1,
        height: 1,
        alpha: 100,
        angle: 0,
        hue: 0,
        saturation: 100,
        lightness: 100,
        gamma: 100,
        sx: 0,
        sy: 0,
        swidth: 0,
        sheight: 0,
        params: "allimages clipimages allangle blockcolor"
    };
    layer.iNum = userImageList.length;
    layer.filename = th.src;
    layer.width = th.width;
    layer.height = th.height;
    layer.swidth = th.width;
    layer.sheight = th.height;

    userImageList.push(th);
    let newLayer = addLayer("Web image", layer);

}

type2FuncList.line = addLine;

function addLine() {
    let layer = {
        type: "line",
        x: 0,
        y: 0,
        width: 2,
        angle: 0,
        len: 100,
        color: "#000000",
        opacity: 1,
        params: "allangle alllen allpreset allcolor"
    };
    let newLayer = addLayer("Line", layer);
    drawProject();
    return newLayer;
}

function copyToClipboard() {
    let str = localStorage.getItem("autosave");
    const el = document.createElement('textarea');
    el.value = str;
    el.setAttribute('readonly', '');
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
};

function clickLoadFont() {
    let o = document.getElementById("fontoverlay");
    if (o.classList.contains("w3-nodisplay")) {
        o.classList.remove("w3-nodisplay");
        o.classList.add("w3-display");
    } else {
        o.classList.remove("w3-display");
        o.classList.add("w3-nodisplay");
    }
}

function loadSpecifiedFont() {
    let url = document.getElementById("fonturl2load").value;

    let o = document.getElementById("fontoverlay");
    o.classList.remove("w3-display");
    o.classList.add("w3-nodisplay");

    loadFont(url);
}

function loadFont(url) {
    // <link href="https://fonts.googleapis.com/css2?family=Turret+Road:wght@400;700;800&display=swap" rel="stylesheet">
    // <link href="https://fonts.googleapis.com/css2?family=Turret+Road&display=swap" rel="stylesheet">

    if (!url.startsWith("http")) {
        let httpPos = url.indexOf('http');
        if (httpPos > 0) {
            // assume url enclosed on double or single quotes
            // extract url start from http, end at char before close quote
            url = url.slice(httpPos, url.indexOf(url.charAt(httpPos - 1), httpPos));
        }
    }
    let domLink = document.createElement("link");
    domLink.href = url;
    domLink.rel = "stylesheet";
    document.body.appendChild(domLink);

    // <span style="float: right;">Font:<select id="inputfont" type="select" onchange="updateValue(this)">
    // <option value="Prototype" style="font-family: Prototype;" default>Prototype</option>
    let fontName = url.slice(url.indexOf('family=') + 7);
    fontName = fontName.replace(/["&]/g, ":"); // change " or & to :
    fontName = fontName.slice(0, fontName.indexOf(":")); // now use : to find end of name
    fontName = fontName.replace(/[+]/g, " ");
    let domOpt = document.createElement("option");
    domOpt.value = fontName;
    domOpt.style.fontFamily = fontName;
    domOpt.innerText = fontName;
    fontList[fontName] = url;

    domInputfont.appendChild(domOpt);

    return;
}

function clickLoadWebImage() {
    let o = document.getElementById("overlay");
    if (o.classList.contains("w3-nodisplay")) {
        o.classList.remove("w3-nodisplay");
        o.classList.add("w3-display");
    } else {
        o.classList.remove("w3-display");
        o.classList.add("w3-nodisplay");
    }
}

function loadWebImage() {
    let url = document.getElementById("url2load").value;
    let img = new Image();
    img.onload = function() {
        webImageLoaded(img);
    };
    img.src = url;
    img.crossOrigin = "Anonymous";
    let o = document.getElementById("overlay");
    o.classList.remove("w3-display");
    o.classList.add("w3-nodisplay");
}

function webImageLoaded(th) {
    // th = image object
    let layer = {
        type: "webFile",
        iNum: 0,
        x: 0,
        y: 0,
        width: 1,
        height: 1,
        alpha: 100,
        angle: 0,
        hue: 0,
        saturation: 100,
        lightness: 100,
        gamma: 100,
        sx: 0,
        sy: 0,
        swidth: 0,
        sheight: 0,
        params: "allimages clipimages allangle blockcolor"
    };
    layer.iNum = userImageList.length;
    layer.filename = th.src;
    layer.width = th.width;
    layer.height = th.height;
    layer.swidth = th.width;
    layer.sheight = th.height;

    userImageList.push(th);
    let newLayer = addLayer("Web image", layer);
    drawProject();
}

function reloadWebImage(url) {
    let img = new Image();
    img.onload = function() {
        webImageReloaded(img);
    };
    img.src = url;
    img.crossOrigin = "Anonymous";
}

function webImageReloaded(th) {
    // th = image object
    let iNum = userImageList.length;
    userImageList.push(th);

    for (let l in aLayers) {
        let thisLayer = aLayers[l];
        if ((thisLayer.type == "webFile") && (thisLayer.filename == th.src)) {
            if (thisLayer.iNum == -1) {
                thisLayer.iNum = iNum;
            }
        }
    }

    drawProject();
}

function cancelOverlay() {
    let o = document.getElementById("overlay");
    o.classList.remove("w3-show");
    o.classList.add("w3-hide");
}

function cancelFontOverlay() {
    let o = document.getElementById("fontoverlay");
    o.classList.remove("w3-show");
    o.classList.add("w3-hide");
}

function clickNew() {
    if (confirm("Delete current work and start fresh?")) resetProject(false);
}

function clickLoadNewProject() {
    if (confirm("Delete current work and start fresh?")) {
        resetProject(false);
        clickLoadProject();
    }
}

var extraRows = 0;
var oldHeight = 0;

var projectLoad = false;

function clickLoadProject() {
    projectLoad = true;
    // following click eventually runs addUserFile()
    document.getElementById('fileselection').click();
}

function projectDataToJson(data) {
    return TMCardMakerProjectSerializer.toJson(data);
}

function clickSaveProject() {
    // make array of user images
    let imagesForSaving = [];
    const orderedLayers = projectState.getOrderedLayers();
    for (let i = 0; i < orderedLayers.length; i++) {
        let layer = orderedLayers[i];
        if ((layer.type != "userFile") && (layer.type != "embedded")) continue;
        imagesForSaving.push(userImageList[layer.iNum]);
    }
    // if no images, assume canvas of 200x200
    let imgData = { container: { width: 200, height: 200 }, pos: [] };
    // if 1+ image, run fitImages and assume canvas of max(height,200) x max(width,200);
    if (imagesForSaving.length) {
        imgData = fitImages(imagesForSaving, 200);
        if (imgData.container.width < 200) imgData.container.width = 200;
        if (imgData.container.height < 200) imgData.container.height = 200;
        for (let i = 0; i < imagesForSaving.length; i++) {
            imgData.pos[i].width = imagesForSaving[i].width;
            imgData.pos[i].height = imagesForSaving[i].height;
        }
    }
    // determine number of extra rows, add this value to all pos.y values returned from fitImages
    // currently our storeage is 2 bytes per pixel (4 worked but BGG does something that ruins it)
    let posStr = projectDataToJson(imgData.pos);
    extraRows = Math.ceil(8 + (lastAutoSave.length + posStr.length + 10) / .375 / imgData.container.width);
    for (let i = 0; i < imgData.pos.length; i++) {
        imgData.pos[i].y += extraRows;
    }
    posStr = projectDataToJson(imgData.pos);
    // NOTE: we are making the not so crazy judgement that changing the pos.y data will not increase
    //  posStr by much and certainly nothing near the minimum 600+ bytes
    //  (8 extra height * 200 (min) * .375 byte per pixel) we have available.
    // make canvas assumed.height+extrarows x assumed.width
    let c = document.getElementById("cmcanvas");
    let ctx = c.getContext("2d");
    c.height = imgData.container.height + extraRows;
    c.width = imgData.container.width;

    // insert JSON and other data
    let tmp = "tm_cmV01";
    let imgPlus = ctx.createImageData(imgData.container.width, extraRows);
    imgPlus.data.fill(255);
    let p = 0;
    // insert our 8 byte signature
    p = string2array(tmp, imgPlus.data, p, false);
    // insert image pos data
    p = string2array(posStr, imgPlus.data, p, true);
    // insert layer info
    p = string2array(lastAutoSave, imgPlus.data, p, true);
    // and put that onto the canvas
    ctx.putImageData(imgPlus, 0, 0);

    // insert images at their pos.x/y locations
    for (let i = 0; i < imgData.pos.length; i++) {
        let layer = imagesForSaving[i];
        let pos = imgData.pos[i];
        ctx.drawImage(layer, pos.x, pos.y);
    }

    // allow time for drawing then prompt for save
    setTimeout(saveProjectCont, 100, true);


    // figure out how much extra height we need (assume UTF-8)
    // oldHeight = h;
    // c.height = h+extraRows;
    // drawProject(true);
}

function saveProjectCont(need2wait) {
    let c = document.getElementById("cmcanvas");

    let projectlink = document.getElementById('projectlink');
    projectlink.setAttribute('download', 'cardMaker.png');
    projectlink.setAttribute('href', c.toDataURL("image/png").replace("image/png", "image/octet-stream"));
    projectlink.click();
    if (need2wait) saveDone();
}

function saveDone() {
    let ans = confirm("Click when done.");
    if (ans || !ans) {
        let c = document.getElementById("cmcanvas");
        c.height = c.height - extraRows;
        extraRows = 0;
        drawProject();

    }
}

function groupModeToggle() {
    let c = document.getElementsByClassName("groupcheck");
    for (let l = 0; l < c.length; l++) {
        if (document.getElementById("groupmode").checked) {
            // turn on group check box
            c[l].classList.add("w3-show-inline-block");
            c[l].classList.remove("w3-hide");
            // make sure they are all unchecked
            c[l].checked = false;
        } else {
            c[l].classList.remove("w3-show-inline-block");
            c[l].classList.add("w3-hide");
            // make sure they are all unchecked
            c[l].checked = false;
        }
    }
}

// function clickMakeGroup() {
//   let c = document.getElementsByClassName("groupcheck");
//   let ch = [];
//   let gap = false;
//   for (let l=0; l < c.length; l++) {
//     if (c[l].checked) {
//       if (gap) {
//         // only true is found checked box after unchecked box after checked box
//         window.alert("Error:Group layers must be contiguous.");
//         return;
//       } else {
//         ch.push(c[l].parentNode.id);
//       }
//     } else if (ch.length) {
//       gap = true; // found unchecked box after checked box
//     }
//   }
//   if (ch.length < 2) return;
//   // make ch into a group
//   let layer = {type:"group", name:"", groupNum:0, params:""};
//   layer.groupNum = groupList.length;
//   layer.name = "Group:" + layer.groupNum;
//   let newLayer = addLayer("Group:" + layer.groupNum, layer);
//   for (let l=0; l < ch.length; l++) {
//     aLayers[ch[l]].group = layer.groupNum;
//   }

//   return newLayer;
// }

// function clickUngroup() {

// }

// Accordion
function myAccFunc(acc) {
    removeKeyInputFocus()
    var x = document.getElementById(acc);
    if (x.classList.contains("w3-hide")) {
        x.classList.remove("w3-hide");
        // if any div siblings are showing, hide them
        let showDivs = x.parentNode.getElementsByClassName("w3-show");
        for (let x = showDivs.length - 1; x >= 0; x--) {

            showDivs[x].classList.add("w3-hide");
            showDivs[x].classList.remove("w3-show");
        }
        x.classList.add("w3-show");

        // Load thumbnails for this category if it's a block category
        if (acc.startsWith("blocks/")) {
            loadCategoryThumbnails(acc);
        }
    } else {
        x.classList.add("w3-hide");
        x.classList.remove("w3-show");
    }
}

// Open and close sidebar
function w3_open() {
    document.getElementById("mySidebar").style.display = "block";
    document.getElementById("myOverlay").style.display = "block";
}

function w3_close() {
    document.getElementById("mySidebar").style.display = "none";
    document.getElementById("myOverlay").style.display = "none";
}

function getMousePos(event) {
    let c = document.getElementById("cmcanvas");
    var rect = c.getBoundingClientRect();

    // Get the current zoom level from the HTML's canvasZoom variable
    // The canvas coordinates need to be divided by the zoom to get the actual canvas position
    var currentZoom = (typeof canvasZoom !== 'undefined') ? canvasZoom : 1;

    return {
        x: (event.clientX - rect.left) / currentZoom,
        y: (event.clientY - rect.top) / currentZoom
    };
}

function dragStart(event) {
    // Don't drag layers if Ctrl is held (used for canvas panning)
    if (event.ctrlKey) {
        return;
    }

    var mouse = getMousePos(event);

    // Collision detection between clicked offset and element.
    const orderedLayerIds = projectState.getOrder();
    for (let i = orderedLayerIds.length - 1; i >= 0; i--) {
        const layerId = orderedLayerIds[i];
        let layer = aLayers[layerId];
        if (clickIsWithinLayer(layer, mouse.x, mouse.y)) {
            // Select the corresponding layer in the properties panel.
            // `selectLayer` expects to be called with the `.inside` element as `this`.
            let inside = document.getElementById(layerId).getElementsByClassName('inside')[0];
            if (inside) {
                selectLayer.call(inside);
            } else {
                selectLayer();
            }
            layerToDrag = layer;
            focusKeyInput(layer);
            dragOffsetX = layer.x - mouse.x;
            dragOffsetY = layer.y - mouse.y;
            return;
        }
    }
}

// Check to see if the given coordinates are within the specified layer
//
// Block objects are anchored at the upper left, and may contain
// transparent areas:
//
//    O-----------+
//    |     .     |
//    |   .....   |
//    | ......... |
//    | ......... |
//    | ......... |
//    |   .....   |
//    |     .     |
//    +-----------+
//
// For these sorts of layers, we can first check to see whether the
// point is within the bounding rectangle, and then check to see if
// the pixel under the point is transparent or not.
//
// Text layers do not lie within their bounding box. The width
// of the bounding box is used to determine where text should wrap,
// and the height of the bounding box controls the font size. The
// anchor is on the baseline of the text. Text layers therefore
// look something like this:
//
// Left-justified:
//
//                     THIS IS SOME TEXT
//                     O--------------------+
//                     +--------------------+
//
// Centered:
//
//             THIS IS SOME TEXT
//                     O--------------------+
//                     +--------------------+
//
// Right-justified:
//
//    THIS IS SOME TEXT
//                     O--------------------+
//                     +--------------------+
//
// Multi-line text layers will vertically overlap with the
// bounding box on the second line only, with the third and
// subsequent lines lying below the bounding box. To do hit
// testing on text, then, we replicate the word-wrapping
// algorithm and calculate a bounding rectangle for each line
// individually, checkin each one until a hit is found.
//
// For all other layer types, the bounding box is used as specified.
function pointToLayerLocal(layer, x, y) {
    let localX = x - layer.x;
    let localY = y - layer.y;
    const angle = Number(layer.angle) || 0;

    if (angle !== 0) {
        const cx = Number(layer.x) + Number(layer.width) / 2;
        const cy = Number(layer.y) + Number(layer.height) / 2;
        const dx = x - cx;
        const dy = y - cy;
        const angleRad = -Math.PI * angle / 180;
        const cos = Math.cos(angleRad);
        const sin = Math.sin(angleRad);
        localX = dx * cos - dy * sin + Number(layer.width) / 2;
        localY = dx * sin + dy * cos + Number(layer.height) / 2;
    }

    return { x: localX, y: localY };
}

function clickIsWithinLayer(layer, x, y) {
    if (!isLayerVisible(layer) || getLayerOpacity(layer) <= 0) return false;
    let c = document.getElementById("cmcanvas");
    let ctx = c.getContext("2d");

    // Check to see if we are inside the text bounding box of a text layer
    // n.b. Text is rendered just above the bounding box (bug?).
    if (layer.type == 'text') {
        return clickIsWithinText(layer, x - layer.x, (y - layer.y) + layer.height);
    }

    if (layer.type == "block") {
        const local = pointToLayerLocal(layer, x, y);
        const localX = local.x;
        const localY = local.y;

        if (localY < 0 || localY > layer.height || localX < 0 || localX > layer.width) {
            return false;
        }

        if (clickIsWithinTransparentArea(layer, localX, localY)) {
            return false;
        }

        return true;
    }

    if (isUserImageLayer(layer)) {
        const local = pointToLayerLocal(layer, x, y);
        return !(local.y < 0 || local.y > layer.height || local.x < 0 || local.x > layer.width);
    }

    // If the x,y is not inside the bounding box, then it's definitely a miss
    if (y < layer.y || y > layer.y + layer.height ||
        x < layer.x || x > layer.x + layer.width) {
        return false;
    }

    // If the click hits a transparent area, then count it as a miss
    if (clickIsWithinTransparentArea(layer, x - layer.x, y - layer.y)) {
        return false;
    }

    // If the click hasn't been found to be outside the area, then it is inside.
    return true;
}

function clickIsWithinTransparentArea(layer, x, y) {
    if ((layer.type != "block") || (!blockList[layer.iNum].obj.complete)) {
        console.log(layer);
        return false;
    }

    try {
        var ctx = document.createElement("canvas").getContext("2d");
        ctx.drawImage(blockList[layer.iNum].obj, 0, 0, layer.width, layer.height);
        let alpha = ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data[3]; // [0]R [1]G [2]B [3]A

        return alpha === 0;
    } catch (error) {
        // https://stackoverflow.com/questions/16217521/i-get-a-canvas-has-been-tainted-error-in-chrome-but-not-in-ff/16218015#16218015
        return false;
    }
}

// Calculate the actual visual bounds of text including all wrapped lines
// Returns {x, y, width, height} representing the total bounding box
function calculateTextBounds(layer) {
    let c = document.getElementById("cmcanvas");
    let ctx = c.getContext("2d");

    // Set font to match the text rendering
    if (!layer.style) layer.style = "normal";
    ctx.font = layer.style + " " + layer.weight + " " + layer.height + "px " + layer.font;

    let lines = layer.data.split("\n");
    let cnt = 0;
    let maxLineWidth = 0;

    // Count total lines and find the widest line
    for (var ln = 0; ln < lines.length; ln++) {
        let spl = lines[ln].split(" ");
        let o = "";
        while (spl.length) {
            o = spl.shift();
            while (spl.length && (ctx.measureText(o + " " + spl[0]).width < layer.width)) {
                o += " " + spl.shift();
            }
            maxLineWidth = Math.max(maxLineWidth, ctx.measureText(o).width);
            cnt++;
        }
    }

    // Total height includes all wrapped lines plus spacing between them
    let totalHeight = (layer.height + layer.lineSpace) * cnt - layer.lineSpace;

    // Calculate starting y position (text goes up from baseline)
    // Text baseline is at layer.y, text extends upward by approximately one line height
    let textStartY = layer.y - layer.height;

    // For centered/right text, we need to account for alignment
    let boundsX = layer.x;
    let boundsWidth = layer.width; // Use full width as text can wrap within it

    return {
        x: boundsX,
        y: textStartY,
        width: boundsWidth,
        height: totalHeight
    };
}

// This function is a copy of the text-wrapping algorithm in drawProject()
// Calculate the bounding box that encompasses all wrapped text lines, accounting for justification
function calculateTextBounds(layer) {
    const c = document.getElementById("cmcanvas");
    const ctx = c.getContext("2d");

    // Set up the font exactly as it's done in drawProject
    if (!layer.style) layer.style = "normal";
    ctx.font = layer.style + " " + layer.weight + " " + layer.height + "px " + layer.font;
    ctx.textAlign = layer.justify;

    let lines = layer.data.split("\n");
    let cnt = 0;
    let maxLineWidth = 0;

    // First pass: calculate total lines and max line width
    for (let ln = 0; ln < lines.length; ln++) {
        let spl = lines[ln].split(" ");
        let o = "";
        while (spl.length) {
            o = spl.shift();
            while (spl.length && (ctx.measureText(o + " " + spl[0]).width < layer.width)) {
                o += " " + spl.shift();
            }
            maxLineWidth = Math.max(maxLineWidth, ctx.measureText(o).width);
            cnt++;
        }
    }

    // Calculate total height
    const totalHeight = (layer.height + layer.lineSpace) * cnt - layer.lineSpace;

    // Calculate x offset based on justification (in local coordinates)
    let localX = 0;
    let width = maxLineWidth;

    if (layer.justify === "center") {
        localX = -(maxLineWidth / 2);
    } else if (layer.justify === "right") {
        localX = -maxLineWidth;
    }
    // For "left", localX stays at 0

    // If rotated, calculate axis-aligned bounding box (AABB)
    if (layer.angle && layer.angle !== 0) {
        const angleRad = Math.PI * layer.angle / 180;
        const cos = Math.cos(angleRad);
        const sin = Math.sin(angleRad);

        // Four corners of the unrotated text box (in local coordinates)
        // Text baseline is at y=0, text extends upward (negative y) by approximately layer.height
        const corners = [
            { x: localX, y: -layer.height },
            { x: localX + width, y: -layer.height },
            { x: localX, y: totalHeight - layer.height },
            { x: localX + width, y: totalHeight - layer.height }
        ];

        // Rotate corners and find AABB
        let minX = Infinity,
            minY = Infinity,
            maxX = -Infinity,
            maxY = -Infinity;
        for (let corner of corners) {
            const rotatedX = corner.x * cos - corner.y * sin;
            const rotatedY = corner.x * sin + corner.y * cos;
            minX = Math.min(minX, rotatedX);
            minY = Math.min(minY, rotatedY);
            maxX = Math.max(maxX, rotatedX);
            maxY = Math.max(maxY, rotatedY);
        }

        return {
            x: layer.x + minX,
            y: layer.y + minY,
            width: maxX - minX,
            height: maxY - minY,
            rotated: true,
            angle: layer.angle,
            // Include original corners for drawing rotated rect
            corners: corners.map(c => ({
                x: layer.x + c.x * cos - c.y * sin,
                y: layer.y + c.x * sin + c.y * cos
            }))
        };
    }

    return {
        x: layer.x + localX,
        y: layer.y - layer.height,
        width: width,
        height: totalHeight + layer.height,
        rotated: false
    };
}

// Make it available globally
window.calculateTextBounds = calculateTextBounds;

function clickIsWithinText(layer, x, y) {
    // Transform click coordinates if text is rotated
    let testX = x;
    let testY = y;

    if (layer.angle && layer.angle !== 0) {
        // For rotated text, compensate for the baseline offset that was applied by the caller
        // The caller added layer.height, but for rotated text we need to work in the rotated coordinate system
        testY = y - layer.height;

        // Apply inverse rotation to click point
        const angleRad = -Math.PI * layer.angle / 180;
        const cos = Math.cos(angleRad);
        const sin = Math.sin(angleRad);
        testX = x * cos - testY * sin;
        testY = x * sin + testY * cos;
    }

    if (testY < 0) {
        return false;
    }
    text = layer.data
    let c = document.getElementById("cmcanvas");
    let ctx = c.getContext("2d");
    let lines = text.split("\n");
    let cnt = 0;
    for (var ln = 0; ln < lines.length; ln++) {
        let spl = lines[ln].split(" ");
        let o = "";
        while (spl.length) {
            o = spl.shift();
            while (spl.length && (ctx.measureText(o + " " + spl[0]).width < layer.width)) {
                o += " " + spl.shift();
            }
            cnt++;
            lineWidth = ctx.measureText(o).width;
            if (testY < ((layer.height + layer.lineSpace) * cnt)) {
                if (layer.justify == "center") {
                    testX = testX + (lineWidth / 2);
                }
                if (layer.justify == "right") {
                    testX = testX + lineWidth;
                }

                return (testX > 0) && (testX < lineWidth);
            }
        }
    }
}

function dragEnd(event) {
    if (layerToDrag) {
        console.log("[UNDO] dragEnd triggered - capturing drag state");
        captureState("Drag layer");
    }
    layerToDrag = null;
}

function drag(event) {
    var mouse = getMousePos(event)
    var x = mouse.x + dragOffsetX,
        y = mouse.y + dragOffsetY;

    if (layerToDrag != null) {
        layerToDrag.x = x;
        layerToDrag.y = y;
        drawProject();
        // Update params panel live if the dragged layer is the currently selected one
        try {
            let selId = getSelectedLayerNodeId();
            if (selId && aLayers[selId] === layerToDrag) {
                refreshParamsForLayer(layerToDrag, selId);
            }
        } catch (e) {}
    }
}

function focusKeyInput(layer) {
    keyFocusLayer = layer;
    document.addEventListener("keydown", moveLayerWithKey, false);
}

function removeKeyInputFocus() {
    keyFocusLayer = null;
    document.removeEventListener("keydown", moveLayerWithKey, false);
}

function moveLayerWithKey(event) {
    if (keyFocusLayer != null) {
        aspectRatio = keyFocusLayer.height / keyFocusLayer.width;
        delta = getMoveDeltas(event, aspectRatio)
        if (delta.x || delta.y || delta.w || delta.h) {
            if (keyFocusLayer.type == "text") {
                if (event.altKey) {
                    delta.x = 0;
                    delta.y = 0;
                    if ((event.key == "ArrowUp") || (event.key == "ArrowDown")) {
                        // Do not adjust the width for alt up / down, only change the font size
                        delta.w = 0;
                        delta.h = 2 * Math.sign(delta.h);
                        delta.y = delta.h
                    } else {
                        // Do not adjust the height for alt left / right, only change the width (wrap point)
                        delta.h = 0;
                    }
                }
            }
            newX = keyFocusLayer.x + delta.x;
            newY = keyFocusLayer.y + delta.y;
            newWidth = keyFocusLayer.width + delta.w;
            newHeight = keyFocusLayer.height + delta.h;
            if (((newWidth >= 8) && (newHeight >= 8)) || (delta.w > 0)) {
                keyFocusLayer.x = newX;
                keyFocusLayer.y = newY;
                keyFocusLayer.width = newWidth;
                keyFocusLayer.height = newHeight;
                drawProject();
                try {
                    let selId = getSelectedLayerNodeId();
                    if (selId && aLayers[selId] === keyFocusLayer) {
                        refreshParamsForLayer(keyFocusLayer, selId);
                    }
                } catch (e) {}
            }
            event.preventDefault();
        }
    }
}

function getMoveDeltas(event, aspectRatio) {
    var delta = {
        x: 0,
        y: 0,
        w: 0,
        h: 0
    };

    // One pixel if shift is up, 1/12" if shift is down
    magnitude = 1;
    if (event.shiftKey) {
        magnitude = 25;
    }

    // Set the directions based on the key
    switch (event.key) {
        case "ArrowRight":
            delta.x = magnitude;
            break;
        case "ArrowLeft":
            delta.x = -magnitude;
            break;
        case "ArrowUp":
            delta.y = -magnitude;
            break;
        case "ArrowDown":
            delta.y = magnitude;
            break;
    }

    // If alt is down, convert movement into resize
    if (event.altKey) {
        var centered = (delta.y != 0);
        delta.w = delta.x - (2 * delta.y);
        delta.h = delta.w * aspectRatio;
        delta.x = 0;
        delta.y = 0;
        if (centered) {
            delta.x = -delta.w / 2;
            delta.y = -delta.h / 2;
        }
    }
    return delta;
}

function getParameterByName(name, url = window.location.href) {
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

// NOTE: Initialization moved to tm_cardmaker.html to ensure assets are loaded first
// This allows blockList and blockDefaults to be populated before resetProject() runs
var projectUrl = getParameterByName('project');
let loadedProjectUrl = localStorage.getItem("loadedProjectUrl");

var elem = document.getElementById('cmcanvas'),
    elemLeft = elem.offsetLeft + elem.clientLeft,
    elemTop = elem.offsetTop + elem.clientTop;

// Add event listener for `drag` events.
elem.addEventListener("mousedown", dragStart, false);
elem.addEventListener("mouseup", dragEnd, false);
elem.addEventListener("mousemove", drag, false);

var scrollArea = document.getElementById('canvasScrollarea');
var scrollInner = document.getElementById('canvasScrollinner');
if (scrollArea) {
    scrollArea.addEventListener("mousedown", function(event) {
        if (event.target === scrollArea || event.target === scrollInner) {
            deselectAllLayers();
        }
    }, false);
}

// Center the canvas in the scrollable area on load
function centerCanvas() {
    console.log("[CENTER] centerCanvas called, timestamp:", Date.now());
    var scrollArea = document.getElementById('canvasScrollarea');
    var scrollInner = document.getElementById('canvasScrollinner');
    var canvasWrap = document.getElementById('canvaswrap');
    var sidebar = document.getElementById('mySidebar'); // left sidebar
    var rightPanel = document.getElementById('rightPanel'); // right sidebar 

    if (scrollArea && scrollInner && canvasWrap) {
        // On desktop, adjust to center between the visible space
        if (window.innerWidth > 992) {
            var leftSidebarWidth = sidebar ? sidebar.offsetWidth : 0;
            var rightPanelWidth = rightPanel ? rightPanel.offsetWidth : 0;

            console.log("=== Canvas Centering Debug ===");
            console.log("Called from:", new Error().stack.split('\n')[2].trim());
            console.log("canvasZoom:", typeof canvasZoom !== 'undefined' ? canvasZoom : 'undefined');
            console.log("Window inner width:", window.innerWidth);
            console.log("Left sidebar width:", leftSidebarWidth);
            console.log("Right panel width:", rightPanelWidth);
            console.log("ScrollArea clientWidth:", scrollArea.clientWidth);
            console.log("ScrollInner scrollWidth:", scrollInner.scrollWidth);
            console.log("ScrollInner scrollHeight:", scrollInner.scrollHeight);
            console.log("CanvasWrap dimensions:", canvasWrap.offsetWidth, "x", canvasWrap.offsetHeight);
            console.log("Initial scrollLeft:", scrollArea.scrollLeft);
            console.log("Initial scrollTop:", scrollArea.scrollTop);

            // Get the actual position and size of the canvas wrapper
            var canvasRect = canvasWrap.getBoundingClientRect();
            var scrollAreaRect = scrollArea.getBoundingClientRect();

            // Calculate center position - but DON'T reset it first, work with current position
            var scrollWidth = scrollInner.scrollWidth;
            var scrollHeight = scrollInner.scrollHeight;
            var areaWidth = scrollArea.clientWidth;
            var areaHeight = scrollArea.clientHeight;

            // Only set basic centering if not already centered (first time)
            if (scrollArea.scrollLeft === 0 && scrollArea.scrollTop === 0) {
                console.log("Initial centering - setting basic scroll position");
                scrollArea.scrollLeft = (scrollWidth - areaWidth) / 2;
                scrollArea.scrollTop = (scrollHeight - areaHeight) / 2;

                // Recalculate canvas position after setting scroll
                canvasRect = canvasWrap.getBoundingClientRect();
            } else {
                console.log("Already scrolled - adjusting from current position");
            }

            // Calculate where the canvas center currently is relative to scrollArea's viewport
            var canvasCenterXInViewport = canvasRect.left - scrollAreaRect.left + (canvasRect.width / 2);
            var canvasCenterYInViewport = canvasRect.top - scrollAreaRect.top + (canvasRect.height / 2);

            // Calculate where we want the canvas center to be (in the middle of visible area)
            var visibleWidth = scrollArea.clientWidth - rightPanelWidth;
            var targetCenterXInViewport = visibleWidth / 2;
            var targetCenterYInViewport = scrollArea.clientHeight / 2;

            // Adjust scroll to move canvas center to target position (both horizontal and vertical)
            var scrollAdjustmentX = canvasCenterXInViewport - targetCenterXInViewport;
            var scrollAdjustmentY = canvasCenterYInViewport - targetCenterYInViewport;
            scrollArea.scrollLeft += scrollAdjustmentX;
            scrollArea.scrollTop += scrollAdjustmentY;

            console.log("Canvas center in viewport (X, Y):", canvasCenterXInViewport, canvasCenterYInViewport);
            console.log("Target center in viewport (X, Y):", targetCenterXInViewport, targetCenterYInViewport);
            console.log("Scroll adjustment (X, Y):", scrollAdjustmentX, scrollAdjustmentY);
            console.log("Final scrollLeft:", scrollArea.scrollLeft, "scrollTop:", scrollArea.scrollTop);
            console.log("==============================");

        } else {
            // Mobile - just do basic centering
            var scrollWidth = scrollInner.scrollWidth;
            var scrollHeight = scrollInner.scrollHeight;
            var areaWidth = scrollArea.clientWidth;
            var areaHeight = scrollArea.clientHeight;
            scrollArea.scrollLeft = (scrollWidth - areaWidth) / 2;
            scrollArea.scrollTop = (scrollHeight - areaHeight) / 2;
        }
    }
}

// Override the simple centerCanvas from HTML with this sidebar-aware version
window.centerCanvas = centerCanvas;
console.log("[JS] window.centerCanvas overridden with JS sidebar-aware version");

// Set zoomToFitAndCenter to call the HTML's zoomCanvasReset function
// This will be called on page load to automatically fit the canvas
window.zoomToFitAndCenter = function() {
    console.log("[JS] zoomToFitAndCenter called, delegating to zoomCanvasReset");
    if (typeof zoomCanvasReset === 'function') {
        zoomCanvasReset();
    } else {
        console.error("[JS] zoomCanvasReset function not found!");
        // Fallback to just centering
        window.centerCanvas();
    }
};

// Add event listener for undo/redo keyboard shortcuts
document.addEventListener("keydown", function(event) {
    // Ctrl+Z (or Cmd+Z on Mac) for undo
    if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        undo();
    }
    // Ctrl+Shift+Z (or Cmd+Shift+Z) or Ctrl+Y for redo
    else if (((event.ctrlKey || event.metaKey) && event.key === 'z' && event.shiftKey) ||
        ((event.ctrlKey || event.metaKey) && event.key === 'y')) {
        event.preventDefault();
        redo();
    }
}, false);
