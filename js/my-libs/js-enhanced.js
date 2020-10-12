/**
 * @typedef {string | HTMLElement} HTMLElementGetter
 */

/**
 *
 * @param {HTMLElementGetter | T} element
 * @param {(element: T) => HTMLElement | void} [getElementOtherwise]
 * @return {HTMLElement | void}
 * @template T
 */
export function getHTMLElement(element, getElementOtherwise) {
    if (element instanceof HTMLElement) {
        return element;
    } else if (typeof element == 'string') {
        return document.getElementById(element);
    } else if (getElementOtherwise) {
        return getElementOtherwise(element);
    }
}
