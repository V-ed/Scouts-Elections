const Utils = {};

Utils.resetVars = function() {
	
	// Set default variables
	
	Utils.isTouchDevice = "ontouchstart" in document.documentElement;
	
	Utils.isDev = false && window.location.hostname.includes("localhost");
	
	Utils.sharedElectionHostRoot = Utils.isDev ? "http://localhost:5678" : "https://ved.ddnsfree.com/scouts-elections/api";
	
	Utils.isServerAccessible = false;
	
	// Setup downloadable database function
	
	Utils.didDownloadDb = false;
	Utils.isDownloadDisabled = false;
	Utils.dbIsDirty = false;
	
}

Utils.resetVars();

Utils.init = function(doPreventVarsReset) {
	
	if (!doPreventVarsReset) {
		Utils.resetVars();
	}
	
	// --------------------------------
	// Setup popovers
	// --------------------------------
	
	// Accept buttons in tooltips and Popovers
	$.fn.tooltip.Constructor.Default.whiteList.button = [];
	
	$(".is-popable").popover({trigger: "manual"});
	$(".is-popable-hover").popover({trigger: "hover"});
	
	// --------------------------------
	// Initialize acceptance forms
	// --------------------------------
	
	Array.from(document.getElementsByClassName("acceptance-form-div-accept-button")).forEach(button => {
		
		button.addEventListener("click", () => {
			
			Array.from(document.getElementsByClassName("acceptance-form-div")).forEach(div => div.hidden = true);
			Array.from(document.getElementsByClassName("accepted-server-div")).forEach(div => div.hidden = false);
			
		});
		
	});
	
	// --------------------------------
	// Miscellaneous
	// --------------------------------
	
	Utils.set_label_non_clickable(document.querySelectorAll("label.col-form-label"));
	
	InputPartition.init(document.querySelectorAll("div.row.input-partition"));
	
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
	
	// Reload if using back / forward button, therefore correctly cleaning the cache of variables

	if (window.performance && window.performance.navigation.type == window.performance.navigation.TYPE_BACK_FORWARD) {
		document.location.reload(true);
	}
	
}

Utils.should_download_data = function() {
	if (Utils.isDownloadDisabled) {
		return false;
	}
	return Utils.dbIsDirty || !Utils.didDownloadDb;
}

Utils.download_data = function(data, dbNameSuffix) {
	
	let stringData = data;
	
	if (data instanceof ElectionData) {
		stringData = data.getAsJSON();
	}
	
	dbNameSuffix = dbNameSuffix || "";
	
	const file = new File([stringData], `${data.dbName}${dbNameSuffix}.json`, {type: "application/json;charset=utf-8"});
	saveAs(file);
	
	Utils.didDownloadDb = true;
	Utils.dbIsDirty = false;
	
}

// File loader initiator and utility functions

Utils.show_loader_error = function($file_zone, error) {
	
	$file_zone.addClass("bg-danger");
	
	$file_zone[0].dataset.content = error;
	$file_zone[0].dataset.haderror = "";
	$file_zone.popover("show");
	
}

Utils.clear_loader_errors = function($file_zone) {
	
	$file_zone.removeClass("bg-danger");
	$file_zone.popover("hide");
	if ($file_zone.attr("data-content")) {
		$file_zone.attr("data-content", "");
	}
	delete $file_zone[0].dataset.haderror;
	
}

Utils.isAdvancedUpload = function() {
	const divElement = document.createElement("div");
	return !Utils.isTouchDevice && (("draggable" in divElement) || ("ondragstart" in divElement && "ondrop" in divElement)) && "FormData" in window && "FileReader" in window;
}();

