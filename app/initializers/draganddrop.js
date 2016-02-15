/**
 * Prevents redirects on file drag & drops
 */
export function initialize( /* application */ ) {
    document.ondragover = event => {
        event.preventDefault();
        return false;
    };

    document.ondrop = event => {
        event.preventDefault();
        return false;
    };
}

export default {
    name: 'draganddrop',
    initialize
};
