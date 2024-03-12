export function $(str: string) {
	return document.querySelector(str) as HTMLElement;
}

export const styleElement = (
	el: HTMLElement,
	style: Partial<HTMLElement["style"]>,
) => {
	Object.entries(style).forEach(([k, v]) => (el.style[k as any] = v as any));
};
