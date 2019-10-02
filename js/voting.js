var tempCandidates = [];

tempCandidates.push({name: "candidate 1", voteCount: 0});
tempCandidates.push({name: "candidate 2", voteCount: 0});
tempCandidates.push({name: "candidate 3", voteCount: 0});
tempCandidates.push({name: "candidate 4", voteCount: 0});
tempCandidates.push({name: "candidate 5", voteCount: 0});
tempCandidates.push({name: "candidate 6", voteCount: 0});
tempCandidates.push({name: "candidate 7", voteCount: 0});

var tempData = {
	dbName: "TestDB",
	numberOfVoters: 20,
	numberOfVotePerVoter: 4,
	candidates: tempCandidates
}

function setup_voting_session(data) {
	
	var cardsHtml = "";
	
	for(var i = 1; i <= data.candidates.length; i++){
		
		// Create rows for each 4 cards
		if ((i - 1) % 4 == 0) {
			cardsHtml += `<div class="row d-flex justify-content-center my-2">`;
		}
		
		var candidateData = data.candidates[i - 1];
		
		cardsHtml += `
		<div class="col-3">
			<div class="card">
				<div class="card-body text-center">
					<h5 class="card-title">${candidateData.name}</h5>
					<button id="vote-candidate-${i}" type="button" class="btn btn-primary">Voter</button>
				</div>
			</div>
		</div>`;
		
		// End rows for each 4 cards
		if ((i - 1) % 4 == 3) {
			cardsHtml += `</div>`;
		}
		
	}
	
	var cardsContainer = document.getElementById("cards-container");
	
	$(cardsContainer).append(cardsHtml);
	
	var voteRemainingCounter = document.getElementById("voting-remaining-count");
	
	voteRemainingCounter.textContent = data.numberOfVotePerVoter;
	
}