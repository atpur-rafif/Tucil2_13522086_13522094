import "./module/autoreload.ts";
import { $ } from "./module/selector.ts";

class Canvas {
	el: HTMLCanvasElement;
	ctx: CanvasRenderingContext2D;

	constructor() {
		this.el = document.createElement("canvas");
		this.el.width = 500;
		this.el.height = 500;
		this.ctx = this.el.getContext("2d") as CanvasRenderingContext2D;
	}

	drawPath(path: any) {
		this.ctx.beginPath();
		for (let i = 0; i < path.length; ++i) {
			this.ctx.lineTo(path[i][0], path[i][1]);
		}
		this.ctx.lineWidth = 2;
		this.ctx.strokeStyle = "white";
		this.ctx.stroke();
	}

	clear() {
		this.ctx.clearRect(0, 0, this.el.width, this.el.height);
	}
}

class Point {
	x: number;
	y: number;

	constructor(x: number, y: number) {
		this.x = x;
		this.y = y;
	}

	static midPoint(a: Point, b: Point): Point {
		return new Point((a.x + b.x) / 2, (a.y + b.y) / 2);
	}
}

type LazyPath = [LazyPoint, Point, LazyPoint];
class LazyPoint {
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

const randomRange = (l: number, r: number) =>
	l + Math.floor(Math.random() * (r - l));
const randomPoint = () => {
	return new Point(randomRange(0, 400), randomRange(0, 400));
};
const randomPath = (len: number) =>
	Array(len)
		.fill(null)
		.map(() => randomPoint());

function traverse(lazy: LazyPoint, depth: number, accumulator: Point[]) {
	if (depth == 0) return;
	const [left, mid, right] = lazy.get();
	traverse(left, depth - 1, accumulator);
	accumulator.push(mid);
	traverse(right, depth - 1, accumulator);
}

function bezzier(lazy: LazyPoint, depth: number): Point[] {
	const accumulator: Point[] = [];
	accumulator.push(lazy.getLeft());
	traverse(lazy, depth, accumulator);
	accumulator.push(lazy.getRight());
	return accumulator;
}

const body = $("body");
const canvas = new Canvas();
body.appendChild(canvas.el);

let i = 1;
let p = new LazyPoint(randomPath(20));
const fn = () => {
	canvas.clear();
	canvas.drawPath(bezzier(p, i).map((v) => [v.x, v.y]));
	if (++i < 8) setTimeout(fn, 300);
	else {
		i = 1;
		p = new LazyPoint(randomPath(20));
		setTimeout(fn, 500);
	}
};
fn();
