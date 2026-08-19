(function(global) {
    "use strict";

    function icon(visible) {
        if (visible) return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
        return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18M10.6 6.1A10.8 10.8 0 0112 6c6.5 0 10 6 10 6a15.8 15.8 0 01-3 3.7M6.3 6.3C3.5 8.2 2 12 2 12s3.5 6 10 6a10.8 10.8 0 003.1-.4"/><path d="M9.9 9.9a3 3 0 004.2 4.2"/></svg>';
    }

    function updateVisibility(row, layer) {
        const visible = global.TMCardMakerLayerModel.isVisible(layer);
        row.classList.toggle("layer-hidden", !visible);
        const button = row.querySelector(".layer-visibility-button");
        if (!button) return;
        button.innerHTML = icon(visible);
        button.title = visible ? "Hide layer" : "Show layer";
        button.setAttribute("aria-label", button.title);
        button.setAttribute("aria-pressed", visible ? "true" : "false");
    }

    function buildRow(options) {
        const layer = options.layer;
        const row = document.createElement("div");
        row.id = options.id;
        row.className = "divRec";
        if (!options.isBase) {
            const group = document.createElement("input");
            group.type = "checkbox";
            group.className = "groupcheck w3-hide";
            row.appendChild(group);
        }

        const inside = document.createElement("div");
        inside.className = "inside";
        inside.onclick = options.onSelect;

        const eye = document.createElement("button");
        eye.type = "button";
        eye.className = "layer-visibility-button";
        eye.onclick = function(event) { event.stopPropagation(); options.onToggleVisibility(row, layer); };
        inside.appendChild(eye);

        const name = document.createElement("input");
        name.type = "text";
        name.id = options.nameInputId;
        name.maxLength = 20;
        name.size = 15;
        name.value = options.title;
        name.onchange = function(event) { options.onRename(event, name); };
        inside.appendChild(name);

        if (!options.isBase) {
            const remove = document.createElement("button");
            remove.innerHTML = "X";
            remove.style.float = "right";
            remove.onclick = function(event) { options.onDelete(event, remove); };
            inside.appendChild(remove);
        }
        if (options.thumbnail) inside.appendChild(options.thumbnail);
        if (!options.isBase) {
            const drag = document.createElement("button");
            drag.type = "button";
            drag.className = "layer-drag-handle";
            drag.title = "Drag to reorder layer";
            drag.setAttribute("aria-label", drag.title);
            drag.innerHTML = "<span></span><span></span><span></span><span></span><span></span><span></span>";
            drag.onclick = event => event.stopPropagation();
            inside.appendChild(drag);
        }
        row.appendChild(inside);
        updateVisibility(row, layer);
        return row;
    }

    global.TMCardMakerLayerPanel = Object.freeze({ buildRow, updateVisibility });
})(window);

// Editor layer workflow and sidebar interaction.
function addLayer(title, layer) {
    // <div id='div1' class='divRec'><div class='inside'>item 1</div></div>

    // Initialize layer.name if not already set
    if (!layer.name) {
        layer.name = title;
    }
    TMCardMakerLayerModel.normalize(layer);

    if (!ddcount && (ddcount != 0)) ddcount = 0;
    let thumbnail = null;
    if (layer.type === "block" && layer.iNum !== undefined && layer.iNum >= 0) {
        const block = blockList[layer.iNum];
        if (block && block.src) thumbnail = createLayerThumbnail(block.src);
    }
    const toAdd = buildLayerRow("dragdropdiv" + ddcount, title, layer, ddcount, thumbnail);
    document.getElementById("layerlist").appendChild(toAdd);
    projectState.add(toAdd.id, layer);
    updateLayerVisibilityUI(toAdd, layer);
    ddcount++;

    sortable(document.getElementById('layerlist'), handleLayerOrderChanged);
    if (!reloading) captureState("Add layer: " + title);
    return layer;
}

function buildLayerRow(id, title, layer, index, thumbnail) {
    return TMCardMakerLayerPanel.buildRow({
        id: id,
        layer: layer,
        title: title,
        nameInputId: "layername" + index,
        isBase: layer.type === "base",
        thumbnail: thumbnail,
        onSelect: selectLayer,
        onRename: updateLayerName,
        onDelete: deleteListItem,
        onToggleVisibility: function(row, targetLayer) {
            const label = (isLayerVisible(targetLayer) ? "Hide layer: " : "Show layer: ") + (targetLayer.name || "Layer");
            targetLayer.visible = !isLayerVisible(targetLayer);
            TMCardMakerLayerPanel.updateVisibility(row, targetLayer);
            drawProject();
            captureState(label);
        }
    });
}

