import { ControlPointEvent } from "../canvas";
import { Point } from "../point";
import { createElement } from "../util";
import { BenchmarkParameter, BezierPainter } from "./base";

export class Calculator {
	private static isVisited: number[] = [];
	private static nthfactorial: number[] = [];
	static factorial(n: number) {
		if (!n) {
			return 1;
		}
		else if (Calculator.isVisited[n]) {
			return Calculator.nthfactorial[n];
		}
		else {
			Calculator.isVisited[n] = 1;
			Calculator.nthfactorial[n] = n * Calculator.factorial(n - 1);
			return Calculator.nthfactorial[n];
		}
	}

	static combination(n: number, k: number) {
		return (Calculator.factorial(n) / (Calculator.factorial(k) * Calculator.factorial(n - k)));
	}

	static bernsteinPolynomial(k: number, n: number, u: number) {
		return ((Calculator.combination(n, k)) * (u ** k) * ((1 - u) ** (n - k)));
	}
}

function bezierBruteForce(controlPoints: Point[], iteration: number) {
	const length = controlPoints.length
	const coefficient = []

	for (let i = 0; i < length; ++i) {
		const tmp = [...coefficient]
		for (let j = 1; j < i; ++j) {
			coefficient[j] = tmp[j - 1] + tmp[j]
		}
		coefficient.push(1)
	}

	const degree = length - 1
	const points: Point[] = []
	points.push(controlPoints[0])
	for (let i = 1; i <= iteration; ++i) {
		const t = i / (iteration + 1)
		let point = new Point(0, 0)
		for (let j = 0; j < coefficient.length; ++j) {
			const scale = coefficient[j] * (t ** j) * ((1 - t) ** (degree - j))
			point = Point.add(point, Point.scale(controlPoints[j], scale));
		}
		points.push(point)
	}
	points.push(controlPoints[degree])
	return points
}

export class BezierPainterBF extends BezierPainter {
	configEl: HTMLElement;

	constructor() {
		super()
		this.configEl = createElement("div")
	}

	benchmark(controlPoints: Point[], targetPointCount: number): Promise<BenchmarkParameter> {
		// const bezier = new BezierBFOld(controlPoints);

		return Promise.resolve({
			strategyName: "Brute Force",
			msTime: 0,
			overshoot: 0,
			pointCount: 0
		})
	}

	getCurrentResult(): Point[] {
		return null as any
	}

	onControlPointEvent(event: ControlPointEvent, point: Point[]): void {
		if (point.length <= 0) return
		const points = bezierBruteForce(point, 10)
		this.draw(points)
	}
}
