import ElectionData from './election-data.js'; // eslint-disable-line no-unused-vars
import Utils from './utils/utilities.js';

export class VotingSession {
    /**
     *
     * @param {ElectionData} [data]
     */
    constructor(data) {
        this.numberOfVotesLeft = data ? data.numberOfVotes : {
            min: 0,
            max: 0
        };
        
        this.setElectionData(data);
    }
    
    /**
     *
     * @param {ElectionData | undefined} electionData
     */
    setElectionData(electionData) {
        if (electionData) {
            /** @private */
            this.data = electionData;
        }
        return !!this.data;
    }
    
    /**
     *
     * @param {ElectionData} [electionData]
     */
    resetNumberOfVotesLeft(electionData) {
        if (!this.setElectionData(electionData)) {
            return;
        }
        
        ({min: this.numberOfVotesLeft.min, max: this.numberOfVotesLeft.max} = this.data.numberOfVotes);
    }
    
    /**
     *
     * @param {ElectionData} [electionData]
     */
    initializeVotingComponents(electionData) {
        if (!this.setElectionData(electionData)) {
            return;
        }
        
        Utils.initializeImages('voting-page', this.data.groupImage);
        
        const isMultipleSameCandidateAllowed = this.data.allowMultipleSameCandidate || false;
        
        this.resetNumberOfVotesLeft();
        
        const cardsHtml = this.createVotingCardsHtml();
        
        const cardsContainer = document.getElementById('cards-container');
        
        $(cardsContainer).append(cardsHtml);
        
        const voteRemainingCounter = document.getElementById('voting-remaining-count');
        const voteRemainingCounterMin = document.getElementById('voting-remaining-count-min');
        const voteRemainingCounterMax = document.getElementById('voting-remaining-count-max');
        
        if (this.numberOfVotesLeft.min == this.numberOfVotesLeft.max) {
            voteRemainingCounter.textContent = this.numberOfVotesLeft.min.toString();
            
            document.getElementById('voting-remaining-text-absolute').hidden = false;
        } else {
            voteRemainingCounterMin.textContent = this.numberOfVotesLeft.min.toString();
            voteRemainingCounterMax.textContent = this.numberOfVotesLeft.max.toString();
            
            document.getElementById('voting-remaining-text-multiple').hidden = false;
        }
        
        const submitVotesButton = /** @type {HTMLButtonElement} */ (document.getElementById('voting-submit-button'));
        
        if (this.numberOfVotesLeft.min == 0) {
            submitVotesButton.disabled = false;
            submitVotesButton.classList.remove('btn-secondary');
            submitVotesButton.classList.add('btn-success');
        }
        
        if (isMultipleSameCandidateAllowed) {
            const inputs = /** @type {NodeListOf<HTMLInputElement>} */ (document.querySelectorAll('div#voting-page input.spinner[type=\'number\']'));
            
            $(inputs).inputSpinner({disabledInput: true, inputClass: 'font-weight-bold', buttonsClass: 'btn-secondary'});
            
            $(inputs).on('change', e => {
                // @ts-ignore
                if (!e.detail || !e.detail.step) {
                    return;
                }
                
                // @ts-ignore
                this.voteForCandidate(parseInt((/** @type {HTMLElement} */ (e.currentTarget)).dataset.candidateindex), e.detail.step);
                
                inputs.forEach(input => input.max = (this.numberOfVotesLeft.max + parseInt(/** @type {string} */ ($(input).val()))).toString());
                
                if (this.numberOfVotesLeft.max == 0) {
                    const nonSelectedInput = Array.from(inputs).filter(input => $(input).val() == 0);
                    
                    nonSelectedInput.forEach(input => input.readOnly = true);
                } else {
                    const readonlyInputs = Array.from(inputs).filter(input => input.readOnly);
                    
                    readonlyInputs.forEach(input => input.readOnly = false);
                }
            });
        } else {
            const votingButtons = /** @type {NodeListOf<HTMLButtonElement>} */ (document.querySelectorAll('button[id^=vote-candidate-]'));
            
            votingButtons.forEach(button => {
                button.addEventListener('click', e => {
                    e.preventDefault();
                    
                    this.voteForCandidate(parseInt(button.dataset.candidateindex), 1);
                    
                    button.hidden = true;
                    document.getElementById(`unvote-candidate-${parseInt(button.dataset.candidateindex)}`).hidden = false;
                    
                    if (this.numberOfVotesLeft.max == 0) {
                        const nonVotedCandidatesButtons = /** @type {NodeListOf<HTMLButtonElement>} */ (document.querySelectorAll('button[id^=vote-candidate-]:not([hidden])'));
                        
                        nonVotedCandidatesButtons.forEach(nonVotedButton => nonVotedButton.disabled = true);
                    }
                });
            });
            
            const unvoteButtons = /** @type {NodeListOf<HTMLButtonElement>} */ (document.querySelectorAll('button[id^=unvote-candidate-]'));
            
            unvoteButtons.forEach(button => {
                button.addEventListener('click', e => {
                    e.preventDefault();
                    
                    this.voteForCandidate(parseInt(button.dataset.candidateindex), -1);
                    
                    button.hidden = true;
                    document.getElementById(`vote-candidate-${parseInt(button.dataset.candidateindex)}`).hidden = false;
                    
                    const disabledNonVotedCandidatesButtons = /** @type {NodeListOf<HTMLButtonElement>} */ (document.querySelectorAll('button[id^=vote-candidate-][disabled]'));
                    
                    disabledNonVotedCandidatesButtons.forEach(nonVotedButton => nonVotedButton.disabled = false);
                });
            });
        }
    }
    
