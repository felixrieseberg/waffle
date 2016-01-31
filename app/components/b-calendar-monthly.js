import Ember from 'ember';
import moment from 'moment';
import { Mixin, Debug } from '../mixins/debugger';

export default Ember.Component.extend(Mixin, {
    synchro: Ember.inject.service(),
    classNames: ['calendar'],
    rows: [],

    firstDay: Ember.computed('targetDate', {
        get() {
            const now = moment(this.get('targetDate'), 'YYYY-MM-DD');
            let firstDay;

            // If the first day of the month is a Monday, great
            // If not, let's find the first Monday
            if (now.clone().date(1).day() !== 0) {
                firstDay = now.day(-0);
            } else {
                firstDay = now;
            }

            return firstDay;
        }
    }),

    lastDay: Ember.computed('firstDay', {
        get() {
            return this.get('firstDay').clone().add(42, 'days').endOf('day');
        }
    }),

    init() {
        this._super(...arguments);
        Ember.run.once(() => {
            this.setupRows();
            this.set('debugger', new Debug('Calendar (Monthly)'));
        });
    },

    didReceiveAttrs() {
        this._super(...arguments);
        Ember.run.once(() => this.setupRows());
    },

    setupRows() {
        const rows = this.get('rows');
        rows.clear();
        rows.pushObjects(this._getRows(this.get('firstDay')));
        this._loadEvents();
    },

    _getRows(startDate) {
        let rows = [];

        for (let i = 0; i < 6; i++) {
            rows.push({
                startDate: startDate.clone().add(i * 7, 'days'),
                events: []
            });
        }

        return rows;
    },

    _loadEvents() {
        let promises = [];
        let eventsInView = [];

        const self = this;
        const firstDay = this.get('firstDay');
        const lastDay = this.get('lastDay');

        function load() {
            if (self.isDestroyed && self.isDestroying) {
                return;
            }

            self.get('accounts').forEach(account => {
                promises.push(account.get('events').then(events => {
                    self.log(`Calendar: Processing ${events.length} events for ${account.get('username')}`);
                    events.forEach((event) => {
                        if (moment(event.get('start')).isBetween(firstDay, lastDay) ||
                            moment(event.get('end')).isBetween(firstDay, lastDay)) {
                            eventsInView.push(event);
                        }
                    });
                }));
            });

            Ember.RSVP.all(promises).then(() => {
                if (!self.isDestroyed && !self.isDestroying) {
                    self.set('events', eventsInView);
                }
            });
        };

        requestIdleCallback(load, { timeout: 2000 });
    }
});
