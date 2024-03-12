import { LazyPoint, Point, bezzier } from "..";

type ControlPointState = {
	x: number;
	y: number;
	dragged: boolean;
};

export class Canvas {
	el: HTMLDivElement;
	canvas: HTMLCanvasElement;
	ctx: CanvasRenderingContext2D;

	controlDiv: [HTMLDivElement, ControlPointState][];

	constructor() {
		this.controlDiv = [];
		this.el = document.createElement("div");
		this.el.style.position = "relative";
		this.el.style.userSelect = "none";
		this.el.style.webkitUserSelect = "none";
		this.canvas = document.createElement("canvas");
		this.el.appendChild(this.canvas);
		this.canvas.width = 500;
		this.canvas.height = 500;
		this.ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;
		this.canvas.addEventListener("click", this.onClick.bind(this));
	}

	drawPath(path: Point[]) {
		this.ctx.beginPath();
		for (let i = 0; i < path.length; ++i) {
			this.ctx.lineTo(path[i].x, path[i].y);
		}
		this.ctx.lineWidth = 2;
		this.ctx.strokeStyle = "white";
		this.ctx.stroke();
	}

	onClick(this: Canvas, ev: MouseEvent) {
		const { x: elX, y: elY } = this.canvas.getBoundingClientRect();
		const { x: pageX, y: pageY } = ev;
		const x = pageX - elX;
		const y = pageY - elY;

		const el = document.createElement("div");
		el.style.width = "10px";
		el.style.height = "10px";
		el.style.backgroundColor = "white";
		el.style.position = "absolute";
		el.style.cursor = "pointer";
		el.style.left = `${x}px`;
		el.style.top = `${y}px`;
		el.style.transform = "translate(-50%,-50%)";
		el.style.borderRadius = "100%";
		el.draggable = false;

		const state: ControlPointState = {
			x: 0,
			y: 0,
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
				this.clear();

				const lazyPoint = new LazyPoint(this.getControlPoint());
				const path = bezzier(lazyPoint, 5);
				this.drawPath(path);
				const line = [path[0], path[path.length - 1]];
				this.drawPath(line);
			}
		});

		el.addEventListener("pointerdown", () => (state.dragged = true));
		this.canvas.addEventListener("pointerup", () => (state.dragged = false));
		this.el.addEventListener("pointerup", () => (state.dragged = false));
		this.controlDiv.push([el, state] as [HTMLDivElement, ControlPointState]);

		this.el.appendChild(el);
	}

	getControlPoint() {
		const { x: elX, y: elY } = this.canvas.getBoundingClientRect();
		return this.controlDiv.map(([div, _]) => {
			const { x: pX, y: pY } = div.getBoundingClientRect();
			return new Point(pX - elX, pY - elY);
		});
	}

	clear() {
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
	}
}
