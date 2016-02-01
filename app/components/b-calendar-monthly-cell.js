import Ember from 'ember';

export default Ember.Component.extend({
    classNames: ['monthly-day'],
    classNameBindings: ['isInTargetMonth::outside-month'],

    dateOfMonth: Ember.computed('date', {
        get() {
            return this.get('date').format('D');
        }
    }),

    didReceiveAttrs() {
        this._super(...arguments);
        this._loadEvents();
    },

    _loadEvents() {
        const events = this.get('events');
        const index = this.get('index');

        if (events && events.length > 0) {
            this.set('dayEvents', events[index]);
        }
    }
});
