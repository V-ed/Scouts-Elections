import { setup_post_voting, setup_results } from "./results.js";
import switch_view from "./switcher.js";
import Utils from "./utilities.js";

let onKeyUpEventBefore;

let auto_download_data = function() {
	
	if (Utils.should_download_data()) {
		
		Utils.download_data(this.data, "_en_cours");
		
	}
	
}

export async function setup_votes(data, sharedElectionCode, beforeSwitchCallback, requestContainer, doForceShowPreVotingPage) {
	
	window.addEventListener("beforeunload", auto_download_data.bind({data: data}));
	
	data.setSharedElectionCode(sharedElectionCode || data.sharedElectionCode);
	
	if (doForceShowPreVotingPage || data.numberOfVoted == 0) {
		
		if (beforeSwitchCallback) {
			beforeSwitchCallback();
		}
		
		switch_view("pre-voting-page", () => setup_pre_voting_session(data));
		
	}
	else {
		
		let didSkipVotingPage = false;
		
		if (data.sharedElectionCode) {
			
			try {
				
				didSkipVotingPage = await voting_go_to_next_voter(data, true, requestContainer, true, undefined, beforeSwitchCallback);
				
			} catch (error) {
				
				return Promise.reject(error.error);
				
			}
			
		}
		
		if (!didSkipVotingPage) {
			
			if (beforeSwitchCallback) {
				beforeSwitchCallback();
			}
			
			switch_view("voting-page", () => setup_voting_session(data));
			
		}
		
		return Promise.resolve(didSkipVotingPage);
		
	}
	
}

