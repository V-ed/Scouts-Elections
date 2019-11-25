let onKeyUpEventBefore;

let auto_download_data = function() {
	
	if (should_download_data()) {
		
		download_data(this.data, "_en_cours");
		
	}
	
}

function setup_pre_voting_session(data) {
	
	window.addEventListener("beforeunload", auto_download_data.bind({data: data}));
	
	if (isTouchDevice) {
		document.getElementById("pre-voting-touchscreen-reminder").hidden = false;
	}
	
	document.getElementById("pre-voting-submit-button").addEventListener("click", e => {
		e.preventDefault();
		
		switch_view("voting-page", () => setup_voting_session(data));
	});
	
}

function setup_voting_session(data) {
	
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
		<div class="col-6 col-sm-4 col-md-3 p-2">
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
	
	submitVotesButton.addEventListener("click", () => {
		
		submitVotesButton.disabled = true;
		votingOverlay.classList.add("active");
		
		setTimeout(() => {
			
			candidatesIndexes.forEach(voteIndex => {
				
				data.candidates[voteIndex].voteCount++;
				
			});
			
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
			
			data.numberOfVoted++;
			
		}, 1200);
		
	});
	
	const votersRemainingCountToast = document.getElementById("voters-remaining-count-toast");
	
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
	
	function go_to_next_voter(data) {
		
		if (isVoteFinished && data.numberOfVoted == data.numberOfVoters) {
			end_voting_session(data);
		}
		else {
			
			votersRemainingCountToast.innerText = `${data.numberOfVoters - data.numberOfVoted} électeur(s) restant sur ${data.numberOfVoters}`;
			
			toastContainer.classList.remove("i-am-away")
			$("#voting-toasts-container > .toast").toast("show");
			
		}
		
		if (isVoteFinished) {
			
			isVoteFinished = false;
			
			document.body.scrollTop = document.documentElement.scrollTop = 0;
			
			votingOverlay.classList.remove("active");
			
		}
		
	}
	
	$("#voting-toasts-container > .toast").on("hidden.bs.toast", () => {
		toastContainer.classList.add("i-am-away")
	});
	
	const skipVotesButton = document.getElementById("voting-skip-button");
	
	skipVotesButton.addEventListener("click", e => {
		e.preventDefault();
		
		data.hasSkipped = true;
		
		end_voting_session(data);
		
	});
	
	function end_voting_session(data) {
		
		document.getElementById("voting-toasts-container").classList.add("i-am-away");
		
		setup_results(data);
		document.body.onkeyup = onKeyUpEventBefore;
		
	}
	
}
