let onKeyUpEventBefore;

let auto_download_data = function() {
	
	if (should_download_data()) {
		
		download_data(this.data, "_en_cours");
		
	}
	
}

function updateSharedElectionCode(newSharedElectionCode) {
	document.querySelectorAll(".shared-election-code").forEach(elem => elem.textContent = newSharedElectionCode);
	document.querySelectorAll(".shared-election-container").forEach(elem => elem.hidden = !newSharedElectionCode);
	document.querySelectorAll(".non-shared-election-container").forEach(elem => elem.hidden = !!newSharedElectionCode);
}

async function setup_votes(data, sharedElectionCode, beforeSwitchCallback, requestContainer, doForceShowPreVotingPage) {
	
	window.addEventListener("beforeunload", auto_download_data.bind({data: data}));
	
	updateSharedElectionCode(sharedElectionCode);
	
	if (doForceShowPreVotingPage || data.numberOfVoted == 0) {
		
		if (beforeSwitchCallback) {
			beforeSwitchCallback();
		}
		
		switch_view("pre-voting-page", () => setup_pre_voting_session(data, sharedElectionCode));
		
	}
	else {
		
		let didSkipVotingPage = false;
		
		if (sharedElectionCode) {
			
			try {
				
				didSkipVotingPage = await voting_go_to_next_voter(data, sharedElectionCode, true, requestContainer, true);
				
			} catch (error) {
				
				return Promise.reject(error.error);
				
			}
			
		}
		
		if (!didSkipVotingPage) {
			
			if (beforeSwitchCallback) {
				beforeSwitchCallback();
			}
			
			switch_view("voting-page", () => setup_voting_session(data, sharedElectionCode));
			
		}
		
		return Promise.resolve(didSkipVotingPage);
		
	}
	
}

function setup_pre_voting_session(data, sharedElectionCode) {
	
	if (isTouchDevice) {
		document.getElementById("pre-voting-touchscreen-reminder").hidden = false;
	}
	
	const preVotingSubmitButton = document.getElementById("pre-voting-submit-button");
	
	if (sharedElectionCode) {
		
		const preVotingSharedForceLocalButton = document.getElementById("pre-voting-shared-force-local-button");
		
		$(preVotingSharedForceLocalButton).popover({trigger: "focus"}).on("shown.bs.popover", function() {
		
			const preVotingSharedConfirmStartLocalButton = document.getElementById("pre-voting-shared-confirm-start-local-button");
			
			preVotingSharedConfirmStartLocalButton.addEventListener("click", () => {
				
				sharedElectionCode = undefined;
				updateSharedElectionCode(undefined);
				
				data.numberOfSeatsTaken = data.numberOfVoted;
				
				$(this).popover("hide");
				
				activateVotingSession();
				
			});
			
		});
		
	}
	
	async function activateVotingSession() {
		
		let didSkipVotingPage = false;
		
		if (sharedElectionCode) {
			
			const preVotingRequestErrorRow = document.getElementById("pre-voting-request-error-row");
			
			try {
				
				preVotingRequestErrorRow.hidden = true;
				
				didSkipVotingPage = await voting_go_to_next_voter(data, sharedElectionCode, true, 'pre-voting-requester-container', false);
				
			} catch (error) {
				
				const preVotingRequestErrorSpan = preVotingRequestErrorRow.querySelector(".text-danger.dynamic-error");
				
				let message = "Une erreur imprévue est survenue.";
				
				if (error.error.readyState == 0) {
					message += " Veuillez vérifier votre connection internet!";
				}
				else {
					
					switch (error.at) {
						case "retrieve":
							message = "Une erreur est survenue lors du téléchargement des dernières données présentes sur le serveur.";
							break;
						case "seat":
							message = "Une erreur est survenue lors de l'envoi d'une demande au serveur pour prendre une nouvelle place.";
							break;
					}
					
				}
				
				preVotingRequestErrorSpan.textContent = message;
				
				preVotingRequestErrorRow.hidden = false;
				
				preVotingSubmitButton.scrollIntoView();
				
				return;
				
			}
			
		}
		else {
			data.numberOfSeatsTaken = data.numberOfSeatsTaken ? data.numberOfSeatsTaken + 1 : 1;
		}
		
		if (!didSkipVotingPage) {
			
			switch_view("voting-page", () => setup_voting_session(data, sharedElectionCode));
			
		}
		
		uninitialize_images("pre-voting-page");
		
	}
	
	preVotingSubmitButton.addEventListener("click", async () => {
		
		preVotingSubmitButton.disabled = true;
		
		await activateVotingSession();
		
		preVotingSubmitButton.disabled = false;
		
	});
	
	initialize_images("pre-voting-page", data.groupImage);
	
}

