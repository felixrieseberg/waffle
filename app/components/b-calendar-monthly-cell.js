import Ember from 'ember';

export default Ember.Component.extend({
    classNames: ['monthly-day'],
    classNameBindings: ['isInTargetMonth::outside-month', 'isToday:is-today'],

    dateOfMonth: Ember.computed('date', {
        get() {
            return this.get('date').format('D');
        }
    }),

    isToday: Ember.computed('date', {
        get() {
            return this.get('date').isSame(Date.now(), 'day');
        }
    }),

    didReceiveAttrs() {
        this._super(...arguments);
        this._loadEvents();
    },

    _loadEvents() {
        const events = this.get('events');
        const index = this.get('index');

        if (events && events.length > 0 && events[index]) {
            const eventsAtIndex = events[index];
            eventsAtIndex.sort((a, b) => {
                let aAD = a.get('isAllDay');
                let bAD = b.get('isAllDay');
                if (aAD === bAD) return 0;
                if (aAD) return -1;
                return 1;
            });
            this.set('dayEvents', eventsAtIndex);
        }
    },

    actions: {
        onEventClicked() {
            this.get('onEventClicked')(...arguments);
        }
    }
});
