import Ember from 'ember';
import moment from 'moment';

export default Ember.Component.extend({
    tagName: 'header',
    classNames: ['calendar-header'],

    actions: {
        calendarViewChangeHandler(newView) {
            this.sendAction('calendarViewChangeHandler', newView);
        },

        toggleSidebar() {
            this.toggleProperty('isSidebarVisible');
        },

        moveCalendar(direction) {
            const currentTargetDate = this.get('targetDate');
            const currentView = this.get('currentView');
            const distance = (currentView === 'monthly') ? 'month' : 'week';
            const newTargetDate = moment(currentTargetDate, 'YYYY-MM-DD');

            if (direction === 'forward') {
                newTargetDate.add(1, distance);
            } else if (direction === 'back') {
                newTargetDate.subtract(1, distance);
            }

            this.sendAction('targetDateChangeHandler', newTargetDate.format('YYYY-MM-DD'));
        }
    }
});
