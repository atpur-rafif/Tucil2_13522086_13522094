import { Canvas } from "../canvas";
import { Point } from "../point";
import { BezierPainter } from "./base";
import { LazyPoint } from "./divideAndConquer";

export class BezierBF {
	lazyPoint: LazyPoint;
	constructor(point: Point[]) {
		this.lazyPoint = new LazyPoint(point);
	}

	solver(iteration: number, lazy: LazyPoint) {
		const accumulator: Point[] = [];
		let p0 : Point = lazy.control[0];
		let p1 : Point = lazy.control[1];
		let p2 : Point = lazy.control[2];

		for(let t = 0; t < 1; t+=1/iteration) {
			let px: number = (1 - t)**2 * p0.x + 2 * t * (1 - t) * p1.x + t**2 * p2.x;
			let py: number = (1 - t)**2 * p0.y + 2 * t * (1 - t) * p1.y + t**2 * p2.y;
			const p = new Point(px, py);
			accumulator.push(p);
		}
		return accumulator;
	}
}
