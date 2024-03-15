import { createElement } from "./util";
import style from "./style.module.css";

export class InfoTray {
	el: HTMLDivElement;
	message: Record<
		string,
		{
			el: HTMLDivElement;
			msg: string;
		}
	>;

	constructor() {
		this.el = createElement("div");
		this.el.classList.add(style.infoTray);
		this.message = {};
	}

	addInfo(id: string, msg: string) {
		const el = createElement("div");
		el.classList.add(style.infoItem);
		const aniEl = createElement("div");
		const txt = createElement("p", { innerText: msg });
		aniEl.appendChild(txt);
		el.appendChild(aniEl);
		this.el.appendChild(el);
		this.message[id] = { el, msg };

		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				el.classList.add(style.expandInfoItem);
			});
		});
	}

	removeInfo(id: string) {
		const target = this.message[id];
		if (!target) return;
		target.el.addEventListener("transitionend", () => {
			if (target.el.parentElement && target.el.getAnimations().length == 0)
				this.el.removeChild(target.el);
			delete this.message[id];
		});
		target.el.classList.remove(style.expandInfoItem);
	}
}
