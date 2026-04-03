


document.getElementById("map-container").addEventListener('touchmove', e => e.preventDefault(), { passive: false });







function deleteTerritoryVisuals(territory) {
    map.removeLayer(`${territory.id}-fill-layer`);
    map.removeLayer(`${territory.id}-stroke-layer`);
    map.removeSource(`territory-source-${territory.id}`);
    territory.listElement.remove();
}

function deleteTerritory(territory) {
    let index = territories.findIndex(t => t.id === territory.id);
    deleteTerritoryVisuals(territory);
    territories.splice(index, 1);

    if (editedTerritory && editedTerritory.id === territory.id) {
        selectTerritoryForEditing(null);
    }

    return index;
}

function createTerritoryVisuals(territory) {


    map.addSource(`territory-source-${territory.id}`, {
        'type': 'geojson',
        'data': territory.geojson
    });

    map.addLayer({
        'id': `${territory.id}-fill-layer`,
        'type': 'fill',
        'source': `territory-source-${territory.id}`,
        'layout': {},
        'paint': {
            'fill-color': territory.fill,
            'fill-opacity': territory.opacity,
        }
    });

    map.addLayer({
        'id': `${territory.id}-stroke-layer`,
        'type': 'line',
        'source': `territory-source-${territory.id}`,
        'layout': {},
        'paint': {
            'line-color': territory.stroke,
            'line-width': territory.thickness,
        }
    });

    if (territory.listElement) {
        territory.listElement.remove();
    }
    let listElement = document.createElement('territory-list-item');
    territory.listElement = listElement;
    listElement.onclick = () => {
        selectTerritoryForEditing(territories.find(t => t.id === territory.id));
    };
    listElement.ondblclick = () => {
        map.fitBounds(territory.geojson.features[0].geometry.coordinates[0].reduce((bounds, coord) => {
            return bounds.extend(coord);
        }, new maplibregl.LngLatBounds(territory.geojson.features[0].geometry.coordinates[0][0], territory.geojson.features[0].geometry.coordinates[0][0])), {
            padding: 100
        });
    };
    document.getElementById('territory-list').appendChild(listElement);
    listElement.addEventListener('checked-change', (event) => {
        const checked = event.detail.checked;
        if (checked) {
            showTerritory(territory);
        } else {
            hideTerritory(territory);
        }

        let showAll = document.getElementById("show-all");
        if (showAll) {
            showAll.isChecked = territories.every(t => t.listElement.checkbox.checked);
            showAll.indeterminate = !showAll.isChecked && territories.some(t => t.listElement.checkbox.checked);
        }
    });
    listElement.addEventListener('delete', () => {
        if (!window.confirm(`Czy na pewno chcesz usunąć teren ${territory.number} - ${territory.name}?`)) {
            return;
        }
        if (editedTerritory && editedTerritory.id === territory.id) {
            selectTerritoryForEditing(null);
        }
        let index = deleteTerritory(territory);
        recordChangeset([{
            index: index,
            data: territory
        }]);
    });
}

function toggleShowAll(show) {
    territories.forEach(territory => {
        if (show) {
            showTerritory(territory);
        } else {
            hideTerritory(territory);
        }
        territory.listElement.checkbox.checked = show;
    });
}

function loadTerritory(territoryData) {

    const id = crypto.randomUUID();


    let newTerritory = {
        id: id,
        number: territoryData.number,
        name: territoryData.name,
        coords: territoryData.coords,
        geojson: null,
        fill: territoryData.fill,
        stroke: territoryData.stroke,
        thickness: territoryData.thickness,
        opacity: territoryData.opacity,
        listElement: null
    };

    refreshGeojson(newTerritory);

    createTerritoryVisuals(newTerritory);

    updateTerrritory(newTerritory);

    return newTerritory;
}

function updateAllTerritories() {

    for (let territory of territories) {
        updateTerrritory(territory);
    }
}

