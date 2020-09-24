import ElectionData from "./election-data.js";
import InputPartition from "./input-partitionner.js";
import MinimalDelayer from "./minimal-delayer.js";

class DataUtils {
	
	constructor() {
		this.isAdvancedUpload = (() => {
			const divElement = document.createElement("div");
			return !this.isTouchDevice && (("draggable" in divElement) || ("ondragstart" in divElement && "ondrop" in divElement)) && "FormData" in window && "FileReader" in window;
		})();
		this.resetVars();
	}
	
	/**
	 * 
	 */
	resetVars() {
		
		// Set default variables
		
		this.isTouchDevice = "ontouchstart" in document.documentElement;
		
		this.isDev = false && window.location.hostname.includes("localhost");
		
		this.sharedElectionHostRoot = this.isDev ? "http://localhost:5678" : "https://ved.ddnsfree.com/scouts-elections/api";
		
		this.isServerAccessible = false;
		
		// Setup downloadable database function
		
		this.didDownloadDb = false;
		this.isDownloadDisabled = false;
		this.dbIsDirty = false;
		
	}
	
	/**
	 * 
	 * @param {boolean} [doPreventVarsReset] 
	 */
	init(doPreventVarsReset) {
		
		if (!doPreventVarsReset) {
			this.resetVars();
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
		
		this.set_label_non_clickable(document.querySelectorAll("label.col-form-label"));
		
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
		
		const clipboardJS = new ClipboardJS('.copy-button');
		
		clipboardJS.on('success', function(e) {
			e.clearSelection();
			
			e.trigger.setAttribute("data-content", e.trigger.getAttribute("data-popup-clip-success-msg"));
			
			$(e.trigger).popover("show");
			
			setTimeout(() => {
				$(e.trigger).popover("hide");
			}, 1000);
			
		});
		
		clipboardJS.on('error', function(e) {
			
			e.trigger.setAttribute("data-content", e.trigger.getAttribute("data-popup-clip-error-msg"));
			
			$(e.trigger).popover("show");
			
			setTimeout(() => {
				$(e.trigger).popover("hide");
			}, 2000);
			
		});
		
	}
	
	/**
	 * 
	 */
	should_download_data() {
		if (this.isDownloadDisabled) {
			return false;
		}
		return this.dbIsDirty || !this.didDownloadDb;
	}
	
	/**
	 * 
	 * @param {string | ElectionData} data 
	 * @param {*} dbNameSuffix 
	 */
	download_data(data, dbNameSuffix) {
		
		const stringData = data instanceof ElectionData ? data.getAsJSON() : data;
		
		const dbName = data instanceof ElectionData ? data.dbName : JSON.parse(data).dbName;
		
		dbNameSuffix = dbNameSuffix || "";
		
		const file = new File([stringData], `${dbName}${dbNameSuffix}.json`, {type: "application/json;charset=utf-8"});
		saveAs(file);
		
		this.didDownloadDb = true;
		this.dbIsDirty = false;
		
	}
	
	/**
	 * File loader initiator and utility functions
	 * @param {*} $file_zone 
	 * @param {*} error 
	 */
	show_loader_error($file_zone, error) {
		
		$file_zone.addClass("bg-danger");
		
		$file_zone[0].dataset.content = error;
		$file_zone[0].dataset.haderror = "";
		$file_zone.popover("show");
		
	}
	
	/**
	 * 
	 * @param {*} $file_zone 
	 */
	clear_loader_errors($file_zone) {
		
		$file_zone.removeClass("bg-danger");
		$file_zone.popover("hide");
		if ($file_zone.attr("data-content")) {
			$file_zone.attr("data-content", "");
		}
		delete $file_zone[0].dataset.haderror;
		
	}
	
	/**
	 * 
	 * @param {*} formId 
	 * @param {*} loadFilesFn 
	 * @param {*} [handleItemsForErrorsFn] 
	 * @param {*} [showLoaderErrorFn] 
	 * @param {*} [clearErrorsFn] 
	 */
	create_file_loader(formId, loadFilesFn, handleItemsForErrorsFn, showLoaderErrorFn, clearErrorsFn) {
		
		if (!showLoaderErrorFn) {
			showLoaderErrorFn = this.show_loader_error;
		}
		if (!clearErrorsFn) {
			clearErrorsFn = this.clear_loader_errors;
		}
		
		const $jqueryElem = $(`#${formId}`);
		
		if (this.isAdvancedUpload) {
			
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
	
	/**
	 * Load image on all elements matching under given view id
	 * @param {*} viewId 
	 * @param {*} imageData 
	 */
	initialize_images(viewId, imageData) {
		
		if (imageData) {
			const uncompressedImage = LZString.decompressFromUTF16(imageData);
			this.viewImageIterator(viewId, true, imageElem => imageElem.src = uncompressedImage);
		}
		else {
			this.viewImageIterator(viewId, false, container => {
				container.classList.add("d-none");
				container.classList.remove("d-flex");
			});
		}
		
	}
	
	/**
	 * 
	 * @param {*} viewId 
	 */
	uninitialize_images(viewId) {
		this.viewImageIterator(viewId, true, imageElem => imageElem.src = "");
	}
	
	viewImageIterator(viewId, iterateOnImages, iteratorFn) {
		
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
	
	/**
	 * Set bootstrap labels to not focus input on click
	 * @param {*} labels 
	 */
	set_label_non_clickable(labels) {
		
		Array.from(labels).forEach(label => {
			
			label.addEventListener("click", e => {
				e.preventDefault();
			});
			
		});
		
	}
	
	/**
	 * Send requests and handle UI spinners
	 * @param {*} ajaxSettings 
	 * @param {*} requesterContainerOptions 
	 * @param {*} [doHideContainerOnEnd] 
	 * @param {*} [minimumRequestDelay] 
	 */
	async sendRequest(ajaxSettings, requesterContainerOptions, doHideContainerOnEnd, minimumRequestDelay) {
		
		const isRequesterOptionsComplex = requesterContainerOptions.constructor == Object;
		
		let requesterContainer = isRequesterOptionsComplex ? requesterContainerOptions.container : requesterContainerOptions;
		
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
			
			if (isRequesterOptionsComplex && requesterContainerOptions.onContainerShownFunc) {
				requesterContainerOptions.onContainerShownFunc(requesterContainer);
			}
			
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
	
	/**
	 * 
	 * @param {number | string} numberOfTries 
	 * @param {*} ajaxSettings 
	 * @param {*} requesterContainerOptions 
	 * @param {boolean} [doHideContainerOnEnd] 
	 * @param {number} [minimumRequestDelay] 
	 */
	async sendRequestFor(numberOfTries, ajaxSettings, requesterContainerOptions, doHideContainerOnEnd, minimumRequestDelay) {
		
		numberOfTries = typeof numberOfTries == 'string' ? parseInt(numberOfTries) : numberOfTries;
		
		if (numberOfTries <= 0) {
			throw "The number of tries should be bigger than 0!";
		}
		
		const delayer = new MinimalDelayer(minimumRequestDelay ? minimumRequestDelay : 250);
		
		for (let attemptCount = 1; attemptCount <= numberOfTries; attemptCount++) {
			
			try {
				
				const response = await this.sendRequest(ajaxSettings, requesterContainerOptions, doHideContainerOnEnd, 0);
				
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
	
}

export const Utils = new DataUtils();

export default Utils;