function setup_voting_session(data, sharedElectionCode) {
	
	initialize_images("voting-page", data.groupImage);
	
	dbIsDirty = true;
	
	onKeyUpEventBefore = document.body.onkeyup;
	
	let candidatesIndexes = [];
	
	const isMultipleSameCandidateAllowed = data.allowMultipleSameCandidate || false;
	
	let minNumberOfVotesLeft = data.numberOfVotePerVoterMin;
	let maxNumberOfVotesLeft = data.numberOfVotePerVoterMax;
	
	if (minNumberOfVotesLeft == undefined && maxNumberOfVotesLeft == undefined) {
		
		const backwardCompatibleNumber = data.numberOfVotePerVoter;
		
		minNumberOfVotesLeft = backwardCompatibleNumber;
		maxNumberOfVotesLeft = backwardCompatibleNumber;
		
	}
	
	let cardsHtml = "";
	
	for(let i = 1; i <= data.candidates.length; i++){
		
		const candidateIndex = i - 1;
		
		const candidateData = data.candidates[candidateIndex];
		
		let inputHtml;
		
		if (isMultipleSameCandidateAllowed) {
			inputHtml = `<input type="number" class="spinner" value="0" min="0" max="${maxNumberOfVotesLeft}" step="1" data-step-max="1" data-candidateindex="${candidateIndex}"/>`;
		}
		else {
			inputHtml = `
				<button id="vote-candidate-${i}" type="button" class="btn btn-primary" data-candidateindex="${candidateIndex}">Voter</button>
				<button id="unvote-candidate-${i}" type="button" class="btn btn-danger" data-candidateindex="${candidateIndex}" hidden>Enlever Vote</button>
			`;
		}
		
		cardsHtml += `
		<div class="col-6 col-md-4 col-lg-3 p-2">
			<div class="card">
				<div class="card-body text-center">
					<h5 class="card-title">${candidateData.name}</h5>
					${inputHtml}
				</div>
			</div>
		</div>`;
		
	}
	
	const cardsContainer = document.getElementById("cards-container");
	
	$(cardsContainer).append(`<div class="row d-flex justify-content-center px-2 px-md-0">${cardsHtml}</div>`);
	
	const voteRemainingCounter = document.getElementById("voting-remaining-count");
	const voteRemainingCounterMin = document.getElementById("voting-remaining-count-min");
	const voteRemainingCounterMax = document.getElementById("voting-remaining-count-max");
	
	if (minNumberOfVotesLeft == maxNumberOfVotesLeft) {
		
		voteRemainingCounter.textContent = minNumberOfVotesLeft;
		
		document.getElementById("voting-remaining-text-absolute").hidden = false;
		
	}
	else {
		
		voteRemainingCounterMin.textContent = minNumberOfVotesLeft;
		voteRemainingCounterMax.textContent = maxNumberOfVotesLeft;
		
		document.getElementById("voting-remaining-text-multiple").hidden = false;
		
	}
	
	const submitVotesButton = document.getElementById("voting-submit-button");
	
	if(minNumberOfVotesLeft == 0){
		submitVotesButton.disabled = false;
	}
	
	if (isMultipleSameCandidateAllowed) {
		
		const inputs = document.querySelectorAll("div#voting-page input.spinner[type='number']");
		
		$(inputs).inputSpinner({disabledInput: true, inputClass: "font-weight-bold", buttonsClass: "btn-secondary"});
		
		$(inputs).on("change", e => {
			
			if (!e.detail || !e.detail.step) {
				return;
			}
			
			vote_for_candidate(parseInt(e.currentTarget.dataset.candidateindex), e.detail.step);
			
			inputs.forEach(input => input.max = maxNumberOfVotesLeft + parseInt($(input).val()));
			
			if (maxNumberOfVotesLeft == 0) {
				const nonSelectedInput = Array.from(inputs).filter(input => $(input).val() == 0);
				nonSelectedInput.forEach(input => input.readOnly = true);
			}
			else {
				const readonlyInputs = Array.from(inputs).filter(input => input.readOnly);
				readonlyInputs.forEach(input => input.readOnly = false);
			}
			
		});
		
	}
	else {
		
		const votingButtons = document.querySelectorAll("button[id^=vote-candidate-]");
		
		votingButtons.forEach(button => {
			button.addEventListener("click", e => {
				e.preventDefault();
				
				vote_for_candidate(parseInt(button.dataset.candidateindex), 1);
				
				button.hidden = true;
				document.getElementById(`unvote-candidate-${parseInt(button.dataset.candidateindex) + 1}`).hidden = false;
				
				if (maxNumberOfVotesLeft == 0) {
					
					const nonVotedCandidatesButtons = document.querySelectorAll("button[id^=vote-candidate-]:not([hidden])");
					
					nonVotedCandidatesButtons.forEach(button => button.disabled = true);
					
				}
				
			});
		});
		
		const unvoteButtons = document.querySelectorAll("button[id^=unvote-candidate-]");
		
		unvoteButtons.forEach(button => {
			button.addEventListener("click", e => {
				e.preventDefault();
				
				vote_for_candidate(parseInt(button.dataset.candidateindex), -1);
				
				button.hidden = true;
				document.getElementById(`vote-candidate-${parseInt(button.dataset.candidateindex) + 1}`).hidden = false;
				
				const disabledNonVotedCandidatesButtons = document.querySelectorAll("button[id^=vote-candidate-][disabled]");
				
				disabledNonVotedCandidatesButtons.forEach(button => button.disabled = false);
				
			});
		});
		
	}
	
	function vote_for_candidate(index, step) {
		
		if (step > 0) {
			for (let i = 0; i < step; i++) {
				candidatesIndexes.push(index);
			}
		}
		else if (step < 0) {
			for (let i = 0; i > step; i--) {
				let candidateIndex = candidatesIndexes.findIndex(currentIndex => currentIndex == index);
				candidateIndex !== -1 && candidatesIndexes.splice(candidateIndex, 1);
			}
		}
		
		minNumberOfVotesLeft = minNumberOfVotesLeft - step;
		maxNumberOfVotesLeft = maxNumberOfVotesLeft - step;
		
		if (minNumberOfVotesLeft == maxNumberOfVotesLeft) {
			voteRemainingCounter.textContent = minNumberOfVotesLeft;
		}
		else {
			voteRemainingCounterMin.textContent = minNumberOfVotesLeft >= 0 ? minNumberOfVotesLeft : 0;
			voteRemainingCounterMax.textContent = maxNumberOfVotesLeft;
		}
		
		submitVotesButton.disabled = minNumberOfVotesLeft > 0;
		
	}
	
	let isVoteFinished = false;
	
	const votingOverlay = document.getElementById("voting-voted-overlay");
	
	function resetVotingState() {
		
		candidatesIndexes = [];
		
		minNumberOfVotesLeft = data.numberOfVotePerVoterMin;
		maxNumberOfVotesLeft = data.numberOfVotePerVoterMax;
		
		if (minNumberOfVotesLeft == undefined && maxNumberOfVotesLeft == undefined) {
			
			const backwardCompatibleNumber = data.numberOfVotePerVoter;
			
			minNumberOfVotesLeft = backwardCompatibleNumber;
			maxNumberOfVotesLeft = backwardCompatibleNumber;
			
		}
		
		if (minNumberOfVotesLeft == maxNumberOfVotesLeft) {
			
			voteRemainingCounter.textContent = minNumberOfVotesLeft;
			
			document.getElementById("voting-remaining-text-absolute").hidden = false;
			
		}
		else {
			
			voteRemainingCounterMin.textContent = minNumberOfVotesLeft;
			voteRemainingCounterMax.textContent = maxNumberOfVotesLeft;
			
			document.getElementById("voting-remaining-text-multiple").hidden = false;
			
		}
		
		if (isMultipleSameCandidateAllowed) {
			
			const inputs = document.querySelectorAll("input.spinner[type='number']");
			
			inputs.forEach(input => {
				
				input.max = maxNumberOfVotesLeft;
				input.readOnly = false;
				$(input).val(0);
				
			});
			
		}
		else {
			
			const votingButtons = document.querySelectorAll("button[id^=vote-candidate-]");
			const unvoteButtons = document.querySelectorAll("button[id^=unvote-candidate-]");
			
			votingButtons.forEach(button => {
				button.hidden = false;
				button.disabled = false;
			});
			unvoteButtons.forEach(button => button.hidden = true);
			
		}
		
		submitVotesButton.disabled = true;
		
		isVoteFinished = true;
		
	}
	
	const overlayRequestErrorSpan = document.getElementById("overlay-request-error-details");
	let votesOnSubmitError = undefined;
	
	async function updateVotes(requestContainer) {
		
		if (sharedElectionCode) {
				
			const candidatesIndexesJSON = JSON.stringify(candidatesIndexes);
			
			const ajaxSettings = {
				type: 'PUT',
				url: `${sharedElectionHostRoot}/vote/${sharedElectionCode}`,
				data: candidatesIndexesJSON,
				cache: false,
			};
			
			try {
				
				const response = await sendRequestFor(3, ajaxSettings, requestContainer);
				
				mergeObjectTo(data, response.data, false, false);
				
			} catch (error) {
				
				votesOnSubmitError = candidatesIndexes;
				
				return;
				
			}
			
		}
		else {
			
			candidatesIndexes.forEach(voteIndex => {
				
				data.candidates[voteIndex].voteCount++;
				
			});
			
			data.numberOfVoted++;
			
		}
		
		resetVotingState();
		
		votesOnSubmitError = undefined;
		
	}
	
	submitVotesButton.addEventListener("click", () => {
		
		submitVotesButton.disabled = true;
		votingOverlay.classList.add("active");
		
		setTimeout(async () => updateVotes(), 1200);
		
	});
	
	document.body.onkeyup = e => {
		e.preventDefault();
		
		if(e.key == " " || e.keyCode == 32){
			
			go_to_next_voter(data);
			
		}
	}
	
	if (isTouchDevice) {
		
		let timer;
		const touchDuration = 500;
		
		function touchStart() {
			timer = setTimeout(onLongTouch, touchDuration);
		}
		
		function touchEnd() {
			
			if (timer) {
				clearTimeout(timer);
			}
			
		}
		
		function onLongTouch() {
			
			go_to_next_voter(data);
			
		};
		
		const touchSkippers = document.querySelectorAll("#voting-voted-overlay .touch-skipper");
		
		touchSkippers.forEach(skipper => {
			
			skipper.addEventListener("touchstart", touchStart);
			skipper.addEventListener("touchend", touchEnd);
			
		});
		
	}
	
	const toastContainer = document.getElementById("voting-toasts-container");
	const votersRemainingCountToast = document.getElementById("voters-remaining-count-toast");
	const seatsRemainingCountToast = document.getElementById("seats-remaining-count-toast");
	
	const toastElement = document.querySelector("#voting-toasts-container > .toast");
	
	let toastTimerId = undefined;
	
	let doPrepareToastTimer = true;
	
	function prepare_toast_timer(timeout) {
		
		timeout = timeout || 1500;
		
		doPrepareToastTimer = true;
		
		clearTimeout(toastTimerId);
		
		toastTimerId = setTimeout(() => {
			
			$(toastElement).toast("hide");
			$(toastElement).off("shown.bs.toast");
			
			toastTimerId = undefined;
			
		}, timeout);
		
	}
	
	function show_remaining_count_toast(data) {
		
		votersRemainingCountToast.innerText = `${data.numberOfVoters - data.numberOfVoted} électeur(s) restant(s) sur ${data.numberOfVoters}`;
		
		if (!seatsRemainingCountToast.hidden) {
			seatsRemainingCountToast.innerText = `${data.numberOfVoters - data.numberOfSeatsTaken} place(s) restante(s) ${data.numberOfVoters} pour cette élection partagée`;
		}
		
		toastContainer.classList.remove("i-am-away");
		
		$(toastElement).toast("show");
		
		$(toastElement).on("shown.bs.toast", () => {
			
			prepare_toast_timer();
			
		});
		
	}
	
	const overlayErrorModal = document.getElementById("overlay-request-error-modal");
	
	function showBadVoteSendRequestError() {
		
		overlayRequestErrorSpan.textContent = "Une erreur est survenue lors de l'envoi des votes au serveur.";
		
		$(overlayErrorModal).modal("show");
		
	}
	
	const skipSharedVotesButton = document.getElementById("voting-shared-skip-button");
	
	async function go_to_next_voter(data) {
		
		if (($(overlayErrorModal).data("bs.modal") || {})._isShown) {
			return false;
		}
		
		if (toastTimerId) {
			
			if (!skipSharedVotesButton.hasAttribute("aria-describedby")) {
				prepare_toast_timer();
			}
			
			return false;
			
		}
		
		if (votesOnSubmitError) {
			
			showBadVoteSendRequestError();
			
			return false;
			
		}
		
		let didFinishElection = false;
		
		try {
			
			didFinishElection = await voting_go_to_next_voter(data, sharedElectionCode, false, 'voting-requester-container', false, isVoteFinished);
			
		} catch (error) {
			
			let message = "Une erreur imprévue est survenue.";
			
			if (error.error.readyState == 0) {
				message += " Veuillez vérifier votre connection internet!";
			}
			else {
				
				switch (error.at) {
					case "retrieve":
						message = "Une erreur est survenue lors du téléchargement des dernières données présentes sur le serveur.";
						break;
					case "seat":
						message = "Une erreur est survenue lors de l'envoi d'une demande au serveur pour prendre une nouvelle place.";
						break;
				}
				
			}
			
			overlayRequestErrorSpan.textContent = message;
			
			$(overlayErrorModal).modal("show");
			
			return false;
			
		}
		
		show_remaining_count_toast(data);
		
		if (isVoteFinished) {
			
			isVoteFinished = false;
			
			document.body.scrollTop = document.documentElement.scrollTop = 0;
			
			votingOverlay.classList.remove("active");
			
		}
		
		return didFinishElection;
		
	}
	
	document.getElementById("overlay-request-error-local-button").addEventListener("click", () => {
		
		$(overlayErrorModal).modal("hide");
		
		sharedElectionCode = undefined;
		updateSharedElectionCode(undefined);
		
		data.numberOfSeatsTaken = data.numberOfVoted;
		
		if (votesOnSubmitError) {
			
			updateVotes();
			
		}
		else {
			
			go_to_next_voter(data);
			
		}
		
	});
	
	document.getElementById("overlay-request-error-retry-button").addEventListener("click", async () => {
		
		$(overlayErrorModal).modal("hide");
		
		if (votesOnSubmitError) {
			
			await updateVotes('voting-requester-container');
			
			if (votesOnSubmitError) {
				
				showBadVoteSendRequestError();
				
				return;
				
			}
			
		}
		
		go_to_next_voter(data);
		
	});
	
	$(toastElement).on("hidden.bs.toast", () => {
		toastContainer.classList.add("i-am-away");
	});
	
	function execute_local_skip_votes(data) {
		
		data.hasSkipped = true;
		
		end_voting_session(data);
		
	}
	
	const skipVotesButton = document.getElementById("voting-skip-button");
	
	skipVotesButton.addEventListener("click", () => execute_local_skip_votes(data));
	
	const sharedElectionSkipRequestErrorDiv = document.getElementById("shared-election-skip-request-error-toast");
	
	async function executeConfirmedSharedSkipVotes() {
		
		doPrepareToastTimer = false;
		
		skipSharedVotesButton.disabled = true;
		sharedElectionSkipRequestErrorDiv.hidden = true;
		
		const ajaxSettings = {
			type: 'PUT',
			url: `${sharedElectionHostRoot}/skip/${sharedElectionCode}`,
		};
		
		try {
			
			const response = await sendRequest(ajaxSettings, 'voting-skipper-requester-container');
			
			mergeObjectTo(data, response.data, false, false);
			
			end_voting_session(data, sharedElectionCode, true);
			
			doPrepareToastTimer = true;
			prepare_toast_timer(0);
			
			$(toastElement).toast("hide");
			$(toastElement).off("shown.bs.toast");
			
		} catch (error) {
			
			let message = "Une erreur imprévue est survenue.";
			
			if (error.readyState == 0) {
				message += " Veuillez vérifier votre connection internet!";
			}
			
			sharedElectionSkipRequestErrorDiv.querySelector(".dynamic-error").textContent = message;
			sharedElectionSkipRequestErrorDiv.hidden = false;
			
		}
		
		skipSharedVotesButton.disabled = false;
		
	}
	
	$(skipSharedVotesButton).popover({trigger: "focus"})
	.on("show.bs.popover", function() {
		
		clearTimeout(toastTimerId);
		
	}).on("shown.bs.popover", function() {
		
		const skipSharedVotesConfirmButton = document.getElementById("voting-shared-skip-confirm-button");
		
		skipSharedVotesConfirmButton.disabled = false;
		
		skipSharedVotesConfirmButton.addEventListener("click", executeConfirmedSharedSkipVotes);
		
	}).on("hidden.bs.popover", function() {
		
		if (doPrepareToastTimer) {
			prepare_toast_timer();
		}
		
	});
	
	document.getElementById("shared-election-skip-request-error-local-button").addEventListener("click", () => {
		
		sharedElectionCode = undefined;
		updateSharedElectionCode(undefined);
		
		execute_local_skip_votes(data);
		
	});
	
}

