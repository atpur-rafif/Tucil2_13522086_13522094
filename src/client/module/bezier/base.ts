import { ControlPointEvent } from "../canvas";
import { Point } from "../point";

export abstract class BezierPainter {
	abstract configEl: HTMLElement;
	abstract attach(): void;
	abstract detach(): void;
	abstract onControlPointEvent(event: ControlPointEvent, point: Point[]): void;

	draw(_: Point[]) {
		throw Error("Draw function not attached");
	}
}
