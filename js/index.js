window.onbeforeunload = function(e) {
	
	// Code that executes before reload
	
};

var newElectionsButton = document.getElementById("home-new-button");

newElectionsButton.addEventListener("click", e => {
	
	switch_view("setup-page")
	
});