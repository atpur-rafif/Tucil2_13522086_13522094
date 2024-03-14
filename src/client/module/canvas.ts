import { LazyPoint, Point, bezzier } from "..";
import { ControlPoint } from "./controlPoint";
import { createElement, styleElement } from "./util";
import { test } from "./selection";

test();

export class Canvas {
	iteration: number;
	timeoutId: number;
	lazyPoint: LazyPoint;
	ctx: CanvasRenderingContext2D;

	el: HTMLDivElement;
	canvas: HTMLCanvasElement;
	animationOption: HTMLSelectElement;

	controlPoints: ControlPoint[];

	constructor() {
		this.iteration = 0;
		this.controlPoints = [];
		this.el = createElement("div");
		styleElement(this.el, {
			position: "relative",
			userSelect: "none",
			webkitUserSelect: "none",
			height: "100vh",
			width: "100vw",
		});
		this.canvas = createElement("canvas");
		styleElement(this.canvas, {
			backgroundColor: "lightblue",
		});
		this.el.appendChild(this.canvas);
		this.ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;
		this.canvas.addEventListener("click", this.onClick.bind(this));

		window.addEventListener("resize", this.resizeCanvas.bind(this));
		this.resizeCanvas();
	}

	resizeCanvas() {
		this.canvas.width = window.innerWidth;
		this.canvas.height = window.innerHeight;
		if (this.controlPoints.length > 1) this.constructBezier();
	}

	constructBezier() {
		if (this.controlPoints.length <= 1) return;
		this.lazyPoint = new LazyPoint(this.getControlPoints());
		this.iteration = 3;

		const max = 7;
		clearTimeout(this.timeoutId);
		const fn = () => {
			this.iteration += 1;
			this.clear();
			this.drawBezier();

			if (this.iteration < max) this.timeoutId = setTimeout(fn, 300) as any;
		};
		fn();
	}

	drawBezier() {
		const bezier = bezzier(this.lazyPoint, this.iteration);
		this.drawPath(bezier);
	}

	drawPath(path: Point[]) {
		this.ctx.beginPath();
		for (let i = 0; i < path.length; ++i) {
			this.ctx.lineTo(path[i].x, path[i].y);
		}
		this.ctx.lineWidth = 2;
		this.ctx.strokeStyle = "black";
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
	}

	getControlPoints() {
		return this.controlPoints.map((controlPoint) => controlPoint.getPosition());
	}

	clear() {
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
	}
}
