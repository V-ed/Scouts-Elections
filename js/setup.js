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
			<input type="text" class="form-control is-invalid is-popable" id="candidate-name-${number}" aria-describedby="candidate-name-${number}" placeholder="Nom" name="candidate-name-${number}" data-candidatenumber="${number}" required>
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
	
	var candidateData = formData.get("candidate-name-1");
	
	for(var i = 2; candidateData != null; i++){
		tempCandidates.push({name: candidateData, voteCount: 0});
		candidateData = formData.get(`candidate-name-${i}`);
	}
	
	var data = {
		dbName: formData.get("dbName"),
		numberOfVoters: formData.get("numberOfVoters"),
		numberOfVotePerVoter: formData.get("numberOfVotes"),
		candidates: tempCandidates
	};
	
	switch_view("voting-page", () => setup_voting_session(data));
	
});

// Handle data validation

var setupInputs = {};

add_input_for_verification("db-name", data => {
	return {
		isValid: data != "" && data[0] === data[0].toUpperCase(),
		reason: data == "" ? "Le nom de la base de donnée ne peut être vide." : "Le nom de la base de donnée doit commencer avec une majuscule."
	} 
});
add_input_for_verification("number-of-voters");
add_input_for_verification("number-of-votes", data => {
	
	var candidatesCount = document.querySelectorAll("input[id^='candidate-name-']").length;
	
	return {
		isValid: data > 0 && candidatesCount > data,
		reason: data === "" ? "Le nombre de vote ne peut être vide." : data > 0 ? "Le nombre de vote doit être inférieur au nombre de candidats." : "Le nombre doit être supérieur à 0."
	};
	
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
	
}

function verify_all_valid() {
	
	var isValid = true;
	
	for (const inputProperty in setupInputs) {
		if (isValid)
			isValid = setupInputs[inputProperty];
	}
	
	submitSetupButton.disabled = !isValid;
	
}

function verify_input(inputElement, customValidator) {
	
	// Check if required. If not, don't verify
	if (!inputElement.required)
		return true;
	
	var isValid = true;
	var reason = "";
	
	var inputValue = inputElement.value;
	
	if (customValidator) {
		var customResults = inputElement.type == "number" && inputValue ? customValidator(parseInt(inputValue)) : customValidator(inputValue);
		
		isValid = customResults.isValid;
		reason = customResults.reason;
		
		if(!reason){
			reason = "La donnée n'est pas valide.";
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