function isLayerVisible(layer) {
    return TMCardMakerLayerModel.isVisible(layer);
}

function getLayerOpacity(layer) {
    return TMCardMakerLayerModel.getOpacity(layer);
}

function updateLayerVisibilityUI(layerNode, layer) {
    if (layerNode && layer) TMCardMakerLayerPanel.updateVisibility(layerNode, layer);
}

function createLayerThumbnail(src) {
    // Create thumbnail container
    let container = document.createElement("span");
    container.className = "layer-thumbnail";
    container.style.display = "inline-block";
    container.style.width = "32px";
    container.style.height = "32px";
    container.style.border = "1px solid #ddd";
    container.style.borderRadius = "3px";
    container.style.overflow = "hidden";
    container.style.backgroundColor = "#f9f9f9";

    // Find the putUnder (category path) from blockList
    let putUnder = null;
    for (let block of blockList) {
        if (block.src === src) {
            putUnder = block.putUnder;
            break;
        }
    }

    if (!putUnder) {
        console.log(`Could not find category for ${src}`);
        return container; // Return empty container
    }

    // Use existing thumbnail system to load the image
    const thumbnailUrl = getThumbnailUrl(src, putUnder, 64);

    // Create img element
    let img = document.createElement("img");
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "contain";
    img.style.display = "block";

    // Load thumbnail using existing fetch logic
    fetch(thumbnailUrl)
        .then(response => {
            if (response.ok) {
                img.src = thumbnailUrl;
            } else {
                // Fallback to 64px if preferred size not found
                const fallbackUrl = getThumbnailUrl(src, putUnder, 64);
                return fetch(fallbackUrl).then(fallbackResponse => {
                    if (fallbackResponse.ok) {
                        img.src = fallbackUrl;
                    }
                });
            }
        })
        .catch(err => {
            console.log(`Thumbnail not available for ${src}`);
        });

    container.appendChild(img);
    return container;
}

function updateLayerName(e, th) {
    let layerName = th.parentNode.parentNode.id;
    aLayers[layerName].name = th.value;
    drawProject();
}

function deleteListItem(e, th) {
    e.stopPropagation();
    // delete item from aLayers and from layerlist (DOM)
    let toDelete = th.parentNode.parentNode;
    const deletedLayerName = aLayers[toDelete.id].name;
    // let deleteNum = Number(toDelete.id.slice(11));
    // // for every list numbered > than the one being deleted, subtract 1
    // let allLayerNodes = toDelete.parentNode.children;
    // for (let ch=0; ch < allLayerNodes.length; ch++) {
    //   let thisNum = Number(allLayerNodes[ch].id.slice(11));
    //   if (thisNum > deleteNum)   {
    //     thisNum--;
    //     allLayerNodes[ch].id = "dragdropdiv" + thisNum;
    //   }

    // }
    projectState.remove(toDelete.id);
    toDelete.parentNode.removeChild(toDelete);
    drawProject();
    captureState("Delete layer: " + deletedLayerName);
}

// Return the id of the currently selected layer DOM node, or null
function getSelectedLayerNodeId() {
    let nodes = document.getElementsByClassName('divRec');
    for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].classList.contains('selected')) return nodes[i].id;
    }
    return null;
}

