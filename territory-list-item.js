import { signal, OxCustomElementBase } from "./ox.js";


const style = /*css*/`
    .label {
        flex: 1;
        text-overflow: ellipsis;
        white-space: nowrap;
        overflow: hidden;
    }

    .more-menu:popover-open {
        position-area: right span-all;
        display: flex;
        flex-direction: column;
        align-items: stretch;
    }
`;


class TerritoryListItem extends OxCustomElementBase {

    static observedAttributes = ["label"];

    #isChecked = signal(true);

    get isChecked() {
        return this.#isChecked();
    }

    set isChecked(value) {
        this.#isChecked.set(value);
    }

    constructor() {
        super();

        this.customAttributes.label.listen((value) => {
            if (this.label) {
                this.label.textContent = value;
            }
        });


        this.attachShadow({ mode: 'open' });
        this.attachShadowCss(style);

        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = new URL("./base.css", import.meta.url);
        this.shadowRoot.appendChild(link);

        this.checkbox = document.createElement('input');
        this.checkbox.id = "select-checkbox";
        this.checkbox.type = 'checkbox';
        this.checkbox.ondblclick = (event) => { event.stopPropagation(); };
        this.checkbox.onchange = () => {
            this.dispatchEvent(new CustomEvent('checked-change', { detail: { checked: this.checkbox.checked } }));
        };
        this.checkbox.checked = this.#isChecked();
        this.shadowRoot.appendChild(this.checkbox);

        this.#isChecked.listen((value) => {
            this.checkbox.checked = value;
        });


        this.label = document.createElement('span');
        this.label.classList.add('label');
        this.label.textContent = this.customAttributes.label();
        this.shadowRoot.appendChild(this.label);

        this.deleteButton = document.createElement('button');
        this.deleteButton.textContent = 'Usuń';
        this.deleteButton.onclick = (event) => {
            event.stopPropagation();
            this.dispatchEvent(new CustomEvent('delete', { detail: {} }));
        };

        this.cardButton = document.createElement('button');
        this.cardButton.textContent = 'Edytuj kartę';
        this.cardButton.onclick = (event) => {
            event.stopPropagation();
            this.dispatchEvent(new CustomEvent('card', { detail: {} }));
        };

        this.moreMenu = document.createElement('div');
        this.moreMenu.popover = "auto";
        this.moreMenu.ondblclick = (event) => { event.stopPropagation(); };
        this.moreMenu.appendChild(this.cardButton);
        this.moreMenu.appendChild(this.deleteButton);
        this.moreMenu.classList.add('more-menu');
        this.shadowRoot.appendChild(this.moreMenu);

        this.moreButton = document.createElement('button');
        this.moreButton.textContent = '⋮';
        this.moreButton.popoverTargetElement = this.moreMenu;
        this.moreButton.ondblclick = (event) => { event.stopPropagation(); };
        this.shadowRoot.appendChild(this.moreButton);
    }



    connectedCallback() {


    }

    disconnectedCallback() {
        console.log(`Custom element removed (${this.constructor.name})`);
    }

    adoptedCallback() {
        console.log(`Custom element moved to new document (${this.constructor.name})`);
    }

}


window.customElements.define("territory-list-item", TerritoryListItem);