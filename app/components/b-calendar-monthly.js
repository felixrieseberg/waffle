import Ember from 'ember';
import moment from 'moment';

export default Ember.Component.extend({
    synchro: Ember.inject.service(),
    classNames: ['calendar'],
    rows: [],

    firstDay: Ember.computed('targetDate', {
        get() {
            const now = moment(this.get('targetDate'), 'YYYY-MM-DD');
            const currentMonth = now.month();
            let firstDay;

            // If the first day of the month is a Monday, great
            // If not, let's find the first Monday
            if (now.date(1).day() !== 0) {
                firstDay = now.day(-0);
            } else {
                firstDay = now;
            }

            return firstDay;
        }
    }),

    init() {
        this._super(...arguments);
        Ember.run.once(() => this.setupRows());
        this.get('synchro').on('update', () => {
            this._addEventsToRows();
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

    _addEventsToRows() {
        return new Ember.RSVP.Promise((resolve, reject) => {
            let startDate = this.get('firstDay');
            let rowBounds = [];
            let events = [[], [], [], [], [], []];
            let promises = [];

            for (let i = 0; i < 6; i++) {
                rowBounds.push({
                    start: startDate.clone().add(i * 7, 'days').startOf('day'),
                    end: startDate.clone().add((i + 1) * 7, 'days').endOf('day')
                });
            }

            this.get('accounts').forEach(account => {
                promises.push(account.get('events').then(accountEvents => {
                    console.log(`Calendar: Processing ${accountEvents.length} events for ${account.get('username')}`);
                    accountEvents.forEach(event => {
                        const start = event.get('start');

                        for (let i = 0; i < rowBounds.length; i++) {
                            if (moment(start).isBetween(rowBounds[i].start, rowBounds[i].end)) {
                                events[i].push(event);
                                break;
                            }
                        }
                    });
                }));
            });

            Ember.RSVP.all(promises).then(() => {
                const rows = this.get('rows');
                for (let i = 0; i < events.length; i++) {
                    rows[i].events.clear();
                    rows[i].events.pushObjects(events[i]);
                }
            });
        });
    }
});
