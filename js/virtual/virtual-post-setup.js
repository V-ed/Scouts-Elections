import ElectionData from '../election-data.js'; // eslint-disable-line no-unused-vars
import Utils from '../utils/utilities.js';

/**
 * @param {ElectionData} data
 */
export function setupVotingLinks(data) {
    Utils.initializeImages('virtual-links-page', data.groupImage);
    
    const virtualElectionVotingLinkSpan = /** @type {HTMLInputElement} */ (document.getElementById('voting-links-voting-link'));
    const virtualElectionResultsLinkSpan = /** @type {HTMLInputElement} */ (document.getElementById('voting-links-results-link'));
    
    const baseUrl = `${window.location.protocol}//${window.location.hostname}${window.location.pathname != '/' ? window.location.pathname : ''}${window.location.port ? ':' + window.location.port : ''}`;
    
    const codeUrl = `${baseUrl}${baseUrl.endsWith('/') ? '' : '/'}virtual.html?code=${data.sharedElectionCode}`;
    const codeResultsUrl = `${codeUrl}&as=admin`;
    
    virtualElectionVotingLinkSpan.value = codeUrl;
    virtualElectionResultsLinkSpan.value = codeResultsUrl;
    
    const virtualGoToResultsButton = /** @type {HTMLLinkElement} */ (document.getElementById('voting-links-go-to-results-link'));
    
    virtualGoToResultsButton.href = codeResultsUrl;
}
