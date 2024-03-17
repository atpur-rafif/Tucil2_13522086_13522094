import { createElement } from "./util";
import style from "./style.module.css";

export class InputNumber {
	el: HTMLDivElement;
	private input: HTMLInputElement;
	onChange: (value: number) => void;
	constructor(label: string, defaultValue: number) {
		this.el = createElement("div");
		this.el.classList.add(style.inputNumberContainer);
		const min = 0;
		this.input = createElement("input", {
			type: "number",
			value: defaultValue.toString(),
			min: min.toString(),
		});
		this.input.addEventListener("change", () => {
			const val = parseInt(this.input.value);
			this.changeValue(val);
		});

		const decEl = createElement("button", {
			innerText: "⌄",
		});
		decEl.addEventListener("click", () => {
			const val = Math.max(parseInt(this.input.value) - 1, min);
			this.changeValue(val);
		});

		const incEl = createElement("button", {
			innerText: "^",
		});
		incEl.addEventListener("click", () => {
			const val = parseInt(this.input.value) + 1;
			this.changeValue(val);
		});

		const labelEl = createElement("p", {
			innerText: label,
		});

		this.el.append(labelEl, incEl, this.input, decEl);
	}

	changeValue(value: number) {
		this.input.value = value.toString();
		if (this.onChange) this.onChange(value);
	}

	changeDisplayValue(value: number) {
		this.input.value = value.toString();
	}
}
