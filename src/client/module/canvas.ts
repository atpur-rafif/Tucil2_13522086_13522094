import { LazyPoint, Point, bezzier } from "..";
import { ControlPoint } from "./controlPoint";
import { createElement } from "./util";
import style from "./style.module.css";
import { Selection } from "./options";

export class Canvas {
	iteration: number;
	timeoutId: number;
	lazyPoint: LazyPoint;
	ctx: CanvasRenderingContext2D;

	el: HTMLDivElement;
	canvas: HTMLCanvasElement;

	controlPoints: ControlPoint[];

	settings: {
		animation: boolean;
		linePath: boolean;
		useDivideAndConquer: boolean;
		deleteMode: boolean;
	} = {
		animation: true,
		linePath: false,
		useDivideAndConquer: true,
		deleteMode: false,
	};

	constructor() {
		this.iteration = 0;
		this.controlPoints = [];

		this.el = createElement("div");
		this.el.classList.add(style.canvasContainer);

		this.canvas = createElement("canvas");
		this.canvas.classList.add(style.canvas);
		this.el.appendChild(this.canvas);

		this.ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;
		this.canvas.addEventListener("click", this.onClick.bind(this));

		const animationOption = new Selection(["Off", "On"], 0, "Animation");
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

	onControlPointChange() {
		if (this.controlPoints.length <= 1) return;
		this.constructBezier();
		this.redraw();
	}

	resizeCanvas() {
		this.canvas.width = window.innerWidth;
		this.canvas.height = window.innerHeight;
		this.onControlPointChange();
	}

	constructBezier() {
		if (this.controlPoints.length <= 1) return;
		this.lazyPoint = new LazyPoint(this.getControlPoints());
		this.iteration = 0;

		const max = 7;
		clearTimeout(this.timeoutId);
		const fn = () => {
			this.iteration += 1;
			this.redraw();

			if (this.iteration < max) this.timeoutId = setTimeout(fn, 300) as any;
		};
		fn();
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

		const bezier = bezzier(this.lazyPoint, this.iteration);
		this.ctx.beginPath();
		this.ctx.setLineDash([]);
		this.ctx.lineWidth = 2;
		this.ctx.strokeStyle = "black";
		bezier.forEach(({ x, y }) => this.ctx.lineTo(x, y));
		this.ctx.stroke();
	}

	onClick(this: Canvas, ev: MouseEvent) {
		const { x: elX, y: elY } = this.canvas.getBoundingClientRect();
		const { x: pageX, y: pageY } = ev;
		const x = pageX - elX;
		const y = pageY - elY;

		const controlPoint = new ControlPoint(this);
		controlPoint.setPosition(x, y);
		controlPoint.attach();
		this.controlPoints.push(controlPoint);
		this.onControlPointChange();
	}

	getControlPoints() {
		return this.controlPoints.map((controlPoint) => controlPoint.getPosition());
	}

	clear() {
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
	}
}
