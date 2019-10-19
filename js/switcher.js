function switch_view(viewId, onSwitchedHandler) {
	
	var views = document.querySelectorAll("#views > *");
	
	views.forEach(view => view.hidden = view.id != viewId);
	
	if (onSwitchedHandler) {
		onSwitchedHandler();
	}
	
}
