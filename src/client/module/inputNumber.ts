import { createElement } from "./util";
import style from "./style.module.css";

class Repeater {
	record: Record<string, number> = {}

	repeat(fn: () => void, interval: number, startDelay: number): string {
		const id = Math.random().toString()
		const int = () => {
			fn();
			this.record[id] = setTimeout(int, interval) as any
		}
		fn();
		this.record[id] = setTimeout(int, startDelay) as any
		return id
	}

	stop(id: string) {
		clearTimeout(this.record[id])
	}
}
const repeater = new Repeater()

export class InputNumber {
	el: HTMLDivElement;
	private input: HTMLInputElement;
	onChange: (value: number) => void;
	constructor(label: string, defaultValue: number, repeat: boolean = false) {
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
		let decRepeatId: string;
		decEl.addEventListener("pointerdown", () => {
			const fn = () => {
				const val = Math.max(parseInt(this.input.value) - 1, min);
				this.changeValue(val);
			}
			if (repeat) decRepeatId = repeater.repeat(fn, 10, 500);
			else fn();
		});
		decEl.addEventListener("pointerup", () => repeater.stop(decRepeatId))

		const incEl = createElement("button", {
			innerText: "^",
		});
		let incRepeatId: string;
		incEl.addEventListener("pointerdown", () => {
			const fn = () => {
				const val = Math.max(parseInt(this.input.value) + 1, min);
				this.changeValue(val);
			}
			if (repeat) incRepeatId = repeater.repeat(fn, 10, 500);
			else fn();
		});
		incEl.addEventListener("pointerup", () => repeater.stop(incRepeatId))

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
