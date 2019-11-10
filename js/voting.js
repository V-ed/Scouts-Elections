let onKeyUpEventBefore;

let auto_download_data = function() {
	
	if (should_download_data()) {
		
		download_data(this.data, "_unfinished");
		
	}
	
}

function setup_voting_session(data) {
	
	dbIsDirty = true;
		
	window.addEventListener("beforeunload", auto_download_data.bind({data: data}));
	
	onKeyUpEventBefore = document.body.onkeyup;
	
	let voteIndexes = [];
	
	let cardsHtml = "";
	
	for(let i = 1; i <= data.candidates.length; i++){
		
		const candidateIndex = i - 1;
		
		const candidateData = data.candidates[candidateIndex];
		
		cardsHtml += `
		<div class="col-6 col-sm-4 col-md-3 p-2">
			<div class="card">
				<div class="card-body text-center">
					<h5 class="card-title">${candidateData.name}</h5>
					<button id="vote-candidate-${i}" type="button" class="btn btn-primary" data-voterindex="${candidateIndex}" data-voternumber="${i}">Voter</button>
					<button id="unvote-candidate-${i}" type="button" class="btn btn-danger" data-voterindex="${candidateIndex}" data-voternumber="${i}" hidden>Enlever Vote</button>
				</div>
			</div>
		</div>`;
		
	}
	
	const cardsContainer = document.getElementById("cards-container");
	
	$(cardsContainer).append(`<div class="row d-flex justify-content-center px-2 px-md-0">${cardsHtml}</div>`);
	
	let minNumberOfVotesLeft = data.numberOfVotePerVoterMin;
	let maxNumberOfVotesLeft = data.numberOfVotePerVoterMax;
	
	if (minNumberOfVotesLeft == undefined && maxNumberOfVotesLeft == undefined) {
		
		const backwardCompatibleNumber = data.numberOfVotePerVoter;
		
		minNumberOfVotesLeft = backwardCompatibleNumber;
		maxNumberOfVotesLeft = backwardCompatibleNumber;
		
	}
	
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
	
	const votingButtons = document.querySelectorAll("button[id^=vote-candidate-]");
	
	votingButtons.forEach(button => {
		button.addEventListener("click", e => {
			e.preventDefault();
			
			voteIndexes.push(button.dataset.voterindex);
			
			button.hidden = true;
			document.getElementById(`unvote-candidate-${button.dataset.voternumber}`).hidden = false;
			
			if (minNumberOfVotesLeft == maxNumberOfVotesLeft) {
				voteRemainingCounter.textContent = --minNumberOfVotesLeft;
				--maxNumberOfVotesLeft;
			}
			else {
				
				voteRemainingCounterMin.textContent = --minNumberOfVotesLeft >= 0 ? minNumberOfVotesLeft : 0;
				voteRemainingCounterMax.textContent = --maxNumberOfVotesLeft;
				
			}
			
			if(minNumberOfVotesLeft == 0){
				submitVotesButton.disabled = false;
			}
			
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
			
			voteIndexes = voteIndexes.filter(index => index != button.dataset.voterindex);
			
			button.hidden = true;
			document.getElementById(`vote-candidate-${button.dataset.voternumber}`).hidden = false;
			
			if (minNumberOfVotesLeft == maxNumberOfVotesLeft) {
				voteRemainingCounter.textContent = ++minNumberOfVotesLeft;
				++maxNumberOfVotesLeft;
			}
			else {
				
				voteRemainingCounterMin.textContent = ++minNumberOfVotesLeft >= 0 ? minNumberOfVotesLeft : 0;
				voteRemainingCounterMax.textContent = ++maxNumberOfVotesLeft;
				
			}
			
			const disabledNonVotedCandidatesButtons = document.querySelectorAll("button[id^=vote-candidate-][disabled]");
			
			disabledNonVotedCandidatesButtons.forEach(button => button.disabled = false);
			
			if(minNumberOfVotesLeft != 0){
				submitVotesButton.disabled = true;
			}
			
		});
	});
	
	let isVoteFinished = false;
	
	const votingOverlay = document.getElementById("voting-voted-overlay");
	
	submitVotesButton.addEventListener("click", () => {
		
		submitVotesButton.disabled = true;
		votingOverlay.classList.add("active");
		
		setTimeout(() => {
			
			voteIndexes.forEach(voteIndex => {
				
				data.candidates[voteIndex].voteCount++;
				
			});
			
			voteIndexes = [];
			
			votingButtons.forEach(button => {
				button.hidden = false;
				button.disabled = false;
			});
			unvoteButtons.forEach(button => button.hidden = true);
			
			numberOfVotesLeft = data.numberOfVotePerVoter;
			voteRemainingCounter.textContent = numberOfVotesLeft;
			
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
			
			votersRemainingCountToast.innerText = `${data.numberOfVoters - data.numberOfVoted} voteur(s) restant sur ${data.numberOfVoters}`;
			
			toastContainer.classList.remove("i-am-away")
			$("#voting-toasts-container > .toast").toast("show");
			
		}
		
		if (isVoteFinished) {
			
			isVoteFinished = false;
			
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
		
		switch_view("pre-results-page", () => setup_pre_results_page(data));
		document.body.onkeyup = onKeyUpEventBefore;
		
	}
	
}
