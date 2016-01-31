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
        const self = this;
        const events = this.get('events');
        const firstDay = this.get('days.firstObject.date');
        const lastDay = this.get('days.lastObject.date');
        const today = this.get('date');
        let dayEvents = [];

        if (!events) return;

        function load() {
            if (self.isDestroyed && self.isDestroying) {
                return;
            }

            events.forEach((event) => {
                if (moment(event.get('start')).isSame(today, 'day') ||
                    moment(event.get('end')).isSame(today, 'day')) {
                    dayEvents.push(event);
                }
            });

            if (!self.isDestroyed && !self.isDestroying) {
                self.set('dayEvents', dayEvents);
            }
        }

        requestIdleCallback(load, { timeout: 2000 });
    }
});
