import { ControlPoint } from "./controlPoint";
import { createElement } from "./util";
import style from "./style.module.css";
import { Selection } from "./options";
import { Point } from "./point";
import { BezierPainterDnC } from "./bezier/divideAndConquer";
import { BezierPainter } from "./bezier/base";

type CanvasSettings = {
	animation: boolean;
	linePath: boolean;
	useDivideAndConquer: boolean;
	deleteMode: boolean;
};

export class Canvas {
	ctx: CanvasRenderingContext2D;

	el: HTMLDivElement;
	canvas: HTMLCanvasElement;

	painter: BezierPainter[];
	currentPainterIndex: number;

	controlPoints: ControlPoint[];

	settings: CanvasSettings = {
		animation: true,
		linePath: false,
		useDivideAndConquer: true,
		deleteMode: false,
	};

	constructor() {
		this.controlPoints = [];

		this.el = createElement("div");

		this.canvas = createElement("canvas");
		this.canvas.classList.add(style.canvas);
		this.el.appendChild(this.canvas);

		this.ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;
		this.canvas.addEventListener("click", this.onClick.bind(this));

		this.currentPainterIndex = 0;
		this.painter = [new BezierPainterDnC(this)];

		const animationOption = new Selection(["Off", "On"], 1, "Animation");
		animationOption.onChange = (v) => (this.settings.animation = v == "On");
		const linePathOption = new Selection(["Off", "On"], 0, "Line Path");
		linePathOption.onChange = (v) => {
			this.settings.linePath = v == "On";
			this.redraw();
		};
		const modeOption = new Selection(["Create and Drag", "Delete"], 0, "Mode");
		modeOption.onChange = (v) => (this.settings.deleteMode = v == "Delete");
		const methodOption = new Selection(
			["Brute Force", "Divide and Conquer"],
			0,
			"Method",
		);
		methodOption.onChange = (v) =>
			(this.settings.useDivideAndConquer = v == "Divide and Conquer");

		const optionContainer = createElement("div");
		optionContainer.classList.add(style.canvasOption);
		optionContainer.appendChild(methodOption.el);
		optionContainer.appendChild(modeOption.el);
		optionContainer.appendChild(animationOption.el);
		optionContainer.appendChild(linePathOption.el);
		this.el.appendChild(optionContainer);

		window.addEventListener("resize", this.resizeCanvas.bind(this));
		this.resizeCanvas();
	}

	clearBezier() {
		this.setBezierPath([]);
	}

	onControlPointChange() {
		if (this.controlPoints.length <= 1) {
			this.clearBezier();
			return;
		}
		const currentPainter = this.painter[this.currentPainterIndex];
		const controlPoints = this.getControlPoints();
		if (this.settings.animation)
			currentPainter.drawFirstAnimationFrame(controlPoints);
		else currentPainter.draw(controlPoints);
	}

	onControlPointFinishedChange(changed: boolean) {
		if (this.controlPoints.length <= 1) {
			this.clearBezier();
			return;
		}

		const currentPainter = this.painter[this.currentPainterIndex];
		const controlPoints = this.getControlPoints();
		if (changed && this.settings.animation)
			currentPainter.animateDraw(controlPoints);
		else currentPainter.draw(controlPoints);
	}

	resizeCanvas() {
		this.canvas.width = window.innerWidth;
		this.canvas.height = window.innerHeight;
		this.onControlPointChange();
	}

	bezierPath: Point[] = [];
	setBezierPath(path: Point[]) {
		this.bezierPath = path;
		this.redraw();
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
		this.onControlPointFinishedChange(true);
	}

	removeControlPoint(controlPoint: ControlPoint) {
		const idx = this.controlPoints.findIndex((v) => v == controlPoint);
		this.controlPoints.splice(idx, 1);
		controlPoint.detach();
		this.onControlPointFinishedChange(true);
	}

	onClick(this: Canvas, ev: MouseEvent) {
		if (this.settings.deleteMode) return;
		const { x: elX, y: elY } = this.canvas.getBoundingClientRect();
		const { x: pageX, y: pageY } = ev;
		const x = pageX - elX;
		const y = pageY - elY;
		this.createControlPoint(x, y);
	}

	getControlPoints() {
		return this.controlPoints.map((controlPoint) => controlPoint.getPosition());
	}

	clear() {
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
	}
}