// Update the params panel inputs to reflect `layer`'s current values.
function refreshParamsForLayer(layer, nodeId) {
    if (!layer) return;
    let thisLayer = layer;
    TMCardMakerLayerModel.normalize(thisLayer);
    let thisLayerParams = thisLayer.params || "";
    thisLayerParams += " allopacity";
    if (!nodeId) nodeId = getSelectedLayerNodeId();
    if (nodeId != "dragdropdiv0") {
        thisLayerParams += " allall";
    }
    if ((thisLayer.type == "block") || isUserImageLayer(thisLayer)) {
        thisLayerParams += " allangle blockcolor";
        if (thisLayer.angle === undefined) thisLayer.angle = 0;
        ensureBlockColorDefaults(thisLayer);
    }

    for (let pch = 0; pch < domParams.children.length; pch++) {
        let thispch = domParams.children[pch];
        if (thisLayerParams.indexOf(thispch.id) == -1) {
            thispch.classList.add("w3-hide");
        } else {
            thispch.classList.remove("w3-hide");
            for (let intype of["input", "textarea", "select"]) {
                let chInputs = thispch.getElementsByTagName(intype);
                for (let subch of chInputs) {
                    if (subch.id.indexOf("input") == 0) {
                        if (subch.type == "checkbox") {
                            subch.checked = thisLayer[subch.id.slice(5)];
                        } else {
                            // guard against undefined properties
                            try { subch.value = thisLayer[subch.id.slice(5)]; } catch (e) {}
                        }
                        syncLinkedBlockColorInput(subch);
                    } else if ((subch.id == "lar") || (subch.id == "slar")) {
                        subch.checked = true;
                    } else if (subch.id == "presets") {
                        let opts = subch.getElementsByTagName("option");
                        let defType = "";
                        if (thisLayer.type == "block") {
                            defType = blockList[thisLayer.iNum].putUnder;
                            // Strip "blocks/" prefix if present to match blockDefaults keys
                            if (defType && defType.indexOf("blocks/") === 0) {
                                defType = defType.slice(7);
                            }
                        } else if (thisLayer.type == "text") {
                            defType = "text";
                        } else if (thisLayer.type == "production") {
                            defType = "production";
                        }
                        if (defType) {
                            subch.value = "";
                            while (opts.length < blockDefaults[defType].length + 1) {
                                let cNode = opts[1].cloneNode(false);
                                cNode.value = "defselect" + (opts.length - 1);
                                subch.appendChild(cNode);
                            }
                            for (let i = 1; i < opts.length; i++) {
                                if (i <= blockDefaults[defType].length) {
                                    opts[i].innerText = blockDefaults[defType][i - 1].label;
                                    opts[i].classList.remove("w3-hide");
                                } else {
                                    opts[i].classList.add("w3-hide");
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    syncOtherBgPadInputs(thisLayer);
}

// Helper function to scroll the properties panel to show the selected element
function scrollPropertiesPanelToElement(element) {
    const rightPanel = document.getElementById('rightPanel');
    if (!rightPanel || !element || !element.offsetParent) return;

    // Get the position of the element relative to the rightPanel
    const elementRect = element.getBoundingClientRect();
    const panelRect = rightPanel.getBoundingClientRect();

    // Calculate the element's position relative to the panel's scrollable content
    const elementTopInPanel = elementRect.top - panelRect.top + rightPanel.scrollTop;
    const elementHeight = elementRect.height;
    const panelHeight = rightPanel.clientHeight;

    // Center the element vertically in the panel
    // Calculate where the top should be so the element is centered
    const targetScrollTop = elementTopInPanel - (panelHeight / 2) + (elementHeight / 2);

    rightPanel.scrollTop = targetScrollTop;
}

// Helper function to select a layer by its DOM ID (used by undo/redo)
function selectLayerById(layerId) {
    const layerEl = document.getElementById(layerId);
    if (!layerEl) return;

    const insideDiv = layerEl.querySelector('.inside');
    if (!insideDiv) return;

    // Call selectLayer with the proper 'this' context
    selectLayer.call(insideDiv);
}

function selectLayer() {
    removeKeyInputFocus();
    let allLayerNodes = document.getElementById("layerlist").children;
    let clickedNode = this.parentNode;

    // Deselect any other node but keep the clicked node selected
    for (let ch = 0; ch < allLayerNodes.length; ch++) {
        let node = allLayerNodes[ch];
        if (node !== clickedNode && node.classList.contains("selected")) {
            // Remove params from previously selected node
            if (domParams.parentNode == node) {
                node.removeChild(domParams);
            }
            node.classList.remove("selected");
            let buttons = node.getElementsByTagName("button");
            if (buttons.length) {
                buttons[0].style.display = "block";
            }
        }
    }

    // Ensure clicked node is selected (keep it selected if it already was)
    if (!clickedNode.classList.contains("selected")) {
        clickedNode.classList.add("selected");
    }

    // Show appropriate params for the clicked layer (populate inputs)
    let thisLayer = aLayers[clickedNode.id];
    refreshParamsForLayer(thisLayer, clickedNode.id);

    // Insert params after the .inside div (accordion-style between layers)
    let insideDiv = clickedNode.querySelector('.inside');
    if (insideDiv && insideDiv.nextSibling) {
        clickedNode.insertBefore(domParams, insideDiv.nextSibling);
    } else if (insideDiv) {
        clickedNode.insertBefore(domParams, insideDiv.nextSibling);
    } else {
        clickedNode.appendChild(domParams);
    }

    // Auto-scroll the properties panel to show the selected layer's properties
    scrollPropertiesPanelToElement(domParams);

    try { drawProject(); } catch (e) {}
}

function deselectAllLayers() {
    let selectedNodes = document.getElementsByClassName("selected");
    for (let i = selectedNodes.length - 1; i >= 0; i--) {
        let node = selectedNodes[i];
        if (typeof domParams !== 'undefined' && domParams.parentNode === node) {
            node.removeChild(domParams);
        }
        node.classList.remove("selected");
        let buttons = node.getElementsByTagName("button");
        if (buttons.length) {
            buttons[0].style.display = "block";
        }
    }
    try { drawProject(); } catch (e) {}
}

// ========== UNDO SYSTEM ==========
// Clear undo history and prepare for a fresh start
function clearUndoHistory() {
    historyStore.clear();
}

// Capture an initial state (called after loading a template or project)
function captureInitialState(label) {
    if (isRestoringState) return;
    clearUndoHistory();
    captureState(label || "Initial state");
}

// Check if current state differs from the previous undo state
// Capture the current state of all layers for undo
function captureState(label) {
    if (isRestoringState) return; // Don't capture while restoring
    const captured = historyStore.capture(aLayers, projectState.getOrder(), label);
    if (!captured) console.log(`[UNDO] State unchanged - skipping capture for "${label}"`);
}

// Restore a previous state from the undo stack
function undo() {
    const snapshot = historyStore.undo();
    if (!snapshot) return console.log("[UNDO] No undo history available");
    restoreHistorySnapshot(snapshot);
}

// Go forward in undo history
function redo() {
    const snapshot = historyStore.redo();
    if (!snapshot) return console.log("[UNDO] No redo history available");
    restoreHistorySnapshot(snapshot);
}

function restoreHistorySnapshot(snapshot) {
    isRestoringState = true;

    // Save the currently selected layer ID before restoring
    const selDiv = document.querySelector('.divRec.selected');
    const selectedLayerId = selDiv ? selDiv.id : null;

    // Deep clone the state to restore
    aLayers = projectState.replace(snapshot.layers, snapshot.layerOrder);

    // Rebuild the layer list UI to match restored state
    rebuildLayerListUI();

    // Restore the selection if that layer still exists
    if (selectedLayerId && aLayers[selectedLayerId]) {
        const layerEl = document.getElementById(selectedLayerId);
        if (layerEl) {
            selectLayerById(selectedLayerId);
        }
    } else {
        // If the previously selected layer no longer exists, select the first layer
        const firstLayer = document.querySelector('.divRec');
        if (firstLayer) {
            selectLayerById(firstLayer.id);
        }
    }

    drawProject();
    isRestoringState = false;
}

// Update the max undo steps setting
function updateMaxUndoSteps(input) {
    const newMax = Number(input.value);
    if (newMax < 5 || newMax > 500) {
        input.value = maxUndoSteps;
        return;
    }
    maxUndoSteps = newMax;
    historyStore.setMaxSteps(newMax);

    console.log("Max undo steps set to: " + maxUndoSteps);
}

// Rebuild the layer list UI from current aLayers state
function rebuildLayerListUI() {
    const layerList = document.getElementById("layerlist");
    if (!layerList) return;

    const layerOrder = projectState.getOrder();

    // Clear the list
    layerList.innerHTML = "";

    // Rebuild in the saved order, only for layers that exist in aLayers
    for (let layerId of layerOrder) {
        if (aLayers[layerId]) {
            const layer = aLayers[layerId];
            const layerIdx = parseInt(layerId.slice("dragdropdiv".length), 10);
            let thumbnail = null;
            if (layer.type === "block" && layer.iNum !== undefined && layer.iNum >= 0) {
                const block = blockList[layer.iNum];
                if (block && block.src) thumbnail = createLayerThumbnail(block.src);
            }
            const li = buildLayerRow(layerId, layer.name || "", layer, layerIdx, thumbnail);
            layerList.appendChild(li);
        }
    }

    // Re-initialize sortable if available
    if (typeof sortable === 'function') {
        sortable(layerList, handleLayerOrderChanged);
    }
}

// ========== END UNDO SYSTEM ==========

// drag/drop stuff
function handleLayerOrderChanged(item) {
    const orderedIds = Array.from(document.getElementById("layerlist").children).map(function(row) {
        return row.id;
    });
    projectState.reorder(orderedIds);
    captureState("Reorder layer: " + ((item && aLayers[item.id] && aLayers[item.id].name) || "Layer"));
}

function sortable(section, onUpdate) {
    section._sortableOnUpdate = onUpdate;
    if (section._sortableInitialized) return;
    section._sortableInitialized = true;

    var dragEl, nextEl, newPos, activeDragHandleLayer;
    var dragRect;

    [...section.children].map(item => {
        item.draggable = false;
        let pos = document.getElementById(item.id).getBoundingClientRect();
        // let pos = item.getBoundingClientRect();
        return pos;
    });

    function clearArmedDragHandle() {
        if (activeDragHandleLayer && activeDragHandleLayer !== dragEl) {
            activeDragHandleLayer.draggable = false;
        }
        if (!dragEl) {
            activeDragHandleLayer = null;
        }
    }

    function _onDragOver(e) {

        let selectedDoms = document.getElementsByClassName("selected");
        for (let i = selectedDoms.length - 1; i >= 0; i--) {
            // Remove params when dragging
            if (domParams.parentNode == selectedDoms[i]) {
                selectedDoms[i].removeChild(domParams);
            }
            selectedDoms[i].classList.remove("selected");
        }
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        var target = e.target.closest(".divRec");
        if (target && target !== dragEl) {
            //getBoundingClientRect contains location-info about the element (relative to the viewport)
            var targetPos = target.getBoundingClientRect();
            // if dragging higher, put element before target
            // if dragging lower, put element after target (i.e. before target.nextSibling)
            if (targetPos.top < dragRect.top) {
                if (target.id == "dragdropdiv0") return;
                section.insertBefore(dragEl, target);
            } else {
                section.insertBefore(dragEl, target.nextSibling);
            }
        }
    }

    function _onDragEnd(evt) {
        evt.preventDefault();
        newPos = [...section.children].map(child => {
            let pos = document.getElementById(child.id).getBoundingClientRect();
            //  let pos = child.getBoundingClientRect();
            return pos;
        });
        dragEl.classList.remove('ghost');
        section.removeEventListener('dragover', _onDragOver, false);
        section.removeEventListener('dragend', _onDragEnd, false);

        nextEl !== dragEl.nextSibling ? section._sortableOnUpdate(dragEl) : false;
        if (dragEl) {
            dragEl.draggable = false;
            dragEl = null;
        }
        activeDragHandleLayer = null;

        drawProject();
    }

    section.addEventListener('mousedown', function(e) {
        const handle = e.target.closest(".layer-drag-handle");
        if (!handle) return;
        const layerRow = handle.closest(".divRec");
        if (!layerRow || layerRow.id == "dragdropdiv0") return;
        activeDragHandleLayer = layerRow;
        layerRow.draggable = true;
    });

    section.addEventListener('mouseup', function() {
        clearArmedDragHandle();
    });

    document.addEventListener('mouseup', clearArmedDragHandle);

    section.addEventListener('dragstart', function(e) {
        const layerRow = e.target.closest(".divRec");
        if (!layerRow || layerRow !== activeDragHandleLayer || layerRow.id == "dragdropdiv0") {
            e.preventDefault();
            return;
        }

        dragEl = layerRow;
        dragRect = dragEl.getBoundingClientRect();
        nextEl = dragEl.nextSibling;

        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('Text', dragEl.textContent);

        section.addEventListener('dragover', _onDragOver, false);
        section.addEventListener('dragend', _onDragEnd, false);

        setTimeout(function() {
            dragEl.classList.add('ghost');
        }, 0)

    });
}
