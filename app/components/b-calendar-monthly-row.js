import Ember from 'ember';
import { Mixin, Debug } from '../mixins/debugger';

export default Ember.Component.extend(Mixin, {
    classNames: ['monthly-row'],

    init() {
        this._super(...arguments);
        this.set('debugger', new Debug('Calendar MonthRow'));
        Ember.run.once(() => this.setup());
    },

    setup() {
        this.set('days', this._getDays(this.get('startDate')));
    },

    didReceiveAttrs() {
        this._super(...arguments);
        if (!this.get('loadingEvents')) {
            this._loadEvents();
        }
    },

    _getDays(startDate) {
        const targetDate = moment(this.get('targetDate'), 'YYYY-MM-DD');
        let days = [];

        for (let i = 0; i < 7; i++) {
            let dayDate = i > 0 ? startDate.clone().add(i, 'days') : startDate.clone();
            let isInTargetMonth = (targetDate.month() === dayDate.month());

            days.push({
                date: moment(dayDate),
                isInTargetMonth: isInTargetMonth
            });
        }

        return days;
    },

    _loadEvents() {
        const self = this;
        const events = this.get('events');
        const firstDay = this.get('days.firstObject.date');
        const lastDay = this.get('days.lastObject.date');
        let rowEvents = [];

        if (!events) return;

        function load() {
            if (self.isDestroyed && self.isDestroying) {
                return;
            }

            events.forEach((event) => {
                if (moment(event.get('start')).isBetween(firstDay, lastDay) ||
                    moment(event.get('end')).isBetween(firstDay, lastDay)) {
                    rowEvents.push(event);
                }
            });

            if (!self.isDestroyed && !self.isDestroying) {
                self.set('rowEvents', rowEvents);
            }
        }

        requestIdleCallback(load, { timeout: 2000 });
    }
});
