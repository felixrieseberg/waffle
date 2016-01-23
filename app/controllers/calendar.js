import Ember from 'ember';
import moment from 'moment';

export default Ember.Controller.extend({
    settingsVisible: false,
    office: Ember.inject.service(),
    
    init() {
        this._super(...arguments);
        Ember.run.next(() => this.resetCalendarHeight());
        
        $(window).off('resize');
        $(window).resize(() => this.resetCalendarHeight());
    },
    
    resetCalendarHeight() {
        const height = $(window).height() - 20;
        $('.full-calendar').fullCalendar('option', 'height', height);
    },
    
    actions: {
        toggleSettings() {
            this.toggleProperty('settingsVisible')
        },
        
        getEvents() {
            const now = moment().toISOString();
            const nextWeek = moment().add(7, 'd').toISOString();
            this.get('office').getCalendarView(now, nextWeek);
        }
    }
});
