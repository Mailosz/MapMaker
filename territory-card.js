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

let style = /*css*/`
    #container {
        display: grid;
        grid-template-rows: auto 4cm auto;
        justify-content: stretch;
        align-items: stretch;
        width: 10cm;
        height: 6cm;
    }

    #map-container {

    }

    #map {
        height: 4cm;
        width: 10cm;
    }


    .maplibregl-ctrl-attrib {
        display: none;
    }

    #footer {
        font-size: 10px;
    }
    `;
    
class TerritoryCard extends OxCustomElementBase {

    static observedAttributes = ["title", "description", "geojson", "bearing", "center", "zoom", "pitch"];

    geojson;

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        
        this.customAttributes.geojson.listen((value) => {
            this.geojson = {
                "type": "FeatureCollection",
                "features": JSON.parse(value)
            }
            if (this.mapElement?.loaded()) {
                this.mapElement.getSource("territories-source").setData(this.geojson);
            }
        });
    }

    connectedCallback() {
        
        this.attachShadowCss(style);

        let builder = new Builder(this.shadowRoot.ownerDocument);

        this.shadowRoot.appendChild(builder.tag("link").attr("rel", "stylesheet").attr("href", "map.css").getElement());

        this.shadowRoot.appendChild(builder.tag("div").id("container").children(
            builder.tag("div").id("header").children(
                builder.tag("div").id("title").bindProperty("innerText", this.customAttributes.title),
                builder.tag("div").id("description").bindProperty("innerText", this.customAttributes.description)
            ),
            builder.tag("div").id("map-container").children(
                builder.tag("div").id("map")
            ),
            builder.tag("div").id("footer").children(
                builder.tag("span").innerText("Prosimy")
            )
        ).getElement());

        this.mapElement = new maplibregl.Map({
            container: this.shadowRoot.getElementById("map"),
            style: "style.json",
            center: JSON.parse(this.customAttributes.center()) ?? [22, 50], 
            zoom: JSON.parse(this.customAttributes.zoom()) ?? 9, 
            bearing: JSON.parse(this.customAttributes.bearing()) ?? 0,
            pitch: JSON.parse(this.customAttributes.pitch()) ?? 0
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

        // this.mapElement.addControl(new maplibregl.NavigationControl({
        //     visualizePitch: true,
        //     visualizeRoll: true,
        //     showZoom: true,
        //     showCompass: true
        // }));

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