async function voting_go_to_next_voter(data, sharedElectionCode, doForceNewVoter, requestsContainer, doSkipRetrievingElectionData, isVoteFinished) {
	
	if (sharedElectionCode && !doSkipRetrievingElectionData) {
		
		const valuesToRetrieve = ["numberOfSeatsTaken", "numberOfVoted", "hasSkipped"];
		
		if (doForceNewVoter) {
			// Remove all values to force query to fetch everything
			valuesToRetrieve.length = 0;
		}
		
		const queryFromValuesToRetrieve = valuesToRetrieve.length == 0 ? "" : `?${valuesToRetrieve.join('&')}`
		
		const ajaxSettings = {
			url: `${sharedElectionHostRoot}/retrieve/${sharedElectionCode}${queryFromValuesToRetrieve}`,
			cache: false,
		};
		
		try {
			
			const response = await sendRequestFor(3, ajaxSettings, requestsContainer);
			
			mergeObjectTo(data, response.data, false, false);
			
		} catch (error) {
			return Promise.reject({error: error, at: "retrieve"});
		}
		
	}
	
	if ((doForceNewVoter || isVoteFinished) && (data.hasSkipped || data.numberOfSeatsTaken == data.numberOfVoters)) {
		end_voting_session(data, sharedElectionCode, false);
		return true;
	}
	else {
		
		if (doForceNewVoter || isVoteFinished) {
			
			if (sharedElectionCode) {
				
				const ajaxSettings = {
					url: `${sharedElectionHostRoot}/seat/${sharedElectionCode}`,
					cache: false,
				};
				
				try {
					
					const response = await sendRequestFor(3, ajaxSettings, requestsContainer);
					
					mergeObjectTo(data, response.data, false, false);
					
				} catch (error) {
					return Promise.reject({error: error, at: "seat"});
				}
				
			}
			else {
				data.numberOfSeatsTaken++;
			}
			
		}
		
	}
	
	return false;
	
}

function end_voting_session(data, sharedElectionCode, didSkipRemainings) {
		
	document.getElementById("voting-toasts-container").classList.add("i-am-away");
	
	if (sharedElectionCode) {
		switch_view("post-shared-voting-page", () => setup_post_voting(data, sharedElectionCode, didSkipRemainings));
	}
	else {
		setup_results(data);
	}
	
	document.body.onkeyup = onKeyUpEventBefore;
	
	uninitialize_images("voting-page");
	
}
