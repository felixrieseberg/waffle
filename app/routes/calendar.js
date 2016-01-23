import Ember from 'ember';

export default Ember.Route.extend({
    office: Ember.inject.service('office'),
    
    actions: {
        authenticateOffice() {
            this.get('office').authenticate();
        },
        
        getOfficeEvents() {
            this.get('office').getEvents();
        }
    }
});
