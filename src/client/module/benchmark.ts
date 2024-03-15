import { createElement, styleElement } from "./util";
import style from "./style.module.css";
import { InfoTray } from "./InfoTray";

export class Benchmark {
	el: HTMLDivElement;
	inp: HTMLInputElement;
	btn: HTMLButtonElement;
	tray: InfoTray;

	constructor() {
		this.el = createElement("div");
		this.el.classList.add(style.benchmark);

		this.inp = createElement("input", {
			type: "number",
			placeholder: "Point Count Target",
		});
		this.btn = createElement("button", {
			innerText: "Benchmark",
		});

		this.tray = new InfoTray();
		this.tray.el.classList.add(style.benchmarkInfoTray);

		const inputContainer = createElement("div");
		styleElement(inputContainer, {
			display: "flex",
			flexDirection: "column",
			backgroundColor: "white",
			padding: "0.5rem",
			borderRadius: "0.4rem",
			alignSelf: "flex-start",
		});
		inputContainer.appendChild(this.inp);
		inputContainer.appendChild(this.btn);

		this.el.append(inputContainer);
		this.el.append(this.tray.el);

		this.btn.addEventListener("click", () => {
			const id = Math.random().toString();
			this.tray.addInfo(id, "value " + this.inp.value);
		});
	}
}
