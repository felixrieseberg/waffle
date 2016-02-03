import Ember from 'ember';
import moment from 'moment';
import { Mixin, Debug } from '../mixins/debugger';
import { processArrayAsync } from '../utils/performance';

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
        this.log('Refreshing');
        this.set('loadedEvents', []);
        this.set('views', []);
        this.setupRows();
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

    _processEvents(events, rows, eventsInView) {
        return new Ember.RSVP.Promise((resolve, reject) => {
            if (this.isDestroyed || this.isDestroying) return;

            rows = rows || this.get('rows');
            events = events.toArray();
            eventsInView = [[], [], [], [], [], []];

            this.log(`Calendar: Processing ${events.length} events`);

            processArrayAsync(events, (event) => {
                for (let i = 0; i < rows.length; i++) {
                    let startBetween = moment(event.get('start')).isBetween(rows[i].startDate, rows[i].endDate);
                    let endBetween = moment(event.get('end')).isBetween(rows[i].startDate, rows[i].endDate);

                    if (startBetween || endBetween) {
                        eventsInView[i].push(event);
                        break;
                    }
                }
            }, 25, this).then(() => {
                resolve(eventsInView);
            });
        });
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
                self.timeEnd('Monthly Init');
            } else {
                self._getOrLoadEvents().then(async (events) => {
                    let eventsInView = await self._processEvents(events);

                    if (!self.isDestroyed && !self.isDestroying) {
                        self.set('events', eventsInView);
                        self.timeEnd('Monthly Init');
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

            if (self._getCachedView(firstDay)) return;

            const nextRows = self._getRows(firstDay);

            self._getOrLoadEvents().then(async (loadedEvents) => {
                const events = await self._processEvents(loadedEvents, nextRows);

                self.log(`Caching view with start date ${firstDay.format('Do MMMM')} `);
                self._addCachedView({ events, firstDay });
            });
        }

        requestIdleCallback(load, { timeout: 60000 });
    }
});
