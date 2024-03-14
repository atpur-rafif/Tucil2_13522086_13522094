import { Point } from "../point";

export abstract class BezierPainter {
	updateControlPoint: (point: Point[]) => void;
	animateDraw: () => void;
	draw: () => void;
	killAnimation: () => void;
}
