import { ControlPoint } from "./controlPoint";
import { createElement, styleElement } from "./util";
import style from "./style.module.css";
import { Selection } from "./options";
import { Point } from "./point";
import { BezierPainterDnC } from "./bezier/divideAndConquer";
import { BezierPainter } from "./bezier/base";
import { Benchmark } from "./benchmark";
import { BezierPainterBF } from "./bezier/bruteForce";

type CanvasSettings = {
	linePath: boolean;
	useDivideAndConquer: boolean;
	moveMode: boolean;
};

type CanvasView = {
	x: number,
	y: number,
	scale: number
}

export type ControlPointEvent =
	| "start_edit"
	| "edit"
	| "end_edit"
	| "count_edit"
	| "redraw"
	| "reset"
	| "attach"
	| "detach";

export class Canvas {
	ctx: CanvasRenderingContext2D;
	benchmark: Benchmark;

	el: HTMLDivElement;
	controlPointsContainer: HTMLDivElement;
	bezierPath: Point[];
	canvas: HTMLCanvasElement;
	configTray: HTMLDivElement;

	painters: BezierPainter[];
	currentPainterIndex: number;

	controlPoints: ControlPoint[];

	settings: CanvasSettings = {
		linePath: false,
		useDivideAndConquer: true,
		moveMode: false,
	};

	view: CanvasView = {
		scale: 1,
		x: 0,
		y: 0
	}

	constructor() {
		this.controlPoints = [];

		this.el = createElement("div");

		this.controlPointsContainer = createElement("div");
		this.controlPointsContainer.classList.add(style.controlPointContainer);
		this.el.append(this.controlPointsContainer);

		this.canvas = createElement("canvas");
		this.canvas.classList.add(style.canvas);
		this.el.appendChild(this.canvas);

		this.ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;
		this.canvas.addEventListener("click", this.onClick.bind(this));

		this.currentPainterIndex = 1;
		this.painters = [new BezierPainterBF(), new BezierPainterDnC()];
		this.painters.forEach(
			(painter) =>
			(painter.draw = (path) => {
				this.bezierPath = path;
				this.redraw();
			}),
		);

		this.benchmark = new Benchmark(this);
		this.benchmark.el.classList.add(style.canvasBenchmark);
		const position = createElement("div", { innerText: "Position: -,-" })
		styleElement(position, { marginBottom: "0.5rem" })
		document.body.addEventListener("pointerleave", () => {
			position.innerText = "Position: -,-"
		})
		document.body.addEventListener("pointermove", (e) => {
			const { x: offsetX, y: offsetY, scale } = this.view
			const x = ((e.x - offsetX) / scale).toFixed(2)
			const y = ((e.y - offsetY) / scale).toFixed(2)
			position.innerText = `Position: ${x},${y}`
		})
		this.benchmark.el.insertAdjacentElement("afterbegin", position)
		this.el.append(this.benchmark.el);

		this.configTray = createElement("div");
		this.configTray.append(...this.painters.map(p => p.configEl));
		this.configTray.classList.add(style.canvasConfigTray);
		this.el.appendChild(this.configTray);

		const showPointOption = new Selection(["Off", "On"], 1, "Show Point");
		showPointOption.onChange = (v) => {
			const classList = this.controlPointsContainer.classList;
			if (v == "Off") classList.add(style.controlPointHide);
			else classList.remove(style.controlPointHide);
		};
		const linePathOption = new Selection(["Off", "On"], 0, "Line Path");
		linePathOption.onChange = (v) => {
			this.settings.linePath = v == "On";
			this.dispatchControlPointEvent("redraw");
		};
		const modeOption = new Selection(["Create and Delete", "Move and Drag"], 0, "Mode");
		modeOption.onChange = () => {
			this.settings.moveMode = modeOption.getSelectedIndex() == 1;
			const classlist = this.controlPointsContainer.classList;
			if (this.settings.moveMode) classlist.add(style.controlPointMoveMode);
			else classlist.remove(style.controlPointMoveMode);
			this.canvas.style.cursor = this.settings.moveMode ? "move" : "";
		};
		const fn = (e: Event) => {
			e.preventDefault();
			modeOption.setSelectedByIndex(modeOption.getSelectedIndex() ? 0 : 1)

		}
		this.canvas.addEventListener("contextmenu", fn)
		this.controlPointsContainer.addEventListener("contextmenu", fn)

		const methodOption = new Selection(
			["Brute Force", "Divide and Conquer"],
			1,
			"Method",
		);
		this.setCurrentPainter(1)
		methodOption.onChange = (v) => {
			this.settings.useDivideAndConquer = v == "Divide and Conquer";
			this.setCurrentPainter(this.settings.useDivideAndConquer ? 1 : 0);
		}

		const clearButton = createElement("button", { innerText: "🗑" });
		clearButton.classList.add(style.canvasButton);
		clearButton.addEventListener("click", () => {
			while (this.controlPoints.length > 0)
				this.removeControlPoint(this.controlPoints[0]);
		});

		const downloadButton = createElement("button", { innerText: "↓" });
		downloadButton.addEventListener("click", () => {
			const input = this.getControlPoints();
			const inputStr = input.map(({ x, y }) => [x, y]).join("\n");

			const output = this.getCurrentPainter().getCurrentResult();
			const outputStr = output.map(({ x, y }) => [x, y]).join("\n");

			const str = `Control Points (${input.length} points):\n${inputStr}\n\nCurve (${output.length} points):\n${outputStr}`;

			const blob = new Blob([str], { type: "text/txt" });
			// @ts-ignore
			const elem = createElement("a", {
				href: window.URL.createObjectURL(blob),
				download: "bezier.txt",
			});
			document.body.appendChild(elem);
			elem.click();
			document.body.removeChild(elem);
		});
		downloadButton.classList.add(style.canvasButton);

		const buttonContainer = createElement("div");
		buttonContainer.classList.add(style.canvasButtonContainer);
		buttonContainer.append(downloadButton, clearButton);
		this.el.appendChild(buttonContainer);

		const optionContainer = createElement("div");
		optionContainer.classList.add(style.canvasOption);
		optionContainer.appendChild(linePathOption.el);
		optionContainer.appendChild(showPointOption.el);
		optionContainer.appendChild(modeOption.el);
		optionContainer.appendChild(methodOption.el);
		this.el.appendChild(optionContainer);

		let canvasDragState = {
			dragged: false,
			startX: 0,
			startY: 0
		}
		this.canvas.addEventListener("pointerdown", (e) => {
			if (!this.settings.moveMode) return
			canvasDragState = {
				dragged: true,
				startX: e.x - this.view.x, startY: e.y - this.view.y
			}
		})
		this.canvas.addEventListener("pointerup", () => {
			canvasDragState.dragged = false
		})
		this.canvas.addEventListener("pointermove", ({ x, y }) => {
			if (!canvasDragState.dragged) return;
			const { startX, startY } = canvasDragState;
			this.view.x = x - startX
			this.view.y = y - startY
			this.updateView();
		})
		this.canvas.addEventListener("wheel", (e) => {
			// I've never fucking this stressed out for code
			// Thanks transformation shit
			const size = 1.1
			const delta = e.deltaY < 0 ? size : (1 / size)
			const { x: offsetX, y: offsetY, scale } = this.view
			const nextScale = scale * delta

			const m = 1 - (1 / delta)
			const oX = (e.x / scale) * m
			const oY = (e.y / scale) * m

			this.view.x = offsetX * delta - (oX) * nextScale;
			this.view.y = offsetY * delta - (oY) * nextScale;
			this.view.scale = nextScale
			this.updateView();
		})

		window.addEventListener("resize", this.resizeCanvas.bind(this));
		this.resizeCanvas();

		// setTimeout(() => {
		// 	const randInt = () => Math.random() * 300 + 100
		// 	for (let i = 0; i < 4; ++i) {
		// 		this.createControlPoint(randInt(), randInt());
		// 	}
		// }, 1000)
	}

