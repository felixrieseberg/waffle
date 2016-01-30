import Ember from 'ember';

export default Ember.Component.extend({
    classNames: ['sidebar'],

    actions: {
        toggleSettings() {
            this.sendAction('toggleSettings')
        }
    }
});
