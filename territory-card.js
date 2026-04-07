import { Builder, signal } from "./ox.js";

class OxCustomElementBase extends HTMLElement {

    static customAttributes = {};

    constructor() {
        super();

        let self = this;
        this.customAttributes = {};
        while (self) {

            if ("observedAttributes" in self.constructor) {
                for (let attr of self.constructor.observedAttributes) {
                    this.customAttributes[attr] = signal();
                }
            }

            self = Object.getPrototypeOf(self);
        }
    }

    attachShadowCss(css) {
        if (css) {
            const styleSheet = new CSSStyleSheet();
            styleSheet.replaceSync(css);

            this.shadowRoot.adoptedStyleSheets.push(styleSheet);
        }
        return this.shadowRoot;
    }

    connectedCallback() {
        console.log(`Custom element added (${this.constructor.name})`);
    }

    disconnectedCallback() {
        console.log(`Custom element removed (${this.constructor.name})`);
    }

    adoptedCallback() {
        console.log(`Custom element moved to new document (${this.constructor.name})`);
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name in this.customAttributes) {
            if (oldValue !== newValue) { 
                this.customAttributes[name].set(newValue);
            }
        }
    }

}

    
class TerritoryCard extends OxCustomElementBase {

    static observedAttributes = ["territory-id", "territory-name", "description", "geojson", "bearing", "center", "zoom", "pitch", "editable", "card-src"];

    geojson;
    isEditable = null;
    #cardLoad;

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        
        this.customAttributes.geojson.listen((value) => {
            this.geojson = {
                "type": "FeatureCollection",
                "features": JSON.parse(value)
            };
            if (this.mapElement?.loaded()) {
                this.mapElement.getSource("territories-source").setData(JSON.stringify(this.geojson));
            }
        });

        this.customAttributes["card-src"].listen((value) => {
            fetch(value).then(res => res.text()).then(data => {

                data = data.replace("{{name}}", "<span id='territory-name'>" + this.customAttributes["territory-name"]() + "</span>");
                data = data.replace("{{description}}", "<span id='territory-description'>" + this.customAttributes["description"]() + "</span>");

                this.shadowRoot.innerHTML = data;

                let mapContainer = this.shadowRoot.getElementById("map-container");
                this.createMap(mapContainer);
            });
        });

        this.customAttributes["territory-name"].listen((value) => {
            let el = this.shadowRoot.getElementById("territory-name");
            if (el) {
                el.innerText = value;
            }
        });

        this.customAttributes["description"].listen((value) => {
            let el = this.shadowRoot.getElementById("territory-description");
            if (el) {
                el.innerText = value;
            }
        });

        this.customAttributes.editable.listen((value) => {
            this.isEditable = value === "true";
        });
    }

    connectedCallback() {
    }

    createMap(mapContainer) {
        this.mapElement = new maplibregl.Map({
            container: mapContainer,
            style: "style.json",
            center: JSON.parse(this.customAttributes.center()) ?? [22, 50], 
            zoom: JSON.parse(this.customAttributes.zoom()) ?? 9, 
            bearing: JSON.parse(this.customAttributes.bearing()) ?? 0,
            pitch: JSON.parse(this.customAttributes.pitch()) ?? 0,
            interactive: this.isEditable === true
        });

        this.mapElement.on('load', () => {
            if (this.geojson) {

                this.mapElement.getSource("territories-source").setData(this.geojson);
            }
        });

        this.mapElement.on("movestart", () => {
            this.viewModified();
        });
        this.mapElement.on("rotatestart", () => {
            this.viewModified();
        });
        this.mapElement.on("pitchstart", () => {
            this.viewModified();
        });
        this.mapElement.on("zoomstart", () => {
            this.viewModified();
        });

    }


    viewModified() {
        this.dispatchEvent(new CustomEvent('view-change', { }));
    }


    disconnectedCallback() {
        console.log(`Custom element removed (${this.constructor.name})`);
    }

    adoptedCallback() {
        console.log(`Custom element moved to new document (${this.constructor.name})`);
    }

    getView() {
        return {
            center: this.mapElement.getCenter().toArray(),
            zoom: this.mapElement.getZoom(),
            bearing: this.mapElement.getBearing(),
            pitch: this.mapElement.getPitch()
        };
    }

}


window.customElements.define("territory-card", TerritoryCard);



