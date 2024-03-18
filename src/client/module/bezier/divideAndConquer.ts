import { ControlPointEvent } from "../canvas";
import { InputNumber } from "../inputNumber";
import { Point } from "../point";
import { createElement, styleElement, waitFrame } from "../util";
import { canvas as externalCanvas } from "../..";
import { BenchmarkParameter, BezierPainter } from "./base";
import { Selection } from "../options";
import { $ } from "../util";
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

export class BezierPainterDnC extends BezierPainter {
	bezier: BezierDnC;
	timerId: number;
	configEl: HTMLDivElement;
	iteration: number = 0;
	maxIteration: number = 1;
	animateButton: HTMLElement;
	animating: boolean;
	intermediatePoint: boolean;

	iterationInput: InputNumber;

	constructor() {
		super();
		this.configEl = createElement("div");
		styleElement(this.configEl, {
			display: "flex",
			flexDirection: "column",
			gap: "0.5rem",
		});

		const iterationEl = createElement("div");
		styleElement(iterationEl, {
			display: "flex",
			flexDirection: "row",
			gap: "0.5rem",
		});

		this.iterationInput = new InputNumber("Iteration", this.iteration);
		const maxIteration = new InputNumber("Auto Max", this.maxIteration);
		this.iterationInput.onChange = (value) => {
			this.iteration = value;
			this.draw(this.bezier.generate(this.iteration));
			if (this.intermediatePoint) this.drawIntermediatePoint();
		};
		maxIteration.onChange = (value) => {
			this.maxIteration = value;
		};

		iterationEl.appendChild(this.iterationInput.el);
		iterationEl.appendChild(maxIteration.el);

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

		this.intermediatePoint = true;
		const intermediatePoint = new Selection(
			["Off", "On"],
			1,
			"Intermediate Point",
		);
		intermediatePoint.onChange = (v) => {
			this.intermediatePoint = v == "On";
			this.iterationInput.changeValue(this.iteration);
		};

		this.configEl.append(intermediatePoint.el);
		this.configEl.append(iterationEl);
		this.configEl.append(this.animateButton);
	}

	attach() { }

	detach() {
		this.killAnimation();
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
		if (point.length <= 1) {
			this.draw([]);
			return;
		}

		if (v == "redraw") {
			this.iterationInput.changeValue(this.iteration);
			return;
		}

		this.bezier = new BezierDnC(point);
		this.iterationInput.changeValue(this.maxIteration);
	}

	drawIntermediatePoint() {
		// I am sorry for this, but I don't even care anymore
		const canvas = externalCanvas
		const ctx = canvas.ctx;
		const scale = 1 / canvas.view.scale

		const tracePoints: Point[] = [];
		const intermediatePoints: Point[][][] = [];
		const traverse = (lazy: LazyPoint, depth: number) => {
			if (depth == 0) return;
			if (depth == 1) intermediatePoints.push(lazy.getIntermediatePoint());
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
		let prev: Point[] = this.bezier.generate(0);
		for (let i = 0; i <= this.maxIteration; ++i) {
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
				if (this.intermediatePoint) this.drawIntermediatePoint();
				await waitFrame();
			}
			prev = next;
		}
		this.animationHandler();
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

	killAnimation() {
		clearTimeout(this.timerId);
	}
}
