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
		styleElement(this.el, {
			left: `${this.position.x}px`,
			top: `${this.position.y}px`,
		});
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

	onPointerDown = () => {
		if (this.canvas.settings.deleteMode) {
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
		const x = pageX - elX;
		const y = pageY - elY;
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
		styleElement(this.el, {
			left: `${this.position.x}px`,
			top: `${this.position.y}px`,
		});
	}

	getPosition() {
		return this.position;
	}
}
