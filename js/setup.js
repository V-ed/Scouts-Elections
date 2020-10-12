import ElectionData from './election-data.js';
import FileLoader from './my-libs/file-loader.js';
import Requester from './my-libs/requester.js';
import Utils from './utils/utilities.js';
import { setupVotes } from './voting.js';

let setupInputs = {};
/**
 * @type {EventTarget | undefined}
 */
let textFieldHadFocus = undefined;
    
/**
 * @type {string}
 */
let groupImageData = undefined;

export function setupSetup() {
    const submitSharedSetupButton = /** @type {HTMLButtonElement} */ (document.getElementById('setup-create-election-modal-button'));
    const setupSharedRequesterContainer = document.getElementById('setup-shared-submit-requester-container');
    
    Requester.sendRequest(`${Utils.sharedElectionHostRoot}`, {
        requesterContainer: setupSharedRequesterContainer,
        doHideContainerOnEnd: false,
        minimumRequestDelay: 100,
    }).then(() => {
        Utils.isServerAccessible = true;
    }).catch(_error => {});
    
    const imagePreview = /** @type {HTMLImageElement} */ (document.getElementById('setup-preview-image'));
    const imagePreviewCloser = /** @type {HTMLButtonElement} */ (document.getElementById('setup-preview-image-closer'));
    
    /**
     *
     * @param {string | ArrayBuffer} imageData
     */
    function setPreviewImage(imageData) {
        const imageSrc = typeof imageData == 'string' ? imageData : (new TextDecoder('utf-8')).decode(imageData);
        
        imagePreview.src = imageSrc;
        // imagePreview.value = "";
        imagePreviewCloser.disabled = false;
        groupImageData = imageSrc;
    }
    
    function removePreviewImage() {
        imagePreview.src = './images/no_image.png';
        imagePreviewCloser.disabled = true;
        $(imagePreviewCloser).popover('hide');
        groupImageData = undefined;
    }
    
    const MAXIMUM_IMAGE_SIZE_MB = 2;
    
    new FileLoader('image-loader-zone', {
        doLoadFiles: files => {
            const file = files[0];
            
            if (file.size > MAXIMUM_IMAGE_SIZE_MB * 1024 * 1024) {
                return 'L\'image ne peut pas dépasser 2 MB! Veuillez utiliser une image plus petite ou optimiser l\'image.';
            }
            
            const reader = new FileReader();
            
            reader.addEventListener('loadend', () => setPreviewImage(reader.result));
            
            if (file) {
                return reader.readAsDataURL(file);
            } else {
                return removePreviewImage();
            }
        },
        doHandleItemsForErrors: items => {
            if (items.length > 1) {
                return 'Veuillez ne glisser qu\'un seul fichier.';
            } else if (!items[0].type.match(/^image\/.+$/)) {
                return 'Le fichier n\'est pas valide : seules les images sont acceptées.';
            }
        },
    });
    
    imagePreviewCloser.addEventListener('click', e => {
        e.preventDefault();
        
        removePreviewImage();
    });
    
    const pswVisibilityToggler = /** @type {HTMLInputElement} */ (document.getElementById('password-visible'));
    const pswField = /** @type {HTMLInputElement} */ (document.getElementById('db-psw'));
    
    pswVisibilityToggler.addEventListener('click', () => pswField.type = pswField.type == 'password' ? 'text' : 'password');
    
    const candidateAddButton = /** @type {HTMLButtonElement} */ (document.getElementById('candidate-add'));
    const candidateRemoveAllButton = /** @type {HTMLButtonElement} */ (document.getElementById('candidate-remove-all'));
    const candidateContainer = document.getElementById('setup-candidates');
    
    const firstCandidateInput = /** @type {HTMLInputElement} */ (document.getElementById('candidate-name-1'));
    const firstCandidateRemoveButton = /** @type {HTMLButtonElement} */ (document.getElementById('candidate-remove-1'));
    
    function removeCandidate(candidateInput) {
        const candidateNumber = parseInt(candidateInput.dataset.candidatenumber);
        
        const allCandidates = Array.from(/** @type {NodeListOf<HTMLInputElement>} */ (document.querySelectorAll('input[id^=\'candidate-name-\']')));
        
        if (allCandidates.length == 1) {
            firstCandidateInput.value = '';
            triggerInputEvent(firstCandidateInput, true);
        } else {
            const allCandidatesToUpdate = allCandidates.filter(input => parseInt(input.dataset.candidatenumber) > candidateNumber);
            
            allCandidatesToUpdate.forEach(candidateInput => {
                const currentCandidateNumber = parseInt(candidateInput.dataset.candidatenumber);
                
                const previousInput = /** @type {HTMLInputElement} */ (document.getElementById(`candidate-name-${currentCandidateNumber - 1}`));
                
                previousInput.value = candidateInput.value;
            });
            
            const inputToRemove = document.getElementById(`candidate-controls-${candidateNumber + allCandidatesToUpdate.length}`);
            
            $(inputToRemove).popover('dispose');
            inputToRemove.remove();
            
            allCandidates.forEach(candidateInput => triggerInputEvent(candidateInput, true));
            
            delete setupInputs[`candidate-name-${candidateNumber}`];
            
            const newCandidateCount = parseInt(candidateAddButton.dataset.candidatecount) - 1;
            
            candidateAddButton.dataset.candidatecount = newCandidateCount.toString();
            
            const numberOfVoteInput = /** @type {HTMLInputElement} */ (document.getElementById('number-of-votes-maximum'));
            
            triggerInputEvent(numberOfVoteInput, true);
            
            if (newCandidateCount == 1 && firstCandidateInput.value.length == 0) {
                candidateRemoveAllButton.disabled = true;
            }
        }
        
        verifyAllValid();
    }
    
    firstCandidateRemoveButton.addEventListener('click', () => removeCandidate(firstCandidateInput));
    
    candidateAddButton.addEventListener('click', e => {
        e.preventDefault();
        
        const newCandidateCount = parseInt(candidateAddButton.dataset.candidatecount) + 1;
        
        candidateAddButton.dataset.candidatecount = newCandidateCount.toString();
        
        $(candidateContainer).append(`
            <div id="candidate-controls-${newCandidateCount}" class="form-group row mb-2 mb-md-3">
                <div class="col-sm-3 col-md-2">
                    <label class="col-form-label" for="candidate-name-${newCandidateCount}">Candidat ${newCandidateCount}</label>
                </div>
                <div class="col-sm-9 col-md-10 d-flex flex-row align-self-center justify-content-center">
                    <input type="text" class="form-control is-invalid is-popable" id="candidate-name-${newCandidateCount}" aria-describedby="candidate-name-${newCandidateCount}" placeholder="Nom" name="candidate-name-${newCandidateCount}" data-placement="top" data-candidatenumber="${newCandidateCount}" autocomplete="off" required>
                    <div class="d-flex align-items-center justify-content-center ml-3">
                        <button id="candidate-remove-${newCandidateCount}" type="button" class="btn btn-outline-danger" tabindex="-1">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                </div>
            </div>`);
        
        candidateRemoveAllButton.disabled = false;
        
        addInputForVerification(`candidate-name-${newCandidateCount}`, validateCandidate);
        
        const newCandidateInput = document.getElementById(`candidate-name-${newCandidateCount}`);
        
        newCandidateInput.focus();
        newCandidateInput.addEventListener('keyup', setupCandidateSelector);
        newCandidateInput.addEventListener('keydown', e => {
            if (e.which === 13 || e.keyCode === 13 || e.key === 'Enter') {
                e.preventDefault();
            }
        });
        const newCandidateDeleteButton = document.getElementById(`candidate-remove-${newCandidateCount}`);
        
        newCandidateDeleteButton.addEventListener('click', () => removeCandidate(newCandidateInput));
        
        newCandidateInput.scrollIntoView();
        
        const numberOfVoteInput = /** @type {HTMLInputElement} */ (document.getElementById('number-of-votes-maximum'));
        
        triggerInputEvent(numberOfVoteInput, true);
        
        firstCandidateRemoveButton.disabled = false;
    });
    
    // Enable / disable remove all custom handler for first candidate input
    firstCandidateInput.addEventListener('input', () => {
        if (document.querySelectorAll('div[id^=\'candidate-controls-\']').length == 1) {
            const isFirstCandidateNameEmpty = firstCandidateInput.value.length == 0;
            
            candidateRemoveAllButton.disabled = isFirstCandidateNameEmpty;
            firstCandidateRemoveButton.disabled = isFirstCandidateNameEmpty;
        }
    });
    
    $(candidateRemoveAllButton).popover({trigger: 'focus'}).on('shown.bs.popover', function() {
        const candidateRemoveAllConfirmButton = document.getElementById('candidate-remove-all-confirm');
        
        candidateRemoveAllConfirmButton.addEventListener('click', () => {
            candidateAddButton.dataset.candidatecount = '1';
            
            const allCandidatesToRemove = Array.from(document.querySelectorAll('div[id^=\'candidate-controls-\']')).filter(control => control.querySelector('input[id^=\'candidate-name-\']') != firstCandidateInput);
            
            allCandidatesToRemove.forEach(control => {
                const candidateInput = /** @type {HTMLInputElement} */ (control.querySelector('input[id^=\'candidate-name-\']'));
                
                $(candidateInput).popover('dispose');
                
                delete setupInputs[`candidate-name-${candidateInput.dataset.candidatenumber}`];
                
                control.remove();
            });
            
            firstCandidateInput.value = '';
            triggerInputEvent(firstCandidateInput, true);
            
            firstCandidateRemoveButton.disabled = true;
            candidateRemoveAllButton.disabled = true;
            
            candidateRemoveAllButton.disabled = true;
            
            triggerInputEvent(/** @type {HTMLInputElement} */ (document.getElementById('number-of-votes-maximum')), true);
            
            if (textFieldHadFocus) {
                firstCandidateInput.focus();
            }
            
            verifyAllValid();
            
            $(this).popover('hide');
        });
    });
    
    function createData() {
        const formData = new FormData(/** @type {HTMLFormElement} */ (document.getElementById('setup-form')));
        
        const tempCandidates = Array.from(/** @type {NodeListOf<HTMLInputElement>} */ (document.querySelectorAll('input[id^=\'candidate-name-\']'))).map(candidateInput => formData.get(candidateInput.name));
        
        Utils.isDownloadDisabled = formData.get('autoDownloadDb') != 'on';
        
        const compressedImageData = groupImageData ? LZString.compressToUTF16(groupImageData) : undefined;
        
        const data = ElectionData.fromFormData(formData, tempCandidates, compressedImageData);
        
        return data;
    }
    
    const submitSetupButton = /** @type {HTMLButtonElement} */ (document.getElementById('setup-submit-button'));
    
    submitSetupButton.addEventListener('click', e => {
        e.preventDefault();
        
        const data = createData();
        
        setupVotes(data, () => {
            window.removeEventListener('beforeunload', preventDataLoss);
            
            Utils.uninitializeImages('setup-page');
        });
    });
    
    const errorDiv = document.getElementById('setup-create-election-modal-error');
    
    submitSharedSetupButton.addEventListener('click', async e => {
        e.preventDefault();
        
        errorDiv.hidden = true;
        
        submitSharedSetupButton.disabled = true;
        
        const electionData = createData();
        
        const electionJSONData = electionData.getAsJSON();
        
        Requester.sendRequest({
            type: 'POST',
            url: `${Utils.sharedElectionHostRoot}/create`,
            data: electionJSONData,
            cache: false,
        }, 'setup-create-election-modal-requester-container').then(response => {
            if (!response.code) {
                throw 'Missing election code!';
            }
            
            electionData.mergeData(response.data);
            
            const data = ElectionData.fromJSON(response.data);
            
            data.setSharedElectionCode(response.code);
            
            return setupVotes(data, () => {
                $('#setup-create-election-modal').modal('hide');
                
                window.removeEventListener('beforeunload', preventDataLoss);
                
                Utils.uninitializeImages('setup-page');
            }, 'setup-create-election-modal-requester-container');
        })
            .catch(_error => {
                errorDiv.hidden = false;
            })
            .finally(() => {
                submitSharedSetupButton.disabled = false;
            });
    });
    
    const inputs = document.querySelectorAll('div#setup-page input.spinner[type=\'number\']');
    
    $(inputs).inputSpinner({inputClass: 'font-weight-bold', buttonsClass: 'btn-secondary'});
    
    // Handle data validation
    
    /**
     *
     * @param {string} data
     * @param {HTMLInputElement} input
     * @param {boolean} isManual
     * @returns {string | void}
     */
    function validateCandidate(data, input, isManual) {
        const dataTrimmed = data.trim();
        
        const otherCandidates = Array.from(/** @type {NodeListOf<HTMLInputElement>} */ (document.querySelectorAll('input[id^=\'candidate-name-\']'))).filter(selectedInput => selectedInput != input);
        const dupCandidates = otherCandidates.filter(candidateInput => candidateInput.value != '' && candidateInput.value.toLowerCase() == dataTrimmed.toLowerCase());
        
        const prevDupeValue = input.dataset.dupevalue;
        
        const hasDupes = dupCandidates.length > 0;
        
        if (hasDupes) {
            input.classList.add('is-invalid');
            input.dataset.dupevalue = dataTrimmed.toLowerCase();
            
            dupCandidates.filter(dupInput => !dupInput.classList.contains('is-invalid')).forEach(dupInput => triggerInputEvent(dupInput, true));
        }
        
        if (input.dataset.dupevalue != null) {
            if (!isManual) {
                const candidatesToRevalidate = otherCandidates.filter(candidateInput => candidateInput.value.toLowerCase() == prevDupeValue);
                
                candidatesToRevalidate.forEach(candidate => triggerInputEvent(candidate, true));
            }
            
            if (!hasDupes) {
                delete input.dataset.dupevalue;
            }
        }
        
        if (hasDupes) {
            return 'Le nom de ce candidat est dupliqué!';
        }
        
        if (dataTrimmed == '') {
            return 'Le nom du candidat ne peut être vide.';
        }
    }
    
    addInputForVerification('db-name', /** @param {string} data */ (data) => {
        if (data == '') {
            return `Le titre de l'élection ne peut être vide.`;
        }
        
        if (data.length > 50) {
            return `Le titre de l'élection doit être inférieur ou égal à 50 caractères de longueur.`;
        }
        
        if (data.endsWith('.')) {
            return `Le titre de l'élection ne peut pas terminer avec un point.`;
        }
        
        const illegalCharRegex = /^[^\\/:*?"<>|]+$/;

        if (!illegalCharRegex.test(data)) {
            return `Le titre de l'élection contient actuellement au moins un caractère invalide.`;
        }
        
        const reservedFileRegex = /^(nul|prn|con|(lpt|com)[0-9])(\.|$)/i;

        if (reservedFileRegex.test(data)) {
            return `Le titre de l'élection ne peut pas être un nom réservé au système.`;
        }
    });
    addInputForVerification('number-of-voters', /** @param {"" | number} data */ (data) => {
        if (data === '') {
            return 'Le nombre d\'électeurs ne peut être vide.';
        }
        
        if (data < 1) {
            return 'Le nombre doit être supérieur à 0.';
        }
    });
    addInputForVerification('number-of-votes-minimum', /** @param {"" | number} data */ (data, input, isManualVerification) => {
        let badData = undefined;
        
        if (data === '') {
            badData = 'Le nombre de vote minimum ne peut être vide.';
        } else if (data < 0) {
            badData = 'Le nombre doit être positif (supérieur ou égal à 0).';
        }
        
        const numberOfVotesMaxInput = /** @type {HTMLInputElement} */ (document.getElementById('number-of-votes-maximum'));
        
        if (badData) {
            return badData;
        }
        
        if (data > numberOfVotesMaxInput.value) {
            $(numberOfVotesMaxInput).val(data);
        }
        
        if (!isManualVerification) {
            triggerInputEvent(numberOfVotesMaxInput, true);
        }
        
        if (numberOfVotesMaxInput.value && data > numberOfVotesMaxInput.value) {
            return 'Le nombre de vote minimum ne peut pas être supérieur au nombre de vote maximum.';
        }
    });
    addInputForVerification('number-of-votes-maximum', /** @param {"" | number} data */ (data, input, isManualVerification) => {
        let badData = undefined;
        
        if (data === '') {
            badData = 'Le nombre de vote maximum ne peut être vide.';
        } else if (data < 1) {
            badData = 'Le nombre doit être supérieur à 0.';
        }
        
        const numberOfVotesMinInput = /** @type {HTMLInputElement} */ (document.getElementById('number-of-votes-minimum'));
        
        if (badData) {
            return badData;
        }
        
        if (data < numberOfVotesMinInput.value) {
            $(numberOfVotesMinInput).val(data);
        }
        
        if (!isManualVerification) {
            triggerInputEvent(numberOfVotesMinInput, true);
        }
        
        if (numberOfVotesMinInput.value && data < numberOfVotesMinInput.value) {
            return 'Le nombre de vote maximum ne peut pas être inférieur au nombre de vote minimum.';
        }
        
        const candidatesCount = document.querySelectorAll('input[id^=\'candidate-name-\']').length;
        
        if (candidatesCount < data) {
            return 'Le nombre de vote maximum doit être inférieur ou égal au nombre de candidats.';
        }
    });
    addInputForVerification('candidate-name-1', validateCandidate);
    
    window.addEventListener('beforeunload', preventDataLoss);
    
    // Handle Enter on input fields
    
    const setupPageTextFields = /** @type {NodeListOf<HTMLInputElement>} */ (document.querySelectorAll('#setup-form input'));
    
    setupPageTextFields.forEach(input => {
        input.addEventListener('keydown', e => {
            if (e.which === 13 || e.keyCode === 13 || e.key === 'Enter') {
                e.preventDefault();
            }
        });
    });
    
    document.getElementById('candidate-name-1').addEventListener('keyup', setupCandidateSelector);
    
    const homepageButton = document.getElementById('setup-homepage-button');
    
    homepageButton.addEventListener('click', () => document.location.reload(true));
}

/**
 *
 * @param {KeyboardEvent | ClipboardEvent} e
 */
function numberTypeOnlyPositive(e) {
    let hasBadChars = false;
    
    if (e instanceof ClipboardEvent) {
        const clipboardData = e.clipboardData;
        const pastedData = clipboardData.getData('Text');
        
        hasBadChars = !pastedData.match(/[0-9]/);
    } else {
        const isValidKeyCode = e.key.match(/[0-9]/) || e.ctrlKey || e.altKey || e.shiftKey || (e.code == 'Backspace' || e.keyCode == 8) || (e.code == 'Tab' || e.keyCode == 9) || e.key.includes('Arrow');
        
        if (!isValidKeyCode) {
            hasBadChars = true;
        }
    }
    
    if (hasBadChars) {
        e.preventDefault();
        return;
    }
}

/**
 *
 * @param {string} inputId
 * @param {CustomValidator} [customValidator]
 */
export function addInputForVerification(inputId, customValidator) {
    setupInputs[inputId] = false;
    
    const inputElement = /** @type {HTMLInputElement} */ (document.getElementById(inputId));
    
    const checkElement = /** @type {HTMLInputElement} */ (inputElement.classList.contains('spinner') ? document.querySelector(`#${inputId} + div.input-group input.spinner`) : inputElement);
    
    if (checkElement.type == 'number' || checkElement.inputMode == 'numeric') {
        checkElement.addEventListener('keyup', numberTypeOnlyPositive);
        checkElement.addEventListener('paste', numberTypeOnlyPositive);
        checkElement.addEventListener('keydown', numberTypeOnlyPositive);
        checkElement.addEventListener('keypress', numberTypeOnlyPositive);
    }
    
    inputElement.addEventListener('input', e => {
        // @ts-ignore
        const isManual = e.detail ? e.detail.isManual : false;
        
        setupInputs[inputId] = verifyInput(inputElement, customValidator, isManual, checkElement);
        
        verifyAllValid();
    });
    
    verifyAllValid();
    
    if (checkElement.classList.contains('is-popable')) {
        if (checkElement.hasAttribute('data-bs.popover')) {
            checkElement.removeAttribute('data-bs.popover');
        }
        $(checkElement).popover({ trigger: 'manual' });
        
        triggerInputEvent(inputElement, true);
        
        checkElement.addEventListener('focus', () => $(checkElement).popover('show'));
        checkElement.addEventListener('focusout', () => $(checkElement).popover('hide'));
        
        if (checkElement.classList.contains('spinner')) {
            let previousSpinnerTimer = undefined;
            
            inputElement.addEventListener('change', e => {
                // @ts-ignore
                if (e.detail.step != undefined) {
                    clearTimeout(previousSpinnerTimer);
                    previousSpinnerTimer = setTimeout(() => {
                        if (document.activeElement != checkElement) {
                            $(checkElement).popover('hide');
                        }
                    }, 1500);
                }
            });
        }
    }
    
    checkElement.addEventListener('focus', e => textFieldHadFocus = e.currentTarget);
    checkElement.addEventListener('focusout', e => setTimeout(() => {
        if (e.target == textFieldHadFocus) {
            textFieldHadFocus = undefined;
        }
    }, 100));
}

export function verifyAllValid() {
    let isValid = true;
    
    for (const inputProperty in setupInputs) {
        isValid = setupInputs[inputProperty];
        
        if (!isValid) {
            break;
        }
    }
    
    const submitSetupButton = /** @type {HTMLButtonElement} */ (document.getElementById('setup-submit-button'));
    const submitVirtualSetupButton = /** @type {HTMLButtonElement} */ (document.getElementById('setup-virtual-submit-button'));
    const submitSharedSetupButton = /** @type {HTMLButtonElement} */ (document.getElementById('setup-shared-submit-button'));
    
    submitSetupButton.disabled = !isValid;
    submitVirtualSetupButton.disabled = !(Utils.isServerAccessible && isValid);
    submitSharedSetupButton.disabled = !(Utils.isServerAccessible && isValid);
}

/**
 * @typedef {string | boolean | {isValid: boolean, reason: string}} ValidatorResult
 */
/**
 * @typedef {(inputValue: string | number | "", inputElement: HTMLInputElement, isManualVerification?: boolean) => ValidatorResult | void} CustomValidator
 */

/**
 *
 * @param {HTMLInputElement} inputElement
 * @param {CustomValidator} customValidator
 * @param {boolean} isManualVerification
 * @param {HTMLElement} [elementToValidate]
 */
export function verifyInput(inputElement, customValidator, isManualVerification, elementToValidate) {
    // Check if required. If not, don't verify
    if (!inputElement.required) {
        return true;
    }
    
    let isValid = true;
    let reason = '';
    
    const inputValue = inputElement.value;
    
    if (customValidator) {
        const inputValueForCustom = (inputElement.type == 'number' || inputElement.inputMode == 'numeric') && inputValue ? parseInt(inputValue) : inputValue;
        const customResults = customValidator(inputValueForCustom, inputElement, isManualVerification);
        
        if (typeof customResults == 'string') {
            isValid = false;
            reason = customResults;
        } else if (typeof customResults == 'boolean') {
            isValid = customResults;
            reason = 'La donnée n\'est pas valide.';
        } else if (customResults) {
            isValid = customResults.isValid;
            reason = customResults.reason;
        }
    } else if (!inputValue) {
        // Value is empty
        isValid = false;
        reason = 'La donnée ne peut pas être vide.';
    } else if (inputElement.type == 'number') {
        const numberValue = parseInt(inputValue);
        
        isValid = numberValue > 0;
        reason = 'Le nombre doit être supérieur à 0.';
    }
    
    const elemToClassify = elementToValidate || inputElement;
    
    if (isValid) {
        inputElement.classList.remove('is-invalid');
        
        elemToClassify.dataset.content = '';
        
        $(elemToClassify).popover('hide');
    } else {
        inputElement.classList.add('is-invalid');
        
        elemToClassify.dataset.content = reason;
        
        $(elemToClassify).popover('show');
    }
    
    return isValid;
}

/**
 *
 * @param {HTMLInputElement} input
 * @param {boolean} [isSilent]
 */
export function triggerInputEvent(input, isSilent) {
    const popableInput = input.classList.contains('spinner') ? document.querySelector(`#${input.id} + div.input-group input.spinner`) : input;
    
    const inputIsPopable = popableInput.classList.contains('is-popable');
    
    if (inputIsPopable && isSilent) {
        $(popableInput).popover('disable');
    }
    
    input.dispatchEvent(new CustomEvent('input', {detail: {isManual: true}}));
    
    if (inputIsPopable && isSilent) {
        $(popableInput).popover('enable');
    }
}

/**
 * Handle reload if at least one candidate is entered
 */
export function preventDataLoss() {
    const isOneCandidateIsEntered = Array.from(/** @type {NodeListOf<HTMLInputElement>} */ (document.querySelectorAll('input[id^=\'candidate-name-\']'))).some(input => input.value != '');
    
    if (isOneCandidateIsEntered) {
        // @ts-ignore
        // event.returnValue = 'Il y au moins un candidat d\'inscrit - continuer le rechargement de la page va le(s) perdre. Êtes vous sûr de vouloir continuer?';
    }
}

/**
 *
 * @param {KeyboardEvent} e
 */
export function setupCandidateSelector(e) {
    if (e.which === 13 || e.keyCode === 13 || e.key === 'Enter') {
        e.preventDefault();
        
        const inputCandidateNumber = parseInt((/** @type {HTMLElement} */ (e.currentTarget)).dataset.candidatenumber);
        
        const candidateAddButton = document.getElementById('candidate-add');
        
        const inputNextCandidate = /** @type {HTMLInputElement} */ (document.getElementById(`candidate-name-${inputCandidateNumber + 1}`));
        
        if (inputNextCandidate == undefined) {
            candidateAddButton.click();
        } else {
            inputNextCandidate.select();
        }
    }
}
