(function(global) {
    "use strict";

    function icon(visible) {
        if (visible) return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
        return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18M10.6 6.1A10.8 10.8 0 0112 6c6.5 0 10 6 10 6a15.8 15.8 0 01-3 3.7M6.3 6.3C3.5 8.2 2 12 2 12s3.5 6 10 6a10.8 10.8 0 003.1-.4"/><path d="M9.9 9.9a3 3 0 004.2 4.2"/></svg>';
    }

    function lockIcon(locked) {
        if (locked) return '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 018 0v3"/></svg>';
        return '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M16 10V7a4 4 0 00-7.5-2"/></svg>';
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

    function updateLocked(row, layer) {
        const locked = layer.locked === true;
        row.classList.toggle("layer-locked", locked);
        const button = row.querySelector(".layer-lock-button");
        if (button) {
            button.innerHTML = lockIcon(locked);
            button.title = locked ? "Unlock layer" : "Lock layer";
            button.setAttribute("aria-label", button.title);
            button.setAttribute("aria-pressed", locked ? "true" : "false");
        }
        const name = row.querySelector(".layer-name-input");
        if (name) name.disabled = locked;
        const remove = row.querySelector(".layer-delete-button");
        if (remove) remove.disabled = locked;
        const drag = row.querySelector(".layer-drag-handle");
        if (drag) drag.disabled = locked;
    }

    function buildRow(options) {
        const layer = options.layer;
        const row = document.createElement("div");
        row.id = options.id;
        row.className = "divRec";
        const inside = document.createElement("div");
        inside.className = "inside";
        inside.onclick = function(event) { options.onSelect.call(inside, event); };

        const eye = document.createElement("button");
        eye.type = "button";
        eye.className = "layer-visibility-button";
        eye.onclick = function(event) { event.stopPropagation(); options.onToggleVisibility(row, layer); };
        inside.appendChild(eye);

        const lock = document.createElement("button");
        lock.type = "button";
        lock.className = "layer-lock-button";
        lock.onclick = function(event) { event.stopPropagation(); options.onToggleLock(row, layer); };
        inside.appendChild(lock);

        const type = document.createElement("span");
        type.className = "layer-type-label";
        type.textContent = layer.type === "userFile" || layer.type === "webFile" || layer.type === "embedded" ? "image" : layer.type;
        type.title = "Layer type: " + type.textContent;
        inside.appendChild(type);

        const name = document.createElement("input");
        name.type = "text";
        name.id = options.nameInputId;
        name.maxLength = 20;
        name.size = 20;
        name.className = "layer-name-input";
        name.value = options.title;
        name.onchange = function(event) { options.onRename(event, name); };
        inside.appendChild(name);

        if (options.thumbnail) inside.appendChild(options.thumbnail);
        if (!options.isBase) {
            const remove = document.createElement("button");
            remove.innerHTML = "X";
            remove.className = "layer-delete-button";
            remove.style.float = "right";
            remove.onclick = function(event) { options.onDelete(event, remove); };
            inside.appendChild(remove);
        }
        if (!options.isBase) {
            const more = document.createElement("button");
            more.type = "button";
            more.className = "layer-menu-button";
            more.title = "Layer actions";
            more.setAttribute("aria-label", more.title);
            more.textContent = "⋯";
            more.onclick = function(event) {
                event.stopPropagation();
                const rect = more.getBoundingClientRect();
                options.onContextMenu({ clientX: rect.right - 180, clientY: rect.bottom }, row, layer);
            };
            inside.appendChild(more);

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
        row.oncontextmenu = function(event) {
            event.preventDefault();
            options.onContextMenu(event, row, layer);
        };
        updateVisibility(row, layer);
        updateLocked(row, layer);
        return row;
    }

    global.TMCardMakerLayerPanel = Object.freeze({ buildRow, updateVisibility, updateLocked });
})(window);

// Editor layer workflow and sidebar interaction.
var selectionAnchorId = null;

function isGroupLayer(layer) {
    return !!layer && layer.type === "group";
}

function getGroupChildren(groupId) {
    return projectState.getOrder().filter(function(layerId) {
        return aLayers[layerId] && aLayers[layerId].groupId === groupId;
    });
}

function isLayerEffectivelyVisible(layerId) {
    const layer = aLayers[layerId];
    if (!layer || !TMCardMakerLayerModel.isVisible(layer)) return false;
    const group = layer.groupId ? aLayers[layer.groupId] : null;
    return !group || TMCardMakerLayerModel.isVisible(group);
}

function isLayerEffectivelyLocked(layerId) {
    const layer = aLayers[layerId];
    if (!layer || layer.locked) return true;
    const group = layer.groupId ? aLayers[layer.groupId] : null;
    return !!(group && group.locked);
}

function updateGroupUI(row, group) {
    if (!row || !group) return;
    row.classList.toggle("group-collapsed", !!group.collapsed);
    row.classList.toggle("layer-hidden", !TMCardMakerLayerModel.isVisible(group));
    row.classList.toggle("layer-locked", !!group.locked);
    const disclosure = row.querySelector(".group-disclosure-button");
    if (disclosure) {
        disclosure.textContent = group.collapsed ? "▸" : "▾";
        disclosure.setAttribute("aria-label", group.collapsed ? "Expand group" : "Collapse group");
    }
    const visibility = row.querySelector(".group-visibility-button");
    if (visibility) {
        visibility.textContent = TMCardMakerLayerModel.isVisible(group) ? "◉" : "○";
        visibility.setAttribute("aria-label", TMCardMakerLayerModel.isVisible(group) ? "Hide group" : "Show group");
    }
    const lock = row.querySelector(".group-lock-button");
    if (lock) {
        lock.textContent = group.locked ? "🔒" : "🔓";
        lock.setAttribute("aria-label", group.locked ? "Unlock group" : "Lock group");
    }
    const groupName = row.querySelector(".layer-name-input");
    const ungroup = row.querySelector(".group-ungroup-button");
    const remove = row.querySelector(".layer-delete-button");
    if (groupName) groupName.disabled = !!group.locked;
    if (ungroup) ungroup.disabled = !!group.locked;
    if (remove) remove.disabled = !!group.locked;
    getGroupChildren(row.id).forEach(function(childId) {
        const childRow = document.getElementById(childId);
        if (!childRow) return;
        childRow.classList.toggle("group-child-collapsed", !!group.collapsed);
        childRow.classList.toggle("group-parent-hidden", !TMCardMakerLayerModel.isVisible(group));
        childRow.classList.toggle("group-parent-locked", !!group.locked);
        const childLayer = aLayers[childId];
        if (childLayer) TMCardMakerLayerPanel.updateLocked(childRow, childLayer);
        if (group.locked) {
            childRow.querySelectorAll("input, button").forEach(function(control) { control.disabled = true; });
        }
    });
}

function buildGroupRow(id, group) {
    const row = document.createElement("div");
    row.id = id;
    row.className = "divRec layer-group-row";
    const inside = document.createElement("div");
    inside.className = "inside";
    inside.onclick = function(event) { selectLayer.call(inside, event); };

    const disclosure = document.createElement("button");
    disclosure.type = "button";
    disclosure.className = "group-disclosure-button";
    disclosure.onclick = function(event) {
        event.stopPropagation();
        group.collapsed = !group.collapsed;
        updateGroupUI(row, group);
        drawProject();
        captureState((group.collapsed ? "Collapse group: " : "Expand group: ") + group.name);
    };
    inside.appendChild(disclosure);

    const visibility = document.createElement("button");
    visibility.type = "button";
    visibility.className = "group-visibility-button";
    visibility.onclick = function(event) {
        event.stopPropagation();
        group.visible = !TMCardMakerLayerModel.isVisible(group);
        updateGroupUI(row, group);
        drawProject();
        captureState((group.visible ? "Show group: " : "Hide group: ") + group.name);
    };
    inside.appendChild(visibility);

    const lock = document.createElement("button");
    lock.type = "button";
    lock.className = "group-lock-button";
    lock.onclick = function(event) {
        event.stopPropagation();
        group.locked = !group.locked;
        updateGroupUI(row, group);
        updateSelectionToolbar();
        drawProject();
        captureState((group.locked ? "Lock group: " : "Unlock group: ") + group.name);
    };
    inside.appendChild(lock);

    const label = document.createElement("span");
    label.className = "layer-type-label group-type-label";
    label.textContent = "GROUP";
    inside.appendChild(label);

    const name = document.createElement("input");
    name.type = "text";
    name.className = "layer-name-input";
    name.id = "layername" + id.slice("dragdropdiv".length);
    name.value = group.name || "Group";
    name.onchange = function(event) { updateLayerName(event, name); };
    inside.appendChild(name);

    const ungroup = document.createElement("button");
    ungroup.type = "button";
    ungroup.className = "group-ungroup-button";
    ungroup.textContent = "Ungroup";
    ungroup.onclick = function(event) { event.stopPropagation(); ungroupLayer(id); };
    inside.appendChild(ungroup);

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "layer-delete-button";
    remove.textContent = "X";
    remove.title = "Delete group and its layers";
    remove.onclick = function(event) { event.stopPropagation(); deleteGroupLayer(id); };
    inside.appendChild(remove);
    row.appendChild(inside);
    updateGroupUI(row, group);
    return row;
}

function addLayer(title, layer, options) {
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
    const layerId = "dragdropdiv" + ddcount;
    const toAdd = isGroupLayer(layer)
        ? buildGroupRow(layerId, layer)
        : buildLayerRow(layerId, title, layer, ddcount, thumbnail);
    document.getElementById("layerlist").appendChild(toAdd);
    projectState.add(toAdd.id, layer);
    if (layer.groupId && aLayers[layer.groupId]) {
        toAdd.classList.add("group-child");
        toAdd.dataset.groupId = layer.groupId;
        updateGroupUI(document.getElementById(layer.groupId), aLayers[layer.groupId]);
    }
    updateLayerVisibilityUI(toAdd, layer);
    ddcount++;

    sortable(document.getElementById('layerlist'), handleLayerOrderChanged);
    if (!reloading && !(options && options.skipHistory)) captureState("Add layer: " + title);
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
        onToggleLock: toggleLayerLock,
        onContextMenu: showLayerContextMenu,
        onToggleVisibility: function(row, targetLayer) {
            const label = (isLayerVisible(targetLayer) ? "Hide layer: " : "Show layer: ") + (targetLayer.name || "Layer");
            targetLayer.visible = !isLayerVisible(targetLayer);
            TMCardMakerLayerPanel.updateVisibility(row, targetLayer);
            drawProject();
            captureState(label);
        }
    });
}

