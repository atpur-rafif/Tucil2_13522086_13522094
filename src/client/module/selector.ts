export function $(str: string) {
	return document.querySelector(str) as HTMLElement;
}
