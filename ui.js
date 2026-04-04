
function toggleShowLayer(layerName, show) {
    map.setLayoutProperty(layerName, 'visibility', show ? 'visible' : 'none');
}

function changeFillColor(color) {
    if (!editedTerritory) return;
    commitChangeset([{
        id: editedTerritory.id,
        data: {
            fill: color
        }
    }]);

    refreshTerritoryGeojson(editedTerritory);
    updateTerritoriesSource();
}

function changeStrokeColor(color) {
    if (!editedTerritory) return;
    commitChangeset([{
        id: editedTerritory.id,
        data: {
            stroke: color
        }
    }]);
    refreshTerritoryGeojson(editedTerritory);
    updateTerritoriesSource();
}

function changeStrokeWidth(width) {
    if (!editedTerritory) return;
    commitChangeset([{
        id: editedTerritory.id,
        data: {
            thickness: parseFloat(width)
        }
    }]);
    refreshTerritoryGeojson(editedTerritory);
    updateTerritoriesSource();
}

function changeOpacity(opacity) {
    if (!editedTerritory) return;
    commitChangeset([{
        id: editedTerritory.id,
        data: {
            opacity: parseFloat(opacity)
        }
    }]);
    refreshTerritoryGeojson(editedTerritory);
    updateTerritoriesSource();
}

function changeName(name) {
    if (!editedTerritory) return;
    commitChangeset([{
        id: editedTerritory.id,
        data: {
            name: name
        }
    }]);
    editedTerritory.listElement.setAttribute('label', `${editedTerritory.number} - ${editedTerritory.name}`);
}

function changeNumber(number) {
    if (!editedTerritory) return;
    commitChangeset([{
        id: editedTerritory.id,
        data: {
            number: parseInt(number)
        }
    }]);
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


function closePopover(el) {
    const popover = el.closest('[popover]');
    popover.hidePopover();
}

function createListElement(territory) {
    let listElement = document.createElement('territory-list-item');
    territory.listElement = listElement;
    listElement.onclick = () => {
        selectTerritoryForEditing(territories.find(t => t.id === territory.id));
    };
    listElement.ondblclick = () => {
        map.fitBounds(territory.coords[0].reduce((bounds, coord) => {
            return bounds.extend(coord);
        }, new maplibregl.LngLatBounds(territory.coords[0][0], territory.coords[0][0])), {
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
        if (editedTerritory && editedTerritory.id === territory.id) {
            selectTerritoryForEditing(null);
        }
        let index = deleteTerritory(territory);
        recordChangeset([{
            index: index,
            data: territory
        }]);
    });

    listElement.addEventListener('card', () => {
        openCardForTerritory(territory);
    });
}

function openCardForTerritory(territory) {
    let dialog = document.createElement('dialog');
    dialog.classList.add('overlay');
    dialog.classList.add('territory-dialog');

    let buttonsContainer = document.createElement('div');
    buttonsContainer.classList.add('buttons-container');
    dialog.appendChild(buttonsContainer);

    let closeButton = document.createElement('button');
    closeButton.classList.add('close-button');
    closeButton.textContent = 'X';
    closeButton.onclick = () => dialog.close();
    buttonsContainer.appendChild(closeButton);

    

    document.body.appendChild(dialog);
    dialog.showModal();

    dialog.onclose = () => { dialog.remove(); }

    let card = document.createElement('territory-card');
    card.setAttribute('territory-id', territory.id);
    card.setAttribute('territory-name', territory.number);
    card.setAttribute('description', territory.name);
    card.setAttribute('geojson', JSON.stringify([territory.geojson]));
    card.setAttribute('center', JSON.stringify(getTeritoryCenter(territory)));
    card.setAttribute('zoom', JSON.stringify(getTerritoryZoom(territory)));
    card.setAttribute('bearing', JSON.stringify(getTerritoryBearing(territory)));
    card.setAttribute('pitch', JSON.stringify(getTerritoryPitch(territory)));
    dialog.appendChild(card);
    card.setAttribute('card-src', 'card.html');

    card.addEventListener('view-change', () => {
        let saveButton = document.createElement('button');
        saveButton.classList.add('save-button');
        saveButton.textContent = '✓';
        saveButton.onclick = () => {
            commitChangeset([{
                id: editedTerritory.id,
                data: {
                    view: card.getView()
                }
            }]);
            dialog.close();
        };
        buttonsContainer.appendChild(saveButton);

    }, { once: true });

}

function getTeritoryCenter(territory) {
    if (territory.view?.center) {
        return territory.view.center;
    }

    let allCoords = territory.coords.reduce((acc, coords) => acc.concat(coords), []);
    let lats = allCoords.map(c => c[1]);
    let lngs = allCoords.map(c => c[0]);
    return [lngs.reduce((a, b) => a + b, 0) / lngs.length, lats.reduce((a, b) => a + b, 0) / lats.length];
}

function getTerritoryZoom(territory) {
    if (territory.view?.zoom) {
        return territory.view.zoom;
    }

    let allCoords = territory.coords.reduce((acc, coords) => acc.concat(coords), []);
    let lats = allCoords.map(c => c[1]);
    let lngs = allCoords.map(c => c[0]);
    let latDiff = Math.max(...lats) - Math.min(...lats);
    let lngDiff = Math.max(...lngs) - Math.min(...lngs);
    let maxDiff = Math.max(latDiff, lngDiff);
    return Math.log2(360 / maxDiff) - 1;
}

function getTerritoryBearing(territory) {
    if (territory.view?.bearing) {
        return territory.view.bearing;
    }
    return 0;
}

function getTerritoryPitch(territory) {
    if (territory.view?.pitch) {
        return territory.view.pitch;
    }
    return 0;
}