window.onbeforeunload = function(e) {
	
	// Code that executes before reload
	
};

var newElectionsButton = document.getElementById("home-new-button");

newElectionsButton.addEventListener("click", e => switch_view("setup-page"));

$(function () {
	$(".is-popable").popover({trigger: "manual"});
});

var isAdvancedUpload = function() {
	var divElement = document.createElement("div");
	return (("draggable" in divElement) || ("ondragstart" in divElement && "ondrop" in divElement)) && "FormData" in window && "FileReader" in window;
}();

var $form = $("#database-loader-zone");

if (isAdvancedUpload) {
	
	$form.addClass("has-advanced-upload");
	
	var droppedFiles = false;
	
	$form.on("drag dragstart dragend dragover dragenter dragleave drop", function(e) {
		e.preventDefault();
		e.stopPropagation();
	})
	.on("dragover dragenter", function() {
		$form.addClass("loader-is-dragover");
	})
	.on("dragleave dragend drop", function() {
		$form.removeClass("loader-is-dragover");
	})
	.on("drop", e => load_file(e.originalEvent.dataTransfer.files[0]));
	
}

var databaseLoaderInput = document.getElementById("loader-file-input");
databaseLoaderInput.addEventListener("change", e => load_file(e.target.files[0]));

function load_file(file) {
	
	file.text()
	.then(text => {
		
		var data = JSON.parse(text);
		
		switch_view("pre-results-page", () => setup_pre_results_page(data));
		
	})
	.catch(err => {
		console.log("ya dun goofed!");
	});
	
}
