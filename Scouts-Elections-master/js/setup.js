var candidateAddButton = document.getElementById("candidate-add");
var candidateRemoveButton = document.getElementById("candidate-remove");
var candidateContainer = document.getElementById("setup-candidates");

var form = new FormData(document.getElementById("form"));


var candidateSubmitButton = document.getElementById("candidate-submit");

candidateAddButton.addEventListener("click", function (e) {
	e.preventDefault();
	
	var number = ++candidateAddButton.dataset.candidatecount;
	
	$(candidateContainer).append(`
	<div id="candidate-controls-${number}" class="form-group row">
	<label class="col-sm-2 col-form-label" for="candidate-${number}">Candidat ${number}</label>
	<div class="col-sm-10">
	<input type="text" class="form-control" id="candidate-${number}" aria-describedby="candidate-${number}" placeholder="Nom">
	</div>
	</div>`);
	
	candidateRemoveButton.hidden = false;
	
});

candidateRemoveButton.addEventListener("click", function (e) {
	e.preventDefault();
	
	var number = candidateAddButton.dataset.candidatecount--;
	
	document.getElementById(`candidate-controls-${number}`).remove();
	
	if (number == 2) {
		candidateRemoveButton.hidden = true;
	}
	
});

candidateSubmitButton.addEventListener("click", function (e){
	e.preventDefault();

	

});

var tempCandidates = [];


for(var i = 1;  candidateData = formData.get(`candidate-${i}`); candidateData != null) i++;{
	
	tempCandidates.push(candidateData[i]);
}

var candidateData = {

	dbName: "TestDB",
	numberOfVoters: 20,
	numberOfVotePerVoter: 4,
	candidates: tempCandidates
}