function toggleLayerLock(row, layer) {
    layer.locked = !layer.locked;
    TMCardMakerLayerPanel.updateLocked(row, layer);
    if (row.classList.contains("selected")) refreshParamsForLayer(layer, row.id);
    captureState((layer.locked ? "Lock layer: " : "Unlock layer: ") + (layer.name || "Layer"));
}

function setSelectedLayersLocked(locked) {
    const ids = getSelectedLayerIds(false);
    if (!ids.length) return;
    ids.forEach(function(id) {
        const layer = aLayers[id];
        if (!layer || layer.type === "base") return;
        layer.locked = locked;
        const row = document.getElementById(id);
        if (isGroupLayer(layer)) updateGroupUI(row, layer);
        else TMCardMakerLayerPanel.updateLocked(row, layer);
    });
    drawProject();
    captureState((locked ? "Lock " : "Unlock ") + ids.length + " layers");
}

function toggleSelectedLayersLocked() {
    const ids = getSelectedLayerIds(false).filter(function(id) { return id !== "dragdropdiv0" && aLayers[id]; });
    const shouldLock = ids.some(function(id) { return !aLayers[id].locked; });
    setSelectedLayersLocked(shouldLock);
    updateSelectionToolbar();
}

function setSelectedLayersVisible(visible) {
    const ids = getSelectedLayerIds(false);
    if (!ids.length) return;
    ids.forEach(function(id) {
        const layer = aLayers[id];
        if (!layer || layer.type === "base") return;
        layer.visible = visible;
        const row = document.getElementById(id);
        if (isGroupLayer(layer)) updateGroupUI(row, layer);
        else TMCardMakerLayerPanel.updateVisibility(row, layer);
    });
    drawProject();
    captureState((visible ? "Show " : "Hide ") + ids.length + " layers");
}

