function setup_index() {
	
	const newElectionsButton = document.getElementById("home-new-button");
	const joinElectionsButton = document.getElementById("home-join-button");
	
	// Javascript enabled, enable inputs...
	
	newElectionsButton.disabled = false;
	document.getElementById("loader-file-input").disabled = false;
	document.getElementById("database-loader-zone").classList.remove("loader-disabled");
	
	// Index script
	
	newElectionsButton.addEventListener("click", () => switch_view("setup-page", () => setup_setup()));
	
	Utils.sendRequest(`${Utils.sharedElectionHostRoot}`, 'home-join-requester-container', false, 150).then(() => {
		
		Utils.isServerAccessible = true;
		
		joinElectionsButton.disabled = false;
		
		const codeElem = document.getElementById("fullCodeValue");
		
		const modalButton = document.getElementById("home-join-election-modal-button");
		
		const errorSpan = document.getElementById("home-join-modal-error-span");
		
		const partitionnedInputs = Array.from(document.querySelectorAll("input[data-partition-for-id='fullCodeValue']"));
		
		codeElem.addEventListener("input", () => {
			modalButton.disabled = codeElem.value.length !== 6;
			errorSpan.hidden = true;
		});
		
		modalButton.addEventListener("click", async () => {
			
			const code = codeElem.value.toUpperCase();
			
			modalButton.disabled = true;
			partitionnedInputs.forEach(input => input.disabled = true);
			errorSpan.hidden = true;
			
			const ajaxSettings = {
				url: `${Utils.sharedElectionHostRoot}/join/${code}`,
				contentType: 'application/javascript; charset=UTF-16',
			};
			
			let request = Utils.sendRequest(ajaxSettings, 'home-join-modal-requester-container');
			
			request.then(response => {
				
				const data = ElectionData.fromData(response.data);
				
				return setup_votes(data, code, () => {
					
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
		
	}).catch(_error => {
		// Nothing to do here in case of errors, the sendRequest method handles it all
	});
	
	Utils.create_file_loader("database-loader-zone", load_file, items => {
		const count = items.length;
		
		if (count > 1) {
			return "Veuillez ne glisser qu'un seul fichier.";
		}
		else if (!is_file_json(items[0])) {
			return "Le fichier n'est pas valide : seuls les fichiers \".json\" sont acceptés.";
		}
	});
	
	function is_file_json(file) {
		return file.type == "application/json";
	}
	
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
	
	function route_data(data) {
		
		if (data.hasSkipped || data.numberOfVoted == data.numberOfVoters) {
			
			Utils.isDownloadDisabled = true;
			
			setup_results(data);
			
		}
		else {
			
			setup_votes(data);
			
		}
		
	}
	
	const preventDrag = e => {
		e.preventDefault();
		e.dataTransfer.effectAllowed = "none";
		e.dataTransfer.dropEffect = "none";
	};
	
	window.addEventListener("dragenter", preventDrag);
	window.addEventListener("dragover", preventDrag);
	window.addEventListener("drop", preventDrag);
	
}