export function setup_pre_voting_session(data) {
	
	if (Utils.isTouchDevice) {
		document.getElementById("pre-voting-touchscreen-reminder").hidden = false;
	}
	
	const preVotingSubmitButton = document.getElementById("pre-voting-submit-button");
	
	if (data.sharedElectionCode) {
		
		const sharedElectionJoinLinkSpan = document.getElementById("pre-voting-join-shared-election-link");
		
		sharedElectionJoinLinkSpan.value = `${window.location.protocol}//${window.location.hostname}${window.location.pathname != "/" ? window.location.pathname : ""}${window.location.port ? ":" + window.location.port : ""}?code=${data.sharedElectionCode}`;
		
		const preVotingSharedForceLocalButton = document.getElementById("pre-voting-shared-force-local-button");
		
		$(preVotingSharedForceLocalButton).popover({trigger: "focus"}).on("shown.bs.popover", function() {
			
			const preVotingSharedConfirmStartLocalButton = document.getElementById("pre-voting-shared-confirm-start-local-button");
			
			preVotingSharedConfirmStartLocalButton.addEventListener("click", () => {
				
				data.setSharedElectionCode(undefined);
				
				data.numberOfSeatsTaken = data.numberOfVoted;
				
				$(this).popover("hide");
				
				activateVotingSession();
				
			});
			
		});
		
	}
	
	async function activateVotingSession() {
		
		let didSkipVotingPage = false;
		
		if (data.sharedElectionCode) {
			
			const preVotingRequestErrorRow = document.getElementById("pre-voting-request-error-row");
			
			try {
				
				preVotingRequestErrorRow.hidden = true;
				
				const requesterOptions = {
					container: 'pre-voting-requester-container',
					onContainerShownFunc: () => preVotingSubmitButton.scrollIntoView()
				};
				
				didSkipVotingPage = await voting_go_to_next_voter(data, true, requesterOptions, false);
				
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
			
			switch_view("voting-page", () => setup_voting_session(data));
			
		}
		
		Utils.uninitialize_images("pre-voting-page");
		
	}
	
	preVotingSubmitButton.addEventListener("click", async () => {
		
		preVotingSubmitButton.disabled = true;
		
		await activateVotingSession();
		
		preVotingSubmitButton.disabled = false;
		
	});
	
	Utils.initialize_images("pre-voting-page", data.groupImage);
	
}

export function setup_voting_session(data) {
	
	Utils.initialize_images("voting-page", data.groupImage);
	
	Utils.dbIsDirty = true;
	
	onKeyUpEventBefore = document.body.onkeyup;
	
	const isMultipleSameCandidateAllowed = data.allowMultipleSameCandidate || false;
	
	let minNumberOfVotesLeft = data.numberOfVotePerVoterMin;
	let maxNumberOfVotesLeft = data.numberOfVotePerVoterMax;
	
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
		submitVotesButton.classList.remove("btn-secondary");
		submitVotesButton.classList.add("btn-success");
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
			data.voteCandidate(index, step);
		}
		else if (step < 0) {
			data.unvoteCandidate(index, -step);
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
		
		if (submitVotesButton.disabled) {
			submitVotesButton.classList.add("btn-secondary");
			submitVotesButton.classList.remove("btn-success");
		}
		else {
			submitVotesButton.classList.remove("btn-secondary");
			submitVotesButton.classList.add("btn-success");
		}
		
	}
	
	let isVoteFinishing = false;
	let isVoteFinished = false;
	
	const votingOverlay = document.getElementById("voting-voted-overlay");
	
	function resetVotingState() {
		
		data.resetCandidateVotes();
		
		minNumberOfVotesLeft = data.numberOfVotePerVoterMin;
		maxNumberOfVotesLeft = data.numberOfVotePerVoterMax;
		
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
		
		isVoteFinishing = false;
		isVoteFinished = true;
		
	}
	
	const overlayRequestErrorSpan = document.getElementById("overlay-request-error-details");
	
	async function updateVotes(requestContainer) {
		
		if (data.sharedElectionCode) {
			
			const candidatesIndexesJSON = JSON.stringify(data.votesCurrentCandidateIndexes);
			
			const ajaxSettings = {
				type: 'PUT',
				url: `${Utils.sharedElectionHostRoot}/vote/${data.sharedElectionCode}`,
				data: candidatesIndexesJSON,
				cache: false,
			};
			
			try {
				
				const response = await Utils.sendRequestFor(3, ajaxSettings, requestContainer);
				
				data.mergeData(response.data);
				
			} catch (error) {
				return error;
			}
			
		}
		else {
			
			data.votesCurrentCandidateIndexes.forEach(voteIndex => {
				
				data.candidates[voteIndex].voteCount++;
				
			});
			
			data.numberOfVoted++;
			
		}
		
		resetVotingState();
		
	}
	
	submitVotesButton.addEventListener("click", () => {
		
		submitVotesButton.disabled = true;
		
		votingOverlay.classList.add("active");
		
		isVoteFinishing = true;
		
		setTimeout(async () => {
			updateVotes()
			
			submitVotesButton.classList.remove("btn-success");
			submitVotesButton.classList.add("btn-secondary");
		}, 1200);
		
	});
	
	document.body.onkeyup = e => {
		e.preventDefault();
		
		if(e.key == " " || e.keyCode == 32){
			
			go_to_next_voter(data);
			
		}
	}
	
	if (Utils.isTouchDevice) {
		
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
	
	const toastElement = toastContainer.querySelector(".toast");
	
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
			// If skipped, show number of remaining active voters instead
			const numberOfPlaceRemaining = data.hasSkipped ? (data.numberOfSeatsTaken - 1) - data.numberOfVoted : data.numberOfVoters - data.numberOfSeatsTaken;
			
			const beginText = data.hasSkipped ? `${numberOfPlaceRemaining} électeur(s) restant(s)` : `${numberOfPlaceRemaining} place(s) restante(s)`;
			
			seatsRemainingCountToast.innerText = `${beginText} sur ${data.numberOfVoters} pour cette élection partagée`;
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
		
		if (isVoteFinishing) {
			return false;
		}
		
		if (isVoteFinished && data.votesCurrentCandidateIndexes) {
			
			showBadVoteSendRequestError();
			
			return false;
			
		}
		
		let didFinishElection = false;
		
		try {
			
			didFinishElection = await voting_go_to_next_voter(data, false, 'voting-requester-container', false, isVoteFinished);
			
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
		
		data.setSharedElectionCode(undefined);
		
		data.numberOfSeatsTaken = data.numberOfVoted;
		
		if (data.votesCurrentCandidateIndexes) {
			updateVotes();
		}
		else {
			go_to_next_voter(data);
		}
		
	});
	
	document.getElementById("overlay-request-error-retry-button").addEventListener("click", async () => {
		
		$(overlayErrorModal).modal("hide");
		
		if (data.votesCurrentCandidateIndexes) {
			
			await updateVotes('voting-requester-container');
			
			if (data.votesCurrentCandidateIndexes) {
				
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
			url: `${Utils.sharedElectionHostRoot}/skip/${data.sharedElectionCode}`,
		};
		
		try {
			
			const response = await Utils.sendRequest(ajaxSettings, 'voting-skipper-requester-container');
			
			data.mergeData(response.data);
			
			end_voting_session(data, true);
			
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
		
		data.setSharedElectionCode(undefined);
		
		execute_local_skip_votes(data);
		
	});
	
}

export async function voting_go_to_next_voter(data, doForceNewVoter, requestsContainer, doSkipRetrievingElectionData, isVoteFinished, beforeSwitchCallback) {
	
	if (data.sharedElectionCode && !doSkipRetrievingElectionData) {
		
		const valuesToRetrieve = ["numberOfSeatsTaken", "numberOfVoted", "hasSkipped"];
		
		if (doForceNewVoter) {
			// Remove all values to force query to fetch everything
			valuesToRetrieve.length = 0;
		}
		
		const queryFromValuesToRetrieve = valuesToRetrieve.length == 0 ? "" : `?${valuesToRetrieve.join('&')}`
		
		const ajaxSettings = {
			url: `${Utils.sharedElectionHostRoot}/retrieve/${data.sharedElectionCode}${queryFromValuesToRetrieve}`,
			cache: false,
		};
		
		try {
			
			const response = await Utils.sendRequestFor(3, ajaxSettings, requestsContainer, undefined, 150);
			
			data.mergeData(response.data);
			
		} catch (error) {
			return Promise.reject({error: error, at: "retrieve"});
		}
		
	}
	
	if ((doForceNewVoter || isVoteFinished) && (data.hasSkipped || data.numberOfSeatsTaken == data.numberOfVoters)) {
		end_voting_session(data, false, beforeSwitchCallback);
		return true;
	}
	else {
		
		if (doForceNewVoter || isVoteFinished) {
			
			if (data.sharedElectionCode) {
				
				const ajaxSettings = {
					url: `${Utils.sharedElectionHostRoot}/seat/${data.sharedElectionCode}`,
					cache: false,
				};
				
				try {
					
					const response = await Utils.sendRequestFor(3, ajaxSettings, requestsContainer, undefined, 150);
					
					data.mergeData(response.data);
					
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

export function end_voting_session(data, didSkipRemainings, beforeSwitchCallback) {
	
	document.getElementById("voting-toasts-container").classList.add("i-am-away");
	
	if (beforeSwitchCallback) {
		beforeSwitchCallback();
	}
	
	if (data.sharedElectionCode && (data.hasSkipped && data.numberOfVoted != data.numberOfSeatsTaken || !data.hasSkipped && data.numberOfVoted != data.numberOfVoters)) {
		switch_view("post-shared-voting-page", () => setup_post_voting(data, didSkipRemainings));
	}
	else {
		setup_results(data);
	}
	
	document.body.onkeyup = onKeyUpEventBefore;
	
	Utils.uninitialize_images("voting-page");
	
}
