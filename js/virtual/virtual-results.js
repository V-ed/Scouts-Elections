import ElectionData from '../election-data.js'; // eslint-disable-line no-unused-vars
import Requester from '../my-libs/requester.js';
import switchView from '../switcher.js';
import Utils from '../utils/utilities.js';
import { requestElectionData } from './virtual.js';

/**
 *
 * @param {ElectionData} data
 */
export function setupResults(data) {
    if (data.dbPsw || data.dbPsw == undefined) {
        switchView('pre-results-page', () => setupPreResultsPage(data));
    } else {
        switchView('results-page', () => setupResultsPage(data));
    }
}

/**
 *
 * @param {ElectionData} data
 */
export function setupPreResultsPage(data) {
    Utils.initializeImages('pre-results-page', data.groupImage);
    
    const preResultsSubmitButton = /** @type {HTMLButtonElement} */ (document.getElementById('pre-results-submit-button'));
    
    const passwordInput = /** @type {HTMLInputElement} */ (document.getElementById('pre-results-password-input'));
    
    preResultsSubmitButton.addEventListener('click', e => {
        e.preventDefault();
        
        const password = passwordInput.value;
        
        if (data.validatePassword(password)) {
            switchView('results-page', () => setupResultsPage(data));
            
            Utils.uninitializeImages('pre-results-page');
        } else {
            passwordInput.classList.add('is-invalid');
            preResultsSubmitButton.disabled = true;
        }
    });
    
    passwordInput.addEventListener('input', () => {
        passwordInput.classList.remove('is-invalid');
        preResultsSubmitButton.disabled = false;
    });
}

/**
 *
 * @param {ElectionData} data
 */
function fillTable(data) {
    const resultsTableBody = /** @type {HTMLTableSectionElement} */ (document.getElementById('results-body'));
    
    resultsTableBody.innerHTML = '';
    
    /** @type {import('../election-data.js').Candidate[]} */
    const candidatesClone = JSON.parse(JSON.stringify(data.candidates));
    const sortedCandidates = candidatesClone.sort((a, b) => ((a.voteCount > b.voteCount) ? -1 : ((b.voteCount > a.voteCount) ? 1 : 0)));
    
    let tableBodyHtml = '';
    
    let countOfEqual = 0;
    let lastVoteCount = -1;
    
    sortedCandidates.forEach((candidate, i) => {
        if (lastVoteCount == candidate.voteCount) {
            countOfEqual++;
        }
        
        let candidateBackground = '';
        let candidateSelectedState = 'unselected';
        
        switch (candidate.selectedState) {
        case 'pre-selected':
            candidateBackground = ' bg-warning';
            candidateSelectedState = 'pre-selected';
            break;
        case 'selected':
            candidateBackground = ' bg-success';
            candidateSelectedState = 'selected';
            break;
        default:
            candidateBackground = '';
            candidateSelectedState = 'unselected';
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
    
    return resultsTableBody;
}

/**
 * @param {ElectionData} data
 */
export function setupResultsPage(data) {
    Utils.initializeImages('results-page', data.groupImage);
    
    const tableBody = fillTable(data);
    
    $(tableBody).on('click', '.clickable-row', e => {
        const row = /** @type {HTMLTableRowElement} */ (e.currentTarget);
        
        $(row).removeClass('bg-warning bg-success');
        
        function getCandidateStatePlus(row) {
            switch (row.dataset.stateselected) {
            case 'unselected':
                $(row).toggleClass('bg-warning');
                return 'pre-selected';
            case 'pre-selected':
                $(row).toggleClass('bg-success');
                return 'selected';
            case 'selected':
            default:
                return 'unselected';
            }
        }
        
        const candidateState = getCandidateStatePlus(row);
        
        row.dataset.stateselected = candidateState;
        
        const candidateObject = data.candidates.find(candidate => candidate.name == row.dataset.candidate);
        
        candidateObject.selectedState = candidateState;
        
        if (syncActive) {
            const jsonCandidate = JSON.stringify(candidateObject);
            
            clearTimeout(timeoutRef);
            
            const response = Requester.sendRequest({
                type: 'PUT',
                url: `${Utils.sharedElectionHostRoot}/update-candidate/${data.sharedElectionCode}`,
                data: jsonCandidate,
                cache: false,
            }, {minimumRequestDelay: 0});
            
            response.then(updateTable).catch(handleSyncError);
        }
    });
    
    const legendToggler = /** @type {HTMLLinkElement} */ (document.querySelector('a[data-toggle=\'collapse\'][data-target=\'#results-click-explications\']'));
    
    $('#results-click-explications').on('hidden.bs.collapse', () => legendToggler.textContent = 'Plus');
    $('#results-click-explications').on('hide.bs.collapse show.bs.collapse', () => legendToggler.textContent = '');
    $('#results-click-explications').on('shown.bs.collapse', () => legendToggler.textContent = 'Moins');
    
    const downloadDbButton = document.getElementById('results-download-button');
    
    downloadDbButton.addEventListener('click', e => {
        e.preventDefault();
        
        Utils.downloadData(data.getAsJSON(true));
    });
    
    const syncContainer = document.getElementById('sync-container');
    
    syncContainer.hidden = false;
    
    const stopSyncButton = /** @type {HTMLButtonElement} */ (document.getElementById('stop-sync-button'));
    
    stopSyncButton.addEventListener('click', e => {
        e.preventDefault();
        
        syncActive = false;
        stopSyncButton.disabled = true;
    });
    
    function updateTable() {
        timeoutRef = setTimeout(() => {
            const request = requestElectionData(data.sharedElectionCode, 'retrieve-virtual');
            
            request.then(response => {
                fillTable(response.data);
                
                if (syncActive) {
                    // eslint-disable-next-line no-unused-vars
                    updateTable();
                }
            }).catch(handleSyncError);
        }, 1000);
    }
    
    updateTable();
}

/**
 *
 * @param {*} [_error]
 */
function handleSyncError(_error) {
    const stopSyncButton = /** @type {HTMLButtonElement} */ (document.getElementById('stop-sync-button'));
    
    const noServerConnexionContainer = document.getElementById('no-server-connexion-container');
    
    noServerConnexionContainer.hidden = false;
    stopSyncButton.disabled = true;
    syncActive = false;
}

let syncActive = true;

/** @type {number} */
let timeoutRef = undefined;
