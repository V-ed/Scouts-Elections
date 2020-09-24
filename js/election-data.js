import Utils from "./utilities.js";

export class ElectionData {
	
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
	
	/**
	 * 
	 * @param {number} index 
	 * @param {number} count 
	 */
	voteCandidate(index, count) {
		if (typeof this.votesCurrentCandidateIndexes == "undefined") {
			/**
			 * @type {number[]}
			 */
			this.votesCurrentCandidateIndexes = [];
		}
		
		for (let i = 0; i < count; i++) {
			this.votesCurrentCandidateIndexes.push(index);
		}
	}
	
	/**
	 * 
	 * @param {number} index 
	 * @param {number} count 
	 */
	unvoteCandidate(index, count) {
		if (typeof this.votesCurrentCandidateIndexes == "undefined") {
			return;
		}
		
		for (let i = 0; i < count && i < this.votesCurrentCandidateIndexes.length; i++) {
			let candidateIndex = this.votesCurrentCandidateIndexes.findIndex(currentIndex => currentIndex == index);
			candidateIndex !== -1 && this.votesCurrentCandidateIndexes.splice(candidateIndex, 1);
		}
	}
	
	resetCandidateVotes() {
		delete this.votesCurrentCandidateIndexes;
	}
	
	/**
	 * 
	 * @param {ElectionData} data 
	 */
	mergeData(data) {
		
		for (const value in data) {
			this[value] = data[value];
		}
		
	}
	
	/**
	 * 
	 * @param {string} dbName 
	 * @param {string} dbPsw 
	 * @param {number} numberOfVoters 
	 * @param {number} numberOfVotePerVoterMin 
	 * @param {number} numberOfVotePerVoterMax 
	 * @param {boolean} allowMultipleSameCandidate 
	 * @param {string[]} candidateNames 
	 * @param {string} [compressedImageData] 
	 */
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
	
	/**
	 * 
	 * @param {FormData} formData 
	 * @param {FormDataEntryValue[]} candidateNames 
	 * @param {string} [compressedImageData] 
	 */
	static fromFormData(formData, candidateNames, compressedImageData) {
		return ElectionData.fromData(
			formData.get("dbName").toString(),
			formData.get("dbPsw").toString(),
			parseInt(formData.get("numberOfVoters").toString()),
			parseInt(formData.get("numberOfVotesMin").toString()),
			parseInt(formData.get("numberOfVotesMax").toString()),
			formData.get("allowMultipleSameCandidate") == "on",
			candidateNames.map(candidateName => candidateName.toString()),
			compressedImageData
		);
	}
	
	static fromJSON(json) {
		
		let data = undefined;
		
		if (typeof json == "string") {
			try {
				data = JSON.parse(json);
			} catch (error) {
				throw "Une erreur est survenue lors du chargement du fichier : veuillez vous assurer que le fichier JSON est conforme.";
			}
		}
		else {
			data = json;
		}
		
		const isValid = data.dbName !== undefined
			&& data.numberOfVoters !== undefined
			&& (data.numberOfVotePerVoter !== undefined || (data.numberOfVotePerVoterMin !== undefined && data.numberOfVotePerVoterMax !== undefined))
			&& data.numberOfVoted !== undefined
			&& data.hasSkipped !== undefined
			&& data.candidates !== undefined;
		
		if (isValid) {
			
			// START OF BACKWARD COMPATIBILITY with v0.1 databases
			if (data.numberOfVotePerVoter !== undefined) {
				data.numberOfVotePerVoterMin = data.numberOfVotePerVoter;
				data.numberOfVotePerVoterMax = data.numberOfVotePerVoter;
				
				delete data.numberOfVotePerVoter;
			}
			
			if (data.numberOfSeatsTaken == undefined) {
				data.numberOfSeatsTaken = data.numberOfVoted + 1;
			}
			// END OF BACKWARD COMPATIBILITY
			
			const electionData = new ElectionData(data.dbName,
				data.dbPsw,
				data.numberOfVoters,
				data.numberOfVotePerVoterMin,
				data.numberOfVotePerVoterMax,
				data.allowMultipleSameCandidate,
				data.numberOfVoted,
				data.numberOfSeatsTaken,
				data.hasSkipped,
				data.isDownloadDisabled,
				data.candidates,
				data.groupImage
			);
			
			if (data.sharedElectionCode) {
				electionData.setSharedElectionCode(data.sharedElectionCode);
			}
			
			return electionData;
			
		}
		else{
			throw "La base de données manque des informations cruciales - veuillez valider les données dans le fichier.";
		}
		
	}

}

export default ElectionData;
