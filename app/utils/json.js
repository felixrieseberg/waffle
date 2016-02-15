/**
 * V8 cannot optimize functions with try/catch blocks (or at least not well).
 * By moving this functionality into a utility, we ensure that functions needing
 * json parsings can still be optimized.
 */

/**
 * JSON.parse(), but with try/catch.
 * @param {string}    - String to parse
 * @return {Object}   - JSON.parse() result - or null if error
 */
export function parse(string) {
    try {
        return JSON.parse(string);
    } catch (e) {
        return null;
    }
}

/**
 * JSON.stringify(), but with try/catch.
 * @param {Object}    - String to parse
 * @return {string}   - JSON.stringify() result - or null if error
 */
export function stringify(obj) {
    try {
        return JSON.stringify(obj);
    } catch (e) {
        return null;
    }
}
