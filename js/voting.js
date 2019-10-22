var onKeyUpEventBefore;

function setup_voting_session(data) {
	
	window.addEventListener("beforeunload", () => {
		
		if (!didDownloadDb) {
			
			download_data(data);
			
		}
		
	});
	
	onKeyUpEventBefore = document.body.onkeyup;
	
	var voteIndexes = [];
	
	var cardsHtml = "";
	
	for(var i = 1; i <= data.candidates.length; i++){
		
		var candidateIndex = i - 1;
		
		var candidateData = data.candidates[candidateIndex];
		
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
	
	var cardsContainer = document.getElementById("cards-container");
	
	$(cardsContainer).append(`<div class="row d-flex justify-content-center px-2 px-md-0">${cardsHtml}</div>`);
	
	var voteRemainingCounter = document.getElementById("voting-remaining-count");
	
	var numberOfVotesLeft = data.numberOfVotePerVoter;
	
	voteRemainingCounter.textContent = numberOfVotesLeft;
	
	var submitVotesButton = document.getElementById("voting-submit-button");
	
	var votingButtons = document.querySelectorAll("button[id^=vote-candidate-]");
	
	votingButtons.forEach(button => {
		button.addEventListener("click", e => {
			e.preventDefault();
			
			voteIndexes.push(button.dataset.voterindex);
			
			button.hidden = true;
			document.getElementById(`unvote-candidate-${button.dataset.voternumber}`).hidden = false;
			
			voteRemainingCounter.textContent = --numberOfVotesLeft;
			
			if(numberOfVotesLeft == 0){
				
				var nonVotedCandidatesButtons = document.querySelectorAll("button[id^=vote-candidate-]:not([hidden])");
				
				nonVotedCandidatesButtons.forEach(button => button.disabled = true);
				
				submitVotesButton.disabled = false;
				
			}
			
		});
	});
	
	var unvoteButtons = document.querySelectorAll("button[id^=unvote-candidate-]");
	
	unvoteButtons.forEach(button => {
		button.addEventListener("click", e => {
			e.preventDefault();
			
			voteIndexes = voteIndexes.filter(index => index != button.dataset.voterindex);
			
			button.hidden = true;
			document.getElementById(`vote-candidate-${button.dataset.voternumber}`).hidden = false;
			
			voteRemainingCounter.textContent = ++numberOfVotesLeft;
			
			var disabledNonVotedCandidatesButtons = document.querySelectorAll("button[id^=vote-candidate-][disabled]");
			
			disabledNonVotedCandidatesButtons.forEach(button => button.disabled = false);
			
			submitVotesButton.disabled = true;
			
		});
	});
	
	var isVoteFinished = false;
	
	var votingOverlay = document.getElementById("voting-voted-overlay");
	
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
	
	var votersRemainingCountToast = document.getElementById("voters-remaining-count-toast");
	
	document.body.onkeyup = e => {
		e.preventDefault();
		
		if(e.key == " " || e.keyCode == 32){
			
			go_to_next_voter(data);
			
		}
	}
	
	if (isTouchDevice) {
		
		var timer;
		var touchDuration = 500;
		
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
	
	function go_to_next_voter(data) {
		
		if (isVoteFinished && data.numberOfVoted == data.numberOfVoters) {
			end_voting_session(data);
		}
		else{
			
			votersRemainingCountToast.innerText = `${data.numberOfVoters - data.numberOfVoted} voteur(s) restant sur ${data.numberOfVoters}`;
			
			$("#voting-toasts-container > .toast").toast("show");
			
		}
		
		if (isVoteFinished) {
			
			isVoteFinished = false;
			
			votingOverlay.classList.remove("active");
			
		}
		
	}
	
	var skipVotesButton = document.getElementById("voting-skip-button");
	
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
