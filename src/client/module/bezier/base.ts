import { ControlPointEvent } from "../canvas";
import { Point } from "../point";

export type BenchmarkParameter = {
	strategyName: string;
	pointCount: number;
	overshoot: number;
	msTime: number;
};

export abstract class BezierPainter {
	abstract configEl: HTMLElement;
	abstract attach(): void;
	abstract detach(): void;
	abstract onControlPointEvent(event: ControlPointEvent, point: Point[]): void;
	abstract benchmark(
		controlPoints: Point[],
		targetPointCount: number,
	): Promise<BenchmarkParameter>;

	draw(_: Point[]) {
		throw Error("Draw function not attached");
	}
}