Utils.create_file_loader = function(formId, loadFilesFn, handleItemsForErrorsFn, showLoaderErrorFn, clearErrorsFn) {
	
	if (!showLoaderErrorFn) {
		showLoaderErrorFn = Utils.show_loader_error;
	}
	if (!clearErrorsFn) {
		clearErrorsFn = Utils.clear_loader_errors;
	}
	
	const $jqueryElem = $(`#${formId}`);
	
	if (Utils.isAdvancedUpload) {
		
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
		.on("drop", async e => {
			if (!("haderror" in $jqueryElem[0].dataset)) {
				
				const result = await loadFilesFn(e.originalEvent.dataTransfer.files, $jqueryElem);
				
				if (result) {
					showLoaderErrorFn($jqueryElem, result);
				}
				
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

// Merge objects

Utils.mergeObjectTo = function(original, newObject, originalIsJsonString, doCloneOriginal){
	
	const objectToMerge = doCloneOriginal === false ? original : (JSON.parse(originalIsJsonString ? original : JSON.stringify(original)));
	
	for (const value in newObject) {
		objectToMerge[value] = newObject[value]
	}
	
	return objectToMerge;
	
}

// Load image on all elements matching under given view id

Utils.initialize_images = function(viewId, imageData) {
	
	if (imageData) {
		const uncompressedImage = LZString.decompressFromUTF16(imageData);
		Utils.viewImageIterator(viewId, true, imageElem => imageElem.src = uncompressedImage);
	}
	else {
		Utils.viewImageIterator(viewId, false, container => {
			container.classList.add("d-none");
			container.classList.remove("d-flex");
		});
	}
	
}

Utils.uninitialize_images = function(viewId) {
	Utils.viewImageIterator(viewId, true, imageElem => imageElem.src = "");
}

Utils.viewImageIterator = function(viewId, iterateOnImages, iteratorFn) {
	
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

Utils.set_label_non_clickable = function(labels) {
	
	Array.from(labels).forEach(label => {
		
		label.addEventListener("click", e => {
			e.preventDefault();
		});
		
	});
	
}

// Send requests and handle UI spinners

Utils.sendRequest = async function(ajaxSettings, requesterContainer, doHideContainerOnEnd, minimumRequestDelay) {
	
	const delayer = new MinimalDelayer(minimumRequestDelay ? minimumRequestDelay : 250);
	
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
	
	let request = new Promise(function (resolve, reject) {
		
		$.ajax(ajaxSettings).done(function() {
			
			delayer.execute(() => resolve.apply(null, arguments));
			
		}).fail(function() {
			
			delayer.execute(() => reject.apply(null, arguments));
			
		});
		
	});
	
	if (!requesterContainer) {
		// Return plain request since no UI container was specified
		return request;
	}
	else {
		
		// Return request with added default behaviors for handling spinners / response icons
		return request.then(response => {
			if (!doHideContainerOnEnd) {
				requesterSuccessIcons.forEach(elem => elem.hidden = false);
			}
			
			return Promise.resolve(response);
		})
		.catch(error => {
			if (!doHideContainerOnEnd) {
				requesterErrorIcons.forEach(elem => elem.hidden = false);
			}
			
			return Promise.reject(error);
		})
		.finally(() => {
			requesterSpinners.forEach(elem => elem.hidden = true);
			
			if (doHideContainerOnEnd) {
				requesterContainer.hidden = true;
			}
		});
		
	}
	
}

Utils.sendRequestFor = async function(numberOfTries, ajaxSettings, requesterContainer, doHideContainerOnEnd, minimumRequestDelay) {
	
	numberOfTries = parseInt(numberOfTries);
	
	if (numberOfTries <= 0) {
		throw "The number of tries should be bigger than 0!";
	}
	
	const delayer = new MinimalDelayer(minimumRequestDelay ? minimumRequestDelay : 250);
	
	for (let attemptCount = 1; attemptCount <= numberOfTries; attemptCount++) {
		
		try {
			
			const response = await Util.sendRequest(ajaxSettings, requesterContainer, doHideContainerOnEnd, 0);
			
			await delayer.wait();
			
			return response;
			
		}
		catch (error) {
			
			// If the attempt count is full or the request was successfull but the server returned an error, stop trying
			if (attemptCount == numberOfTries || error.readyState == 4) {
				throw error;
			}
			
		}
		
	}
	
	throw "Wait a second... how did you even get here? My method is flawed...";
	
}
