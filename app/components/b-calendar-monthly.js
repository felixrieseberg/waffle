import Ember from 'ember';
import moment from 'moment';
import { Mixin, Debug } from '../mixins/debugger';

export default Ember.Component.extend(Mixin, {
    synchro: Ember.inject.service(),
    classNames: ['calendar'],
    loadedEvents: [],
    events: [],
    rows: [],
    views: [],

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

    didRender() {
        // Now that we're rendered, let's preload the prev & the next events
    },

    setupRows() {
        console.time('Monthly Init');
        this.get('rows').clear();
        this.get('rows').pushObjects(this._getRows(this.get('firstDay')));
        this._loadEvents();
    },

    _getRows(startDate) {
        let rows = [];

        for (let i = 0; i < 6; i++) {
            rows.push({
                startDate: startDate.clone().add(i * 7, 'days').startOf('day'),
                endDate: startDate.clone().add((i * 7) + 6, 'days').endOf('day')
            });
        }

        return rows;
    },

    _getOrLoadEvents() {
        return new Ember.RSVP.Promise((resolve, reject) => {
            const loadedEvents = this.get('loadedEvents');
            let events = [];
            let promises = [];

            if (loadedEvents && loadedEvents.length && loadedEvents.length > 0) {
                resolve(loadedEvents);
            } else {
                this.get('accounts').forEach(account => {
                    promises.push(account.get('events').then(result => {
                        events = events.concat(result.toArray());
                    }));
                });

                Ember.RSVP.all(promises).then(() => {
                    this.set('loadedEvents', events);
                    resolve(events);
                });
            }
        });
    },

    _processEvents(events) {
        const rows = this.get('rows');
        let eventsInView = [[], [], [], [], [], []];

        this.log(`Calendar: Processing ${events.length} events`);
        events.forEach((event) => {
            for (let i = 0; i < rows.length; i++) {
                let startBetween = moment(event.get('start')).isBetween(rows[i].startDate, rows[i].endDate);
                let endBetween = moment(event.get('end')).isBetween(rows[i].startDate, rows[i].endDate);

                if (startBetween || endBetween) {
                    eventsInView[i].push(event);
                    break;
                }
            }
        });

        return eventsInView;
    },

    _loadEvents() {
        const self = this;
        const firstDay = this.get('firstDay');

        function load() {
            if (self.isDestroyed && self.isDestroying) {
                return;
            };

            const cachedView = self._getCachedView(firstDay)

            if (cachedView) {
                self.set('events', cachedView.events);
                console.timeEnd('Monthly Init');
            } else {
                self._getOrLoadEvents().then((events, inView) => {
                    let eventsInView = self._processEvents(events);

                    if (!self.isDestroyed && !self.isDestroying) {
                        self.set('events', eventsInView);
                        console.timeEnd('Monthly Init');
                    }

                    return eventsInView;
                }).then((eventsInView) => {
                    requestIdleCallback(() => {
                        self._addCachedView({
                            firstDay: firstDay,
                            events: eventsInView
                        });
                    }, { timeout: 5000 });
                });
            }
        };

        requestIdleCallback(load, { timeout: 200 });
    },

    _getCachedView(firstDay) {
        const views = this.get('views');

        if (views && views.length && views.length > 0) {
            const exists = views.find(function (item) {
                return (firstDay.isSame(item.firstDay, 'day'));
            });

            return exists;
        }
    },

    _addCachedView(view) {
        const views = this.get('views');

        if (views && views.length && views.length > 0) {
            const exists = views.find(function (item) {
                return (view.firstDay.isSame(item.firstDay, 'day'));
            });

            if (exists) return;
        }

        views.pushObject(view);
    }
});
