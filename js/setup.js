let setupInputs = {};
let textFieldHadFocus = undefined;

function setup_setup() {
	
	const pswVisibilityToggler = document.getElementById("password-visible");
	const pswField = document.getElementById("db-psw");
	
	pswVisibilityToggler.addEventListener("click", () => pswField.type = pswField.type == "password" ? "text" : "password");
	
	const candidateAddButton = document.getElementById("candidate-add");
	const candidateRemoveButton = document.getElementById("candidate-remove");
	const candidateContainer = document.getElementById("setup-candidates");
	
	candidateAddButton.addEventListener("click", e => {
		e.preventDefault();
		
		const number = ++candidateAddButton.dataset.candidatecount;
		
		$(candidateContainer).append(`
			<div id="candidate-controls-${number}" class="form-group row mb-2 mb-md-3">
				<label class="col-sm-3 col-md-2 col-form-label" for="candidate-name-${number}">Candidat ${number}</label>
				<div class="col-sm-9 col-md-10">
					<input type="text" class="form-control is-invalid is-popable" id="candidate-name-${number}" aria-describedby="candidate-name-${number}" placeholder="Nom" name="candidate-name-${number}" data-placement="top" data-candidatenumber="${number}" autocomplete="off" required>
				</div>
			</div>`);
		
		candidateRemoveButton.disabled = false;
		
		add_input_for_verification(`candidate-name-${number}`, validateCandidate);
		
		const newCandidateInput = document.getElementById(`candidate-name-${number}`);
		newCandidateInput.focus();
		newCandidateInput.addEventListener("keyup", setup_candidate_selector);
		newCandidateInput.addEventListener("keydown", e => {
			if (e.which === 13 || e.keyCode === 13 || e.key === "Enter") {
				e.preventDefault();
			}
		});
		
		newCandidateInput.scrollIntoView();
		
		const numberOfVoteInput = document.getElementById("number-of-votes-maximum");
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
			candidateRemoveButton.disabled = true;
		}
		
		if (input.dataset.dupevalue != null) {
			
			const otherCandidates = Array.from(document.querySelectorAll("input[id^='candidate-name-']")).filter(selectedInput => selectedInput != input);
			const candidatesToRevalidate = otherCandidates.filter(candidateInput => candidateInput.value.toLowerCase() == input.dataset.dupevalue);
			candidatesToRevalidate.forEach(candidate => triggerInputEvent(candidate));
			
		}
		
		const numberOfVoteInput = document.getElementById("number-of-votes-maximum");
		numberOfVoteInput.max = number - 2;
		triggerInputEvent(numberOfVoteInput, true);
		
		if (textFieldHadFocus) {
			document.getElementById(`candidate-name-${number - 1}`).focus();
		}
		
	});
	
	const submitSetupButton = document.getElementById("setup-submit-button");
	
	submitSetupButton.addEventListener("click", e => {
		e.preventDefault();
		
		const formData = new FormData(document.getElementById("setup-form"));
		
		let tempCandidates = [];
		
		document.querySelectorAll("input[id^='candidate-name-']").forEach(candidate => {
			const candidateData = formData.get(candidate.name);
			tempCandidates.push({ name: candidateData, voteCount: 0, selectedState: "unselected" });
		});
		
		let data = {
			dbName: formData.get("dbName"),
			dbPsw: formData.get("dbPsw"),
			numberOfVoters: parseInt(formData.get("numberOfVoters")),
			numberOfVotePerVoterMin: parseInt(formData.get("numberOfVotesMin")),
			numberOfVotePerVoterMax: parseInt(formData.get("numberOfVotesMax")),
			allowMultipleSameCandidate: formData.get("allowMultipleSameCandidate") == "on",
			numberOfVoted: 0,
			hasSkipped: false,
			candidates: tempCandidates
		};
		
		isDownloadDisabled = formData.get("autoDownloadDb") != "on";
		
		switch_view("pre-voting-page", () => setup_pre_voting_session(data));
		
		window.removeEventListener("beforeunload", prevent_data_loss);
		
	});
	
	const inputs = document.querySelectorAll("div#setup-page input.spinner[type='number']");
	
	$(inputs).inputSpinner({inputClass: "font-weight-bold", buttonsClass: "btn-secondary"});
	
	// Handle data validation
	
	const validateCandidate = function (data, input) {
		
		const dataTrimmed = data.trim();
		
		const otherCandidates = Array.from(document.querySelectorAll("input[id^='candidate-name-']")).filter(selectedInput => selectedInput != input);
		const dupCandidates = otherCandidates.filter(candidateInput => candidateInput.value != "" && candidateInput.value.toLowerCase() == dataTrimmed.toLowerCase());
		
		if (dupCandidates.length > 0) {
			
			input.classList.add("is-invalid");
			input.dataset.dupevalue = dataTrimmed.toLowerCase();
			
			dupCandidates.filter(dupInput => !dupInput.classList.contains("is-invalid")).forEach(dupInput => triggerInputEvent(dupInput, true));
			
			return "Le nom de ce candidat est dupliqué!";
			
		}
		else if (input.dataset.dupevalue != null) {
			
			const candidatesToRevalidate = otherCandidates.filter(candidateInput => candidateInput.value.toLowerCase() == input.dataset.dupevalue);
			candidatesToRevalidate.forEach(candidate => triggerInputEvent(candidate, true));
			
			delete input.dataset.dupevalue;
			
		}
		
		if (dataTrimmed == "") {
			return "Le nom du candidat ne peut être vide.";
		}
		
	}
	
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
		
		const illegalCharRegex = /^[^\\/:\*\?"<>\|]+$/;
		if (!illegalCharRegex.test(data)) {
			return "Le nom de la base de données contient actuellement au moins un caractère invalide.";
		}
		
		const reservedFileRegex = /^(nul|prn|con|(lpt|com)[0-9])(\.|$)/i;
		if (reservedFileRegex.test(data)) {
			return "Le nom de la base de données ne peut pas être un nom réservé au système.";
		}
		
	});
	add_input_for_verification("number-of-voters", data => {
		
		if (data === "") {
			return "Le nombre d'électeurs ne peut être vide.";
		}
		
		if (data < 1) {
			return "Le nombre doit être supérieur à 0.";
		}
		
	});
	add_input_for_verification("number-of-votes-minimum", (data, input, isManualVerification) => {
		
		let badData = undefined;
		
		if (data === "") {
			badData = "Le nombre de vote minimum ne peut être vide.";
		}
		else if (data < 0) {
			badData = "Le nombre doit être positif (supérieur ou égal à 0).";
		}
		
		const numberOfVotesMaxInput = document.getElementById("number-of-votes-maximum");
		
		if (badData) {
			return badData;
		}
		
		if (data > numberOfVotesMaxInput.value) {
			$(numberOfVotesMaxInput).val(data);
		}
		
		if (!isManualVerification) {
			triggerInputEvent(numberOfVotesMaxInput, true);
		}
		
		if (numberOfVotesMaxInput.value && data > numberOfVotesMaxInput.value) {
			return "Le nombre de vote minimum ne peut pas être supérieur au nombre de vote maximum.";
		}
		
	});
	add_input_for_verification("number-of-votes-maximum", (data, input, isManualVerification) => {
		
		let badData = undefined;
		
		if (data === "") {
			badData = "Le nombre de vote maximum ne peut être vide.";
		}
		else if (data < 1) {
			badData = "Le nombre doit être supérieur à 0.";
		}
		
		const numberOfVotesMinInput = document.getElementById("number-of-votes-minimum");
		
		if (badData) {
			return badData;
		}
		
		if (data < numberOfVotesMinInput.value) {
			$(numberOfVotesMinInput).val(data);
		}
		
		if (!isManualVerification) {
			triggerInputEvent(numberOfVotesMinInput, true);
		}
		
		if (numberOfVotesMinInput.value && data < numberOfVotesMinInput.value) {
			return "Le nombre de vote maximum ne peut pas être inférieur au nombre de vote minimum.";
		}
		
		const candidatesCount = document.querySelectorAll("input[id^='candidate-name-']").length;
		
		if (candidatesCount < data) {
			return "Le nombre de vote maximum doit être inférieur ou égal au nombre de candidats.";
		}
		
	});
	add_input_for_verification("candidate-name-1", validateCandidate);
	
	window.addEventListener("beforeunload", prevent_data_loss);
	
	// Handle Enter on input fields
	
	const setupPageTextFields = document.querySelectorAll("#setup-form input");
	
	setupPageTextFields.forEach(input => {
		
		input.addEventListener("keydown", e => {
			
			if (e.which === 13 || e.keyCode === 13 || e.key === "Enter") {
				e.preventDefault();
			}
			
		});
		
	});
	
	document.getElementById("candidate-name-1").addEventListener("keyup", setup_candidate_selector);
	
	const homepageButton = document.getElementById("setup-homepage-button");
	
	homepageButton.addEventListener("click", () => document.location.reload(true));
	
}

