// Set default variables

const isTouchDevice = "ontouchstart" in document.documentElement;

const sharedElectionHostRoot = "https://ved.ddnsfree.com/scouts-elections/api";

let isServerAccessible = false;

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
	// Accept buttons in tooltips and Popovers
	$.fn.tooltip.Constructor.Default.whiteList.button = [];
	
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

// Initialize acceptance forms

$(function () {
	
	Array.from(document.getElementsByClassName("acceptance-form-div-accept-button")).forEach(button => {
		
		button.addEventListener("click", () => {
			
			Array.from(document.getElementsByClassName("acceptance-form-div")).forEach(div => div.hidden = true);
			Array.from(document.getElementsByClassName("accepted-server-div")).forEach(div => div.hidden = false);
			
		});
		
	});
	
});

// Merge objects

function mergeObjectTo(original, newObject, originalIsJsonString, doCloneOriginal){
	
	const objectToMerge = doCloneOriginal === false ? original : (JSON.parse(originalIsJsonString ? original : JSON.stringify(original)));
	
	for (const value in newObject) {
		objectToMerge[value] = newObject[value]
	}
	
	return objectToMerge;
	
}

// Load image on all elements matching under given view id

function initialize_images(viewId, imageData) {
	
	if (imageData) {
		const uncompressedImage = LZString.decompressFromUTF16(imageData);
		viewImageIterator(viewId, true, imageElem => imageElem.src = uncompressedImage);
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
			}, 150);
			
		}
		
	});
	
}

// Implement workable partitionned input field

const elems = document.querySelectorAll("div.row.input-partition");

elems.forEach(elem => {
	
	const inputs = elem.querySelectorAll("input");
	
	const hiddenInputValue = document.createElement("input");
	hiddenInputValue.setAttribute("type", "hidden");
	
	const hiddenInputId = elem.hasAttribute("data-hidden-input-id") ? elem.getAttribute("data-hidden-input-id") : "partitionned-input".concat(elem.id ? "-".concat(elem.id) : "");
	hiddenInputValue.setAttribute("id", hiddenInputId);
	
	elem.appendChild(hiddenInputValue);
	
	inputs.forEach(input => input.setAttribute("data-partition-for-id", hiddenInputId));
	
	function updateHiddenInputValue() {
		
		hiddenInputValue.value = Array.from(inputs).map(input => input.value).join("");
		
		hiddenInputValue.dispatchEvent(new Event("change"));
		
	}
	
	inputs.forEach(input => {
		
		// Mobile fix
		input.addEventListener("input", e => {
			
			if (e.inputType == "deleteContentBackward" || (e.inputType == "insertCompositionText" && !e.data)) {
				
				input.value = "";
				
				const prevSibling = input.previousElementSibling;
				
				if (prevSibling) {
					prevSibling.focus();
				}
				
			}
			else if (e.inputType == "insertCompositionText" || e.inputType == "insertText") {
				
				let canGoToNext = true;
				
				const inputPattern = input.getAttribute("pattern");
				
				if (inputPattern) {
					
					const charInput = e.data.length == 2 ? e.data.charAt(1) : e.data;
					const prevValue = e.data.length == 2 ? e.data.charAt(0) : "";
					
					const patternRegex = new RegExp("^".concat(inputPattern, "$"));
					
					const doReplace = input.hasAttribute("data-do-replace") && input.getAttribute("data-do-replace") == "true";
					
					if (!patternRegex.test(charInput)) {
						canGoToNext = false;
						input.value = prevValue;
					}
					
					if (canGoToNext && doReplace) {
						input.value = charInput;
					}
					
				}
				
				if (canGoToNext) {
					
					const sibling = input.nextElementSibling;
					
					if (sibling && !sibling.hasAttribute("hidden")) {
						sibling.focus();
					}
					
				}
				
			}
			
			updateHiddenInputValue();
			
		});
		
		// Actual keyboard and semi mobile behavior
		input.addEventListener("keyup", () => {
			updateHiddenInputValue();
		});
		
		input.addEventListener("keypress", e => {
			
			const inputPattern = input.getAttribute("pattern");
			
			if (inputPattern) {
				
				const charInput = e.key || String.fromCharCode(e.keyCode);
				
				const patternRegex = new RegExp("^".concat(inputPattern, "$"));
				
				const doReplace = input.hasAttribute("data-do-replace") && input.getAttribute("data-do-replace") == "true";
				
				const valueToTest = doReplace ? charInput : input.value.concat(charInput);
				
				if (!patternRegex.test(valueToTest)) {
					e.preventDefault();
					e.stopPropagation();
					return;
				}
				
				if (doReplace) {
					input.value = charInput;
					e.preventDefault();
					e.stopPropagation();
				}
				
			}
			
			const sibling = input.nextElementSibling;
			
			if (sibling) {
				sibling.focus();
			}
			
		});
		
		input.addEventListener("keydown", e => {
			
			if (e.key == "Backspace" || e.keyCode == 8) {
				
				e.preventDefault();
				e.stopPropagation();
				e.returnValue = false;
				
				let currentInput = input;
				
				do {
					
					currentInput.value = "";
					
					const prevSibling = currentInput.previousElementSibling;
					
					if (prevSibling) {
						prevSibling.focus();
					}
					
					currentInput = prevSibling;
					
				} while (e.ctrlKey && currentInput);
				
			}
			else if (e.key == "Delete" || e.keyCode == 46) {
				
				e.preventDefault();
				e.stopPropagation();
				e.returnValue = false;
				
				let currentInput = input;
				
				do {
					
					const sibling = currentInput.nextElementSibling;
					
					if (sibling && sibling.value) {
						sibling.focus();
					}
					
					currentInput = sibling;
					
					currentInput.value = "";
					
				} while (e.ctrlKey && currentInput);
				
			}
			else if ((e.key == "ArrowLeft" || e.keyCode == 37) || (e.key == "Home" || e.keyCode == 36)) {
				
				e.preventDefault();
				e.stopPropagation();
				e.returnValue = false;
				
				let currentInput = input;
				
				do {
					
					const prevSibling = currentInput.previousElementSibling;
					
					if (prevSibling) {
						prevSibling.focus();
					}
					
					currentInput = prevSibling;
					
				} while ((e.ctrlKey || (e.key == "Home" || e.keyCode == 36)) && currentInput);
				
			}
			else if ((e.key == "ArrowRight" || e.keyCode == 39) || (e.key == "End" || e.keyCode == 35)) {
				
				e.preventDefault();
				e.stopPropagation();
				e.returnValue = false;
				
				let currentInput = input;
				
				do {
					
					const sibling = currentInput.nextElementSibling;
					
					if (sibling && sibling.nextElementSibling && sibling.nextElementSibling.value) {
						sibling.focus();
					}
					
					currentInput = sibling;
					
				} while ((e.ctrlKey || (e.key == "End" || e.keyCode == 35)) && currentInput);
				
			}
			
		});
		
		input.addEventListener("focus", e => {
			
			let currentInput = input;
			let prevSibling = undefined;
			
			do {
				
				if (!currentInput.value) {
					
					prevSibling = currentInput.previousElementSibling;
					
					if (prevSibling && !prevSibling.value) {
						currentInput = prevSibling;
					}
					
				}
				
			} while (prevSibling && !prevSibling.value);
			
			if (currentInput != input) {
				currentInput.focus();
			}
			
		});
		
	});
	
});

