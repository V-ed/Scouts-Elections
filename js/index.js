const newElectionsButton = document.getElementById("home-new-button");

// Javascript enabled, enable inputs...

newElectionsButton.disabled = false;
document.getElementById("loader-file-input").disabled = false;
document.getElementById("database-loader-zone").classList.remove("loader-disabled");

// Index script

newElectionsButton.addEventListener("click", () => switch_view("setup-page", () => setup_setup()));

$(function () {
	$(".is-popable").popover({trigger: "manual"});
	$(".is-popable-hover").popover({trigger: "hover"});
});

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

function load_file(files, $form) {
	
	const file = files[0];
	
	if (!is_file_json(file)) {
		show_loader_error($form, "Le fichier n'est pas valide : seuls les fichiers \".json\" sont acceptés.");
		return;
	}
	
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
			
			show_loader_error($form, "La base de données manque des informations cruciales - veuillez valider les données dans le fichier.");
			
		}
		
	})
	.catch(() => show_loader_error($form, "Une erreur est survenue lors du chargement du fichier : veuillez vous assurer que le fichier JSON est conforme."));
	
}

function route_data(data) {
	
	if (data.hasSkipped || data.numberOfVoted == data.numberOfVoters) {
		
		isDownloadDisabled = true;
		
		setup_results(data);
		
	}
	else {
		
		switch_view("voting-page", () => setup_voting_session(data));
		
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
