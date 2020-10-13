import ElectionData from '../election-data.js';
import Requester from '../my-libs/requester.js';
import switchView from '../switcher.js';
import Utils from '../utils/utilities.js';
import { VotingSession } from '../voting-session.js';
import Cookies from '../libraries/js.cookie.min.mjs';

const urlParams = new URLSearchParams(window.location.search);

function setupVirtualElection() {
    const loadingMainText = document.getElementById('loading-main-text');
    
    if (!urlParams.has('code')) {
        const noCodeErrorText = document.getElementById('no-code-error');
        
        noCodeErrorText.hidden = false;
    } else {
        const virtualElectionCode = urlParams.get('code');
        
        const electionCookie = Cookies.get(`election_${virtualElectionCode}`);
        
        if (electionCookie) {
            loadingMainText.innerText = 'Vous avez déjà voté pour cette élection! Merci! :)';
        } else {
            const request = Requester.sendRequest({
                url: `${Utils.sharedElectionHostRoot}/join-virtual/${virtualElectionCode}`,
                contentType: 'application/javascript; charset=UTF-16',
            }, {
                requesterContainer: 'home-loading-requester-container',
                minimumRequestDelay: 500,
            });
            
            request.then(response => {
                handleJoinSuccessResponse(response, virtualElectionCode);
            }).catch(() => {
                const serverErrorText = document.getElementById('server-error');
                
                serverErrorText.hidden = false;
            });
        }
    }
}

/**
 * @param {*} response
 * @param {string} virtualElectionCode
 */
function handleJoinSuccessResponse(response, virtualElectionCode) {
    Utils.isServerAccessible = true;
    
    const data = ElectionData.fromJSON(response.data);
    
    data.setSharedElectionCode(virtualElectionCode);
    
    switchView('voting-page', () => setupVirtualVotingSession(data));
}

function addLoaderElementToVotingPage() {
    const votingSubmitButtonDiv = document.getElementById('voting-submit-button-div');
    
    votingSubmitButtonDiv.classList.add('d-flex', 'flex-row');
    
    const requesterLoaderHtml = `
    <div id="voting-sending-votes-requester-container" class="requester-container align-self-center ml-3" hidden>
        <div class="requester-spinner spinner-border" role="status">
            <span class="sr-only">Chargement...</span>
        </div>
    </div>`;
    
    $(votingSubmitButtonDiv).append(requesterLoaderHtml);
    
    const votingUnderSubmitButtonDiv = document.getElementById('voting-under-submit-button-div');
    
    const errorSubmitMessageHtml = `
    <span class="h4 text-danger">Une erreur est survenue lors de l'envoi des votes aux serveurs, veuillez réessayer!</span>`;
    
    $(votingUnderSubmitButtonDiv).append(errorSubmitMessageHtml);
    
    votingUnderSubmitButtonDiv.classList.add('text-center', 'mt-2');
}

/**
 *
 * @param {ElectionData} data
 */
function setupVirtualVotingSession(data) {
    const votingSession = new VotingSession(data);
    
    votingSession.initializeVotingComponents();
    
    addLoaderElementToVotingPage();
    
    const submitVotesButton = /** @type {HTMLButtonElement} */ (document.getElementById('voting-submit-button'));
    
    const votingOverlay = document.getElementById('voting-voted-overlay');
    
    submitVotesButton.addEventListener('click', () => {
        submitVotesButton.disabled = true;
        
        const votingUnderSubmitButtonDiv = document.getElementById('voting-under-submit-button-div');
        
        votingUnderSubmitButtonDiv.hidden = true;
        
        const candidatesIndexesJSON = JSON.stringify(data.votesCurrentCandidateIndexes);
        
        const requestContainer = 'voting-sending-votes-requester-container';
        
        const response = Requester.sendRequest({
            type: 'PUT',
            url: `${Utils.sharedElectionHostRoot}/vote-virtual/${data.sharedElectionCode}`,
            data: candidatesIndexesJSON,
            cache: false,
        }, {
            requesterContainer: requestContainer,
            minimumRequestDelay: 500,
            doLingerSpinner: true
        });
        
        response.then(() => {
            votingOverlay.classList.add('active');
            document.cookie = `election_${data.sharedElectionCode}=true`;
        }).catch(_error => {
            votingUnderSubmitButtonDiv.hidden = false;
            Requester.hideLoader(requestContainer);
            submitVotesButton.disabled = false;
        });
    });
}

const fragmentLoader = document.querySelector('include-fragment');

fragmentLoader.addEventListener('load', () => {
    Utils.init();
    
    setupVirtualElection();
});
