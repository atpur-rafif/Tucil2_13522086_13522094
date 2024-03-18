import { ControlPointEvent } from "../canvas";
import { InputNumber } from "../inputNumber";
import { Point } from "../point";
import { createElement } from "../util";
import { BenchmarkParameter, BezierPainter } from "./base";

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
	iteration: number = 100;
	controlPoints: Point[] = []
	iterationInput: InputNumber

	constructor() {
		super()
		this.configEl = createElement("div")
		this.iterationInput = new InputNumber("Iteration", this.iteration, true);
		this.iterationInput.onChange = (v) => {
			this.iteration = v
			const points = bezierBruteForce(this.controlPoints, v)
			this.draw(points)
		}
		this.configEl.append(this.iterationInput.el)
	}

	benchmark(controlPoints: Point[], targetPointCount: number): Promise<BenchmarkParameter> {
		const start = performance.now()
		const len = bezierBruteForce(controlPoints, Math.max(targetPointCount - 2, 0)).length;
		const end = performance.now()

		return Promise.resolve({
			strategyName: "Brute Force",
			msTime: end - start,
			overshoot: len - targetPointCount,
			pointCount: len
		})
	}

	getCurrentResult(): Point[] {
		return null as any
	}

	onControlPointEvent(_: ControlPointEvent, point: Point[]): void {
		if (point.length <= 0) return
		this.controlPoints = point
		this.iterationInput.changeValue(this.iteration)
	}
}
