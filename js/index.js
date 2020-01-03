const newElectionsButton = document.getElementById("home-new-button");
const joinElectionsButton = document.getElementById("home-join-button");

// Javascript enabled, enable inputs...

newElectionsButton.disabled = false;
document.getElementById("loader-file-input").disabled = false;
document.getElementById("database-loader-zone").classList.remove("loader-disabled");

// Index script

newElectionsButton.addEventListener("click", () => switch_view("setup-page", () => setup_setup()));

sendRequest(`${sharedElectionHostRoot}`, 'home-join-requester-container', false).then(() => {
	
	isServerAccessible = true;
	
	joinElectionsButton.disabled = false;
	
	const codeElem = document.getElementById("fullCodeValue");
	
	const modalButton = document.getElementById("home-join-election-modal-button");
			
	const errorSpan = document.getElementById("home-join-modal-error-span");
	
	const partitionnedInputs = Array.from(document.querySelectorAll("input[data-partition-for-id='fullCodeValue']"));
	
	codeElem.addEventListener("change", () => {
		modalButton.disabled = codeElem.value.length !== 6;
		errorSpan.hidden = true;
	});
	
	modalButton.addEventListener("click", async () => {
		
		const code = codeElem.value.toUpperCase();
		
		const ajaxSettings = {
			url: `${sharedElectionHostRoot}/join/${code}`,
			contentType: 'application/javascript; charset=UTF-16',
		};
		
		modalButton.disabled = true;
		partitionnedInputs.forEach(input => input.disabled = true);
		
		let request = sendRequest(ajaxSettings, 'home-join-modal-requester-container');
		
		request.then(response => {
			
			$("#home-join-election-modal").modal("hide");
			
			errorSpan.hidden = true;
			
			setup_votes(response.data, code);
			
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
	
}).catch(error => {});

create_file_loader("database-loader-zone", load_file, items => {
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

function load_file(files, $file_zone) {
	
	const file = files[0];
	
	file.text()
	.then(text => {
		
		const data = JSON.parse(text);
		
		const isValid = data.dbName !== undefined
			&& data.numberOfVoters !== undefined
			&& (data.numberOfVotePerVoter !== undefined || (data.numberOfVotePerVoterMin !== undefined && data.numberOfVotePerVoterMax !== undefined))
			&& data.numberOfVoted !== undefined
			&& data.hasSkipped !== undefined
			&& data.candidates !== undefined;
		
		if (isValid) {
			
			route_data(data);
			
		}
		else{
			
			show_loader_error($file_zone, "La base de données manque des informations cruciales - veuillez valider les données dans le fichier.");
			
		}
		
	})
	.catch(() => show_loader_error($file_zone, "Une erreur est survenue lors du chargement du fichier : veuillez vous assurer que le fichier JSON est conforme."));
	
}

function route_data(data) {
	
	if (data.hasSkipped || data.numberOfVoted == data.numberOfVoters) {
		
		isDownloadDisabled = true;
		
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