function toggleSelectedLayersVisible() {
    const ids = getSelectedLayerIds(false).filter(function(id) { return id !== "dragdropdiv0" && aLayers[id]; });
    const shouldShow = ids.some(function(id) { return !TMCardMakerLayerModel.isVisible(aLayers[id]); });
    setSelectedLayersVisible(shouldShow);
    updateSelectionToolbar();
}

function deleteSelectedLayers() {
    const selected = getSelectedLayerIds(false).filter(function(id) {
        return id !== "dragdropdiv0" && aLayers[id] && !isLayerEffectivelyLocked(id);
    });
    if (!selected.length) return;
    const removal = [];
    selected.forEach(function(id) {
        if (isGroupLayer(aLayers[id])) getGroupChildren(id).forEach(function(childId) { removal.push(childId); });
        removal.push(id);
    });
    deselectAllLayers();
    Array.from(new Set(removal)).forEach(function(id) { projectState.remove(id); });
    rebuildLayerListUI();
    drawProject();
    captureState("Delete " + selected.length + " selected layers");
}

function createGroupFromSelection() {
    const selected = getSelectedLayerIds(false).filter(function(id) {
        return id !== "dragdropdiv0" && aLayers[id] && !isGroupLayer(aLayers[id]) && !aLayers[id].groupId;
    });
    if (selected.length < 2) return;
    const oldOrder = projectState.getOrder();
    const insertionIndex = Math.min.apply(null, selected.map(function(id) { return oldOrder.indexOf(id); }));
    const group = TMCardMakerLayerModel.normalize({
        type: "group",
        name: "Group",
        params: "",
        collapsed: false,
        groupKey: "group-" + Date.now() + "-" + ddcount
    });
    addLayer(group.name, group, { skipHistory: true });
    const groupId = "dragdropdiv" + (ddcount - 1);
    selected.forEach(function(id) {
        aLayers[id].groupId = groupId;
        aLayers[id].parentGroupKey = group.groupKey;
    });
    const remaining = oldOrder.filter(function(id) { return selected.indexOf(id) === -1; });
    remaining.splice.apply(remaining, [insertionIndex, 0, groupId].concat(selected));
    projectState.reorder(remaining);
    rebuildLayerListUI();
    selectLayerById(groupId);
    drawProject();
    captureState("Group " + selected.length + " layers");
}

function ungroupLayer(groupId) {
    const group = aLayers[groupId];
    if (!isGroupLayer(group) || group.locked) return;
    getGroupChildren(groupId).forEach(function(childId) {
        delete aLayers[childId].groupId;
        delete aLayers[childId].parentGroupKey;
    });
    projectState.remove(groupId);
    rebuildLayerListUI();
    drawProject();
    captureState("Ungroup: " + (group.name || "Group"));
}

