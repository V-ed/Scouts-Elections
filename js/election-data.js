class ElectionData {
	
	constructor(dbName, dbPsw, numberOfVoters, numberOfVotePerVoterMin, numberOfVotePerVoterMax, allowMultipleSameCandidate, numberOfVoted, numberOfSeatsTaken, hasSkipped, isDownloadDisabled, candidates, groupImage) {
		this.dbName = dbName;
		this.dbPsw = dbPsw;
		this.numberOfVoters = numberOfVoters;
		this.numberOfVotePerVoterMin = numberOfVotePerVoterMin;
		this.numberOfVotePerVoterMax = numberOfVotePerVoterMax;
		this.allowMultipleSameCandidate = allowMultipleSameCandidate;
		this.numberOfVoted = numberOfVoted;
		this.numberOfSeatsTaken = numberOfSeatsTaken;
		this.hasSkipped = hasSkipped;
		this.isDownloadDisabled = isDownloadDisabled;
		this.candidates = candidates;
		this.groupImage = groupImage;
	}
	
	getAsJSON(excludeSharedElectionCode) {
		
		const sharedCode = this.sharedElectionCode;
		
		if (excludeSharedElectionCode) {
			delete this.sharedElectionCode;
		}
		
		const jsoned = JSON.stringify(this);
		
		if (excludeSharedElectionCode) {
			this.sharedElectionCode = sharedCode;
		}
		
		return jsoned;
		
	}
	
	validatePassword(passwordToCheck) {
		// Default password if not set is "VL" for "Vieux-Loups"
		return (this.dbPsw || "VL") == passwordToCheck;
	}
	
	setSharedElectionCode(sharedElectionCode) {
		
		function handleHiddenAndFlex(element, doHide) {
		
			element.hidden = doHide;
			
			if (element.classList.contains("d-flex")) {
				element.classList.remove("d-flex");
				element.setAttribute("data-shared-did-flex", "true");
			}
			else if (element.getAttribute("data-shared-did-flex") == "true") {
				element.classList.add("d-flex");
				element.removeAttribute("data-shared-did-flex");
			}
			
		}
		
		document.querySelectorAll(".shared-election-code").forEach(elem => elem.textContent = sharedElectionCode);
		document.querySelectorAll(".shared-election-container").forEach(elem => handleHiddenAndFlex(elem, !sharedElectionCode));
		document.querySelectorAll(".non-shared-election-container").forEach(elem => handleHiddenAndFlex(elem, !!sharedElectionCode));
		
		if (sharedElectionCode) {
			this.sharedElectionCode = sharedElectionCode;
		}
		else {
			delete this.sharedElectionCode;
		}
		
	}
	
	voteCandidate(index, count) {
		const numberIndex = parseInt(index);
		
		if (isNaN(numberIndex)) {
			throw "index given is not a number!"
		}
		
		if (typeof this.votesCurrentCandidateIndexes == "undefined") {
			this.votesCurrentCandidateIndexes = [];
		}
		
		for (let i = 0; i < count; i++) {
			this.votesCurrentCandidateIndexes.push(numberIndex);
		}
	}
	
	unvoteCandidate(index, count) {
		const numberIndex = parseInt(index);
		
		if (isNaN(numberIndex)) {
			throw "index given is not a number!"
		}
		
		if (typeof this.votesCurrentCandidateIndexes == "undefined") {
			return;
		}
		
		for (let i = 0; i < count && i < this.votesCurrentCandidateIndexes.length; i++) {
			let candidateIndex = this.votesCurrentCandidateIndexes.findIndex(currentIndex => currentIndex == numberIndex);
			candidateIndex !== -1 && this.votesCurrentCandidateIndexes.splice(candidateIndex, 1);
		}
	}
	
	resetCandidateVotes() {
		delete this.votesCurrentCandidateIndexes;
	}
	
	mergeData(data) {
		
		for (const value in data) {
			this[value] = data[value];
		}
		
	}
	
	static fromData(dbName, dbPsw, numberOfVoters, numberOfVotePerVoterMin, numberOfVotePerVoterMax, allowMultipleSameCandidate, candidateNames, compressedImageData) {
		const candidates = Array.from(candidateNames).map(name => (
		{
			name: name,
			voteCount: 0,
			selectedState: "unselected"
		}
		));
		
		return new ElectionData(
			dbName,
			dbPsw,
			numberOfVoters,
			numberOfVotePerVoterMin,
			numberOfVotePerVoterMax,
			allowMultipleSameCandidate,
			0,
			0,
			false,
			Utils.isDownloadDisabled,
			candidates,
			compressedImageData
			);
	}
	
	static fromFormData(formData, candidateNames, compressedImageData) {
		return ElectionData.fromData(
			formData.get("dbName"),
			formData.get("dbPsw"),
			parseInt(formData.get("numberOfVoters")),
			parseInt(formData.get("numberOfVotesMin")),
			parseInt(formData.get("numberOfVotesMax")),
			formData.get("allowMultipleSameCandidate") == "on",
			candidateNames,
			compressedImageData
			);
	}
	
	static fromJSON(json) {
		
		if (typeof json == "string") {
			try {
				json = JSON.parse(json);
			} catch (error) {
				throw "Une erreur est survenue lors du chargement du fichier : veuillez vous assurer que le fichier JSON est conforme.";
			}
		}
		
		const isValid = data.dbName !== undefined
			&& data.numberOfVoters !== undefined
			&& (data.numberOfVotePerVoter !== undefined || (data.numberOfVotePerVoterMin !== undefined && data.numberOfVotePerVoterMax !== undefined))
			&& data.numberOfVoted !== undefined
			&& data.hasSkipped !== undefined
			&& data.candidates !== undefined;
		
		if (isValid) {
			
			// Backward compatibility with v0.1 databases
			if (data.numberOfVotePerVoter !== undefined) {
				data.numberOfVotePerVoterMin = data.numberOfVotePerVoter;
				data.numberOfVotePerVoterMax = data.numberOfVotePerVoter;
				
				delete data.numberOfVotePerVoter;
			}
			
			return new ElectionData(dbName,
				dbPsw,
				numberOfVoters,
				numberOfVotePerVoterMin,
				numberOfVotePerVoterMax,
				allowMultipleSameCandidate,
				numberOfVoted,
				numberOfSeatsTaken,
				hasSkipped,
				isDownloadDisabled,
				candidates,
				groupImage
				);
			
		}
		else{
			throw "La base de données manque des informations cruciales - veuillez valider les données dans le fichier.";
		}
		
	}

}