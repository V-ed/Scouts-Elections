import ElectionData from "./election-data.js";
import InputPartition from "./input-partitionner.js";

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
		// @ts-ignore
		$.fn.tooltip.Constructor.Default.whiteList.button = [];
		
		$(".is-popable").popover({trigger: "manual"});
		$(".is-popable-hover").popover({trigger: "hover"});
		
		// --------------------------------
		// Initialize acceptance forms
		// --------------------------------
		
		Array.from(document.getElementsByClassName("acceptance-form-div-accept-button")).forEach(button => {
			
			button.addEventListener("click", () => {
				
				// @ts-ignore
				Array.from(document.getElementsByClassName("acceptance-form-div")).forEach(div => div.hidden = true);
				// @ts-ignore
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
		
		// @ts-ignore
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
		
		this.hideSharedCodes();
		
	}
	
	// ---------------------------------------------
	// 				DATA DOWNLOAD
	// ---------------------------------------------
	
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
	 * @param {string} [dbNameSuffix] 
	 */
	download_data(data, dbNameSuffix) {
		
		const stringData = data instanceof ElectionData ? data.getAsJSON() : data;
		
		const dbName = data instanceof ElectionData ? data.dbName : JSON.parse(data).dbName;
		
		const parsedDbNameSuffix = dbNameSuffix || "";
		
		const file = new File([stringData], `${dbName}${parsedDbNameSuffix}.json`, {type: "application/json;charset=utf-8"});
		saveAs(file);
		
		this.didDownloadDb = true;
		this.dbIsDirty = false;
		
	}
	
	// ---------------------------------------------
	// 				IMAGE HANDLING
	// ---------------------------------------------
	
	/**
	 * Load image on all elements matching under given view id
	 * @param {string} viewId 
	 * @param {string} imageData 
	 */
	initialize_images(viewId, imageData) {
		
		if (imageData) {
			const uncompressedImage = LZString.decompressFromUTF16(imageData);
			this.viewImageIterator(viewId, imageElem => imageElem.src = uncompressedImage);
		}
		else {
			this.viewImageContainerIterator(viewId, container => {
				container.classList.add("d-none");
				container.classList.remove("d-flex");
			});
		}
		
	}
	
	/**
	 * 
	 * @param {string} viewId 
	 */
	uninitialize_images(viewId) {
		this.viewImageIterator(viewId, imageElem => imageElem.src = "");
	}
	
	/**
	 * 
	 * @param {string} viewId 
	 * @param {(imageElem: HTMLImageElement) => *} iteratorFn 
	 */
	viewImageIterator(viewId, iteratorFn) {
		
		const imageContainers = document.getElementById(viewId).querySelectorAll("div.election-group-image");
		
		imageContainers.forEach(container => {
			
			const imageElems = container.querySelectorAll("img");
			
			imageElems.forEach(imageElem => iteratorFn(imageElem));
			// imageElem.src = imageData
		});
		
	}
	
	/**
	 * 
	 * @param {string} viewId 
	 * @param {(container: Element) => *} iteratorFn 
	 */
	viewImageContainerIterator(viewId, iteratorFn) {
		
		const imageContainers = document.getElementById(viewId).querySelectorAll("div.election-group-image");
		
		imageContainers.forEach(container => iteratorFn(container));
		
	}
	
	// ---------------------------------------------
	// 				SHARED ELECTIONS
	// ---------------------------------------------
	
	/**
	 * 
	 */
	hideSharedCodes() {
		document.querySelectorAll(".shared-election-container").forEach(/** @param {HTMLElement} elem */ (elem) => this.handleSharedCodeHiddenStatus(elem, true));
		document.querySelectorAll(".non-shared-election-container").forEach(/** @param {HTMLElement} elem */ (elem) => this.handleSharedCodeHiddenStatus(elem, false));
	}
	
	/**
	 * 
	 * @param {string} sharedElectionCode 
	 */
	showSharedCode(sharedElectionCode) {
		document.querySelectorAll(".shared-election-code").forEach(elem => elem.textContent = sharedElectionCode);
		document.querySelectorAll(".shared-election-container").forEach(/** @param {HTMLElement} elem */ (elem) => this.handleSharedCodeHiddenStatus(elem, false));
		document.querySelectorAll(".non-shared-election-container").forEach(/** @param {HTMLElement} elem */ (elem) => this.handleSharedCodeHiddenStatus(elem, true));
	}
	
	/**
	 * 
	 * @param {HTMLElement} element
	 * @param {boolean} doHide
	 */
	handleSharedCodeHiddenStatus(element, doHide) {
		
		element.hidden = doHide;
		
		if (element.classList.contains("d-flex")) {
			element.classList.remove("d-flex");
			element.setAttribute("data-shared-did-flex", "true");
		}
		else if (element.getAttribute("data-shared-did-flex") == "true") {
			element.classList.add("d-flex");
			element.removeAttribute("data-shared-did-flex");
		}
		
	}
	
	// ---------------------------------------------
	// 				COMMON UTILITIES
	// ---------------------------------------------
	
	/**
	 * Set bootstrap labels to not focus input on click
	 * @param {HTMLLabelElement | HTMLLabelElement[] | NodeListOf<HTMLLabelElement>} labels 
	 */
	set_label_non_clickable(labels) {
		
		const labelsArray = labels instanceof NodeList ? Array.from(labels) : Array.isArray(labels) ? labels : [labels];
		
		labelsArray.forEach(label => {
			
			label.addEventListener("click", e => {
				e.preventDefault();
			});
			
		});
		
	}
	
	/**
	 * 
	 * @param {HTMLElementGetter | T} element
	 * @param {(element: T) => HTMLElement | void} [getElementOtherwise]
	 * @return {HTMLElement | void}
	 * @template T
	 */
	getHTMLElement(element, getElementOtherwise) {
		if (element instanceof HTMLElement) {
			return element;
		}
		else if (typeof element == 'string') {
			return document.getElementById(element);
		}
		else if (getElementOtherwise) {
			return getElementOtherwise(element);
		}
	}
	
}

/**
 * @typedef {string | HTMLElement} HTMLElementGetter
 */

export const Utils = new DataUtils();

export default Utils;
