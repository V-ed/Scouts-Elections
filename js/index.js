var newElectionsButton = document.getElementById("home-new-button");

newElectionsButton.addEventListener("click", () => switch_view("setup-page"));

$(function () {
	$(".is-popable").popover({trigger: "manual"});
});

var isAdvancedUpload = function() {
	var divElement = document.createElement("div");
	return (("draggable" in divElement) || ("ondragstart" in divElement && "ondrop" in divElement)) && "FormData" in window && "FileReader" in window;
}();

var $form = $("#database-loader-zone");

if (isAdvancedUpload) {
	
	$form.addClass("has-advanced-upload");
	
	var droppedFiles = false;
	
	$form.on("drag dragstart dragend dragover dragenter dragleave drop", e => {
		e.preventDefault();
		e.stopPropagation();
	})
	.on("dragover dragenter", e => {
		
		if ($form.hasClass("bg-danger") || $form.hasClass("loader-is-dragover")) {
			return;
		}
		
		if ($(e.relatedTarget).parents("#database-loader-zone").length) {
			return;
		}
		
		$form.removeClass("bg-danger");
		
		var count = e.originalEvent.dataTransfer.items.length;
		
		var error = null;
		
		if (count > 1) {
			
			error = "Veuillez ne glisser qu'un seul fichier!";
			
		}
		else if (e.originalEvent.dataTransfer.items[0].type != "application/json") {
			
			error = "Le fichier n'est pas valide : seuls les fichiers \".json\" sont acceptés.";
			
		}
		
		if (error != null) {
			
			show_loader_error($form, error);
			
		}
		else {
			delete $form[0].dataset.haderror;
		}
		
		$form.addClass("loader-is-dragover");
		
	})
	.on("dragleave dragend drop", e => {
		
		if ($(e.relatedTarget).parents("#database-loader-zone").length) {
			return;
		}
		
		$form.removeClass("loader-is-dragover");
		if (e.handleObj.type != "drop"){
			$form.removeClass("bg-danger");
			$form.popover("hide");
			delete $form[0].dataset.haderror;
		}
		
	})
	.on("drop", e => {
		if (!("haderror" in $form[0].dataset)) {
			load_file(e.originalEvent.dataTransfer.files[0]);
		}
	});
	
}

var databaseLoaderInput = document.getElementById("loader-file-input");
databaseLoaderInput.addEventListener("change", e => load_file(e.target.files[0]));
databaseLoaderInput.addEventListener("click", () => {
	$form.removeClass("bg-danger");
	$form.popover("hide");
	delete $form[0].dataset.haderror;
});

function load_file(file) {
	
	file.text()
	.then(text => {
		
		var data = JSON.parse(text);
		
		var isValid = data.dbName !== undefined
			&& data.numberOfVoters !== undefined
			&& data.numberOfVotePerVoter !== undefined
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
		
		switch_view("pre-results-page", () => setup_pre_results_page(data));
		
	}
	else {
		
		switch_view("voting-page", () => setup_voting_session(data));
		
	}
	
}

function show_loader_error($form, error) {
	
	$form.addClass("bg-danger");
	
	$form[0].dataset.content = error;
	$form[0].dataset.haderror = "";
	$form.popover("show");
	
	$form.get(0).reset();
	
}

var preventDrag = e => {
	e.preventDefault();
	e.dataTransfer.effectAllowed = "none";
	e.dataTransfer.dropEffect = "none";
};

window.addEventListener("dragenter", preventDrag);
window.addEventListener("dragover", preventDrag);
window.addEventListener("drop", preventDrag);
