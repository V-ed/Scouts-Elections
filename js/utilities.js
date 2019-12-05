// Set default variables

const isTouchDevice = "ontouchstart" in document.documentElement;

// Setup downloadable database function

let didDownloadDb = false;
let isDownloadDisabled = false;
let dbIsDirty = false;

function should_download_data() {
	if (isDownloadDisabled) {
		return false;
	}
	return dbIsDirty || !didDownloadDb;
}

function download_data(data, dbNameSuffix) {
	
	const stringData = JSON.stringify(data);
	
	dbNameSuffix = dbNameSuffix || "";
	
	const file = new File([stringData], `${data.dbName}${dbNameSuffix}.json`, {type: "application/json;charset=utf-8"});
	saveAs(file);
	
	didDownloadDb = true;
	dbIsDirty = false;
	
}

// Setup popovers

$(function () {
	$(".is-popable").popover({trigger: "manual"});
	$(".is-popable-hover").popover({trigger: "hover"});
});

// File loader initiator and utility functions

function show_loader_error($file_zone, error) {
	
	$file_zone.addClass("bg-danger");
	
	$file_zone[0].dataset.content = error;
	$file_zone[0].dataset.haderror = "";
	$file_zone.popover("show");
	
}

function clear_loader_errors($file_zone) {
	
	$file_zone.removeClass("bg-danger");
	$file_zone.popover("hide");
	if ($file_zone.attr("data-content")) {
		$file_zone.attr("data-content", "");
	}
	delete $file_zone[0].dataset.haderror;
	
}

const isAdvancedUpload = function() {
	const divElement = document.createElement("div");
	return !isTouchDevice && (("draggable" in divElement) || ("ondragstart" in divElement && "ondrop" in divElement)) && "FormData" in window && "FileReader" in window;
}();

function create_file_loader(formId, loadFilesFn, handleItemsForErrorsFn, showLoaderErrorFn, clearErrorsFn) {
	
	if (!showLoaderErrorFn) {
		showLoaderErrorFn = show_loader_error;
	}
	if (!clearErrorsFn) {
		clearErrorsFn = clear_loader_errors;
	}
	
	const $jqueryElem = $(`#${formId}`);
	
	if (isAdvancedUpload) {
		
		$jqueryElem.addClass("has-advanced-upload");
		
		$jqueryElem.on("drag dragstart dragend dragover dragenter dragleave drop", e => {
			e.preventDefault();
			e.stopPropagation();
		})
		.on("dragover dragenter", e => {
			
			if ($jqueryElem.hasClass("loader-is-dragover") || ($jqueryElem.hasClass("bg-danger") && $jqueryElem.hasClass("loader-is-dragover"))) {
				return;
			}
			
			if ($(e.relatedTarget).parents("#database-loader-zone").length) {
				return;
			}
			
			let error = undefined;
			
			const isNotFile = Array.from(e.originalEvent.dataTransfer.items).some(item => item.kind != "file");
			
			if (isNotFile) {
				error = "Seuls des fichiers sont acceptés dans cette zone.";
			}
			else {
				error = handleItemsForErrorsFn(e.originalEvent.dataTransfer.items);
			}
			
			if (error) {
				showLoaderErrorFn($jqueryElem, error);
			}
			else {
				clearErrorsFn($jqueryElem);
			}
			
			$jqueryElem.addClass("loader-is-dragover");
			
		})
		.on("dragleave dragend drop", e => {
			
			if ($(e.relatedTarget).parents(`#${formId}`).length) {
				return;
			}
			
			$jqueryElem.removeClass("loader-is-dragover");
			if (e.handleObj.type != "drop"){
				clearErrorsFn($jqueryElem);
			}
			
		})
		.on("drop", e => {
			if (!("haderror" in $jqueryElem[0].dataset)) {
				loadFilesFn(e.originalEvent.dataTransfer.files, $jqueryElem);
			}
		});
		
	}
	
	const databaseLoaderInput = $jqueryElem.find("input.loader-file")[0];
	databaseLoaderInput.addEventListener("change", e => {
		
		const error = handleItemsForErrorsFn(databaseLoaderInput.files);
		
		if (error) {
			showLoaderErrorFn($jqueryElem, error);
			databaseLoaderInput.value = "";
		}
		else {
			loadFilesFn(e.target.files, $jqueryElem);
		}
		
	});
	databaseLoaderInput.addEventListener("click", () => {
		clearErrorsFn($jqueryElem);
	});
	
}

// Load image on all elements matching under given view id

function initialize_images(viewId, imageData) {
	
	if (imageData) {
		viewImageIterator(viewId, true, imageElem => imageElem.src = imageData);
	}
	else {
		viewImageIterator(viewId, false, container => {
			container.classList.add("d-none");
			container.classList.remove("d-flex");
		});
	}
	
}

function uninitialize_images(viewId) {
	viewImageIterator(viewId, true, imageElem => imageElem.src = "");
}

function viewImageIterator(viewId, iterateOnImages, iteratorFn) {
	
	const imageContainers = document.getElementById(viewId).querySelectorAll("div.election-group-image");
	
	if (iterateOnImages) {
		
		imageContainers.forEach(container => {
			
			const imageElems = container.querySelectorAll("img");
			
			imageElems.forEach(imageElem => iteratorFn(imageElem));
			// imageElem.src = imageData
		});
		
	}
	else {
		
		imageContainers.forEach(container => iteratorFn(container));
		
		// container.classList.add("d-none");
		// container.classList.remove("d-flex");
	}
	
}

// Set bootstrap labels to not focus input on click

function set_label_non_clickable(labels) {
	
	Array.from(labels).forEach(label => {
		
		label.addEventListener("click", e => {
			e.preventDefault();
		});
		
	});
	
}

$(function () {
	set_label_non_clickable(document.querySelectorAll("label.col-form-label"));
});

// Restore current focus when changing screen orientation
// Especially useful for mobile

window.addEventListener("orientationchange", function() {
	setTimeout(() => {
		document.activeElement.scrollIntoView();
	}, 500);
});

// Workaround to fix Chrome's device orientation issue : https://github.com/V-ed/Scouts-Elections/issues/65

if (!!window.chrome) {
	
	window.addEventListener("orientationchange", function() {
		
		if (screen.orientation.angle % 180 == 0) {
			
			const bodyElem = document.querySelector("body");
			bodyElem.classList.toggle("d-flex");
			setTimeout(() => {
				bodyElem.classList.toggle("d-flex");
			}, 20);
			
		}
		
	});
	
}

// Reload if using back / forward button, therefore correctly cleaning the cache of variables
if (window.performance && window.performance.navigation.type == window.performance.navigation.TYPE_BACK_FORWARD) {
	document.location.reload(true);
}
