import css from "./selection.module.css";
import { createElement, styleElement } from "./util";
import { $ } from "./util";

export function test() {
	console.log(css.classname);
	const el = createElement("div");
	styleElement(el, {
		zIndex: "100",
	});
	el.innerHTML = "HELLo";
	el.classList.add(css.classname);
	$("body").appendChild(el);
}