// Send requests and handle UI spinners

function sendRequest(ajaxSettings, requesterContainer, doHideContainerOnEnd) {
	
	doHideContainerOnEnd = doHideContainerOnEnd !== false;
	
	if (typeof ajaxSettings == 'string') {
		ajaxSettings = {
			url: ajaxSettings
		};
	}
	
	if (!('type' in ajaxSettings)) {
		ajaxSettings.type = 'GET';
	}
	if (!('contentType' in ajaxSettings)) {
		ajaxSettings.contentType = 'application/json';
	}
	
	let requesterSpinners = undefined;
	let requesterSuccessIcons = undefined;
	let requesterErrorIcons = undefined;
	
	if (requesterContainer) {
		
		if (typeof requesterContainer == 'string') {
			requesterContainer = document.getElementById(requesterContainer);
		}
		
		requesterSpinners = Array.from(requesterContainer.getElementsByClassName("requester-spinner"));
		requesterSuccessIcons = Array.from(requesterContainer.getElementsByClassName("requester-success-icon"));
		requesterErrorIcons = Array.from(requesterContainer.getElementsByClassName("requester-alert-icon"));
		
		requesterSpinners.forEach(elem => elem.hidden = false);
		requesterSuccessIcons.forEach(elem => elem.hidden = true);
		requesterErrorIcons.forEach(elem => elem.hidden = true);
		
		requesterContainer.hidden = false;
		
	}
	
	let request = $.ajax(ajaxSettings);
	
	if (!requesterContainer) {
		// Return plain request since no UI container was specified
		return request;
	}
	else {
		
		// Return request with added default behaviors for handling spinners / response icons
		return request.done(() => {
			if (!doHideContainerOnEnd) {
				requesterSuccessIcons.forEach(elem => elem.hidden = false);
			}
		})
		.fail(() => {
			if (!doHideContainerOnEnd) {
				requesterErrorIcons.forEach(elem => elem.hidden = false);
			}
		})
		.always(() => {
			requesterSpinners.forEach(elem => elem.hidden = true);
			
			if (doHideContainerOnEnd) {
				requesterContainer.hidden = true;
			}
		});
		
	}
	
}

// Reload if using back / forward button, therefore correctly cleaning the cache of variables

if (window.performance && window.performance.navigation.type == window.performance.navigation.TYPE_BACK_FORWARD) {
	document.location.reload(true);
}
