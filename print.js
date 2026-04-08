
function print() {

    let printDiv = document.createElement('div');
    printDiv.classList.add('print-div');
    document.body.appendChild(printDiv);

    let printIframe = document.createElement('iframe');
    printIframe.classList.add('print-iframe');
    printIframe.srcdoc = "<!DOCTYPE html><html><head></head><body></body></html>";
    printDiv.appendChild(printIframe);

    let buttonsContainer = document.createElement('div');
    buttonsContainer.classList.add('buttons-container');
    printDiv.appendChild(buttonsContainer);

    let closeButton = document.createElement('button');
    closeButton.classList.add('close-button');
    closeButton.textContent = 'X';
    closeButton.onclick = () => {printDiv.remove();};
    buttonsContainer.appendChild(closeButton);

    let printButton = document.createElement('button');
    printButton.classList.add('save-button');
    printButton.textContent = 'Drukuj';
    printButton.disabled = true;
    printButton.onclick = () => printIframe.contentWindow.print();
    buttonsContainer.appendChild(printButton);

    printIframe.onload = () => { 

        drawPrintingPages(printIframe).then(() => {
            printButton.disabled = false;
        });

    }

}


async function drawPrintingPages(printIframe,) {

    const script = printIframe.contentDocument.createElement("script");
    script.type = "module";
    script.src = "./territory-card.js";
    printIframe.contentDocument.head.appendChild(script);

    const link = printIframe.contentDocument.createElement("link");
    link.rel = "stylesheet";
    link.href = "./print.css";
    printIframe.contentDocument.head.appendChild(link);

    let page = printIframe.contentDocument.createElement('div');
    page.classList.add('page');
    printIframe.contentDocument.body.appendChild(page);

    let grid = printIframe.contentDocument.createElement('div');
    grid.classList.add('grid');
    page.appendChild(grid);

    let renderer = await createRenderer();


    let count = 0;
    for (let territory of territories.filter(t => t.visible)) {
        if (!printIframe.contentDocument) {
            break;
        }
        let card = printIframe.contentDocument.createElement('territory-card');
        card.setAttribute('territory-id', territory.id);
        card.setAttribute('territory-name', territory.number);
        card.setAttribute('description', territory.name);
        card.setAttribute('editable', 'false');
        card.setAttribute('static-image', await renderTerritoryToImage(renderer.renderMap, territory)); 

        grid.appendChild(card);
        card.setAttribute('card-src', 'card.html');

        if (++count >= 4) {
            count = 0;
            page = printIframe.contentDocument.createElement('div');
            page.classList.add('page');
            printIframe.contentDocument.body.appendChild(page);

            grid = printIframe.contentDocument.createElement('div');
            grid.classList.add('grid');
            page.appendChild(grid);
        }
    }
    renderer.remove();
    return;
}


async function loadCardTemplate() {
    const html = await fetch("card.html").then(r => r.text());

    const tpl = document.createElement("div");
    tpl.attachShadow({ mode: 'open' });
    tpl.shadowRoot.innerHTML = html.trim();

    return tpl;
}

let renderer;
async function createRenderer() {
    let renderer = await loadCardTemplate();

    let container = renderer.shadowRoot.querySelector("#map-container");
    renderer.style.position = "absolute";
    document.body.appendChild(renderer);

    renderer.renderMap = new maplibregl.Map({
        container,
        style: "style.json",
        pixelRatio: 4,
        interactive: false
    });


    return new Promise(resolve => {
        renderer.renderMap.on("load", () => resolve(renderer));
    });
}

async function renderTerritoryToImage(renderMap, territory) {
    const geojson = {
        type: "FeatureCollection",
        features: [territory.geojson]
    };

    // Update source
    renderMap.getSource("territories-source").setData(geojson);

    // Set view
    renderMap.jumpTo({
        center: getTeritoryCenter(territory),
        zoom: getTerritoryZoom(territory),
        bearing: getTerritoryBearing(territory),
        pitch: getTerritoryPitch(territory)
    });

    // Wait for render
    await new Promise(resolve => renderMap.once("idle", resolve));

    // Export image
    return renderMap.getCanvas().toDataURL("image/png");
}