function deleteGroupLayer(groupId) {
    const group = aLayers[groupId];
    if (!isGroupLayer(group) || group.locked) return;
    getGroupChildren(groupId).forEach(function(childId) { projectState.remove(childId); });
    projectState.remove(groupId);
    rebuildLayerListUI();
    drawProject();
    captureState("Delete group: " + (group.name || "Group"));
}

function duplicateLayerById(layerId) {
    const source = aLayers[layerId];
    if (!source || source.type === "base" || isLayerEffectivelyLocked(layerId)) return;
    const copy = TMCardMakerLayerModel.clone(source);
    copy.locked = false;
    copy.name = (source.name || "Layer") + " copy";
    if (Number.isFinite(Number(copy.x))) copy.x = Number(copy.x) + 10;
    if (Number.isFinite(Number(copy.y))) copy.y = Number(copy.y) + 10;

    const newId = "dragdropdiv" + ddcount;
    addLayer(copy.name, copy, { skipHistory: true });
    const sourceIndex = projectState.getOrder().indexOf(layerId);
    projectState.moveTo(newId, sourceIndex + 1);
    rebuildLayerListUI();
    selectLayerById(newId);
    drawProject();
    captureState("Duplicate layer: " + (source.name || "Layer"));
}

function moveLayerByCommand(layerId, command) {
    const layer = aLayers[layerId];
    if (!layer || layer.type === "base" || isLayerEffectivelyLocked(layerId)) return;
    const order = projectState.getOrder();
    const currentIndex = order.indexOf(layerId);
    let destination = currentIndex;
    if (command === "forward") destination = Math.min(order.length - 1, currentIndex + 1);
    if (command === "backward") destination = Math.max(1, currentIndex - 1);
    if (command === "front") destination = order.length - 1;
    if (command === "back") destination = 1;
    if (!projectState.moveTo(layerId, destination)) return;
    rebuildLayerListUI();
    selectLayerById(layerId);
    drawProject();
    captureState("Move layer " + command + ": " + (layer.name || "Layer"));
}

function getLayerContextMenu() {
    let menu = document.getElementById("layerContextMenu");
    if (menu) return menu;
    menu = document.createElement("div");
    menu.id = "layerContextMenu";
    menu.className = "layer-context-menu";
    menu.setAttribute("role", "menu");
    document.body.appendChild(menu);
    document.addEventListener("mousedown", function(event) {
        if (!menu.contains(event.target)) menu.classList.remove("is-open");
    });
    document.addEventListener("keydown", function(event) {
        if (event.key === "Escape") menu.classList.remove("is-open");
    });
    return menu;
}

