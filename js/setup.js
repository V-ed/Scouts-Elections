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
			<input type="text" class="form-control" id="candidate-${number}" aria-describedby="candidate-${number}" placeholder="Nom" name="candidate-${number}" data-candidatenumber="${number}">
		</div>
	</div>`);
	
	candidateRemoveButton.hidden = false;
	
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
