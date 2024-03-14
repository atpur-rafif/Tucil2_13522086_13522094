import { Point } from "../point";

export abstract class BezierPainter {
	drawFirstAnimationFrame: (controlPoint: Point[]) => void;
	animateDraw: (controlPoint: Point[]) => void;
	draw: (controlPoint: Point[]) => void;
	killAnimation: () => void;
}
