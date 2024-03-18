import { Point } from "./point";
import { Canvas } from "./canvas";
import { createElement, styleElement } from "./util";
import style from "./style.module.css";

export class ControlPoint {
	canvas: Canvas;
	position: Point;
	dragged: boolean;
	el: HTMLDivElement;

	constructor(parent: Canvas) {
		this.canvas = parent;
		this.dragged = false;
		this.position = new Point(0, 0);

		this.el = createElement("div", { draggable: false });
		this.el.classList.add(style.controlPoint);
	}

	attach() {
		this.el.addEventListener("pointerdown", this.onPointerDown);
		this.canvas.el.addEventListener("pointerup", this.onPointerUp);
		this.canvas.el.addEventListener("pointermove", this.onPointerMove);
		this.canvas.controlPointsContainer.appendChild(this.el);
	}

	detach() {
		this.el.removeEventListener("pointerdown", this.onPointerDown);
		this.canvas.el.removeEventListener("pointerup", this.onPointerUp);
		this.canvas.el.removeEventListener("pointermove", this.onPointerMove);
		this.canvas.controlPointsContainer.removeChild(this.el);
	}

	onPointerDown = (e: MouseEvent) => {
		if (e.buttons != 1) return
		if (!this.canvas.settings.moveMode) {
			this.canvas.removeControlPoint(this);
			return;
		}
		this.dragged = true;
		this.canvas.dispatchControlPointEvent("start_edit");
	};

	onPointerMove = (ev: MouseEvent) => {
		if (!this.dragged) return;
		const { x: elX, y: elY } = this.canvas.canvas.getBoundingClientRect();
		const { x: pageX, y: pageY } = ev;
		const { x: offsetX, y: offsetY, scale } = this.canvas.view;
		const x = (pageX - elX - offsetX) / scale;
		const y = (pageY - elY - offsetY) / scale;
		this.setPosition(x, y);
		this.canvas.dispatchControlPointEvent("edit");
	};

	onPointerUp = () => {
		if (!this.dragged) return;
		this.dragged = false;
		this.canvas.dispatchControlPointEvent("end_edit");
	};

	setPosition(x: number, y: number) {
		this.position.x = x;
		this.position.y = y;
		const { x: offsetX, y: offsetY, scale } = this.canvas.view;
		const dimension = 10
		styleElement(this.el, {
			width: `${dimension}px`,
			height: `${dimension}px`,
			left: `${(x * scale) + offsetX}px`,
			top: `${(y * scale) + offsetY}px`,
		});
	}

	getPosition() {
		return this.position;
	}
}



