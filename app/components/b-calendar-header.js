import Ember from 'ember';

export default Ember.Component.extend({
    tagName: 'header',
    classNames: ['calendar-header'],

    actions: {
        calendarViewChangeHandler(newView) {
            this.sendAction('calendarViewChangeHandler', newView);
        },

        moveCalendar(direction) {
            const currentTargetDate = this.get('targetDate');
            const currentView = this.get('currentView');
            const distance = (currentView === 'monthly') ? 30 : 7;
            const newTargetDate = moment(currentTargetDate, 'YYYY-MM-DD');

            if (direction === 'forward') {
                newTargetDate.add(distance, 'days');
            } else if (direction === 'back') {
                newTargetDate.subtract(distance, 'days');
            }

            this.sendAction('targetDateChangeHandler', newTargetDate.format('YYYY-MM-DD'));
        }
    }
});
