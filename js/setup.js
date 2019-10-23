var candidateAddButton = document.getElementById("candidate-add");
var candidateRemoveButton = document.getElementById("candidate-remove");
var candidateContainer = document.getElementById("setup-candidates");

candidateAddButton.addEventListener("click", e => {
	e.preventDefault();
	
	var number = ++candidateAddButton.dataset.candidatecount;
	
	$(candidateContainer).append(`
	<div id="candidate-controls-${number}" class="form-group row mb-2 mb-md-3">
		<label class="col-sm-2 col-form-label" for="candidate-name-${number}">Candidat ${number}</label>
		<div class="col-sm-10">
			<input type="text" class="form-control is-invalid is-popable" id="candidate-name-${number}" aria-describedby="candidate-name-${number}" placeholder="Nom" name="candidate-name-${number}" data-placement="top" data-candidatenumber="${number}" autocomplete="off" required>
		</div>
	</div>`);
	
	candidateRemoveButton.hidden = false;
	
	add_input_for_verification(`candidate-name-${number}`, validateCandidate);
	
	var newCandidateInput = document.getElementById(`candidate-name-${number}`);
	newCandidateInput.focus();
	newCandidateInput.addEventListener("keyup", setup_candidate_selector);
	newCandidateInput.addEventListener("keydown", e => {
		if (e.which === 13 || e.keyCode === 13 || e.key === "Enter") {
			e.preventDefault();
		}
	});
	
	newCandidateInput.scrollIntoView();
	
	var numberOfVoteInput = document.getElementById("number-of-votes");
	numberOfVoteInput.max = number - 1;
	triggerInputEvent(numberOfVoteInput, true);
	
});

candidateRemoveButton.addEventListener("click", e => {
	e.preventDefault();
	
	const number = candidateAddButton.dataset.candidatecount--;
	
	const input = document.getElementById(`candidate-name-${number}`);
	$(input).popover("dispose");
	document.getElementById(`candidate-controls-${number}`).remove();
	
	delete setupInputs[`candidate-name-${number}`];
	verify_all_valid();
	
	if (number == 2) {
		candidateRemoveButton.hidden = true;
	}
	
	if (input.dataset.dupevalue != null) {
		
		const otherCandidates = Array.from(document.querySelectorAll("input[id^='candidate-name-']")).filter(selectedInput => selectedInput != input);
		const candidatesToRevalidate = otherCandidates.filter(candidateInput => candidateInput.value.toLowerCase() == input.dataset.dupevalue);
		candidatesToRevalidate.forEach(candidate => triggerInputEvent(candidate));
		
	}
	
	var numberOfVoteInput = document.getElementById("number-of-votes");
	numberOfVoteInput.max = number - 2;
	triggerInputEvent(numberOfVoteInput, true);
	
});

var submitSetupButton = document.getElementById("setup-submit-button");

submitSetupButton.addEventListener("click", e => {
	e.preventDefault();
	
	var formData = new FormData(document.getElementById("setup-form"));
	
	var tempCandidates = [];
	
	document.querySelectorAll("input[id^='candidate-name-']").forEach(candidate => {
		var candidateData = formData.get(candidate.name);
		tempCandidates.push({name: candidateData, voteCount: 0, selectedState: "unselected"});
	});
	
	var data = {
		dbName: formData.get("dbName"),
		numberOfVoters: parseInt(formData.get("numberOfVoters")),
		numberOfVotePerVoter: parseInt(formData.get("numberOfVotes")),
		numberOfVoted: 0,
		hasSkipped: false,
		candidates: tempCandidates
	};
	
	switch_view("voting-page", () => setup_voting_session(data));
	
	window.removeEventListener("beforeunload", prevent_data_loss);
	
});

// Handle data validation

