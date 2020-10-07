import Utils from "./utilities.js";

/**
 * @typedef Candidate
 * @property {string} name
 * @property {number} voteCount
 * @property {'unselected' | 'pre-selected' | 'selected'} selectedState
 */

export class ElectionData {
	
	/**
	 * 
	 * @param {string} dbName 
	 * @param {string} dbPsw 
	 * @param {number} numberOfVoters 
	 * @param {number} numberOfVotePerVoterMin 
	 * @param {number} numberOfVotePerVoterMax 
	 * @param {boolean} allowMultipleSameCandidate 
	 * @param {number} numberOfVoted 
	 * @param {number} numberOfSeatsTaken 
	 * @param {boolean} hasSkipped 
	 * @param {boolean} isDownloadDisabled 
	 * @param {Candidate[]} candidates 
	 * @param {string} [groupImage] 
	 */
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
		
		/** @type {string | undefined} */
		this.sharedElectionCode = undefined;
	}
	
	/**
	 * 
	 * @param {boolean} [excludeSharedElectionCode] 
	 */
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
	
	/**
	 * 
	 * @param {string} passwordToCheck 
	 */
	validatePassword(passwordToCheck) {
		// Default password if not set is "VL" for "Vieux-Loups"
		return (this.dbPsw || "VL") == passwordToCheck;
	}
	
	/**
	 * 
	 * @param {string | void} [sharedElectionCode] 
	 */
	setSharedElectionCode(sharedElectionCode) {
		
		if (sharedElectionCode) {
			this.sharedElectionCode = sharedElectionCode;
			Utils.showSharedCode(this.sharedElectionCode);
		}
		else {
			Utils.hideSharedCodes();
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
		
		const candidates = Array.from(candidateNames).map(name => /** @type {Candidate} */ (
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
	
	/**
	 * 
	 * @param {string | Record<string, *>} json Could be a string or any object
	 */
	static fromJSON(json) {
		
		/**
		 * 
		 * @param {string | Record<string, *>} json
		 * @returns {Record<string, *>} 
		 */
		function getJsonAsRecord(json) {
			if (typeof json == "string") {
				let data = undefined;
				try {
					data = JSON.parse(json);
				} catch (error) {
					throw "Une erreur est survenue lors du chargement du fichier : veuillez vous assurer que le fichier JSON est conforme.";
				}
				if (typeof data != 'object') {
					throw "Les données du fichier ne sont pas sous forme d'objet.";
				}
				return data;
			}
			else {
				return json;
			}
		}
		
		const data = getJsonAsRecord(json);
		
		if (typeof data.dbName == 'string'
			&& (data.dbPsw == undefined || typeof data.dbPsw == 'string')
			&& typeof data.numberOfVoters == 'number'
			&& (typeof data.numberOfVotePerVoter == 'number' || (typeof data.numberOfVotePerVoterMin == 'number' && typeof data.numberOfVotePerVoterMax == 'number'))
			&& typeof data.numberOfVoted == 'number'
			&& (data.numberOfSeatsTaken == undefined || typeof data.numberOfSeatsTaken == 'number')
			&& typeof data.hasSkipped == 'boolean'
			&& typeof data.candidates == 'object') {
			
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
