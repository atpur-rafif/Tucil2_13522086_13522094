import "./module/autoreload.ts";
import { $ } from "./module/selector.ts";

type Point = [number, number];
type Path = Point[];

class Canvas {
	el: HTMLCanvasElement;
	ctx: CanvasRenderingContext2D;

	constructor() {
		this.el = document.createElement("canvas");
		this.el.width = 500;
		this.el.height = 500;
		this.ctx = this.el.getContext("2d") as CanvasRenderingContext2D;
	}

	drawPath(path: Path) {
		console.log(path.length);
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

function midPoint(a: Point, b: Point): Point {
	return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
}

function bezzier(path: Path, iter: number): Path {
	const count = path.length;
	const result: Path = [];

	function recur(p: Path, iter: number) {
		if (iter == 0) return;

		let l: Path = [];
		let r: Path = [];
		let c: Path = [...p];
		let n: Path = [];

		l.push(p[0]);
		r.push(p[count - 1]);
		for (let i = count - 1; i > 0; --i) {
			for (let j = 0; j < i; ++j) {
				let m = midPoint(c[j], c[j + 1]);
				if (j == 0) l.push(m);
				if (j == i - 1) r.push(m);
				n.push(m);
			}
			c = [...n];
			n = [];
		}
		r = r.reverse();

		recur(l, iter - 1);
		result.push(c[0]);
		recur(r, iter - 1);
	}

	result.push(path[0]);
	recur(path, iter);
	result.push(path[count - 1]);

	return result;
}

const ctrlPoint: Path = [
	[0, 0],
	[200, 200],
	[400, 0],
];

const body = $("body");
const canvas = new Canvas();
body.appendChild(canvas.el);
canvas.drawPath(bezzier(ctrlPoint, 5));