var validateCandidate = function (data, input) {
	
	var otherCandidates = Array.from(document.querySelectorAll("input[id^='candidate-name-']")).filter(selectedInput => selectedInput != input);
	const dupCandidates = otherCandidates.filter(candidateInput => candidateInput.value != "" && candidateInput.value.toLowerCase() == data.toLowerCase());
	
	if (dupCandidates.length > 0) {
		
		input.classList.add("is-invalid");
		input.dataset.dupevalue = data.toLowerCase();
		
		dupCandidates.filter(dupInput => !dupInput.classList.contains("is-invalid")).forEach(dupInput => triggerInputEvent(dupInput, true));
		
		return "Le nom de ce candidat est dupliqué!";
		
	}
	else if (input.dataset.dupevalue != null) {
		
		const candidatesToRevalidate = otherCandidates.filter(candidateInput => candidateInput.value.toLowerCase() == input.dataset.dupevalue);
		candidatesToRevalidate.forEach(candidate => triggerInputEvent(candidate, true));
		
		delete input.dataset.dupevalue;
		
	}
	
	if (data == "") {
		return "Le nom du candidat ne peut être vide.";
	}
	
}

var setupInputs = {};

add_input_for_verification("db-name", data => {
	
	if (data == "") {
		return "Le nom de la base de données ne peut être vide.";
	}
	
	if (data.length > 50) {
		return "Le nom de la base de données doit être inférieur ou égal à 50 caractères de longueur.";
	}
	
	if (data.endsWith(".")) {
		return "Le nom de la base de données ne peut pas terminer avec un point.";
	}
	
	var illegalCharRegex = /^[^\\/:\*\?"<>\|]+$/;
	if (!illegalCharRegex.test(data)) {
		return "Le nom de la base de données contient actuellement au moins un caractère invalide.";
	}
	
	var reservedFileRegex = /^(nul|prn|con|(lpt|com)[0-9])(\.|$)/i;
	if (reservedFileRegex.test(data)) {
		return "Le nom de la base de données ne peut pas être un nom réservé au système.";
	}
	
});
add_input_for_verification("number-of-voters", data => {
	
	if (data === "") {
		return "Le nombre de voteurs ne peut être vide.";
	}
	
	if (data < 1) {
		return "Le nombre doit être supérieur à 0.";
	}
	
});
add_input_for_verification("number-of-votes", (data, input) => {
	
	if (data === "") {
		return "Le nombre de vote ne peut être vide.";
	}
	
	if (data < 1) {
		return "Le nombre doit être supérieur à 0.";
	}
	
	var candidatesCount = document.querySelectorAll("input[id^='candidate-name-']").length;
	
	if (candidatesCount <= data) {
		return "Le nombre de vote doit être inférieur au nombre de candidats - 1.";
	}
	
});
add_input_for_verification("candidate-name-1", validateCandidate);

function add_input_for_verification(inputId, customValidator) {
	
	setupInputs[inputId] = false;
	
	var inputElement = document.getElementById(inputId);
	
	if (inputElement.type == "number") {
		
		function numberTypeOnlyPositive(e) {
			
			var hasBadChars = false;
			
			if (e.type == "paste") {
				clipboardData = e.clipboardData || window.clipboardData;
				pastedData = clipboardData.getData("Text");
				hasBadChars = !pastedData.match(/[0-9]/);
			}
			else {
			
				const isValidKeyCode = e.key.match(/[0-9]/) || e.ctrlKey || e.altKey || e.shiftKey || (e.code == "Backspace" || e.keyCode == 8) || (e.code == "Tab" || e.keyCode == 9) || e.key.includes("Arrow");
				
				if(!isValidKeyCode) {
					hasBadChars = true;
				}
				
			}
			
			if (hasBadChars) {
				e.preventDefault();
				return;
			}
			
		}
		inputElement.addEventListener("keyup", numberTypeOnlyPositive);
		inputElement.addEventListener("paste", numberTypeOnlyPositive);
		inputElement.addEventListener("keydown", numberTypeOnlyPositive);
		inputElement.addEventListener("keypress", numberTypeOnlyPositive);
		
	}
	
	inputElement.addEventListener("input", () => {
		
		setupInputs[inputId] = verify_input(inputElement, customValidator);
		
		verify_all_valid();
		
	});
	
	verify_all_valid();
	
	if (inputElement.classList.contains("is-popable")) {
		$(inputElement).popover({trigger: "manual"});
		
		triggerInputEvent(inputElement, true);
		
		inputElement.addEventListener("focus", () => $(inputElement).popover("show"));
		inputElement.addEventListener("focusout", () => $(inputElement).popover("hide"));
	}
	
}

function verify_all_valid() {
	
	var isValid = true;
	
	for (const inputProperty in setupInputs) {
		if (isValid) {
			isValid = setupInputs[inputProperty];
		}
	}
	
	submitSetupButton.disabled = !isValid;
	
}

function verify_input(inputElement, customValidator) {
	
	// Check if required. If not, don't verify
	if (!inputElement.required) {
		return true;
	}
	
	var isValid = true;
	var reason = "";
	
	var inputValue = inputElement.value;
	
	if (customValidator) {
		var customResults = inputElement.type == "number" && inputValue ? customValidator(parseInt(inputValue), inputElement) : customValidator(inputValue, inputElement);
		
		if (typeof customResults == "string") {
			isValid = false;
			reason = customResults;
		}
		else if (typeof customResults == "boolean") {
			isValid = customResults;
			reason = "La donnée n'est pas valide.";
		}
		else if (customResults) {
			
			isValid = customResults.isValid;
			reason = customResults.reason;
			
		}
		
	}
	else if (!inputValue) {
		// Value is empty
		isValid = false;
		reason = "La donnée ne peut pas être vide.";
	}
	else if (inputElement.type == "number") {
		
		var numberValue = parseInt(inputValue);
		
		isValid = numberValue > 0;
		reason = "Le nombre doit être supérieur à 0.";
		
	}
	
	if (isValid) {
		
		inputElement.classList.remove("is-invalid");
		
		inputElement.dataset.content = "";
		
		$(inputElement).popover("hide");
		
	}
	else{
		
		inputElement.classList.add("is-invalid");
		
		inputElement.dataset.content = reason;
		
		$(inputElement).popover("show");
		
	}
	
	return isValid;
	
}

function triggerInputEvent(input, isSilent) {
	
	const inputIsPopable = input.classList.contains("is-popable");
	
	if (inputIsPopable && isSilent) {
		$(input).popover("disable");
	}
	
	input.dispatchEvent(new Event("input"));
	
	if (inputIsPopable && isSilent) {
		$(input).popover("enable");
	}
	
}

// Handle reload if at least one candidate is entered

function prevent_data_loss() {
	
	var isOneCandidateIsEntered = Array.from(document.querySelectorAll("input[id^='candidate-name-']")).some(input => input.value != "");
	
	if (isOneCandidateIsEntered) {
		
		event.returnValue = "Il y au moins un candidat d'inscrit - continuer le rechargement de la page va le(s) perdre. Êtes vous sûr de vouloir continuer?";
		
	}
	
}

window.addEventListener("beforeunload", prevent_data_loss);

// Handle Enter on input fields

var setupPageTextFields = document.querySelectorAll("#setup-form input");

setupPageTextFields.forEach(input => {
	
	input.addEventListener("keydown", e => {
		
		if (e.which === 13 || e.keyCode === 13 || e.key === "Enter") {
			e.preventDefault();
		}
		
	});
	
});

function setup_candidate_selector(e) {
	
	if (e.which === 13 || e.keyCode === 13 || e.key === "Enter") {
		e.preventDefault();
		
		var inputCandidateNumber = parseInt(e.currentTarget.dataset.candidatenumber);
		
		var inputNextCandidate = document.getElementById(`candidate-name-${inputCandidateNumber + 1}`);
		
		if (inputNextCandidate == undefined) {
			
			candidateAddButton.click();
			
		}
		else {
			
			inputNextCandidate.select();
			
		}
		
	}
	
}

document.getElementById("candidate-name-1").addEventListener("keyup", setup_candidate_selector);