function updateTerrritory(territoryData) {
    refreshGeojson(territoryData);
    map.getSource(`territory-source-${territoryData.id}`).setData(territoryData.geojson);
    map.setPaintProperty(`${territoryData.id}-stroke-layer`, 'line-color', territoryData.stroke);
    map.setPaintProperty(`${territoryData.id}-stroke-layer`, 'line-width', parseFloat(territoryData.thickness));
    map.setPaintProperty(`${territoryData.id}-fill-layer`, 'fill-opacity', parseFloat(territoryData.opacity));
    territoryData.listElement.setAttribute('label', `${territoryData.number} - ${territoryData.name}`);
    territoryData.listElement.setAttribute('label', `${territoryData.number} - ${territoryData.name}`);
    territoryData.listElement.setAttribute('label', `${territoryData.number} - ${territoryData.name}`);
}

function showTerritory(territory) {
    map.setLayoutProperty(`${territory.id}-fill-layer`, 'visibility', 'visible');
    map.setLayoutProperty(`${territory.id}-stroke-layer`, 'visibility', 'visible');
}

function hideTerritory(territory) {
    map.setLayoutProperty(`${territory.id}-fill-layer`, 'visibility', 'none');
    map.setLayoutProperty(`${territory.id}-stroke-layer`, 'visibility', 'none');
}

function removeEditingMarkers() {
    editedTerritoryMarkers.forEach(node => {
        node.marker.remove();
        node.halfpoint.remove();
    });
    editedTerritoryMarkers = [];
}

function selectTerritoryForEditing(territoryData, polygonIndex = 0) {
    removeEditingMarkers();

    if (editedTerritory) {
        editedTerritory.listElement.classList.remove('selected');
    }

    editedTerritory = territoryData;

    if (!territoryData) {
        document.getElementById('territory-form').setAttribute('disabled', '');
        return;
    }

    territoryData.coords[polygonIndex].forEach((point, index) => {
        editedTerritoryMarkers.push(createNodeMarker(point, index, territoryData, polygonIndex));
    });

    territoryData.listElement.classList.add('selected');

    let form = document.getElementById('territory-form');
    form.removeAttribute('disabled');
    document.getElementById('number-input').value = territoryData.number;
    document.getElementById('name-input').value = territoryData.name;
    document.getElementById('fill-input').value = territoryData.fill;
    document.getElementById('stroke-input').value = territoryData.stroke;
    document.getElementById('thickness-input').value = territoryData.thickness;
    document.getElementById('opacity-input').value = territoryData.opacity;
}


function createNodeMarker(point, index, territoryData, polygonIndex) {

    let marker = new maplibregl.Marker({
        draggable: true,
        element: document.createElement('div'),
        className: 'point-marker'
    })
        .setLngLat(point)
        .addTo(map);

    let halfpoint = new maplibregl.Marker({
        draggable: true,
        element: document.createElement('div'),
        className: 'halfpoint-marker'
    })
        // .setLngLat(getHalfpointPosition(territoryData.geojson.features[0].geometry.coordinates[0][index === 0 ? territoryData.geojson.features[0].geometry.coordinates[0].length - 2 : index - 1], point))
        .setLngLat(getHalfpointPosition(territoryData.coords[polygonIndex][index === 0 ? territoryData.coords[polygonIndex].length - 1 : index - 1], point))
        .addTo(map);

    let nodeMarker = { marker: marker, halfpoint: halfpoint, index: index };

    marker.on('drag', () => {
        nodeDrag(nodeMarker, territoryData, polygonIndex);
    });

    marker.getElement().addEventListener('dblclick', (event) => {
        event.stopPropagation();
        nodeDblClick(nodeMarker.index, territoryData, polygonIndex);
    });

    marker.getElement().addEventListener('click', (event) => {
        event.stopPropagation();
    });

    marker.on('dragend', () => {
        nodeDragEnd(nodeMarker, territoryData, polygonIndex);
    });

    halfpoint.once('dragstart', () => {
        addNode(nodeMarker, territoryData, polygonIndex);
    });

    return nodeMarker;
}

function getHalfpointPosition(p1, p2) { return [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2] }

function refreshGeojson(territoryData) {

    territoryData.geojson = {
        'type': 'FeatureCollection',
        'features':
            territoryData.coords.map((coords) => {
                return {
                    'type': 'Feature',
                    'geometry': {
                        'type': 'Polygon',
                        'coordinates': [[...coords, coords[0]]]
                    }
                }
            })


    };
    // 'coordinates': [[...territoryData.coords, territoryData.coords[0]]]
}

