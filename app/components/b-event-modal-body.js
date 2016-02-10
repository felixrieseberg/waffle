import Ember from 'ember';

export default Ember.Component.extend({
    tagName: 'section',
    classNames: ['event-body'],

    src: Ember.computed('body', 'type', function src() {
        const body = this.get('body');

        if (this.get('isHTML')) {
            return `data:text/html,${encodeURI(body)}`;
        }
    }),

    isHTML: Ember.computed('type', function isHTML() {
        return (this.get('type') === 'HTML');
    }),

    isVisible: Ember.computed('body', function isVisible() {
        return (this._determineIfBodyHasContent());
    }),

    didInsertElement() {
        this._super(...arguments);
        // Deal with a <webview> issue - this forces correct size
        if (this.get('webviewLoadListener')) return;

        const webview = Ember.$('webview#body-webview')[0];
        const modal = Ember.$('#modal-event-body');
        const listener = webview.addEventListener('did-finish-load', () => {
            Ember.run.later(() => modal.width('321px'));
        });

        this.set('webviewLoadListener', listener);
    },

    /**
     * HTML Body Content will never be length=0, but might still be empty
     * to the user. Let's check if there's anything in there.
     * @return {boolean} - Does the body have content
     */
    _determineIfBodyHasContent() {
        const body = this.get('body');
        const content = /<body [^>]*>([\s\S]*?)<\/body>/g.exec(body);

        // Quick Check for Office-Style Empty Content
        if (content && content[1] && /\s*?<div>\s*?<br>\s*?<\/div>\s*?/.test(content[1])) {
            return false;
        }
        return true;
    }
});
