import ElectionData from "./election-data.js";
import FileLoader from "./file-loader.js";
import InputPartition from "./input-partitionner.js";
import MinimalDelayer from "./minimal-delayer.js";
import Requester from "./requester.js";
import { setup_results } from "./results.js";
import { setup_setup } from "./setup.js";
import switch_view from "./switcher.js";
import Utils from "./utilities.js";
import { setup_votes } from "./voting.js";

function setup_index() {
	
	const newElectionsButton = /** @type {HTMLButtonElement} */ (document.getElementById("home-new-button"));
	const joinElectionsButton = /** @type {HTMLButtonElement} */ (document.getElementById("home-join-button"));
	
	// Javascript enabled, enable inputs...
	
	function enableHomePageInputs() {
		newElectionsButton.disabled = false;
		const loaderFileInput = /** @type {HTMLInputElement} */ (document.getElementById("loader-file-input"));
		loaderFileInput.disabled = false;
		document.getElementById("database-loader-zone").classList.remove("loader-disabled");
	}
	
	const urlParams = new URLSearchParams(window.location.search);
		
	if (!urlParams.has("code")) {
		enableHomePageInputs();
	}
	else {
		
		// Query has shared code, show toast that it is being processed...
		
		const toastContainer = document.getElementById("home-toasts-container");
		const toastElement = toastContainer.querySelector(".toast.processing");
		
		toastContainer.classList.remove("i-am-away");
		
		$(toastElement).toast("show");
		
	}
	
	// Index script
	
	newElectionsButton.addEventListener("click", () => {
		
		if (urlParams.has("code")) {
			
			const toastErrorElement = document.getElementById("home-toasts-container").querySelector(".toast.error");
			
			$(toastErrorElement).toast("hide");
			
		}
		
		switch_view("setup-page", () => setup_setup());
	});
	
	const minimumToastDelay = urlParams.has("code") ? new MinimalDelayer(1000) : undefined;
	
	Requester.sendRequest(`${Utils.sharedElectionHostRoot}`, {
		requesterContainer: 'home-join-requester-container',
		doHideContainerOnEnd: false,
		minimumRequestDelay: 150,
	}).then(() => {
		
		Utils.isServerAccessible = true;
		
		joinElectionsButton.disabled = false;
		
		const codeElem = /** @type {HTMLButtonElement} */ (document.getElementById("fullCodeValue"));
		
		const modalButton = /** @type {HTMLButtonElement} */ (document.getElementById("home-join-election-modal-button"));
		
		const errorSpan = document.getElementById("home-join-modal-error-span");
		
		const partitionnedInputs = Array.from(/** @type {NodeListOf<HTMLInputElement>} */ (document.querySelectorAll("input[data-partition-for-id='fullCodeValue']")));
		
		codeElem.addEventListener("input", () => {
			modalButton.disabled = codeElem.value.length !== 6;
			errorSpan.hidden = true;
		});
		
		modalButton.addEventListener("click", async () => {
			
			const code = codeElem.value.toUpperCase();
			
			modalButton.disabled = true;
			partitionnedInputs.forEach(input => input.disabled = true);
			errorSpan.hidden = true;
			
			const request = Requester.sendRequest({
				url: `${Utils.sharedElectionHostRoot}/join/${code}`,
				contentType: 'application/javascript; charset=UTF-16',
			}, 'home-join-modal-requester-container');
			
			request.then(response => {
				
				const data = ElectionData.fromJSON(response.data);
				
				data.setSharedElectionCode(code);
				
				return setup_votes(data, () => {
					
					$("#home-join-election-modal").modal("hide");
					
					errorSpan.hidden = true;
					
				}, 'home-join-modal-requester-container');
				
			})
			.catch(response => {
				
				if (response.status == 400) {
					errorSpan.textContent = "Ce code n'existe pas. Veuillez réessayer!";
				}
				else {
					errorSpan.textContent = "Une erreur imprévue est survenue, veuillez réessayer!";
				}
				
				errorSpan.hidden = false;
				
			})
			.finally(() => {
				modalButton.disabled = false;
				partitionnedInputs.forEach(input => input.disabled = false);
			});
			
		});
		
		// If URL contains the query to set the code, directly open the modal to join a shared election
		
		if (urlParams.has("code")) {
			
			enableHomePageInputs();
			
			joinElectionsButton.click();
			
			// And set the content to that code
			InputPartition.setContentFor(document.getElementById("join-election-input-partition-root"), urlParams.get("code"));
			
		}
		
	}).catch(_error => {
		
		if (urlParams.has("code")) {
			
			enableHomePageInputs();
			
			// Show error toast
			const toastContainer = document.getElementById("home-toasts-container");
			const toastErrorElement = /** @type {HTMLElement} */ (toastContainer.querySelector(".toast.error"));
			
			toastErrorElement.hidden = false;
			
			$(toastErrorElement).toast("show");
			
			$(toastErrorElement).on("hidden.bs.toast", () => {
				
				toastContainer.classList.add("i-am-away");
				
				$(toastErrorElement).off("hidden.bs.toast");
				
			});
			
		}
		
	}).finally(() => {
		
		if (urlParams.has("code")) {
			
			minimumToastDelay.execute(() => {
				
				const toastContainer = document.getElementById("home-toasts-container");
				const toastElement = toastContainer.querySelector(".toast.processing");
				
				$(toastElement).toast("hide");
				
				$(toastElement).on("hidden.bs.toast", () => {
					
					$(toastElement).off("hidden.bs.toast");
					
					if (!toastContainer.querySelector(".toast.error").classList.contains("show")) {
						toastContainer.classList.add("i-am-away");
					}
					
				});
				
			});
			
		}
		
	});
	
	new FileLoader("database-loader-zone", {
		doLoadFiles: load_file,
		doHandleItemsForErrors: items => {
			const count = items.length;
			
			if (count > 1) {
				return "Veuillez ne glisser qu'un seul fichier.";
			}
			else if (items[0].type != "application/json") {
				return "Le fichier n'est pas valide : seuls les fichiers \".json\" sont acceptés.";
			}
		}
	});
	
	/**
	 * 
	 * @param {File[]} files 
	 */
	async function load_file(files) {
		
		const file = files[0];
		
		const text = await file.text();
		
		try {
			
			const data = ElectionData.fromJSON(text);
			
			route_data(data);
			
		} catch (error) {
			return error;
		}
		
	}
	
	/**
	 * 
	 * @param {ElectionData} data 
	 */
	function route_data(data) {
		
		if (urlParams.has("code")) {
			
			const toastErrorElement = document.getElementById("home-toasts-container").querySelector(".toast.error");
			
			$(toastErrorElement).toast("hide");
			
		}
		
		if (data.hasSkipped || data.numberOfVoted == data.numberOfVoters) {
			
			Utils.isDownloadDisabled = true;
			
			setup_results(data);
			
		}
		else {
			
			setup_votes(data);
			
		}
		
	}
	
	const preventDrag = /** @param {DragEvent} e */ (e) => {
		e.preventDefault();
		e.dataTransfer.effectAllowed = "none";
		e.dataTransfer.dropEffect = "none";
	};
	
	window.addEventListener("dragenter", preventDrag);
	window.addEventListener("dragover", preventDrag);
	window.addEventListener("drop", preventDrag);
	
}

const fragmentLoader = document.querySelector('include-fragment');

fragmentLoader.addEventListener('load', () => {
	Utils.init();
	
	setup_index();
});
