let undoStack = [];
let redoStack = [];
let editedTerritoryMarkers = [];
let editedTerritory = null;
let territories = [];
let savedOn = 0;
let currentDraft = {
    timestamp: Date.now(),
    data: null
};
let drafts = [];
let currentProjectName = "";

let data = {
    v: 1,
    name: "Nienazwany projekt",
    groups: [
        {
            territories: []
        }
    ],
}

// Initialize the map       
let map = new maplibregl.Map({
    container: 'map-container',
    style: "style.json",
    center: [22, 50], // starting position [lng, lat]
    zoom: 9 // starting zoom
});
const canvas = map.getCanvasContainer();

map.addControl(new maplibregl.NavigationControl({
    visualizePitch: true,
    visualizeRoll: true,
    showZoom: true,
    showCompass: true
}));

// Add geolocate control to the map.
map.addControl(
    new maplibregl.GeolocateControl({
        positionOptions: {
            enableHighAccuracy: true
        },
        trackUserLocation: false
    })
);
map.doubleClickZoom.disable();


map.on('load', () => {
    // Add a source and layer displaying a point which will be dragged around.

    loadData(data);
    if (territories.length > 0) {
        selectTerritoryForEditing(territories[0]);
    }

    findDrafts();

});

map.on('click', (e) => {
    const features = map.queryRenderedFeatures(e.point);

    if (features.length > 0 && features[0].source.startsWith('territory-source-')) {
        const territoryId = features[0].source.substring('territory-source-'.length);
        const territoryData = territories.find(t => t.id === territoryId);
        selectTerritoryForEditing(territoryData);
    } else {
        selectTerritoryForEditing(null);
    }
});

map.on('dblclick', (e) => {
    const features = map.queryRenderedFeatures(e.point);

    console.log("Features:", features);
});


