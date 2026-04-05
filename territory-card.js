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
    :host {
        display: block;
        width: 14cm;
        height: 9.7cm;
    }

    #container {
        display: block;
        width: 14cm;
        height: 9.7cm;
    }

    #header {
        position: absolute;
        left: 0.1cm;
        top: 0.1cm;
        right: 0.1cm;
        height: 2cm;
    }

    #map-container {
        position: absolute;
        left: 0.1cm;
        top: 2.5cm; 
        right: 0.1cm;
        bottom: 1cm;
    }

    #map {
        height: 8cm;
        width: 14cm;
    }


    .maplibregl-ctrl-attrib {
        display: none;
    }

    #footer {
        position: absolute;
        left: 0.1cm;
        right: 0.1cm;
        bottom: 0.1cm;
        height: 0.8cm;
        font-size: 10px;
    }
    `;
    
class TerritoryCard extends OxCustomElementBase {

    static observedAttributes = ["territory-id", "territory-name", "description", "geojson", "bearing", "center", "zoom", "pitch", "card-src"];

    geojson;

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
    }

    connectedCallback() {
        
        this.attachShadowCss(style);

        //let builder = new Builder(this.shadowRoot.ownerDocument);

        // this.shadowRoot.appendChild(builder.tag("link").attr("rel", "stylesheet").attr("href", "map.css").getElement());

        // this.shadowRoot.appendChild(builder.tag("div").id("container").children(
        //     builder.tag("div").id("header").children(
        //         builder.tag("div").id("title").bindProperty("innerText", this.customAttributes.title),
        //         builder.tag("div").id("description").bindProperty("innerText", this.customAttributes.description)
        //     ),
        //     builder.tag("div").id("map-container"),
        //     builder.tag("div").id("footer").children(
        //         builder.tag("span").innerText("Prosimy")
        //     )
        // ).getElement());

       

        

        // this.mapElement.addControl(new maplibregl.NavigationControl({
        //     visualizePitch: true,
        //     visualizeRoll: true,
        //     showZoom: true,
        //     showCompass: true
        // }));

    }

    createMap(mapContainer) {
        this.mapElement = new maplibregl.Map({
            container: mapContainer,
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



