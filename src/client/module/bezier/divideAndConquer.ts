import { Canvas } from "../canvas";
import { Point } from "../point";
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
	target: number = 8;
	timerId: number;

	constructor(canvas: Canvas) {
		this.canvas = canvas;
	}

	updateControlPoint(point: Point[]) {
		this.bezier = new BezierDnC(point);
	}

	draw() {
		const bezier = this.bezier.generate(this.target);
		this.canvas.setBezierPath(bezier);
	}

	animateDraw() {
		let i = 0;
		clearTimeout(this.timerId);
		const fn = () => {
			this.canvas.setBezierPath(this.bezier.generate(i));
			++i;
			if (i < this.target) this.timerId = setTimeout(fn, 100) as any;
		};
		fn();
	}

	killAnimation() {
		clearTimeout(this.timerId);
	}
}
