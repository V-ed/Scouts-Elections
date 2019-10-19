function setup_pre_results_page(data) {
	
	var preResultsSubmitButton = document.getElementById("pre-results-submit-button");
	
	var passwordInput = document.getElementById("pre-results-password-input");
	
	preResultsSubmitButton.addEventListener("click", e => {
		e.preventDefault();
		
		var password = passwordInput.value;
		
		// Password is "VL" for "Vieux-Loups"
		if (password == "VL") {
			
			switch_view("results-page", () => setup_results_page(data));
			
		}
		else {
			
			passwordInput.classList.add("is-invalid");
			preResultsSubmitButton.disabled = true;
			
		}
		
	});
	
	passwordInput.addEventListener("input", () => {
		
		passwordInput.classList.remove("is-invalid")
		preResultsSubmitButton.disabled = false;
		
	});
	
}

function setup_results_page(data) {
	
	var resultsTableBody = document.getElementById("results-body");
	
	var candidatesClone = JSON.parse(JSON.stringify(data.candidates));
	var sortedCandidates = candidatesClone.sort((a, b) => (a.voteCount > b.voteCount) ? -1 : ((b.voteCount > a.voteCount) ? 1 : 0));
	
	var tableBodyHtml = "";
	
	var countOfEqual = 0;
	var lastVoteCount = -1;
	
	sortedCandidates.forEach((candidate, i) => {
		
		if (lastVoteCount == candidate.voteCount) {
			countOfEqual++;
		}
		
		tableBodyHtml += `
		<tr class="clickable-row">
			<th scope="row">${i + 1}</th>
			<td>${i + 1 - countOfEqual}</td>
			<td>${candidate.name}</td>
			<td>${candidate.voteCount}</td>
		</tr>`;
		
		lastVoteCount = candidate.voteCount;
		
	});
	
	$(resultsTableBody).append(tableBodyHtml);
	
	$(resultsTableBody).on("click", ".clickable-row", () => {
		$(this).toggleClass("bg-success");
	});
	
	var downloadDbButton = document.getElementById("results-download-button");
	
	downloadDbButton.addEventListener("click", e => {
		e.preventDefault();
		
		download_data(data);
		
		didDownloadDb = true;
		
	});
	
	var homepageButton = document.getElementById("results-homepage-button");
	
	homepageButton.addEventListener("click", () => document.location.reload(true));
	
}
