class TerritoryListItem extends HTMLElement {

    static observedAttributes = ["label"];

    get isChecked() {
        return this.checkbox.isChecked;
    }

    set isChecked(value) {
        this.checkbox.checked = value;
    }

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
        this.deleteButton.textContent = 'Usuń';
        this.deleteButton.onclick = (event) => {
            event.stopPropagation();
            this.dispatchEvent(new CustomEvent('delete', { detail: {} }));
        };

        this.cardButton = document.createElement('button');
        this.cardButton.textContent = 'Pokaż kartę';
        this.cardButton.onclick = (event) => {
            event.stopPropagation();
            this.dispatchEvent(new CustomEvent('card', { detail: {} }));
        };

        this.moreMenu = document.createElement('div');
        this.moreMenu.popover = "auto";
        this.moreMenu.appendChild(this.cardButton);
        this.moreMenu.appendChild(this.deleteButton);
        this.moreMenu.classList.add('more-menu');
        this.appendChild(this.moreMenu);

        this.moreButton = document.createElement('button');
        this.moreButton.textContent = '⋮';
        this.moreButton.popoverTargetElement = this.moreMenu;
        this.appendChild(this.moreButton);
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