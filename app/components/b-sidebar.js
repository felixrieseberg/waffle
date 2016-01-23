import Ember from 'ember';

export default Ember.Component.extend({
    actions: {
        toggleSettings() {
            this.sendAction('toggleSettings')
        }
    }
});
