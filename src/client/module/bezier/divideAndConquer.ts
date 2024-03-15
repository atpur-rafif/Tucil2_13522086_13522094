import { Canvas } from "../canvas";
import { InputNumber } from "../inputNumber";
import { Point } from "../point";
import { createElement, styleElement } from "../util";
import { BezierPainter } from "./base";

type LazyPath = [LazyPoint, Point, LazyPoint];
export class LazyPoint {
	private computed: boolean;
	control: Point[];
	result: LazyPath;

	constructor(control: Point[]) {
		this.computed = false;
		this.control = control;
	}

	getLeft() {
		return this.control[0];
	}

	getRight() {
		return this.control[this.control.length - 1];
	}

	get(): LazyPath {
		if (this.computed) return this.result;
		const count = this.control.length;

		let left: Point[] = [];
		let right: Point[] = [];
		let current: Point[] = [...this.control];
		let next: Point[] = [];

		left.push(current[0]);
		right.push(current[count - 1]);
		for (let i = count - 1; i > 0; --i) {
			for (let j = 0; j < i; ++j) {
				const mid = Point.midPoint(current[j], current[j + 1]);
				if (j == 0) left.push(mid);
				if (j == i - 1) right.push(mid);
				next.push(mid);
			}
			current = [...next];
			next = [];
		}
		right = right.reverse();

		this.computed = true;
		this.result = [new LazyPoint(left), current[0], new LazyPoint(right)];
		return this.result;
	}
}

export class BezierDnC {
	lazyPoint: LazyPoint;
	constructor(point: Point[]) {
		this.lazyPoint = new LazyPoint(point);
	}

	static traverse(lazy: LazyPoint, depth: number, accumulator: Point[]) {
		if (depth == 0) return;
		const [left, mid, right] = lazy.get();
		BezierDnC.traverse(left, depth - 1, accumulator);
		accumulator.push(mid);
		BezierDnC.traverse(right, depth - 1, accumulator);
	}

	generate(iteration: number) {
		const accumulator: Point[] = [];
		accumulator.push(this.lazyPoint.getLeft());
		BezierDnC.traverse(this.lazyPoint, iteration, accumulator);
		accumulator.push(this.lazyPoint.getRight());
		return accumulator;
	}
}

export class BezierPainterDnC implements BezierPainter {
	canvas: Canvas;
	bezier: BezierDnC;
	timerId: number;
	configEl: HTMLDivElement;
	iteration: number = 0;
	maxIteration: number = 8;

	iterationInput: InputNumber;

	constructor(canvas: Canvas) {
		this.canvas = canvas;
		this.configEl = createElement("div");

		const iterationEl = createElement("div");
		styleElement(iterationEl, {
			display: "flex",
			flexDirection: "row",
			gap: "10px",
		});

		this.iterationInput = new InputNumber("Iteration", this.iteration);
		const maxIteration = new InputNumber("Auto Max", this.maxIteration);
		this.iterationInput.onChange = (value) => {
			this.iteration = value;
			this.killAnimation();
			this.canvas.setBezierPath(this.bezier.generate(this.iteration));
		};
		maxIteration.onChange = (value) => {
			this.maxIteration = value;
		};

		iterationEl.appendChild(this.iterationInput.el);
		iterationEl.appendChild(maxIteration.el);

		this.configEl.append(iterationEl);
	}

	draw(point: Point[]) {
		this.bezier = new BezierDnC(point);
		this.canvas.setBezierPath(this.bezier.generate(this.maxIteration));
		this.iterationInput.changeDisplayValue(this.maxIteration);
	}

	animateDraw(point: Point[]) {
		this.bezier = new BezierDnC(point);

		let i = 0;
		this.killAnimation();
		const fn = () => {
			this.canvas.setBezierPath(this.bezier.generate(i));
			this.iterationInput.changeDisplayValue(i);
			++i;
			if (i <= this.maxIteration) this.timerId = setTimeout(fn, 100) as any;
		};
		fn();
	}

	drawFirstAnimationFrame(point: Point[]) {
		this.bezier = new BezierDnC(point);
		this.canvas.setBezierPath(this.bezier.generate(0));
		this.iterationInput.changeDisplayValue(0);
	}

	killAnimation() {
		clearTimeout(this.timerId);
	}
}
