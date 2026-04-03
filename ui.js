
function toggleShowLayer(layerName, show) {
    map.setLayoutProperty(layerName, 'visibility', show ? 'visible' : 'none');
}

function changeFillColor(color) {
    if (!editedTerritory) return;
    recordChangeset([{
        id: editedTerritory.id,
        data: {
            fill: editedTerritory.fill
        }
    }]);
    editedTerritory.fill = color;
    map.setPaintProperty(`${editedTerritory.id}-fill-layer`, 'fill-color', color);
}

function changeStrokeColor(color) {
    if (!editedTerritory) return;
    recordChangeset([{
        id: editedTerritory.id,
        data: {
            stroke: editedTerritory.stroke
        }
    }]);
    editedTerritory.stroke = color;
    map.setPaintProperty(`${editedTerritory.id}-stroke-layer`, 'line-color', color);
}

function changeStrokeWidth(width) {
    if (!editedTerritory) return;
    recordChangeset([{
        id: editedTerritory.id,
        data: {
            thickness: editedTerritory.thickness
        }
    }]);
    editedTerritory.thickness = parseFloat(width);
    map.setPaintProperty(`${editedTerritory.id}-stroke-layer`, 'line-width', parseFloat(width));
}

function changeOpacity(opacity) {
    if (!editedTerritory) return;
    recordChangeset([{
        id: editedTerritory.id,
        data: {
            opacity: editedTerritory.opacity
        }
    }]);
    editedTerritory.opacity = parseFloat(opacity);
    map.setPaintProperty(`${editedTerritory.id}-fill-layer`, 'fill-opacity', parseFloat(opacity));
}

function changeName(name) {
    if (!editedTerritory) return;
    recordChangeset([{
        id: editedTerritory.id,
        data: {
            name: editedTerritory.name
        }
    }]);
    editedTerritory.name = name;
    editedTerritory.listElement.setAttribute('label', `${editedTerritory.number} - ${editedTerritory.name}`);
}

function changeNumber(number) {
    if (!editedTerritory) return;
    recordChangeset([{
        id: editedTerritory.id,
        data: {
            number: editedTerritory.number
        }
    }]);
    editedTerritory.number = parseInt(number);
    editedTerritory.listElement.setAttribute('label', `${editedTerritory.number} - ${editedTerritory.name}`);
}

function toggleEditMode(enabled) {
    document.body.classList.toggle('edit-mode');
}

function changeProjectName(name) {
    setProjectName(name);
    updateCurrentDraft();
}

function setProjectName(name) {
    currentProjectName = name;
    document.getElementById('project-name').value = name;
    window.document.title = name;
}


