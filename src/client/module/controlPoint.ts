import { Point } from "./point";
import { Canvas } from "./canvas";
import { createElement, styleElement } from "./util";
import style from "./style.module.css";

export class ControlPoint {
	parent: Canvas;
	position: Point;
	dragged: boolean;
	el: HTMLDivElement;

	constructor(parent: Canvas) {
		this.parent = parent;
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
		this.parent.el.addEventListener("pointerup", this.onPointerUp);
		this.parent.el.addEventListener("pointermove", this.onPointerMove);
		this.parent.el.appendChild(this.el);
	}

	detach() {
		this.el.removeEventListener("pointerdown", this.onPointerDown);
		this.parent.el.removeEventListener("pointerup", this.onPointerUp);
		this.parent.el.removeEventListener("pointermove", this.onPointerMove);
		this.parent.el.removeChild(this.el);
	}

	onPointerDown = () => {
		this.dragged = true;
	};

	onPointerUp = () => {
		this.dragged = false;
	};

	onPointerMove = (ev: MouseEvent) => {
		if (!this.dragged) return;
		const { x: elX, y: elY } = this.parent.canvas.getBoundingClientRect();
		const { x: pageX, y: pageY } = ev;
		const x = pageX - elX;
		const y = pageY - elY;
		this.setPosition(x, y);
		this.parent.onControlPointChange();
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