	updateView() {
		let { scale, x, y } = this.view
		// @ts-ignore
		window.test = this.view
		this.ctx.resetTransform()
		this.ctx.translate(x, y)
		this.ctx.scale(scale, scale)

		this.controlPoints.forEach((controlPoint) => {
			const { x, y } = controlPoint.position
			controlPoint.setPosition(x, y)
		})
		this.dispatchControlPointEvent("redraw");
	}

	drawer(point: Point[]) {
		this.bezierPath = point;
		this.redraw();
	}

	getControlPoints() {
		return this.controlPoints.map((controlPoint) => controlPoint.getPosition());
	}

	dispatchControlPointEvent(event: ControlPointEvent) {
		if (this.benchmark.benchmarked && event != "redraw") this.benchmark.clickHandler();
		const controlPoints = this.getControlPoints();
		const currentPainter = this.getCurrentPainter();
		currentPainter.onControlPointEvent(event, controlPoints);
	}

	getCurrentPainter() {
		return this.painters[this.currentPainterIndex];
	}

	setCurrentPainter(idx: number) {
		this.getCurrentPainter().configEl.classList.remove(style.canvasConfigTrayItemOpened)
		this.dispatchControlPointEvent("detach")
		this.currentPainterIndex = idx
		this.getCurrentPainter().configEl.classList.add(style.canvasConfigTrayItemOpened)
		this.dispatchControlPointEvent("attach")
		this.dispatchControlPointEvent("reset")
	}

	resizeCanvas() {
		this.canvas.width = window.innerWidth;
		this.canvas.height = window.innerHeight;
		this.updateView();
	}

	redraw() {
		const scale = 1 / this.view.scale
		this.clear();
		if (this.settings.linePath) {
			this.ctx.beginPath();
			this.ctx.setLineDash([5]);
			this.ctx.lineWidth = 1 * scale;
			this.ctx.strokeStyle = "gray";
			this.getControlPoints().forEach(({ x, y }) => this.ctx.lineTo(x, y));
			this.ctx.stroke();
		}

		this.ctx.beginPath();
		this.ctx.setLineDash([]);
		this.ctx.lineWidth = 2 * scale;
		this.ctx.strokeStyle = "black";
		this.bezierPath.forEach(({ x, y }) => this.ctx.lineTo(x, y));
		this.ctx.stroke();
	}

	createControlPoint(x: number, y: number) {
		const controlPoint = new ControlPoint(this);
		controlPoint.setPosition(x, y);
		controlPoint.attach();
		this.controlPoints.push(controlPoint);
		this.dispatchControlPointEvent("count_edit");
	}

	removeControlPoint(controlPoint: ControlPoint) {
		const idx = this.controlPoints.findIndex((v) => v == controlPoint);
		this.controlPoints.splice(idx, 1);
		controlPoint.detach();
		this.dispatchControlPointEvent("count_edit");
	}

	onClick(this: Canvas, ev: MouseEvent) {
		if (this.settings.moveMode) return;
		const { x: elX, y: elY } = this.canvas.getBoundingClientRect();
		const { x: pageX, y: pageY } = ev;
		const { x: offsetX, y: offsetY, scale } = this.view;
		const x = (pageX - elX - offsetX) / scale;
		const y = (pageY - elY - offsetY) / scale;
		this.createControlPoint(x, y);
	}

	clear() {
		this.ctx.save();
		this.ctx.setTransform(1, 0, 0, 1, 0, 0);
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		this.ctx.restore();
	}
}
