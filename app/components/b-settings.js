import Ember from 'ember';

export default Ember.Component.extend({
    office: Ember.inject.service(),
  
    currentView: 'accounts',
    o365: true,
    
    o365email: Ember.computed({
        get() {
            return this.get('office').getEmail()
        }
    }),
    
    init() {
        this._super(...arguments);
        this.send('switchToPreferences');
    },

    actions: {
        authenticateOffice() {
            this.get('office').authenticate();
        },
        
        toggleVisibility() {
            this.toggleProperty('isEnabled');
        },
        
        switchToAccounts() {
            this.set('isAccounts', true);
            this.set('isPreferences', false);
        },
        
        switchToPreferences() {
            this.set('isAccounts', false);
            this.set('isPreferences', true);
        }
    }
});
