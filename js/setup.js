var candidateAddButton = document.getElementById("candidate-add");
var candidateRemoveButton = document.getElementById("candidate-remove");
var candidateContainer = document.getElementById("setup-candidates");

candidateAddButton.addEventListener("click", function (e) {
	e.preventDefault();
	
	var number = ++candidateAddButton.dataset.candidatecount;
	
	$(candidateContainer).append(`
	<div id="candidate-controls-${number}" class="form-group row">
		<label class="col-sm-2 col-form-label" for="candidate-${number}">Candidat ${number}</label>
		<div class="col-sm-10">
			<input type="text" class="form-control is-invalid" id="candidate-${number}" aria-describedby="candidate-${number}" placeholder="Nom" name="candidate-${number}" data-candidatenumber="${number}" required>
		</div>
	</div>`);
	
	candidateRemoveButton.hidden = false;
	
	add_input_for_verification(`candidate-${number}`);
	
	document.getElementById(`candidate-${number}`).focus();
	
});

candidateRemoveButton.addEventListener("click", function (e) {
	e.preventDefault();
	
	var number = candidateAddButton.dataset.candidatecount--;
	
	document.getElementById(`candidate-controls-${number}`).remove();
	
	if (number == 2) {
		candidateRemoveButton.hidden = true;
	}
	
});

var submitSetupButton = document.getElementById("setup-submit-button");

submitSetupButton.addEventListener("click", e => {
	e.preventDefault();
	
	var formData = new FormData(document.getElementById("setup-form"));
	
	var tempCandidates = [];
	
	var candidateData = formData.get("candidate-1");
	
	for(var i = 1; candidateData != null; i++){
		tempCandidates.push({name: candidateData, voteCount: 0});
		candidateData = formData.get(`candidate-${i}`);
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

add_input_for_verification("db-name", data => { return data == "LOL" });
add_input_for_verification("number-of-voters");
add_input_for_verification("number-of-votes");
add_input_for_verification("candidate-1");

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
	
	var isInvalid = false;
	
	var inputValue = inputElement.value;
	
	if (customValidator) {
		isInvalid = !customValidator(inputValue);
	}
	else if (!inputValue) {
		// Value is empty
		isInvalid = true;
	}
	else if (inputElement.type == "number") {
		
		var numberValue = parseInt(inputValue);
		
		isInvalid = numberValue <= 0;
		
	}
	
	if (isInvalid) {
		
		inputElement.classList.add("is-invalid");
		
	}
	else{
		
		inputElement.classList.remove("is-invalid");
		
	}
	
	return !isInvalid;
	
}
