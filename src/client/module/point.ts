export class Point {
	x: number;
	y: number;

	constructor(x: number, y: number) {
		this.x = x;
		this.y = y;
	}

	static midPoint(a: Point, b: Point): Point {
		return Point.LERP(a, b, 0.5);
	}

	static LERP(a: Point, b: Point, t: number): Point {
		const x = a.x * (1 - t) + b.x * t;
		const y = a.y * (1 - t) + b.y * t;
		return new Point(x, y);
	}
}