function add_input_for_verification(inputId, customValidator) {
	
	setupInputs[inputId] = false;
	
	const inputElement = document.getElementById(inputId);
	
	const checkElement = inputElement.classList.contains("spinner") ? document.querySelector(`#${inputId} + div.input-group input.spinner`) : inputElement;
	
	if (checkElement.type == "number" || checkElement.inputMode == "numeric") {
		
		function numberTypeOnlyPositive(e) {
			
			let hasBadChars = false;
			
			if (e.type == "paste") {
				clipboardData = e.clipboardData || window.clipboardData;
				pastedData = clipboardData.getData("Text");
				hasBadChars = !pastedData.match(/[0-9]/);
			}
			else {
				
				const isValidKeyCode = e.key.match(/[0-9]/) || e.ctrlKey || e.altKey || e.shiftKey || (e.code == "Backspace" || e.keyCode == 8) || (e.code == "Tab" || e.keyCode == 9) || e.key.includes("Arrow");
				
				if (!isValidKeyCode) {
					hasBadChars = true;
				}
				
			}
			
			if (hasBadChars) {
				e.preventDefault();
				return;
			}
			
		}
		checkElement.addEventListener("keyup", numberTypeOnlyPositive);
		checkElement.addEventListener("paste", numberTypeOnlyPositive);
		checkElement.addEventListener("keydown", numberTypeOnlyPositive);
		checkElement.addEventListener("keypress", numberTypeOnlyPositive);
		
	}
	
	inputElement.addEventListener("input", (e) => {
		
		const isManual = e.detail ? e.detail.isManual : false;
		
		setupInputs[inputId] = verify_input(inputElement, customValidator, isManual, checkElement);
		
		verify_all_valid();
		
	});
	
	verify_all_valid();
	
	if (checkElement.classList.contains("is-popable")) {
		if (checkElement.hasAttribute("data-bs.popover")) {
			checkElement.removeAttribute("data-bs.popover");
		}
		$(checkElement).popover({ trigger: "manual" });
		
		triggerInputEvent(inputElement, true);
		
		checkElement.addEventListener("focus", () => $(checkElement).popover("show"));
		checkElement.addEventListener("focusout", () => $(checkElement).popover("hide"));
		
		if (checkElement.classList.contains("spinner")) {
			let previousSpinnerTimer = undefined;
			inputElement.addEventListener("change", e => {
				if (e.detail.step != undefined) {
					clearTimeout(previousSpinnerTimer);
					previousSpinnerTimer = setTimeout(() => {
						if (document.activeElement != checkElement) {
							$(checkElement).popover("hide")
						}
					}, 1500);
				}
			});
		}
	}
	
	checkElement.addEventListener("focus", e => textFieldHadFocus = e.currentTarget);
	checkElement.addEventListener("focusout", e => setTimeout(() => {
		if (e.target == textFieldHadFocus) {
			textFieldHadFocus = undefined;
		}
	}, 100));
	
}

