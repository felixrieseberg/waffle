import Ember from 'ember';
import moment from 'moment';
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
        this._loadEvents();
    },

    _getDays(startDate) {
        const targetDate = moment(this.get('targetDate'), 'YYYY-MM-DD');
        const days = [];

        for (let i = 0; i < 7; i++) {
            const date = i > 0 ? startDate.clone().add(i, 'days') : startDate.clone();
            const isInTargetMonth = (targetDate.month() === date.month());

            days.push({
                date,
                isInTargetMonth
            });
        }

        return days;
    },

    _loadEvents() {
        const events = this.get('events');
        const index = this.get('index');
        const self = this;

        function load() {
            if (self.isDestroyed || self.isDestroyed) return;
            self.set('rowEvents', self._processEvents(events[index]));
        }

        if (events && events.length > 0) {
            requestIdleCallback(load, {
                timeout: 200
            });
        }
    },

    _processEvents(events) {
        const days = this.get('days');
        const eventsInView = [[], [], [], [], [], [], []];

        if (!days || !days.length) return eventsInView;

        events.forEach((event) => {
            for (let i = 0; i < days.length; i++) {
                const start = new Date(event.get('start'));
                const end = new Date(event.get('end'));

                // We can allow us to do "dumb" comparisons, given that the
                // data already arrived filtered from the db and the month
                // component.
                const startOn = (start.getDate() === days[i].date.date());
                const endOn = (end.getDate() === days[i].date.date());

                if (startOn || endOn || days[i].date.isBetween(start, end)) {
                    eventsInView[i].push(event);
                }

                if (days[i].date.isSame(end, 'day')) break;
            }
        });

        return eventsInView;
    },

    actions: {
        onEventClicked() {
            this.get('onEventClicked')(...arguments);
        }
    }
});
