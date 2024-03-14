import { createElement } from "./util";
import style from "./style.module.css";

export class StatusInfoTray {
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
		this.addInfo("p", "Test 1");
		setTimeout(() => {
			this.addInfo("q", "Ini tulisan yang sangat panjang\nTest2");
			setTimeout(() => {
				this.removeInfo("p");
				setTimeout(() => {
					this.removeInfo("q");
				}, 1000);
			}, 500);
		}, 1000);
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
			if (target.el.parentElement) this.el.removeChild(target.el);
			delete this.message[id];
		});
		target.el.classList.remove(style.expandInfoItem);
	}
}