function showLayerContextMenu(event, row, layer) {
    selectLayerById(row.id);
    const menu = getLayerContextMenu();
    menu.innerHTML = "";
    const actions = [
        { label: layer.locked ? "Unlock Layer" : "Lock Layer", run: function() { toggleLayerLock(row, layer); } },
        { label: "Duplicate Layer", disabled: layer.type === "base", run: function() { duplicateLayerById(row.id); } },
        { separator: true },
        { label: "Move to Front", disabled: layer.type === "base" || layer.locked, run: function() { moveLayerByCommand(row.id, "front"); } },
        { label: "Move Forward", disabled: layer.type === "base" || layer.locked, run: function() { moveLayerByCommand(row.id, "forward"); } },
        { label: "Move Backward", disabled: layer.type === "base" || layer.locked, run: function() { moveLayerByCommand(row.id, "backward"); } },
        { label: "Move to Back", disabled: layer.type === "base" || layer.locked, run: function() { moveLayerByCommand(row.id, "back"); } }
    ];
    actions.forEach(function(action) {
        if (action.separator) {
            menu.appendChild(document.createElement("hr"));
            return;
        }
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = action.label;
        button.disabled = !!action.disabled;
        button.onclick = function() {
            menu.classList.remove("is-open");
            action.run();
        };
        menu.appendChild(button);
    });
    menu.style.left = Math.max(4, Math.min(event.clientX, window.innerWidth - 190)) + "px";
    menu.style.top = Math.max(4, Math.min(event.clientY, window.innerHeight - 230)) + "px";
    menu.classList.add("is-open");
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

function updateLayerLockedUI(layerNode, layer) {
    if (layerNode && layer) TMCardMakerLayerPanel.updateLocked(layerNode, layer);
}

function initializePropertyPanel() {
    if (typeof domParams === "undefined" || !domParams) return;
    const groups = [
        { title: "Layout", ids: ["allpreset", "allall", "allimages", "allangle"] },
        { title: "Appearance", ids: ["allopacity", "blockcolor", "otherbg", "color"] },
        { title: "Text", ids: ["alltext"] },
        { title: "Crop", ids: ["clipimages"] },
        { title: "Line", ids: ["alllen"] }
    ];
    groups.forEach(function(definition) {
        const availableSections = definition.ids.map(function(id) {
            return domParams.querySelector("#" + id);
        }).filter(Boolean);
        if (!availableSections.length) return;

        const group = document.createElement("div");
        group.className = "property-section";
        const toggle = document.createElement("button");
        toggle.type = "button";
        toggle.className = "property-section-toggle";
        toggle.textContent = definition.title;
        toggle.setAttribute("aria-expanded", "true");
        toggle.onclick = function() {
            const collapsed = group.classList.toggle("is-collapsed");
            toggle.setAttribute("aria-expanded", collapsed ? "false" : "true");
        };
        const body = document.createElement("div");
        body.className = "property-section-body";
        group.appendChild(toggle);
        group.appendChild(body);
        domParams.insertBefore(group, availableSections[0]);
        availableSections.forEach(function(section) {
            section.classList.add("property-fields");
            body.appendChild(section);
        });
    });

    const oldSettings = domParams.querySelector("#settings");
    if (oldSettings) oldSettings.classList.add("w3-hide");
    const oldDivider = domParams.querySelector(":scope > hr");
    if (oldDivider) oldDivider.classList.add("w3-hide");

    function addResetButton(sectionId, label, handler) {
        const section = domParams.querySelector("#" + sectionId);
        if (!section || section.querySelector(".property-reset-button")) return;
        const reset = document.createElement("button");
        reset.type = "button";
        reset.className = "property-reset-button";
        reset.textContent = label;
        reset.onclick = handler;
        section.appendChild(reset);
    }
    addResetButton("allangle", "Reset rotation", function() { resetSelectedLayerFields({ angle: 0 }, "Reset rotation"); });
    addResetButton("allopacity", "Reset opacity", function() { resetSelectedLayerFields({ alpha: 100 }, "Reset opacity"); });
    addResetButton("blockcolor", "Reset appearance", function() {
        resetSelectedLayerFields({ hue: 0, saturation: 100, lightness: 100, gamma: 100 }, "Reset appearance");
    });

    const numberInputs = domParams.querySelectorAll('input[type="number"]');
    for (let input of numberInputs) {
        if (!input.step) input.step = "1";
        input.addEventListener("keydown", function(event) {
            if (!event.shiftKey || (event.key !== "ArrowUp" && event.key !== "ArrowDown")) return;
            event.preventDefault();
            const step = Number(input.step) || 1;
            const current = Number(input.value) || 0;
            input.value = String(current + (event.key === "ArrowUp" ? step * 10 : -step * 10));
            input.dispatchEvent(new Event("change", { bubbles: true }));
        });
    }
}

function resetSelectedLayerFields(values, actionLabel) {
    const layerId = getSelectedLayerNodeId();
    const layer = layerId ? aLayers[layerId] : null;
    if (!layer || layer.locked) return;
    Object.keys(values).forEach(function(key) { layer[key] = values[key]; });
    refreshParamsForLayer(layer, layerId);
    drawProject();
    captureState(actionLabel + ": " + (layer.name || "Layer"));
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
    if (isLayerEffectivelyLocked(layerName)) return;
    aLayers[layerName].name = th.value;
    drawProject();
    captureState("Rename layer: " + th.value);
}

function deleteListItem(e, th) {
    e.stopPropagation();
    // delete item from aLayers and from layerlist (DOM)
    let toDelete = th.parentNode.parentNode;
    if (!aLayers[toDelete.id] || isLayerEffectivelyLocked(toDelete.id)) return;
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
    const primary = document.querySelector("#layerlist > .divRec.primary-selected");
    if (primary) return primary.id;
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

    const paramSections = domParams.querySelectorAll(".property-fields");
    for (let thispch of paramSections) {
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
                            try {
                                let value = thisLayer[subch.id.slice(5)];
                                if (subch.type === "number" && Number.isFinite(Number(value))) {
                                    value = Math.round(Number(value) * 1000) / 1000;
                                }
                                subch.value = value;
                            } catch (e) {}
                        }
                        syncLinkedBlockColorInput(subch);
                    } else if ((subch.id == "lar") || (subch.id == "slar")) {
                        const preferenceName = subch.id == "lar"
                            ? "lockAspectRatio"
                            : "lockSourceAspectRatio";
                        subch.checked = thisLayer[preferenceName] !== false;
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

    const propertyInputs = domParams.querySelectorAll("input, textarea, select, button");
    for (let propertyInput of propertyInputs) propertyInput.disabled = false;
    syncOtherBgPadInputs(thisLayer);
    if (thisLayer.locked) {
        for (let propertyInput of propertyInputs) {
            if (!propertyInput.classList.contains("property-section-toggle")) propertyInput.disabled = true;
        }
    }

    const propertyGroups = domParams.querySelectorAll(".property-section");
    for (let propertyGroup of propertyGroups) {
        const visibleField = propertyGroup.querySelector(".property-fields:not(.w3-hide)");
        propertyGroup.classList.toggle("w3-hide", !visibleField);
    }
}

// Direct canvas controls -----------------------------------------------------
var canvasControlDrag = null;

function getCanvasControlGeometry(layer) {
    if (!layer) return null;
    // Text uses a baseline/wrapping coordinate model and lines use length/angle
    // rather than a rectangular box. Their precise controls remain in the
    // property panel until dedicated handle math is added for those types.
    if (layer.type === "text" || layer.type === "line" || layer.type === "base") return null;
    const x = Number(layer.x);
    const y = Number(layer.y);
    const width = Number(layer.width);
    const height = Number(layer.height);
    if (![x, y, width, height].every(Number.isFinite) || width <= 0 || height <= 0) return null;
    const angle = (Number(layer.angle) || 0) * Math.PI / 180;
    const zoom = (typeof canvasZoom !== "undefined" && canvasZoom > 0) ? canvasZoom : 1;
    const ux = { x: Math.cos(angle), y: Math.sin(angle) };
    const uy = { x: -Math.sin(angle), y: Math.cos(angle) };
    const center = { x: x + width / 2, y: y + height / 2 };
    function point(sx, sy, extraY) {
        return {
            x: center.x + ux.x * sx * width / 2 + uy.x * (sy * height / 2 + (extraY || 0)),
            y: center.y + ux.y * sx * width / 2 + uy.y * (sy * height / 2 + (extraY || 0))
        };
    }
    return {
        center,
        ux,
        uy,
        corners: {
            nw: point(-1, -1),
            ne: point(1, -1),
            se: point(1, 1),
            sw: point(-1, 1)
        },
        rotation: point(0, -1, -35 / zoom),
        topMiddle: point(0, -1),
        canRotate: layer.type === "block" || layer.type === "userFile" || layer.type === "webFile" || layer.type === "embedded"
    };
}

function drawCanvasControls() {
    const canvas = document.getElementById("cmcanvas");
    const overlay = document.getElementById("cmcanvas_controls");
    if (!canvas || !overlay) return;
    // The canvas wrapper includes responsive padding. Position this overlay
    // from the main canvas's actual layout offset instead of the wrapper's
    // origin so handles and hit targets share the same coordinate system.
    overlay.style.left = (canvas.offsetLeft + canvas.clientLeft) + "px";
    overlay.style.top = (canvas.offsetTop + canvas.clientTop) + "px";
    if (overlay.width !== canvas.width) overlay.width = canvas.width;
    if (overlay.height !== canvas.height) overlay.height = canvas.height;
    const ctx = overlay.getContext("2d");
    ctx.clearRect(0, 0, overlay.width, overlay.height);

    const layerId = getSelectedLayerNodeId();
    const layer = layerId ? aLayers[layerId] : null;
    const geometry = getCanvasControlGeometry(layer);
    if (!geometry || layer.type === "base") return;
    const zoom = (typeof canvasZoom !== "undefined" && canvasZoom > 0) ? canvasZoom : 1;
    const handleSize = 10 / zoom;

    ctx.save();
    ctx.strokeStyle = layer.locked ? "#a66520" : "#1677d2";
    ctx.fillStyle = "#ffffff";
    ctx.lineWidth = 2 / zoom;
    if (layer.locked) ctx.setLineDash([6 / zoom, 4 / zoom]);
    ctx.beginPath();
    ctx.moveTo(geometry.corners.nw.x, geometry.corners.nw.y);
    ctx.lineTo(geometry.corners.ne.x, geometry.corners.ne.y);
    ctx.lineTo(geometry.corners.se.x, geometry.corners.se.y);
    ctx.lineTo(geometry.corners.sw.x, geometry.corners.sw.y);
    ctx.closePath();
    ctx.stroke();
    if (!layer.locked) {
        ctx.setLineDash([]);
        if (geometry.canRotate) {
            ctx.beginPath();
            ctx.moveTo(geometry.topMiddle.x, geometry.topMiddle.y);
            ctx.lineTo(geometry.rotation.x, geometry.rotation.y);
            ctx.stroke();
        }
        Object.keys(geometry.corners).forEach(function(key) {
            const point = geometry.corners[key];
            ctx.fillRect(point.x - handleSize / 2, point.y - handleSize / 2, handleSize, handleSize);
            ctx.strokeRect(point.x - handleSize / 2, point.y - handleSize / 2, handleSize, handleSize);
        });
        if (geometry.canRotate) {
            ctx.beginPath();
            ctx.arc(geometry.rotation.x, geometry.rotation.y, handleSize * 0.62, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }
    }
    ctx.restore();
}

function beginCanvasControlDrag(mouse) {
    if (getSelectedLayerIds(true).length > 1) return false;
    const layerId = getSelectedLayerNodeId();
    const layer = layerId ? aLayers[layerId] : null;
    if (!layer || isLayerEffectivelyLocked(layerId) || !isLayerEffectivelyVisible(layerId) || layer.type === "base") return false;
    const geometry = getCanvasControlGeometry(layer);
    if (!geometry) return false;
    const zoom = (typeof canvasZoom !== "undefined" && canvasZoom > 0) ? canvasZoom : 1;
    const tolerance = 12 / zoom;
    let handle = null;
    Object.keys(geometry.corners).some(function(key) {
        const point = geometry.corners[key];
        if (Math.hypot(mouse.x - point.x, mouse.y - point.y) <= tolerance) {
            handle = key;
            return true;
        }
        return false;
    });
    if (!handle && geometry.canRotate && Math.hypot(mouse.x - geometry.rotation.x, mouse.y - geometry.rotation.y) <= tolerance) handle = "rotate";
    if (!handle) return false;
    canvasControlDrag = {
        layerId,
        handle,
        original: JSON.parse(JSON.stringify(layer)),
        geometry
    };
    return true;
}

function updateCanvasControlDrag(mouse) {
    if (!canvasControlDrag) return false;
    const layer = aLayers[canvasControlDrag.layerId];
    if (!layer || isLayerEffectivelyLocked(canvasControlDrag.layerId) || !isLayerEffectivelyVisible(canvasControlDrag.layerId)) return true;
    const original = canvasControlDrag.original;
    const geometry = canvasControlDrag.geometry;
    if (canvasControlDrag.handle === "rotate") {
        const radians = Math.atan2(mouse.y - geometry.center.y, mouse.x - geometry.center.x);
        layer.angle = Math.round(((radians * 180 / Math.PI) + 90 + 360) % 360);
    } else {
        const signs = {
            nw: { x: -1, y: -1 }, ne: { x: 1, y: -1 },
            se: { x: 1, y: 1 }, sw: { x: -1, y: 1 }
        }[canvasControlDrag.handle];
        const opposite = {
            x: geometry.center.x - geometry.ux.x * signs.x * original.width / 2 - geometry.uy.x * signs.y * original.height / 2,
            y: geometry.center.y - geometry.ux.y * signs.x * original.width / 2 - geometry.uy.y * signs.y * original.height / 2
        };
        const vector = { x: mouse.x - opposite.x, y: mouse.y - opposite.y };
        let width = signs.x * (vector.x * geometry.ux.x + vector.y * geometry.ux.y);
        let height = signs.y * (vector.x * geometry.uy.x + vector.y * geometry.uy.y);
        const aspectInput = document.getElementById("lar");
        const supportsAspectLock = String(original.params || "").indexOf("allimages") !== -1;
        if (supportsAspectLock && aspectInput && aspectInput.checked) {
            const scale = Math.max(8 / original.width, 8 / original.height, (width / original.width + height / original.height) / 2);
            width = original.width * scale;
            height = original.height * scale;
        }
        width = Math.max(8, width);
        height = Math.max(8, height);
        const center = {
            x: opposite.x + geometry.ux.x * signs.x * width / 2 + geometry.uy.x * signs.y * height / 2,
            y: opposite.y + geometry.ux.y * signs.x * width / 2 + geometry.uy.y * signs.y * height / 2
        };
        layer.width = Math.round(width * 1000) / 1000;
        layer.height = Math.round(height * 1000) / 1000;
        layer.x = Math.round((center.x - width / 2) * 1000) / 1000;
        layer.y = Math.round((center.y - height / 2) * 1000) / 1000;
    }
    drawProject();
    refreshParamsForLayer(layer, canvasControlDrag.layerId);
    return true;
}

function endCanvasControlDrag() {
    if (!canvasControlDrag) return false;
    const layer = aLayers[canvasControlDrag.layerId];
    const action = canvasControlDrag.handle === "rotate" ? "Rotate layer" : "Resize layer";
    canvasControlDrag = null;
    captureState(action + ": " + ((layer && layer.name) || "Layer"));
    return true;
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

function getSelectedLayerIds(expandGroups) {
    const ids = Array.from(document.querySelectorAll("#layerlist > .divRec.selected")).map(function(row) {
        return row.id;
    });
    if (!expandGroups) return ids;
    const expanded = [];
    ids.forEach(function(id) {
        if (isGroupLayer(aLayers[id])) {
            getGroupChildren(id).forEach(function(childId) {
                if (expanded.indexOf(childId) === -1) expanded.push(childId);
            });
        } else if (expanded.indexOf(id) === -1) {
            expanded.push(id);
        }
    });
    return expanded;
}

function updateSelectionToolbar() {
    const selected = getSelectedLayerIds(false);
    const toolbar = document.getElementById("multiSelectionToolbar");
    const count = document.getElementById("selectionCount");
    if (count) count.textContent = selected.length + (selected.length === 1 ? " layer selected" : " layers selected");
    if (toolbar) toolbar.classList.toggle("is-active", selected.length > 1);
    const actionable = selected.filter(function(id) { return id !== "dragdropdiv0" && aLayers[id]; });
    const lockButton = document.getElementById("selectionLockButton");
    const visibilityButton = document.getElementById("selectionVisibilityButton");
    const groupButton = document.getElementById("selectionGroupButton");
    const groupable = actionable.filter(function(id) { return !isGroupLayer(aLayers[id]) && !aLayers[id].groupId; });
    if (groupButton) groupButton.disabled = groupable.length < 2;
    if (lockButton) lockButton.textContent = actionable.length && actionable.every(function(id) { return aLayers[id].locked; }) ? "Unlock" : "Lock";
    if (visibilityButton) visibilityButton.textContent = actionable.length && actionable.every(function(id) { return !TMCardMakerLayerModel.isVisible(aLayers[id]); }) ? "Show" : "Hide";
}

function clearLayerSelection(keepId) {
    Array.from(document.querySelectorAll("#layerlist > .divRec.selected")).forEach(function(node) {
        if (node.id === keepId) return;
        if (domParams.parentNode === node) node.removeChild(domParams);
        node.classList.remove("selected", "primary-selected");
    });
}

function showPrimaryLayerProperties(row) {
    Array.from(document.querySelectorAll("#layerlist > .divRec.primary-selected")).forEach(function(node) {
        node.classList.remove("primary-selected");
    });
    row.classList.add("primary-selected");
    const layer = aLayers[row.id];
    if (isGroupLayer(layer)) {
        if (domParams.parentNode && domParams.parentNode.classList && domParams.parentNode.classList.contains("divRec")) {
            domParams.parentNode.removeChild(domParams);
        }
        return;
    }
    refreshParamsForLayer(layer, row.id);
    const insideDiv = row.querySelector(".inside");
    if (insideDiv) row.insertBefore(domParams, insideDiv.nextSibling);
}

function selectLayer(event, preserveExistingSelection) {
    removeKeyInputFocus();
    const clickedNode = this.parentNode;
    const additive = !!(event && (event.ctrlKey || event.metaKey || (preserveExistingSelection && event.shiftKey)));
    const range = !!(event && event.shiftKey && !preserveExistingSelection && selectionAnchorId);
    const wasSelected = clickedNode.classList.contains("selected");

    if (range) {
        const rows = Array.from(document.querySelectorAll("#layerlist > .divRec"));
        const start = rows.findIndex(function(row) { return row.id === selectionAnchorId; });
        const end = rows.indexOf(clickedNode);
        if (start !== -1 && end !== -1) {
            clearLayerSelection();
            rows.slice(Math.min(start, end), Math.max(start, end) + 1).forEach(function(row) {
                if (row.id !== "dragdropdiv0") row.classList.add("selected");
            });
        }
    } else if (additive) {
        if (clickedNode.id !== "dragdropdiv0") clickedNode.classList.toggle("selected");
    } else if (!(preserveExistingSelection && wasSelected)) {
        clearLayerSelection(clickedNode.id);
        clickedNode.classList.add("selected");
    }

    if (clickedNode.classList.contains("selected")) {
        showPrimaryLayerProperties(clickedNode);
    } else {
        clickedNode.classList.remove("primary-selected");
        const remainingSelection = document.querySelector("#layerlist > .divRec.selected");
        if (remainingSelection) showPrimaryLayerProperties(remainingSelection);
        else if (domParams.parentNode === clickedNode) clickedNode.removeChild(domParams);
    }
    selectionAnchorId = clickedNode.id;
    updateSelectionToolbar();
    if (domParams.parentNode === clickedNode) scrollPropertiesPanelToElement(domParams);

    try { drawProject(); } catch (e) {}
}

function deselectAllLayers() {
    let selectedNodes = document.getElementsByClassName("selected");
    for (let i = selectedNodes.length - 1; i >= 0; i--) {
        let node = selectedNodes[i];
        if (typeof domParams !== 'undefined' && domParams.parentNode === node) {
            node.removeChild(domParams);
        }
        node.classList.remove("selected", "primary-selected");
        let buttons = node.getElementsByTagName("button");
        if (buttons.length) {
            buttons[0].style.display = "block";
        }
    }
    selectionAnchorId = null;
    updateSelectionToolbar();
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
            const li = isGroupLayer(layer)
                ? buildGroupRow(layerId, layer)
                : buildLayerRow(layerId, layer.name || "", layer, layerIdx, thumbnail);
            if (layer.groupId && aLayers[layer.groupId]) {
                li.classList.add("group-child");
                li.dataset.groupId = layer.groupId;
            }
            layerList.appendChild(li);
        }
    }

    layerOrder.forEach(function(layerId) {
        if (isGroupLayer(aLayers[layerId])) updateGroupUI(document.getElementById(layerId), aLayers[layerId]);
    });

    // Re-initialize sortable if available
    if (typeof sortable === 'function') {
        sortable(layerList, handleLayerOrderChanged);
    }
    updateSelectionToolbar();
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
            const dragGroupId = aLayers[dragEl.id] ? (aLayers[dragEl.id].groupId || null) : null;
            const targetGroupId = aLayers[target.id] ? (aLayers[target.id].groupId || null) : null;
            if (dragGroupId !== targetGroupId) return;
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
        if (!layerRow || layerRow.id == "dragdropdiv0" || (aLayers[layerRow.id] && aLayers[layerRow.id].locked)) return;
        activeDragHandleLayer = layerRow;
        layerRow.draggable = true;
    });

    section.addEventListener('mouseup', function() {
        clearArmedDragHandle();
    });

    document.addEventListener('mouseup', clearArmedDragHandle);

    section.addEventListener('dragstart', function(e) {
        const layerRow = e.target.closest(".divRec");
        if (!layerRow || layerRow !== activeDragHandleLayer || layerRow.id == "dragdropdiv0" ||
            (aLayers[layerRow.id] && aLayers[layerRow.id].locked)) {
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
