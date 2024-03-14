import { createElement } from "./util";
import style from "./style.module.css";

export class Selection {
	options: string[];
	el: HTMLElement;
	optionElements: HTMLButtonElement[];
	currentSelectedIndex: number;
	onChange: (value: string) => void | null;

	constructor(options: string[], defaultIndex: number, fieldName: string) {
		this.options = options;
		this.optionElements = [];
		this.currentSelectedIndex = 0;
		this.el = createElement("div");
		this.el.classList.add(style.selectionContainer);

		const selection = createElement("div");
		selection.classList.add(style.selection);
		for (let i = 0; i < options.length; ++i) {
			const el = createElement("button", {
				innerText: options[i],
			});
			el.classList.add(style.selectionItem);
			selection.appendChild(el);
			this.optionElements.push(el);
			el.addEventListener("click", () => this.setSelectedByIndex(i));
		}

		const field = createElement("p", {
			innerText: fieldName,
		});
		field.classList.add(style.selectionFieldName);

		this.el.appendChild(field);
		this.el.appendChild(selection);
		this.setSelectedByIndex(defaultIndex);
	}

	setSelectedByIndex(idx: number) {
		this.optionElements[this.currentSelectedIndex].classList.remove(
			style.selected,
		);
		this.optionElements[idx].classList.add(style.selected);
		this.currentSelectedIndex = idx;
		if (this.onChange != null) this.onChange(this.options[idx]);
	}

	setSelectedByName(name: string) {
		this.setSelectedByIndex(this.options.findIndex((v) => v == name));
	}

	getSelectedName() {
		return this.options[this.currentSelectedIndex];
	}

	getSelectedIndex() {
		return this.currentSelectedIndex;
	}
}