    /**
     *
     * @param {number} candidate
     * @param {number} step
     */
    voteForCandidate(candidate, step) {
        if (step > 0) {
            this.data.voteCandidate(candidate, step);
        } else if (step < 0) {
            this.data.unvoteCandidate(candidate, -step);
        }
        
        const voteRemainingCounter = document.getElementById('voting-remaining-count');
        const voteRemainingCounterMin = document.getElementById('voting-remaining-count-min');
        const voteRemainingCounterMax = document.getElementById('voting-remaining-count-max');
        
        const submitVotesButton = /** @type {HTMLButtonElement} */ (document.getElementById('voting-submit-button'));
        
        this.numberOfVotesLeft.min = this.numberOfVotesLeft.min - step;
        this.numberOfVotesLeft.max = this.numberOfVotesLeft.max - step;
        
        if (this.numberOfVotesLeft.min == this.numberOfVotesLeft.max) {
            voteRemainingCounter.textContent = this.numberOfVotesLeft.min.toString();
        } else {
            voteRemainingCounterMin.textContent = (this.numberOfVotesLeft.min >= 0 ? this.numberOfVotesLeft.min : 0).toString();
            voteRemainingCounterMax.textContent = this.numberOfVotesLeft.max.toString();
        }
        
        submitVotesButton.disabled = this.numberOfVotesLeft.min > 0;
        
        if (submitVotesButton.disabled) {
            submitVotesButton.classList.add('btn-secondary');
            submitVotesButton.classList.remove('btn-success');
        } else {
            submitVotesButton.classList.remove('btn-secondary');
            submitVotesButton.classList.add('btn-success');
        }
    }
    
    /**
     *
     * @param {ElectionData} [electionData]
     */
    createVotingCardsHtml(electionData) {
        if (!this.setElectionData(electionData)) {
            return;
        }
        
        const isMultipleSameCandidateAllowed = this.data.allowMultipleSameCandidate || false;
        
        return this.data.candidates.reduce((html, candidate, candidateIndex) => {
            let inputHtml;
            
            if (isMultipleSameCandidateAllowed) {
                inputHtml = `<input type="number" class="spinner" value="0" min="0" max="${this.data.numberOfVotePerVoterMax}" step="1" data-step-max="1" data-candidateindex="${candidateIndex}"/>`;
            } else {
                inputHtml = `
                    <button id="vote-candidate-${candidateIndex}" type="button" class="btn btn-primary" data-candidateindex="${candidateIndex}">Voter</button>
                    <button id="unvote-candidate-${candidateIndex}" type="button" class="btn btn-danger" data-candidateindex="${candidateIndex}" hidden>Enlever Vote</button>
                `;
            }
            
            return `${html}
            <div class="col-6 col-md-4 col-lg-3 p-2">
                <div class="card">
                    <div class="card-body text-center">
                        <h5 class="card-title">${candidate.name}</h5>
                        ${inputHtml}
                    </div>
                </div>
            </div>`;
        }, '');
    }
}
