var onKeyUpEventBefore;

function setup_voting_session(data) {
	
	onKeyUpEventBefore = document.body.onkeyup;
	
	var voteIndexes = [];
	
	var cardsHtml = "";
	
	for(var i = 1; i <= data.candidates.length; i++){
		
		var candidateIndex = i - 1;
		
		// Create rows for each 4 cards
		if (candidateIndex % 4 == 0) {
			cardsHtml += `<div class="row d-flex justify-content-center my-2">`;
		}
		
		var candidateData = data.candidates[candidateIndex];
		
		cardsHtml += `
		<div class="col-3">
			<div class="card">
				<div class="card-body text-center">
					<h5 class="card-title">${candidateData.name}</h5>
					<button id="vote-candidate-${i}" type="button" class="btn btn-primary" data-voterindex="${candidateIndex}" data-voternumber="${i}">Voter</button>
					<button id="unvote-candidate-${i}" type="button" class="btn btn-danger" data-voterindex="${candidateIndex}" data-voternumber="${i}" hidden>Enlever Vote</button>
				</div>
			</div>
		</div>`;
		
		// End rows for each 4 cards
		if (candidateIndex % 4 == 3) {
			cardsHtml += `</div>`;
		}
		
	}
	
	var cardsContainer = document.getElementById("cards-container");
	
	$(cardsContainer).append(cardsHtml);
	
	var voteRemainingCounter = document.getElementById("voting-remaining-count");
	
	var numberOfVotesLeft = data.numberOfVotePerVoter;
	
	voteRemainingCounter.textContent = numberOfVotesLeft;
	
	var submitVotesButton = document.getElementById("voting-submit-button");
	
	var votingButtons = document.querySelectorAll("button[id^=vote-candidate-]");
	
	votingButtons.forEach(function (button) {
		button.addEventListener("click", function (e) {
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
	
	unvoteButtons.forEach(function (button) {
		button.addEventListener("click", function (e) {
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
	
	var voterCountRemaining = data.numberOfVoters;
	var isVoteFinished = false;
	
	var votingOverlay = document.getElementById("voting-voted-overlay");
	
	submitVotesButton.addEventListener("click", function (e) {
		
		submitVotesButton.disabled = true;
		votingOverlay.classList.add("active");
		
		setTimeout(function() {
			
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
			
			voterCountRemaining--;
			isVoteFinished = true;
			
			data.numberOfVoted++;
			
		}, 1200);
		
	});
	
	var votersRemainingCountToast = document.getElementById("voters-remaining-count-toast");
	
	document.body.onkeyup = function(e) {
		e.preventDefault();
		
		if(e.keyCode == 32){
			
			if (isVoteFinished && voterCountRemaining == 0) {
				switch_view("pre-results-page", () => setup_pre_results_page(data));
				document.body.onkeyup = onKeyUpEventBefore;
			}
			else{
				
				votersRemainingCountToast.innerText = `${voterCountRemaining} vote(s) restant sur ${data.numberOfVoters}`;
				
				$("#voting-toasts-container > .toast").toast("show");
				
			}
			
			if (isVoteFinished) {
				
				isVoteFinished = false;
				
				votingOverlay.classList.remove("active");
				
			}
			
		}
	}
	
}