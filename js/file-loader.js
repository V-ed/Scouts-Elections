import Utils from "./utilities.js";

/**
 * @typedef FileLoaderOptions
 * @property {(files: File[]) => Promise<string | void> | string | void} doLoadFiles
 * @property {(items: DataTransferItem[] | File[]) => string | undefined | void} [doHandleItemsForErrors] This can be used to check the given files / items. If it returns a string, then the string is used to populate the loader's error popup.
 * @property {(error: string) => *} [showLoaderErrorFn] 
 * @property {() => *} [clearErrorsFn] 
 */

export class FileLoader {
	
	/**
	 * 
	 * @param {import("./utilities.js").HTMLElementGetter} loaderZone The form element that defines the loader
	 * @param {FileLoaderOptions} fileLoaderOptions 
	 */
	constructor(loaderZone, fileLoaderOptions) {
		
		/** @type {Required<FileLoaderOptions>} */
		const defaultOptions = {
			doLoadFiles: fileLoaderOptions.doLoadFiles,
			doHandleItemsForErrors: undefined,
			showLoaderErrorFn: this.showError.bind(this),
			clearErrorsFn: this.clearErrors.bind(this),
		};
		
		const options = {...defaultOptions, ...fileLoaderOptions};
		
		const htmlLoaderZone = Utils.getHTMLElement(loaderZone);
		
		if (!htmlLoaderZone) {
			throw 'Loader Zone element provided does not exists!';
		}
		
		this.zone = $(htmlLoaderZone);
		
		if (Utils.isAdvancedUpload) {
			
			this.zone.addClass("has-advanced-upload");
			
			this.zone.on("drag dragstart dragend dragover dragenter dragleave drop", e => {
				e.preventDefault();
				e.stopPropagation();
			})
			.on("dragover dragenter", /** @param {JQuery.DragEvent<HTMLElement, undefined, HTMLElement, HTMLElement>} e */ (e) => {
				
				if (this.zone.hasClass("loader-is-dragover") || (this.zone.hasClass("bg-danger") && this.zone.hasClass("loader-is-dragover"))) {
					return;
				}
				
				// @ts-ignore
				if ($(e.relatedTarget).parents("#database-loader-zone").length) {
					return;
				}
				
				/** @type {string | void} */
				let error = undefined;
				
				const items = Array.from(e.originalEvent.dataTransfer.items);
				
				// @ts-ignore
				const isNotFile = items.some(item => item.kind != "file");
				
				if (isNotFile) {
					error = "Seuls des fichiers sont acceptés dans cette zone.";
				}
				else if (options.doHandleItemsForErrors) {
					error = options.doHandleItemsForErrors(items);
				}
				
				if (error) {
					options.showLoaderErrorFn(error);
				}
				else {
					options.clearErrorsFn();
				}
				
				this.zone.addClass("loader-is-dragover");
				
			})
			.on("dragleave dragend drop", e => {
				
				// @ts-ignore
				if ($(e.relatedTarget).parents(`#${loaderZone}`).length) {
					return;
				}
				
				this.zone.removeClass("loader-is-dragover");
				// @ts-ignore
				if (e.handleObj.type != "drop"){
					options.clearErrorsFn();
				}
				
			})
			.on("drop", async e => {
				if (!("haderror" in this.zone.get(0).dataset)) {
					
					const result = await options.doLoadFiles(Array.from(e.originalEvent.dataTransfer.files));
					
					if (result) {
						options.showLoaderErrorFn(result);
					}
					
				}
			});
			
		}
		
		const databaseLoaderInput = /** @type {HTMLInputElement} */ (this.zone.find("input.loader-file").get(0));
		databaseLoaderInput.addEventListener("change", e => {
			
			const error = options.doHandleItemsForErrors(Array.from(databaseLoaderInput.files));
			
			if (error) {
				options.showLoaderErrorFn(error);
				databaseLoaderInput.value = "";
			}
			else {
				options.doLoadFiles(Array.from((/** @type HTMLInputElement */ (e.target)).files));
			}
			
		});
		databaseLoaderInput.addEventListener("click", () => {
			options.clearErrorsFn();
		});
		
	}
	
	/**
	 * File loader initiator and utility functions
	 * @param {string} error 
	 */
	showError(error) {
		
		this.zone.addClass("bg-danger");
		
		this.zone.get(0).dataset.content = error;
		this.zone.get(0).dataset.haderror = "";
		this.zone.popover("show");
		
	}
	
	/**
	 * 
	 */
	clearErrors() {
		
		this.zone.removeClass("bg-danger");
		this.zone.popover("hide");
		if (this.zone.attr("data-content")) {
			this.zone.attr("data-content", "");
		}
		delete this.zone.get(0).dataset.haderror;
		
	}
	
}

export default FileLoader;