function addNode(node, territoryData, polygonIndex) {
    if (!editedTerritory) return;

    let previousPoint = territoryData.coords[polygonIndex][node.index === 0 ? territoryData.coords[polygonIndex].length - 1 : node.index - 1];
    let nextPoint = territoryData.coords[polygonIndex][node.index];
    let point = getHalfpointPosition(previousPoint, nextPoint);

    let halfpoint = new maplibregl.Marker({
        draggable: true,
        element: document.createElement('div'),
        className: 'halfpoint-marker'
    })
        .setLngLat(getHalfpointPosition(previousPoint, point))
        .addTo(map);

    let newnode = { marker: node.halfpoint, halfpoint: halfpoint, index: node.index };
    newnode.marker.addClassName('point-marker');
    newnode.marker.removeClassName('halfpoint-marker');

    newnode.marker.on('drag', () => {
        nodeDrag(newnode, territoryData, polygonIndex);
    });

    newnode.marker.on('dragend', () => {
        nodeDragEnd(newnode, territoryData, polygonIndex);
    });

    newnode.marker.getElement().addEventListener('dblclick', (event) => {
        event.stopPropagation();
        nodeDblClick(newnode.index, territoryData, polygonIndex);
    });

    newnode.marker.getElement().addEventListener('click', (event) => {
        event.stopPropagation();
    });

    node.halfpoint = new maplibregl.Marker({
        draggable: true,
        element: document.createElement('div'),
        className: 'halfpoint-marker'
    })
        .setLngLat(getHalfpointPosition(point, nextPoint))
        .addTo(map);

    halfpoint.once('dragstart', () => {
        addNode(newnode, territoryData, polygonIndex);
    });
    node.halfpoint.once('dragstart', () => {
        addNode(node, territoryData, polygonIndex);
    });

    for (let i = node.index; i < editedTerritoryMarkers.length; i++) {
        editedTerritoryMarkers[i].index++;
    }

    recordChangeset([{
        id: editedTerritory.id,
        data: {
            coords: territoryData.coords.map((polygon) => Array.from(polygon))
        }
    }]);
    territoryData.coords[polygonIndex].splice(newnode.index, 0, point);
    editedTerritoryMarkers.splice(newnode.index, 0, newnode);

    refreshGeojson(territoryData);
    map.getSource(`territory-source-${territoryData.id}`).setData(territoryData.geojson);
}

function nodeDblClick(index, territoryData, polygonIndex) {
    if (!editedTerritory) return;
    if (editedTerritoryMarkers.length <= 3) return;

    editedTerritoryMarkers[index].marker.remove();
    editedTerritoryMarkers[index].halfpoint.remove();

    recordChangeset([{
        id: editedTerritory.id,
        data: {
            coords: territoryData.coords.map((polygon) => Array.from(polygon))
        }
    }]);

    editedTerritoryMarkers.splice(index, 1);
    territoryData.coords[polygonIndex].splice(index, 1);

    refreshGeojson(territoryData);


    for (let i = index; i < editedTerritoryMarkers.length; i++) {
        editedTerritoryMarkers[i].index--;
    }

    map.getSource(`territory-source-${editedTerritory.id}`).setData(territoryData.geojson);


    // set halfpoint of next node
    editedTerritoryMarkers[index % editedTerritoryMarkers.length].halfpoint.setLngLat(
        getHalfpointPosition(territoryData.coords[polygonIndex][index === 0 ? territoryData.coords[polygonIndex].length - 1 : index - 1],
            index === territoryData.coords[polygonIndex].length ? territoryData.coords[polygonIndex][0] : territoryData.coords[polygonIndex][index])
    );
}


