import { ControlPoint } from "./controlPoint";
import { createElement } from "./util";
import style from "./style.module.css";
import { Selection } from "./options";
import { Point } from "./point";
import { BezierPainterDnC } from "./bezier/divideAndConquer";
import { BezierPainter } from "./bezier/base";
import { Benchmark } from "./benchmark";

type CanvasSettings = {
	linePath: boolean;
	useDivideAndConquer: boolean;
	deleteMode: boolean;
};

export type ControlPointEvent =
	| "start_edit"
	| "edit"
	| "end_edit"
	| "count_edit";

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
		deleteMode: false,
	};

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

		this.currentPainterIndex = 0;
		this.painters = [new BezierPainterDnC()];
		this.painters.forEach(
			(painter) =>
				(painter.draw = (path) => {
					this.bezierPath = path;
					this.redraw();
				}),
		);

		this.benchmark = new Benchmark(this);
		this.benchmark.el.classList.add(style.canvasBenchmark);
		this.el.append(this.benchmark.el);

		this.configTray = createElement("div");
		this.configTray.appendChild(this.getCurrentPainter().configEl);
		this.configTray.classList.add(style.canvasConfigTray);
		this.el.appendChild(this.configTray);

		const linePathOption = new Selection(["Off", "On"], 0, "Line Path");
		linePathOption.onChange = (v) => {
			this.settings.linePath = v == "On";
			this.redraw();
		};
		const modeOption = new Selection(["Create and Drag", "Delete"], 0, "Mode");
		modeOption.onChange = (v) => {
			this.settings.deleteMode = v == "Delete";
			const classlist = this.controlPointsContainer.classList;
			if (this.settings.deleteMode) classlist.add(style.controlPointDeleteMode);
			else classlist.remove(style.controlPointDeleteMode);
			this.canvas.style.cursor = this.settings.deleteMode ? "default" : "";
		};
		const methodOption = new Selection(
			["Brute Force", "Divide and Conquer"],
			0,
			"Method",
		);
		methodOption.onChange = (v) =>
			(this.settings.useDivideAndConquer = v == "Divide and Conquer");

		const clearButton = createElement("button", {
			innerText: "🗑",
		});
		clearButton.classList.add(style.canvasClear);
		clearButton.addEventListener("click", () => {
			while (this.controlPoints.length > 0)
				this.removeControlPoint(this.controlPoints[0]);
		});
		this.el.appendChild(clearButton);

		const optionContainer = createElement("div");
		optionContainer.classList.add(style.canvasOption);
		optionContainer.appendChild(linePathOption.el);
		optionContainer.appendChild(modeOption.el);
		optionContainer.appendChild(methodOption.el);
		this.el.appendChild(optionContainer);

		window.addEventListener("resize", this.resizeCanvas.bind(this));
		this.resizeCanvas();
	}

	drawer(point: Point[]) {
		this.bezierPath = point;
		this.redraw();
	}

	getControlPoints() {
		return this.controlPoints.map((controlPoint) => controlPoint.getPosition());
	}

	dispatchControlPointEvent(event: ControlPointEvent) {
		if (this.benchmark.benchmarked) this.benchmark.clickHandler();
		const controlPoints = this.getControlPoints();
		const currentPainter = this.getCurrentPainter();
		currentPainter.onControlPointEvent(event, controlPoints);
	}

	getCurrentPainter() {
		return this.painters[this.currentPainterIndex];
	}

	setCurrentPainter() {}

	resizeCanvas() {
		this.canvas.width = window.innerWidth;
		this.canvas.height = window.innerHeight;
		this.dispatchControlPointEvent("count_edit");
	}

	redraw() {
		this.clear();
		if (this.settings.linePath) {
			this.ctx.beginPath();
			this.ctx.setLineDash([5]);
			this.ctx.lineWidth = 1;
			this.ctx.strokeStyle = "gray";
			this.getControlPoints().forEach(({ x, y }) => this.ctx.lineTo(x, y));
			this.ctx.stroke();
		}

		this.ctx.beginPath();
		this.ctx.setLineDash([]);
		this.ctx.lineWidth = 2;
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
		if (this.settings.deleteMode) return;
		const { x: elX, y: elY } = this.canvas.getBoundingClientRect();
		const { x: pageX, y: pageY } = ev;
		const x = pageX - elX;
		const y = pageY - elY;
		this.createControlPoint(x, y);
	}

	clear() {
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
	}
}
