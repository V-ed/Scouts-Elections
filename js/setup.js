var candidateAddButton = document.getElementById("candidate-add");
var candidateRemoveButton = document.getElementById("candidate-remove");
var candidateContainer = document.getElementById("setup-candidates");

candidateAddButton.addEventListener("click", function (e) {
	e.preventDefault();
	
	var number = ++candidateAddButton.dataset.candidatecount;
	
	$(candidateContainer).append(`
	<div id="candidate-controls-${number}" class="form-group row">
		<label class="col-sm-2 col-form-label" for="candidate-name-${number}">Candidat ${number}</label>
		<div class="col-sm-10">
			<input type="text" class="form-control is-invalid is-popable" id="candidate-name-${number}" aria-describedby="candidate-name-${number}" placeholder="Nom" name="candidate-name-${number}" data-candidatenumber="${number}" autocomplete="off" required>
		</div>
	</div>`);
	
	candidateRemoveButton.hidden = false;
	
	add_input_for_verification(`candidate-name-${number}`);
	
	document.getElementById(`candidate-name-${number}`).focus();
	
	var numberOfVoteInput = document.getElementById("number-of-votes");
	numberOfVoteInput.max = number - 1;
	var forceNumberOfVotesEvent = new Event("input");
	numberOfVoteInput.dispatchEvent(forceNumberOfVotesEvent);
	
});

candidateRemoveButton.addEventListener("click", function (e) {
	e.preventDefault();
	
	var number = candidateAddButton.dataset.candidatecount--;
	
	$(document.getElementById(`candidate-name-${number}`)).popover("dispose");
	document.getElementById(`candidate-controls-${number}`).remove();
	
	delete setupInputs[`candidate-name-${number}`];
	verify_all_valid();
	
	if (number == 2) {
		candidateRemoveButton.hidden = true;
	}
	
	var numberOfVoteInput = document.getElementById("number-of-votes");
	numberOfVoteInput.max = number - 2;
	var forceNumberOfVotesEvent = new Event("input");
	numberOfVoteInput.dispatchEvent(forceNumberOfVotesEvent);
	
});

var submitSetupButton = document.getElementById("setup-submit-button");

submitSetupButton.addEventListener("click", e => {
	e.preventDefault();
	
	var formData = new FormData(document.getElementById("setup-form"));
	
	var tempCandidates = [];
	
	for(var i = 1, max = document.querySelectorAll("input[id^='candidate-name-']").length; i <= max; i++){
		var candidateData = formData.get(`candidate-name-${i}`);
		tempCandidates.push({name: candidateData, voteCount: 0});
	}
	
	var data = {
		dbName: formData.get("dbName"),
		numberOfVoters: parseInt(formData.get("numberOfVoters")),
		numberOfVotePerVoter: parseInt(formData.get("numberOfVotes")),
		numberOfVoted: 0,
		hasSkipped: false,
		candidates: tempCandidates
	};
	
	switch_view("voting-page", () => setup_voting_session(data));
	
});

// Handle data validation

var setupInputs = {};

add_input_for_verification("db-name", data => {
	
	if (data == "") {
		return "Le nom de la base de donnée ne peut être vide.";
	}
	
	if (data.length > 50) {
		return "Le nom de la base de donnée doit être inférieur ou égal à 50 caractères de longueur.";
	}
	
	if (data.endsWith(".")) {
		return "Le nom de la base de donnée ne peut pas terminer avec un point.";
	}
	
	var illegalCharRegex = /^[^\\/:\*\?"<>\|]+$/;
	if (!illegalCharRegex.test(data)) {
		return "Le nom de la base de donnée contient actuellement au moins un caractère invalide.";
	}
	
	var reservedFileRegex = /^(nul|prn|con|(lpt|com)[0-9])(\.|$)/i;
	if (reservedFileRegex.test(data)) {
		return "Le nom de la base de donnée ne peut pas être un nom réservé au système.";
	}
	
});
add_input_for_verification("number-of-voters");
add_input_for_verification("number-of-votes", data => {
	
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
add_input_for_verification("candidate-name-1");

function add_input_for_verification(inputId, customValidator) {
	
	setupInputs[inputId] = false;
	
	var inputElement = document.getElementById(inputId);
	
	inputElement.addEventListener("input", e => {
		
		setupInputs[inputId] = verify_input(inputElement, customValidator);
		
		verify_all_valid();
		
	});
	
	verify_all_valid();
	
	if (inputElement.classList.contains("is-popable")) {
		$(inputElement).popover({trigger: "manual"});
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
		var customResults = inputElement.type == "number" && inputValue ? customValidator(parseInt(inputValue)) : customValidator(inputValue);
		
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
