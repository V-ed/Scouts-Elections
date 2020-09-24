import LZString from 'lz-string';
import ClipboardJS from 'clipboard';
import saveAs from 'file-saver';

declare global {
	const LZString: typeof LZString;
	const ClipboardJS: typeof ClipboardJS;
	const saveAs: typeof saveAs;
	
	// V-ed's Bootstrap InputSpinner
	interface JQuery<TElement = HTMLElement> {
		inputSpinner(options?: Partial<{
			/** button text */
			decrementButton: string,
			/** button text */
			incrementButton: string,
			/** css class of the resulting input-group */
			groupClass: string,
			/** css class of the resulting text input */
			inputClass: string,
			/** css class of the resulting buttons */
			buttonsClass: string,
			buttonsWidth: string,
			textAlign: 'auto' | 'left' | 'right' | 'center',
			/** ms holding before auto value change */
			autoDelay: number,
			/** speed of auto value change */
			autoInterval: number,
			/** boost after these steps */
			boostThreshold: number,
			/** you can also set a constant number as multiplier */
			boostMultiplier: 'auto' | number,
			/** the locale for number rendering; if null, the browsers language is used */
			locale: string | null,
			/** make the text input disabled, while still allowing stepping */
			disabledInput: boolean,
			/** make the increment / decrement buttons automatically loop when reaching max / min */
			loopable: boolean,
		}>);
	}
}