function loadData(data) {

    setProjectName(data.name);

    data.groups.forEach(group => {
        group.territories.forEach(territory => {
            const newTerritory = loadTerritory(territory);
            territories.push(newTerritory);
        });
    });

}

function loadTerritory(territoryData) {

    const id = crypto.randomUUID();


    let newTerritory = {
        id: id,
        number: territoryData.number,
        name: territoryData.name,
        coords: territoryData.coords,
        geojson: {
            "type": "Feature",
            "geometry": {

            },
            "properties": {
                "id": id
            }
        },
        fill: territoryData.fill,
        stroke: territoryData.stroke,
        thickness: territoryData.thickness,
        opacity: territoryData.opacity,
        listElement: null,
        view: territoryData.view
    };

    createTerritoryVisuals(newTerritory);

    updateTerrritory(newTerritory);

    return newTerritory;
}

function findDrafts() {
    drafts = localStorage.getItem('drafts');

    if (!drafts) {
        drafts = [];
    } else {
        const draftList = document.getElementById('draft-list');

        drafts = JSON.parse(drafts).filter(draft => draft.data).sort((a, b) => b.timestamp - a.timestamp);

        if (drafts.length > 0) {
            for (let draft of drafts) {
                let draftButton = document.createElement('button');
                draftButton.innerHTML = `${draft.data.name}&emsp;${new Date(draft.timestamp).toLocaleString()}`;
                draftButton.onclick = () => {
                    currentDraft = draft;
                    changeProject(draft.data);
                    closePopover(draftButton);
                };

                let div = document.createElement('div');
                div.appendChild(draftButton);

                let deleteButton = document.createElement('button');
                deleteButton.innerText = "Usuń";
                deleteButton.onclick = () => {
                    if (!window.confirm("Czy na pewno chcesz usunąć ten szkic?")) {
                        return;
                    }
                    drafts.splice(drafts.indexOf(draft), 1);
                    localStorage.setItem('drafts', JSON.stringify(drafts));
                    div.remove();
                    if (draftList.firstChild === null) {
                        document.getElementById('draft-popover')?.hidePopover();
                    }
                };
                div.appendChild(deleteButton);
                draftList.appendChild(div);
            }
            document.getElementById('draft-popover')?.showPopover();
        }
    }
    drafts.push(currentDraft);
    localStorage.setItem('drafts', JSON.stringify(drafts));
}

function getJSONtoSave() {
    return {
        v: 1,
        name: currentProjectName,
        groups: [{
            territories: territories.map(t => ({
                number: t.number,
                name: t.name,
                coords: t.coords,
                fill: t.fill,
                stroke: t.stroke,
                thickness: t.thickness,
                opacity: t.opacity,
                view: t.view
            }))
        }],
    }
}

function updateCurrentDraft() {
    currentDraft.timestamp = Date.now();
    currentDraft.data = getJSONtoSave();
    localStorage.setItem('drafts', JSON.stringify(drafts));
}


function save() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(getJSONtoSave()));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "territory.json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    savedOn = undoStack.length;
}

function load() {
    if (undoStack.length > savedOn && !window.confirm("Wczytanie pliku spowoduje utratę niezapisanych zmian. Kontynuować?")) {
        return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (event) => {
        const file = event.target.files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = JSON.parse(e.target.result);
            // Handle the loaded data
            changeProject(data);
        };
        reader.readAsText(file);
    };
    input.click();
}

function changeProject(data) {
    removeEditingMarkers();
    for (let territory of territories) {
        deleteTerritoryVisuals(territory);
    }
    territories = [];
    loadData(data);
    if (territories.length > 0) {
        selectTerritoryForEditing(territories[0]);

        map.fitBounds(territories.reduce((bounds, territory) => {
            return bounds.extend(territory.coords[0].reduce((bounds, coord) => {
                return bounds.extend(coord);
            }, new maplibregl.LngLatBounds(territory.coords[0][0], territory.coords[0][0])));
        }, new maplibregl.LngLatBounds(territories[0].coords[0][0], territories[0].coords[0][0])),
            {
                padding: 100
            });

    }
    undoStack = [];
    redoStack = [];
    savedOn = 0;
}
