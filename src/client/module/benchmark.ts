import { createElement, styleElement } from "./util";
import style from "./style.module.css";
import { InfoTray } from "./InfoTray";
import { Canvas } from "./canvas";

export class Benchmark {
	el: HTMLDivElement;
	inp: HTMLInputElement;
	btn: HTMLButtonElement;
	tray: InfoTray;
	canvas: Canvas;
	benchmarked: boolean;

	constructor(canvas: Canvas) {
		this.canvas = canvas;

		this.el = createElement("div");
		this.el.classList.add(style.benchmark);

		this.inp = createElement("input", {
			type: "number",
			placeholder: "Point Count Target",
			min: "0"
		});
		this.inp.addEventListener("input", function() {
			this.value = this.value.replace(/[^0-9.]/g, '')
		})
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
			width: "9rem",
			overflow: "hidden",
		});
		inputContainer.appendChild(this.inp);
		inputContainer.appendChild(this.btn);

		this.el.append(inputContainer);
		this.el.append(this.tray.el);

		this.inp.style.transition = "all 0.2s";
		document.body.style.transition = "opacity 0.5s";
		this.benchmarked = false;
		this.btn.addEventListener("click", this.clickHandler);
	}

	clickHandler = async () => {
		if (this.benchmarked) {
			await this.tray.clearAll();
			this.inp.disabled = false;
			this.inp.style.opacity = "";
			this.btn.innerText = "Benchmark";
			this.benchmarked = false;
			return;
		}

		const pointCountTarget = parseInt(this.inp.value);
		const controlPoints = this.canvas.getControlPoints();

		let error: string = "";
		if (controlPoints.length == 0) error = "Control points still empty";
		else if (isNaN(pointCountTarget)) error = "Invalid point count target";

		if (error) {
			const id = "error-" + Math.random();
			this.tray.addInfo(id, error);
			setTimeout(() => this.tray.removeInfo(id), 1000);
			return;
		}

		this.btn.innerText = "Benchmarking...";
		document.body.style.opacity = "0.5";

		requestAnimationFrame(() => {
			requestAnimationFrame(async () => {
				for (const painter of this.canvas.painters) {
					const v = await painter.benchmark(controlPoints, pointCountTarget);
					this.tray.addInfo(
						Math.random().toString(),
						`${v.strategyName}\nTime: ${v.msTime}ms\nPoint Count: ${v.pointCount}\nOvershoot: ${v.overshoot}`,
					);
				}
				this.inp.disabled = true;
				this.inp.style.opacity = "0.5";
				this.btn.innerText = "Clear";
				this.benchmarked = true;
				document.body.style.opacity = "";
			});
		});
	};
}
