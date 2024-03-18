export function $(str: string) {
	return document.querySelector(str) as HTMLElement;
}

export const styleElement = (
	el: HTMLElement,
	style: Partial<HTMLElement["style"]>,
) => {
	Object.entries(style || {}).forEach(
		([k, v]) => (el.style[k as any] = v as any),
	);
};

type Objectify<T extends Object> = {
	[K in keyof T]: T[K] extends string | number | boolean ? T[K] : never;
};

export function createElement<K extends keyof HTMLElementTagNameMap>(
	tagName: K,
	options?: Partial<Objectify<HTMLElementTagNameMap[K]>>,
): HTMLElementTagNameMap[K] {
	const el = document.createElement(tagName);
	Object.entries(options || {}).map(([k, v]) => {
		el[k] = v;
	});
	return el;
}

export const waitFrame = (): Promise<void> =>
	new Promise((r) => requestAnimationFrame(() => r()));