function nodeDrag(node, territoryData, polygonIndex) {
    if (!editedTerritory) return;
    const lngLat = node.marker.getLngLat();


    territoryData.geojson.features[0].geometry.coordinates[polygonIndex][node.index] = [lngLat.lng, lngLat.lat];
    if (node.index === 0) {
        territoryData.geojson.features[0].geometry.coordinates[polygonIndex][territoryData.geojson.features[0].geometry.coordinates[polygonIndex].length - 1] = [lngLat.lng, lngLat.lat];
    }

    let previousPoint = node.index === 0 ? territoryData.geojson.features[0].geometry.coordinates[polygonIndex][territoryData.geojson.features[0].geometry.coordinates[polygonIndex].length - 2] : territoryData.geojson.features[0].geometry.coordinates[polygonIndex][node.index - 1];
    node.halfpoint.setLngLat(getHalfpointPosition(previousPoint, [lngLat.lng, lngLat.lat]));

    let nextPoint = node.index === editedTerritoryMarkers.length - 1 ? territoryData.geojson.features[0].geometry.coordinates[polygonIndex][0] : territoryData.geojson.features[0].geometry.coordinates[polygonIndex][node.index + 1];
    editedTerritoryMarkers[(node.index + 1) % editedTerritoryMarkers.length].halfpoint.setLngLat(getHalfpointPosition(nextPoint, [lngLat.lng, lngLat.lat]));

    map.getSource(`territory-source-${editedTerritory.id}`).setData(territoryData.geojson);
}

function nodeDragEnd(node, territoryData, polygonIndex) {
    let lastCoord = editedTerritory.coords[polygonIndex][node.index];
    const lngLat = node.marker.getLngLat();

    let changeset = [{
        id: editedTerritory.id,
        data: {
            coords: territoryData.coords.map((polygon) => Array.from(polygon))
        }
    }];

    editedTerritory.coords[polygonIndex][node.index] = [lngLat.lng, lngLat.lat];

    recordChangeset(changeset);
}




function addNewTerritory() {

    let center = map.getCenter();
    let projected = map.project(center);
    let size = map.unproject([projected.x + 50, projected.y + 50]).lng - map.unproject(projected).lng;

    const newTerritoryData = {
        number: territories.length + 1,
        name: `Teren ${territories.length + 1}`,
        coords: [[[center.lng - size, center.lat], [center.lng + size, center.lat], [center.lng, center.lat + size]]],
        fill: document.getElementById("fill-input")?.value ?? "#000088",
        stroke: document.getElementById("stroke-input")?.value ?? "#000000",
        thickness: parseFloat(document.getElementById("thickness-input")?.value ?? 5),
        opacity: parseFloat(document.getElementById("opacity-input")?.value ?? 0.2)
    };
    let newTerritory = loadTerritory(newTerritoryData);
    territories.push(newTerritory);

    recordChangeset([{
        id: newTerritory.id,
        data: null
    }]);

    selectTerritoryForEditing(newTerritory);
}

/**
 * Records a changeset for undo/redo and saves current project as draft
 */
function recordChangeset(changeset) {
    redoStack = [];
    undoStack.push(changeset);

    updateCurrentDraft();
}

function performUndo() {
    if (undoStack.length === 0) return;
    const changeset = undoStack.pop();
    console.log("UNDO", changeset);
    redoStack.push(commitChangeset(changeset));
}

function performRedo() {
    if (redoStack.length === 0) return;
    const changeset = redoStack.pop();
    console.log("REDO", changeset);
    undoStack.push(commitChangeset(changeset));
}

function commitChangeset(changeset) {
    let inverseChangeset = [];

    for (let change of changeset) {
        if (change.id) {
            if (change.data === null) { // created territory
                let createdTerritory = territories.find(t => t.id === change.id);
                if (!createdTerritory) throw new Error("Territory not found for change commit");

                let index = deleteTerritory(createdTerritory);

                inverseChangeset.push({
                    index: index,
                    data: createdTerritory
                });
            } else { // changed territory
                let territory = territories.find(t => t.id === change.id);
                if (!territory) throw new Error("Territory not found for change commit");

                let previousData = {};
                for (let key in change.data) {
                    previousData[key] = territory[key];
                    territory[key] = change.data[key];
                }

                inverseChangeset.push({
                    id: territory.id,
                    data: previousData
                });
            }
        } else { // delete territory
            let deletedTerritory = change.data;
            territories.splice(change.index, 0, deletedTerritory);
            createTerritoryVisuals(deletedTerritory);
            //TODO: move listElement to correct position in list

            inverseChangeset.push({
                id: deletedTerritory.id,
                data: null
            });
        }


    }

    updateAllTerritories();
    if (editedTerritory) {
        selectTerritoryForEditing(editedTerritory);
    }

    updateCurrentDraft();

    return inverseChangeset;
}

