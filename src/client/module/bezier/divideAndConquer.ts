import { ControlPointEvent } from "../canvas";
import { InputNumber } from "../inputNumber";
import { Point } from "../point";
import { createElement, styleElement, waitFrame } from "../util";
import { canvas as externalCanvas } from "../..";
import { BenchmarkParameter, BezierPainter } from "./base";
import { Selection } from "../options";
import style from "../style.module.css";

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

	intermediatePoint: Point[][] = [];
	getIntermediatePoint() {
		if (!this.computed) this.get();
		return this.intermediatePoint;
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
			this.intermediatePoint.push(current);
			current = [...next];
			next = [];
		}
		right = right.reverse();
		this.intermediatePoint.push([current[0]]);

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
		if (depth === 0) return;
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

export class BezierPainterDnC extends BezierPainter {
	bezier: BezierDnC;
	timerId: number;
	configEl: HTMLDivElement;
	iteration: number = 1;
	animateButton: HTMLElement;
	animating: boolean;

	intermediate: boolean = false;
	incremental: boolean = false;

	iterationInput: InputNumber;

	constructor() {
		super();
		this.configEl = createElement("div");
		styleElement(this.configEl, {
			display: "flex",
			flexDirection: "column",
			gap: "0.5rem",
		});

		this.iterationInput = new InputNumber("Iteration", this.iteration);
		this.iterationInput.onChange = (value) => {
			if (!this.bezier) return
			this.iteration = value;
			this.drawAll();
		};

		this.animating = false;
		this.animateButton = createElement("button", {
			innerText: "Animate",
		});
		styleElement(this.animateButton, {
			backgroundColor: "white",
			borderRadius: "0.3rem",
			padding: "0.5rem",
		});
		this.animateButton.addEventListener("click", this.animationHandler);

		const intermediatePoint = new Selection(
			["Off", "On"],
			0,
			"Intermediate Point",
		);
		const incremental = new Selection(
			["Off", "On"],
			0,
			"Incremental",
		);
		incremental.onChange = (v) => {
			this.incremental = v == "On";
			if (this.intermediate && this.incremental) intermediatePoint.setSelectedByName("Off")
			this.drawAll();
		};
		intermediatePoint.onChange = (v) => {
			this.intermediate = v == "On";
			if (this.intermediate && this.incremental) incremental.setSelectedByName("Off")
			this.drawAll();
		};

		this.configEl.append(intermediatePoint.el);
		this.configEl.append(incremental.el);
		this.configEl.append(this.iterationInput.el);
		this.configEl.append(this.animateButton);
	}

	drawAll() {
		this.draw(this.bezier.generate(this.iteration));
		if (this.intermediate) this.drawIntermediatePoint()
		if (this.incremental) this.incrementalGeneration();
		else clearTimeout(this.incrementalTimerId)
	}

	animationHandler = () => {
		this.animating = !this.animating;
		if (this.animating) {
			document.body.style.pointerEvents = "none";
			this.animateButton.style.pointerEvents = "auto";
			this.animateButton.innerText = "Stop";
			this.animate();
		} else {
			document.body.style.pointerEvents = "";
			this.animateButton.style.pointerEvents = "";
			this.animateButton.innerText = "Animate";
			document.body.classList.remove(style.onAnimation);
		}
	};

	onControlPointEvent(v: ControlPointEvent, point: Point[]) {
		if (v == "detach") {
			clearTimeout(this.incrementalTimerId)
			return
		}

		if (point.length <= 1) {
			this.draw([]);
			return;
		}
		if (v != "redraw") {
			this.bezier = new BezierDnC(point);
		}

		if (this.incremental && (v == "edit" || v == "start_edit")) {
			this.draw(this.bezier.generate(this.iteration));
			return;
		};

		if (v == "redraw") {
			this.draw(this.bezier.generate(this.iteration));
			if (this.intermediate) this.drawIntermediatePoint()
			if (this.incremental) this.draw(this.incrementalResult)
			return;
		}

		if (v == "end_edit" || v == "count_edit") {
			this.iterationInput.changeValue(this.iteration);
			if (this.incremental) this.incrementalGeneration();
			return
		}

		this.iterationInput.changeValue(this.iteration);
		if (this.incremental) this.incrementalGeneration();
	}

