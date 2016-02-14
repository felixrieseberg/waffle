import Ember from 'ember';
import moment from 'moment';

export default Ember.Controller.extend({
    synchro: Ember.inject.service(),
    isSettingsVisible: false,
    isSidebarVisible: false,

    init() {
        this._super(...arguments);
        this.set('targetDate', moment().date(1).format('YYYY-MM-DD'));
        this.set('currentView', 'monthly');
    },

    calendarViewChangeHandler(newView) {
        if (newView === 'monthly') {
            this.set('currentView', 'monthly');
        } else if (newView === 'weekly') {
            this.set('currentView', 'weekly');
        }
    },

    actions: {
        sync() {
            this.get('synchro').synchronize();
        }
    }
});
