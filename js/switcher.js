/**
 * 
 * @param {string} viewId 
 * @param {() => *} onSwitchedHandler 
 */
export function switch_view(viewId, onSwitchedHandler) {
	
	const views = /** @type {NodeListOf<HTMLElement>} */ (document.querySelectorAll("#views > *"));
	
	views.forEach(view => view.hidden = view.id != viewId);
	
	document.body.scrollTop = document.documentElement.scrollTop = 0;
	
	if (onSwitchedHandler) {
		onSwitchedHandler();
	}
	
}

export default switch_view;
