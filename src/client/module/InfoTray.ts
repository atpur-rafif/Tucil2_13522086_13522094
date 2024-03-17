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

	addInfo(id: string, msg: string): Promise<void> {
		const el = createElement("div");
		el.classList.add(style.infoItem);
		const aniEl = createElement("div");
		const txt = createElement("p", { innerText: msg });
		aniEl.appendChild(txt);
		el.appendChild(aniEl);
		this.el.appendChild(el);
		this.message[id] = { el, msg };

		let resolver: () => void;
		const promise = new Promise<void>((r) => (resolver = r));

		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				el.classList.add(style.expandInfoItem);
				el.addEventListener("transitionend", () => {
					resolver();
				});
			});
		});
		return promise;
	}

	removeInfo(id: string): Promise<void> {
		const target = this.message[id];
		if (!target) return Promise.resolve();

		let resolver: () => void;
		const promise = new Promise<void>((r) => (resolver = r));

		target.el.addEventListener("transitionend", () => {
			if (target.el.parentElement && target.el.getAnimations().length == 0) {
				this.el.removeChild(target.el);
				delete this.message[id];
				resolver();
			}
		});
		target.el.classList.remove(style.expandInfoItem);
		return promise;
	}

	clearAll() {
		return Promise.all(
			Object.keys(this.message).map((id) => this.removeInfo(id)),
		);
	}
}
