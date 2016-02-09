import Ember from 'ember';
import moment from 'moment';
import { Mixin, Debug } from '../mixins/debugger';
import { processArrayAsync } from '../utils/performance';

export default Ember.Component.extend(Mixin, {
    synchro: Ember.inject.service(),
    store: Ember.inject.service(),
    classNames: ['calendar'],
    events: [],
    rows: [],
    views: [],
    eventModalTop: 0,
    eventModalLeft: 0,

    firstDay: Ember.computed('targetDate', {
        get() {
            const now = moment(this.get('targetDate'), 'YYYY-MM-DD');
            return (now.clone().date(1).day() !== 0) ? now.day(-0) : now;
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
            this.get('synchro').on('update', () => this.refresh());
            this.set('debugger', new Debug('Calendar (Monthly)'));
        });
    },

    refresh() {
        Ember.run.later(() => {
            this.log('Refreshing');
            this.set('loadedEvents', []);
            this.set('views', []);
            this._loadEvents();
        });
    },

    didReceiveAttrs() {
        this._super(...arguments);
        Ember.run.once(() => this.setupRows());
    },

    didRender() {
        Ember.run.debounce(this, this._prefetchCachedViews, 200);
    },

    setupRows() {
        this.time('Monthly Init');
        this.get('rows').clear();
        this.get('rows').pushObjects(this._getRows(this.get('firstDay')));
        this._loadEvents();
    },

    _getRows(startDate) {
        const rows = [];

        for (let i = 0; i < 6; i++) {
            rows.push({
                startDate: startDate.clone().add(i * 7, 'days').startOf('day'),
                endDate: startDate.clone().add((i * 7) + 6, 'days').endOf('day')
            });
        }

        return rows;
    },

    _loadEvents() {
        const self = this;
        const firstDay = this.get('firstDay');

        function load() {
            if (self.isDestroyed && self.isDestroying) return;

            const cachedView = self._getCachedView(firstDay);

            if (cachedView) {
                self.set('events', cachedView.events);
                self.timeEnd('Monthly Init');
            } else {
                self._fetchEvents().then(async (events) => {
                    const eventsInView = await self._processEvents(events);

                    if (!self.isDestroyed && !self.isDestroying) {
                        self.set('events', eventsInView);
                        self.timeEnd('Monthly Init');
                    }

                    return eventsInView;
                }).then((events) => {
                    requestIdleCallback(() => {
                        self._addCachedView({
                            firstDay,
                            events
                        });
                    }, {
                        timeout: 5000
                    });
                });
            }
        }

        requestIdleCallback(load, {
            timeout: 200
        });
    },

    _fetchEvents(optionalStart, optionalEnd) {
        return new Promise(resolve => {
            const store = this.get('store');
            const start = optionalStart || this.get('firstDay').toISOString();
            const end = optionalEnd || this.get('lastDay').toISOString();
            const promises = [];
            let events = [];

            this.get('accounts').forEach(account => {
                const query = {
                    isCalendarQuery: true,
                    accountId: account.get('id'),
                    start,
                    end
                };

                promises.push(store.query('event', query)
                    .then(result => {
                        events = events.concat(result.toArray());
                    })
                );
            });

            Ember.RSVP.all(promises).then(() => resolve(events));
        });
    },

    _processEvents(events, passedRows) {
        return new Promise(resolve => {
            if (this.isDestroyed || this.isDestroying) return;

            const rows = passedRows || this.get('rows');
            const eventsArray = events.toArray();
            const eventsInView = [[], [], [], [], [], []];

            this.log(`Calendar: Processing ${events.length} events`);

            processArrayAsync(eventsArray, (event) => {
                for (let i = 0; i < rows.length; i++) {
                    const start = moment(new Date(event.get('start')));
                    const end = moment(new Date(event.get('end')));
                    const startBetween = start.isBetween(rows[i].startDate, rows[i].endDate);
                    const endBetween = end.isBetween(rows[i].startDate, rows[i].endDate);

                    if (startBetween || endBetween) {
                        eventsInView[i].push(event);
                        if (rows[i].endDate.isSameOrAfter(end, 'day')) break;
                    }
                }
            }, 25, this).then(() => {
                resolve(eventsInView);
            });
        });
    },

    _getCachedView(firstDay) {
        const views = this.get('views');

        if (views && views.length && views.length > 0) {
            const exists = views.find(item => (firstDay.isSame(item.firstDay, 'day')));
            return exists;
        }
    },

    _addCachedView(view) {
        const views = this.get('views');

        if (views && views.length && views.length > 0) {
            const exists = views.find(item => view.firstDay.isSame(item.firstDay, 'day'));
            if (exists) return;
        }

        views.pushObject(view);
    },

    _prefetchCachedViews() {
        this._prefetchCachedViewForMonth(-1);
        this._prefetchCachedViewForMonth(1);
    },

    _prefetchCachedViewForMonth(month) {
        const self = this;

        function load() {
            if (self.isDestroyed && self.isDestroying) return;

            const targetDate = moment(self.get('targetDate'), 'YYYY-MM-DD');
            const newMonth = targetDate.clone().add(month, 'month').date('1').startOf('day');
            const firstDay = (newMonth.day() !== 0) ? newMonth.day(-0) : newMonth;
            const lastDay = firstDay.clone().add(42, 'days').endOf('day');

            if (self._getCachedView(firstDay)) return;

            const nextRows = self._getRows(firstDay);

            self._fetchEvents(firstDay.toISOString(), lastDay.toISOString())
                .then(async (loadedEvents) => {
                    const events = await self._processEvents(loadedEvents, nextRows);

                    self.log(`Caching view with start date ${firstDay.format('Do MMMM')} `);
                    self._addCachedView({
                        events,
                        firstDay
                    });
                }
            );
        }

        requestIdleCallback(load, {
            timeout: 60000
        });
    },

    actions: {
        onEventClicked(e, selectedEvent) {
            this.set('selectedEvent', selectedEvent);
            this.set('eventModalTop', e.clientY);
            this.set('eventModalLeft', e.clientX);
            this.toggleProperty('eventModalVisible');
        }
    }
});