function verify_all_valid() {
	
	let isValid = true;
	
	for (const inputProperty in setupInputs) {
		isValid = setupInputs[inputProperty];
		
		if (!isValid) {
			break;
		}
	}
	
	const submitSetupButton = document.getElementById("setup-submit-button");
	
	submitSetupButton.disabled = !isValid;
	
}

function verify_input(inputElement, customValidator, isManualVerification, elementToValidate) {
	
	// Check if required. If not, don't verify
	if (!inputElement.required) {
		return true;
	}
	
	let isValid = true;
	let reason = "";
	
	const inputValue = inputElement.value;
	
	if (customValidator) {
		const customResults = (inputElement.type == "number" || inputElement.inputMode == "numeric") && inputValue ? customValidator(parseInt(inputValue), inputElement, isManualVerification) : customValidator(inputValue, inputElement, isManualVerification);
		
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
		
		const numberValue = parseInt(inputValue);
		
		isValid = numberValue > 0;
		reason = "Le nombre doit être supérieur à 0.";
		
	}
	
	const elemToClassify = elementToValidate || inputElement;
	
	if (isValid) {
		
		inputElement.classList.remove("is-invalid");
		
		elemToClassify.dataset.content = "";
		
		$(elemToClassify).popover("hide");
		
	}
	else {
		
		inputElement.classList.add("is-invalid");
		
		elemToClassify.dataset.content = reason;
		
		$(elemToClassify).popover("show");
		
	}
	
	return isValid;
	
}

function triggerInputEvent(input, isSilent) {
	
	const popableInput = input.classList.contains("spinner") ? document.querySelector(`#${input.id} + div.input-group input.spinner`) : input;
	
	const inputIsPopable = popableInput.classList.contains("is-popable");
	
	if (inputIsPopable && isSilent) {
		$(popableInput).popover("disable");
	}
	
	input.dispatchEvent(new CustomEvent("input", {detail: {isManual: true}}));
	
	if (inputIsPopable && isSilent) {
		$(popableInput).popover("enable");
	}
	
}

// Handle reload if at least one candidate is entered

function prevent_data_loss() {
	
	const isOneCandidateIsEntered = Array.from(document.querySelectorAll("input[id^='candidate-name-']")).some(input => input.value != "");
	
	if (isOneCandidateIsEntered) {
		
		event.returnValue = "Il y au moins un candidat d'inscrit - continuer le rechargement de la page va le(s) perdre. Êtes vous sûr de vouloir continuer?";
		
	}
	
}

function setup_candidate_selector(e) {
	
	if (e.which === 13 || e.keyCode === 13 || e.key === "Enter") {
		e.preventDefault();
		
		const inputCandidateNumber = parseInt(e.currentTarget.dataset.candidatenumber);
		
		const candidateAddButton = document.getElementById("candidate-add");
		
		const inputNextCandidate = document.getElementById(`candidate-name-${inputCandidateNumber + 1}`);
		
		if (inputNextCandidate == undefined) {
			
			candidateAddButton.click();
			
		}
		else {
			
			inputNextCandidate.select();
			
		}
		
	}
	
}
