import { LazyPoint, Point, bezzier } from "..";
import { createElement, styleElement } from "./util";

type ControlPointState = {
	x: number;
	y: number;
	dragged: boolean;
};

const animated = true;

export class Canvas {
	iteration: number;
	timeoutId: number;
	lazyPoint: LazyPoint;
	ctx: CanvasRenderingContext2D;

	el: HTMLDivElement;
	canvas: HTMLCanvasElement;
	animationOption: HTMLSelectElement;

	controlElements: [HTMLDivElement, ControlPointState][];
	controlPoints: Point[];

	constructor() {
		this.iteration = 0;
		this.controlElements = [];
		this.controlPoints = [];
		this.el = createElement("div");
		styleElement(this.el, {
			position: "relative",
			userSelect: "none",
			webkitUserSelect: "none",
		});
		this.canvas = createElement("canvas", {
			width: 500,
			height: 500,
		});
		this.el.appendChild(this.canvas);
		this.ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;
		this.canvas.addEventListener("click", this.onClick.bind(this));
	}

	constructBezier() {
		this.controlPoints = this.getControlPoints();
		this.lazyPoint = new LazyPoint(this.controlPoints);
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

		const el = createElement("div", {
			draggable: false,
		});
		styleElement(el, {
			width: "10px",
			height: "10px",
			backgroundColor: "black",
			position: "absolute",
			cursor: "pointer",
			left: `${x}px`,
			top: `${y}px`,
			transform: "translate(-50%,-50%)",
			borderRadius: "100%",
		});

		const state: ControlPointState = {
			x,
			y,
			dragged: false,
		};

		this.canvas.addEventListener("pointermove", (ev: MouseEvent) => {
			if (state.dragged) {
				const { x: elX, y: elY } = this.canvas.getBoundingClientRect();
				const { x: pageX, y: pageY } = ev;
				const x = pageX - elX;
				const y = pageY - elY;
				styleElement(el, {
					left: `${x}px`,
					top: `${y}px`,
				});
				state.x = x;
				state.y = y;
				this.controlPoints = this.getControlPoints();
				clearTimeout(this.timeoutId);
				if (animated) {
					this.constructBezier();
					// this.drawPath(this.controlPoints);
				} else {
					this.clear();
					this.drawPath(bezzier(new LazyPoint(this.controlPoints), 5));
				}
			}
		});

		el.addEventListener("pointerdown", () => (state.dragged = true));
		this.canvas.addEventListener("pointerup", () => {
			state.dragged = false;
			if (animated) this.constructBezier();
		});
		this.el.addEventListener("pointerup", () => {
			state.dragged = false;
			if (animated) this.constructBezier();
		});
		this.controlElements.push([el, state] as [
			HTMLDivElement,
			ControlPointState,
		]);
		this.clear();
		this.controlPoints = this.getControlPoints();
		if (animated) this.constructBezier();
		else {
			this.drawPath(bezzier(new LazyPoint(this.controlPoints), 5));
		}

		this.el.appendChild(el);
	}

	getControlPoints() {
		return this.controlElements.map(([_, { x, y }]) => {
			return new Point(x, y);
		});
	}

	clear() {
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
	}
}
