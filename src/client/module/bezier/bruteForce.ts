import { Canvas } from "../canvas";
import { Point } from "../point";
import { BezierPainter } from "./base";
import { LazyPoint } from "./divideAndConquer";

export class Calculator {
	private isVisited: number[] = [];
	private nthfactorial: number[] = [];
	factorial(n: number) {
		if(!n) {
			return 1;
		}
		else if(this.isVisited[n]) {
			return this.nthfactorial[n];
		}
		else {
			this.isVisited[n] = 1;
			this.nthfactorial[n] = n * this.factorial(n-1);
			return this.nthfactorial[n];
		}
	}

	combination(n: number, k: number) {
		return (this.factorial(n)/(this.factorial(k) * this.factorial(n-k)));
	}
	
	bernsteinPolynomial(k: number, n: number, u: number) {
		return ((this.combination(n, k)) * (u**k) * ((1-u)**(n-k)));
	}
}
export class BezierBF {
	calc: Calculator;
	lazyPoint: LazyPoint;
	constructor(point: Point[]) {
		this.lazyPoint = new LazyPoint(point);
	}

	point(k: number, n: number, u: number) {
		const p: Point = this.lazyPoint.control[k];
		p.x *= this.calc.bernsteinPolynomial(k, n, u);
		p.y *= this.calc.bernsteinPolynomial(k, n, u)
		return p;
	}

	/*
		n = number of points
		iteration = number of iteration (precision)
		k = 0,...,n
	*/
	solver(n: number, iteration: number, lazy: LazyPoint) {
		const accumulator: Point[] = [];
		for(let k = 0; k <= n; k++) {
			for(let u = 0; u <= iteration; u++) {
				accumulator.push(this.point(k, n, u/iteration));
			}
		}
		return accumulator;
	}
}