	drawIntermediatePoint() {
		// I am sorry for this, but I don't even care anymore
		const canvas = externalCanvas
		const ctx = canvas.ctx;
		const scale = 1 / canvas.view.scale

		const tracePoints: Point[] = [];
		const intermediatePoints: Point[][][] = [];
		const traverse = (lazy: LazyPoint, depth: number) => {
			if (depth === 0) return;
			if (depth === 1) intermediatePoints.push(lazy.getIntermediatePoint());
			const [left, mid, right] = lazy.get();
			traverse(left, depth - 1);
			tracePoints.push(mid);
			traverse(right, depth - 1);
		};
		traverse(this.bezier.lazyPoint, this.iteration);

		ctx.setLineDash([]);
		for (const intermediatePoint of intermediatePoints) {
			for (let i = 0; i < intermediatePoint.length; ++i) {
				if (intermediatePoint.length == 1) continue;

				const frac = 0.05 + ((i + 1) / intermediatePoint.length) * 0.95;
				ctx.strokeStyle = `rgba(0,0,0,${frac})`;
				ctx.lineWidth = 1 * scale;

				ctx.beginPath();
				for (const point of intermediatePoint[i]) {
					ctx.lineTo(point.x, point.y);
					const size = 2 * scale
					const halfSize = scale
					ctx.fillRect(point.x - halfSize, point.y - halfSize, size, size);
				}
				ctx.stroke();
			}
		}

		for (const point of tracePoints) {
			ctx.beginPath();
			ctx.arc(point.x, point.y, 3 * scale, 0, 2 * Math.PI, true);
			ctx.fill();
		}
	}

	async animate() {
		const target = this.iteration
		let prev: Point[] = this.bezier.generate(0);
		for (let i = 0; i <= target; ++i) {
			if (!this.animating) return;
			this.iterationInput.changeDisplayValue(i);
			this.iteration = i;

			const next = this.bezier.generate(i);
			const midPrev: Point[] = [];
			const now: Point[] = [];
			for (let j = 0; j < prev.length - 1; ++j) {
				now.push(prev[j]);
				now.push(Point.midPoint(prev[j], prev[j + 1]));
				midPrev.push(Point.midPoint(prev[j], prev[j + 1]));
			}
			now.push(prev[prev.length - 1]);

			const fps = 30;
			for (let j = 1; j <= fps; ++j) {
				const t = j / fps;
				for (let k = 0; k < midPrev.length; ++k) {
					const nextIdx = 1 + 2 * k;
					now[nextIdx] = Point.LERP(midPrev[k], next[nextIdx], t);
				}
				this.draw(now);
				if (this.intermediate) this.drawIntermediatePoint();
				await waitFrame();
			}
			prev = next;
		}
		this.animationHandler();
		if (this.incremental) this.incrementalGeneration();
	}

	incrementalTimerId: number;
	incrementalResult: Point[]
	incrementalGeneration() {
		if (!this.bezier) return
		clearTimeout(this.incrementalTimerId)
		const lazyPoint = this.bezier.lazyPoint
		const [left, right] = this.bezier.generate(0)

		let absoluteMaxDepth = 25;
		let maxDepth = this.iteration + 1
		const fn = () => {
			const points: Point[] = [];

			points.push(left)
			const traverse = (lazy: LazyPoint, depth: number) => {
				if (depth === 0) return;

				const [left, mid, right] = lazy.get();
				const [_l1, leftBelow, _l2] = left.get();
				const [_r1, rightBelow, _r2] = right.get();

				if (Point.manhattanDistance(leftBelow, mid) > 0.05)
					traverse(left, depth - 1)
				points.push(mid)
				if (Point.manhattanDistance(mid, rightBelow) > 0.05)
					traverse(right, depth - 1)
			}
			traverse(lazyPoint, maxDepth);
			points.push(right)

			this.incrementalResult = points
			if (lazyPoint == this.bezier.lazyPoint) {
				if (maxDepth == absoluteMaxDepth) return
				this.draw(points)
				maxDepth++
				this.incrementalTimerId = setTimeout(fn, 100) as any
			}
		}
		this.incrementalTimerId = setTimeout(fn, 100) as any;
	}

	getCurrentResult(): Point[] {
		if (!this.bezier) return [];
		return this.bezier.generate(this.iteration);
	}

	benchmark(
		controlPoints: Point[],
		targetPointCount: number,
	): Promise<BenchmarkParameter> {
		const start = performance.now();
		const bezier = new BezierDnC(controlPoints);
		let len = 0;
		let i = 0;
		while (len <= targetPointCount) {
			len = bezier.generate(i++).length;
		}
		const end = performance.now();

		return Promise.resolve({
			msTime: end - start,
			overshoot: len - targetPointCount,
			pointCount: len,
			strategyName: "Divide and Conquer",
		});
	}
}
