import MinimalDelayer from './minimal-delayer.js';
import { getHTMLElement } from './js-enhanced.js';

/**
 * @param {Partial<RequestOptions> | string} [requestOptions]
 * @returns {RequestOptions}
 */
function createRequestOptions(requestOptions) {
    const defaultRequesterContainer = typeof requestOptions == 'string' ? requestOptions : undefined;
    
    /** @type {RequestOptions} */
    const defaultOptions = {
        requesterContainer: defaultRequesterContainer,
        minimumRequestDelay: 250,
        doHideContainerOnEnd: true,
        doLingerSpinner: false,
    };
    
    if (typeof requestOptions == 'string') {
        return defaultOptions;
    } else {
        return {...defaultOptions, ...requestOptions};
    }
}

class RequestSender {
    /**
     * Send requests and handle UI spinners
     * @param {JQuery.AjaxSettings | string} ajaxSettings
     * @param {Partial<RequestOptions> | string} [requestOptions]
     */
    async sendRequest(ajaxSettings, requestOptions) {
        const options = createRequestOptions(requestOptions);
        
        const finalRequesterContainer = options.requesterContainer && getHTMLElement(options.requesterContainer, elem => getHTMLElement(elem.container));
        
        const delayer = new MinimalDelayer(options.minimumRequestDelay);
        
        const doHideContainerOnEnd = options.doHideContainerOnEnd !== false;
        
        const parsedAjaxSettings = typeof ajaxSettings == 'string' ? {url: ajaxSettings} : ajaxSettings;
        
        if (!('type' in parsedAjaxSettings)) {
            parsedAjaxSettings.type = 'GET';
        }
        if (!('contentType' in parsedAjaxSettings)) {
            parsedAjaxSettings.contentType = 'application/json';
        }
        
        const requestContainerElements = this.getContainerElements(finalRequesterContainer);
        
        if (finalRequesterContainer && requestContainerElements) {
            requestContainerElements.requesterSpinners.forEach(elem => elem.hidden = false);
            requestContainerElements.requesterSuccessIcons.forEach(elem => elem.hidden = true);
            requestContainerElements.requesterErrorIcons.forEach(elem => elem.hidden = true);
            
            finalRequesterContainer.hidden = false;
            
            if (options.requesterContainer
                && typeof options.requesterContainer != 'string'
                && !(options.requesterContainer instanceof HTMLElement)
                && options.requesterContainer.onContainerShownFunc) {
                options.requesterContainer.onContainerShownFunc(finalRequesterContainer);
            }
        }
        
        const request = new Promise((resolve, reject) => {
            $.ajax(parsedAjaxSettings)
                .done(function () { delayer.execute(() => resolve.apply(null, arguments)); })
                .fail(function () { delayer.execute(() => reject.apply(null, arguments)); });
        });
        
        if (!finalRequesterContainer || !requestContainerElements) {
            // Return plain request since no UI container was specified
            return request;
        } else {
            // Return request with added default behaviors for handling spinners / response icons
            return request.then(response => {
                if (!doHideContainerOnEnd) {
                    requestContainerElements.requesterSuccessIcons.forEach(elem => elem.hidden = false);
                }
                
                return Promise.resolve(response);
            }).catch(error => {
                if (!doHideContainerOnEnd) {
                    requestContainerElements.requesterErrorIcons.forEach(elem => elem.hidden = false);
                }
                
                return Promise.reject(error);
            }).finally(() => {
                if (!options.doLingerSpinner) {
                    requestContainerElements.requesterSpinners.forEach(elem => elem.hidden = true);
                    
                    if (doHideContainerOnEnd) {
                        finalRequesterContainer.hidden = true;
                    }
                }
            });
        }
    }
    
    /**
     *
     * @param {number | string} numberOfTries
     * @param {JQuery.AjaxSettings | string} ajaxSettings
     * @param {Partial<RequestOptions> | string} [requestOptions]
     */
    async sendRequestFor(numberOfTries, ajaxSettings, requestOptions) {
        numberOfTries = typeof numberOfTries == 'string' ? parseInt(numberOfTries) : numberOfTries;
        
        if (numberOfTries <= 0) {
            throw 'The number of tries should be bigger than 0!';
        }
        
        const options = createRequestOptions(requestOptions);
        
        const delayer = new MinimalDelayer(options.minimumRequestDelay);
        
        options.minimumRequestDelay = 0;
        
        for (let attemptCount = 1; attemptCount <= numberOfTries; attemptCount++) {
            try {
                const response = await this.sendRequest(ajaxSettings, options);
                
                await delayer.wait();
                
                return response;
            } catch (error) {
                // If the attempt count is full or the request was successfull but the server returned an error, stop trying
                if (attemptCount == numberOfTries || error.readyState == 4) {
                    throw error;
                }
            }
        }
        
        throw 'Wait a second... how did you even get here? My method is flawed...';
    }
    
    /**
     *
     * @param {RequestContainer} requesterContainer
     */
    hideLoader(requesterContainer) {
        const containerElements = this.getContainerElements(requesterContainer);
        
        if (containerElements) {
            containerElements.requesterSuccessIcons.forEach(elem => elem.hidden = true);
            containerElements.requesterErrorIcons.forEach(elem => elem.hidden = true);
            containerElements.requesterSpinners.forEach(elem => elem.hidden = true);
            
            containerElements.container.hidden = true;
        }
    }
    
    /**
     *
     * @param {RequestContainer | void} requesterContainer
     * @returns {RequestContainerElements | void}
     */
    getContainerElements(requesterContainer) {
        const finalRequesterContainer = requesterContainer && getHTMLElement(requesterContainer, elem => getHTMLElement(elem.container));
        
        if (finalRequesterContainer) {
            return {
                container: finalRequesterContainer,
                requesterSpinners: Array.from(/** @type {HTMLCollectionOf<HTMLElement>} */ (finalRequesterContainer.getElementsByClassName('requester-spinner'))),
                requesterSuccessIcons: Array.from(/** @type {HTMLCollectionOf<HTMLElement>} */ (finalRequesterContainer.getElementsByClassName('requester-success-icon'))),
                requesterErrorIcons: Array.from(/** @type {HTMLCollectionOf<HTMLElement>} */ (finalRequesterContainer.getElementsByClassName('requester-alert-icon'))),
            };
        }
    }
}

/**
 * @typedef RequestContainerElements
 * @property {HTMLElement} container,
 * @property {HTMLElement[]} requesterSpinners,
 * @property {HTMLElement[]} requesterSuccessIcons,
 * @property {HTMLElement[]} requesterErrorIcons,
 */

/**
 * @typedef RequestContainerOption
 * @property {HTMLElement | string} container,
 * @property {(requestContainer: HTMLElement) => *} [onContainerShownFunc],
 */

/**
 * @typedef {HTMLElement | string | RequestContainerOption} RequestContainer
 */

/**
 * @typedef RequestOptions
 * @property {RequestContainer | void} requesterContainer
 * @property {boolean} doHideContainerOnEnd
 * @property {number} minimumRequestDelay
 * @property {boolean} doLingerSpinner
 */

export const Requester = new RequestSender();

export default Requester;
