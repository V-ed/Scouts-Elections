function setup_post_voting(data, sharedElectionCode) {
	
	initialize_images("post-shared-voting-page", data.groupImage);
	
	const sharedPostVoteButtonVerify = document.getElementById("shared-post-votes-verify");
	const sharedPostVoteButtonGo = document.getElementById("shared-post-votes-go");
	const sharedPostVoteButtonGoAndDelete = document.getElementById("shared-post-votes-go-and-delete");
	
	const sharedPostVoteFinishedIcon = document.getElementById("post-shared-voting-verify-finished-icon");
	const sharedPostVoteNotFinishedIcon = document.getElementById("post-shared-voting-verify-not-finished-icon");
	
	let autoClickVerifyTimerSeconds = 30;
	const sharedPostVerifyAutoClickTimer = document.getElementById("shared-post-verify-auto-click-timer");
	
	function resetAutoClickVerifyTimer(count) {
		
		autoClickVerifyTimerSeconds = count;
		
		sharedPostVerifyAutoClickTimer.textContent = ` (${autoClickVerifyTimerSeconds})`;
		
		const intervalId = setInterval(() => {
			
			sharedPostVerifyAutoClickTimer.textContent = ` (${--autoClickVerifyTimerSeconds})`;
			
			if (autoClickVerifyTimerSeconds <= 0) {
				
				clearInterval(intervalId);
				
				sharedPostVoteButtonVerify.dispatchEvent(new Event("click"));
				
			}
			
		}, 1000);
		
		return intervalId;
		
	}
	
	let autoClickVerifyTimer = undefined;
	
	function handleVerificationDisabling(data) {
		
		const didAllVoted = data.numberOfVoted == data.numberOfVoters;
		
		sharedPostVoteButtonVerify.disabled = didAllVoted;
		sharedPostVoteButtonGo.disabled = !didAllVoted;
		sharedPostVoteButtonGoAndDelete.disabled = !didAllVoted;
		
		clearInterval(autoClickVerifyTimer);
		
		if (didAllVoted) {
			sharedPostVoteFinishedIcon.hidden = false;
			
			sharedPostVerifyAutoClickTimer.hidden = true;
		}
		else {
			sharedPostVoteNotFinishedIcon.hidden = false;
			
			autoClickVerifyTimer = resetAutoClickVerifyTimer(30);
		}
		
	}
	
	handleVerificationDisabling(data);
	
	const sharedPostVoteButtonSkipWait = document.getElementById("shared-post-votes-skip-wait");
	
	sharedPostVoteButtonSkipWait.addEventListener("click", () => {
		
		clearInterval(autoClickVerifyTimer);
		
		setup_results(data);
		
		uninitialize_images("voting-page");
		
	});
	
	const errorInternetErrorMessage = "Une erreur de requête est survenue, veuillez vérifier votre accès Internet ou utilisez l'option de voir les résultats localement!";
	
	sharedPostVoteButtonVerify.addEventListener("click", async () => {
		
		const ajaxSettings = {
			url: `${sharedElectionHostRoot}/retrieve/${sharedElectionCode}?numberOfVoted&candidates`,
			cache: false,
		};
		
		sharedPostVoteFinishedIcon.hidden = true;
		sharedPostVoteNotFinishedIcon.hidden = true;
		
		sharedPostVoteButtonVerify.disabled = true;
		clearInterval(autoClickVerifyTimer);
		
		const sharedPostVotesVerifyErrorSpan = document.getElementById("shared-post-votes-verify-error-span");
		
		try {
			
			sharedPostVotesVerifyErrorSpan.hidden = true;
			
			const response = await sendRequest(ajaxSettings, 'post-shared-voting-verify-requester-container');
			
			mergeObjectTo(data, response.data, false, false);
			
		} catch (error) {
			
			const messageToShow = error.status == 400 ? `Le code ${sharedElectionCode} n'est pas sur le serveur. Un autre appareil a probablement déjà supprimer les données du serveur! Vous pouvez cependant utiliser l'option de voir les résultats localement.` : errorInternetErrorMessage;
			
			sharedPostVotesVerifyErrorSpan.textContent = messageToShow;
			sharedPostVotesVerifyErrorSpan.hidden = false;
			
		}
		
		handleVerificationDisabling(data);
		
	});
	
	sharedPostVoteButtonGo.addEventListener("click", async () => {
		
		const ajaxSettings = {
			url: `${sharedElectionHostRoot}/retrieve/${sharedElectionCode}`,
			cache: false,
		};
		
		sharedPostVoteButtonGo.disabled = true;
		
		const sharedPostVotesGoErrorSpan = document.getElementById("shared-post-votes-go-error-span");
		
		try {
			
			sharedPostVotesGoErrorSpan.hidden = true;
			
			const response = await sendRequest(ajaxSettings, 'post-shared-votes-go-requester-container');
			
			mergeObjectTo(data, response.data, false, false);
			
			setup_results(data);
			
			uninitialize_images("voting-page");
			
		} catch (error) {
			
			const messageToShow = error.status == 400 ? `Le code ${sharedElectionCode} n'est pas sur le serveur. Un autre appareil a probablement déjà supprimer les données du serveur! Vous pouvez cependant utiliser l'option de voir les résultats localement.` : errorInternetErrorMessage;
			
			sharedPostVotesGoErrorSpan.textContent = messageToShow;
			sharedPostVotesGoErrorSpan.hidden = false;
			
		}
		
		sharedPostVoteButtonGo.disabled = false;
		
	});
	
	sharedPostVoteButtonGoAndDelete.addEventListener("click", async () => {
		
		const ajaxSettings = {
			type: 'DELETE',
			url: `${sharedElectionHostRoot}/delete/${sharedElectionCode}`,
			cache: false,
		};
		
		sharedPostVoteButtonGoAndDelete.disabled = true;
		
		const sharedPostVotesGoAndDeleteErrorSpan = document.getElementById("shared-post-votes-go-and-delete-error-span");
		
		try {
			
			sharedPostVotesGoAndDeleteErrorSpan.hidden = true;
			
			const response = await sendRequest(ajaxSettings, 'post-shared-votes-go-and-delete-requester-container');
			
			mergeObjectTo(data, response.data, false, false);
			
			setup_results(data);
			
			uninitialize_images("voting-page");
			
		} catch (error) {
			
			const messageToShow = error.status == 400 ? `Le code ${sharedElectionCode} n'est pas sur le serveur. Un autre appareil a probablement déjà supprimer les données du serveur! Vous pouvez cependant utiliser l'option de voir les résultats localement.` : errorInternetErrorMessage;
			
			sharedPostVotesGoAndDeleteErrorSpan.textContent = messageToShow;
			sharedPostVotesGoAndDeleteErrorSpan.hidden = false;
			
		}
		
		sharedPostVoteButtonGoAndDelete.disabled = false;
		
	});
	
}

