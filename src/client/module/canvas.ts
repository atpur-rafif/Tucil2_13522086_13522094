import { LazyPoint, Point, bezzier } from "..";
import { styleElement } from "./util";

type ControlPointState = {
	x: number;
	y: number;
	dragged: boolean;
};

export class Canvas {
	iteration: number;
	el: HTMLDivElement;
	timeoutId: number;
	lazyPoint: LazyPoint;
	canvas: HTMLCanvasElement;
	ctx: CanvasRenderingContext2D;

	controlPoints: [HTMLDivElement, ControlPointState][];

	constructor() {
		this.controlPoints = [];
		this.el = document.createElement("div");
		styleElement(this.el, {
			position: "relative",
			userSelect: "none",
			webkitUserSelect: "none",
		});
		this.canvas = document.createElement("canvas");
		this.el.appendChild(this.canvas);
		this.canvas.width = 500;
		this.canvas.height = 500;
		this.ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;
		this.canvas.addEventListener("click", this.onClick.bind(this));
		this.iteration = 0;
	}

	constructBezier() {
		const controlPoints = this.getControlPoints();
		this.lazyPoint = new LazyPoint(controlPoints);
		this.iteration = 0;

		const max = 7;
		clearTimeout(this.timeoutId);
		const fn = () => {
			this.iteration += 1;
			this.clear();
			this.drawBezier();

			if (this.iteration < max) this.timeoutId = setTimeout(fn, 300) as any;
		};

		this.clear();
		this.drawPath(controlPoints);
		this.timeoutId = setTimeout(fn, 300) as any;
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

		const el = document.createElement("div");
		el.draggable = false;
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
				el.style.left = `${x}px`;
				el.style.top = `${y}px`;
				state.x = x;
				state.y = y;
				this.constructBezier();
			}
		});

		el.addEventListener("pointerdown", () => (state.dragged = true));
		this.canvas.addEventListener("pointerup", () => (state.dragged = false));
		this.el.addEventListener("pointerup", () => (state.dragged = false));
		this.controlPoints.push([el, state] as [HTMLDivElement, ControlPointState]);
		this.constructBezier();

		this.el.appendChild(el);
	}

	getControlPoints() {
		return this.controlPoints.map(([_, { x, y }]) => {
			return new Point(x, y);
		});
	}

	clear() {
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
	}
}
