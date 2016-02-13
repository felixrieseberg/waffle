import Ember from 'ember';

export default Ember.Component.extend({
    classNames: ['sidebar', 'sidebar-effect'],

    actions: {
        toggleSettings() {
            this.toggleProperty('isSettingsVisible');
        }
    }
});