function setup_results(data) {
	
	if (data.dbPsw || data.dbPsw == undefined) {
		switch_view("pre-results-page", () => setup_pre_results_page(data));
	}
	else {
		switch_view("results-page", () => setup_results_page(data));
	}
	
}

function setup_pre_results_page(data) {
	
	initialize_images("pre-results-page", data.groupImage);
	
	// Default password if not set is "VL" for "Vieux-Loups"
	let passwordToCheck = data.dbPsw || "VL";
	
	const preResultsSubmitButton = document.getElementById("pre-results-submit-button");
	
	const passwordInput = document.getElementById("pre-results-password-input");
	
	preResultsSubmitButton.addEventListener("click", e => {
		e.preventDefault();
		
		const password = passwordInput.value;
		
		if (password == passwordToCheck) {
			
			switch_view("results-page", () => setup_results_page(data));
			
			uninitialize_images("pre-results-page");
			
		}
		else {
			
			passwordInput.classList.add("is-invalid");
			preResultsSubmitButton.disabled = true;
			
		}
		
	});
	
	passwordInput.addEventListener("input", () => {
		
		passwordInput.classList.remove("is-invalid");
		preResultsSubmitButton.disabled = false;
		
	});
	
}

function setup_results_page(data) {
	
	initialize_images("results-page", data.groupImage);
	
	const resultsTableBody = document.getElementById("results-body");
	
	const candidatesClone = JSON.parse(JSON.stringify(data.candidates));
	const sortedCandidates = candidatesClone.sort((a, b) => (a.voteCount > b.voteCount) ? -1 : ((b.voteCount > a.voteCount) ? 1 : 0));
	
	let tableBodyHtml = "";
	
	let countOfEqual = 0;
	let lastVoteCount = -1;
	
	sortedCandidates.forEach((candidate, i) => {
		
		if (lastVoteCount == candidate.voteCount) {
			countOfEqual++;
		}
		
		let candidateBackground = "";
		let candidateSelectedState = "unselected";
		
		switch (candidate.selectedState) {
			case "pre-selected":
				candidateBackground = " bg-warning";
				candidateSelectedState = "pre-selected";
				break;
			case "selected":
				candidateBackground = " bg-success";
				candidateSelectedState = "selected";
				break;
			default:
				candidateBackground = "";
				candidateSelectedState = "unselected";
				break;
		}
		
		tableBodyHtml += `
		<tr class="clickable-row${candidateBackground}" data-stateselected="${candidateSelectedState}" data-candidate="${candidate.name}">
			<th scope="row">${i + 1}</th>
			<td>${i + 1 - countOfEqual}</td>
			<td>${candidate.name}</td>
			<td>${candidate.voteCount}</td>
		</tr>`;
		
		lastVoteCount = candidate.voteCount;
		
	});
	
	$(resultsTableBody).append(tableBodyHtml);
	
	$(resultsTableBody).on("click", ".clickable-row", e => {
		
		const row = e.currentTarget;
		
		$(row).removeClass("bg-warning bg-success");
		
		let candidateState = "problem (not changed)";
		
		if (row.dataset.stateselected == "unselected") {
			
			$(row).toggleClass("bg-warning");
			candidateState = "pre-selected";
			
		}
		else if (row.dataset.stateselected == "pre-selected") {
			
			$(row).toggleClass("bg-success");
			candidateState = "selected";
			
		}
		else if (row.dataset.stateselected == "selected") {
			
			candidateState = "unselected";
			
		}
		
		row.dataset.stateselected = candidateState;
		
		const candidateObject = data.candidates.find(candidate => candidate.name == row.dataset.candidate);
		
		candidateObject.selectedState = candidateState;
		
		dbIsDirty = true;
		
	});
	
	const legendToggler = document.querySelector("a[data-toggle='collapse'][data-target='#results-click-explications']");
	$("#results-click-explications").on("hidden.bs.collapse", function () {
		legendToggler.text = "Plus";
	});
	$("#results-click-explications").on("hide.bs.collapse show.bs.collapse", function () {
		legendToggler.text = "";
	});
	$("#results-click-explications").on("shown.bs.collapse", function () {
		legendToggler.text = "Moins";
	});
	
	const downloadDbButton = document.getElementById("results-download-button");
	
	downloadDbButton.addEventListener("click", e => {
		e.preventDefault();
		
		download_data(data);
	});
	
	const homepageButton = document.getElementById("results-homepage-button");
	
	homepageButton.addEventListener("click", () => {
		
		let canReload = true;
		
		if (should_download_data()) {
			
			canReload = confirm("La base de données n'est pas enregistrée. Êtes vous sûr de vouloir continuer?");
			
		}
		
		if (canReload) {
			
			window.removeEventListener("beforeunload", auto_download_data);
			
			isDownloadDisabled = true;
			document.location.reload(true);
			
		}
		
	});
	
}
