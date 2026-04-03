class TerritoryListItem extends HTMLElement {

    static observedAttributes = ["label"];

    constructor() {
        super();

    }



    connectedCallback() {
        this.checkbox = document.createElement('input');
        this.checkbox.type = 'checkbox';
        this.checkbox.onchange = () => {
            this.dispatchEvent(new CustomEvent('checked-change', { detail: { checked: this.checkbox.checked } }));
        };
        this.checkbox.checked = true;
        this.appendChild(this.checkbox);


        this.label = document.createElement('span');
        this.label.style.flex = '1';
        this.appendChild(this.label);

        this.deleteButton = document.createElement('button');
        this.deleteButton.textContent = 'X';
        this.deleteButton.onclick = (event) => {
            event.stopPropagation();
            this.dispatchEvent(new CustomEvent('delete', { detail: {} }));
        };
        this.appendChild(this.deleteButton);
    }

    disconnectedCallback() {
        console.log(`Custom element removed (${this.constructor.name})`);
    }

    adoptedCallback() {
        console.log(`Custom element moved to new document (${this.constructor.name})`);
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'label') {
            this.label.textContent = newValue;
        }
    }

}


window.customElements.define("territory-list-item", TerritoryListItem);