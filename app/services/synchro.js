import Ember from 'ember';
import { Mixin, Debug } from '../mixins/debugger';

export default Ember.Service.extend(Ember.Evented, Mixin, {
    store: Ember.inject.service(),
    isSyncEngineRunning: false,

    init() {
        this._super(...arguments);
        this.set('debugger', new Debug('Sync Engine'));
        this.startEngine();
    },

    startEngine() {
        this.log('Started Synchronization Engine');
        this.set('syncInterval', this.schedule(this.get('synchronize')));
    },

    stopEngine() {
        Ember.run.cancel(this.get('syncInterval'));
    },

    schedule(f) {
        return Ember.run.later(this, function () {
            f.apply(this);
            this.set('syncInterval', this.schedule(f));
        }, 180000);
    },

    async synchronize() {
        if (this.get('isSyncEngineRunning') === true) {
            this.log('Sync Engine: Wanted to sync, but synchronization is already running');
            return;
        }

        this.set('isSyncEngineRunning', true);

        const store = this.get('store');
        const accounts = await store.findAll('account');
        const promises = [];

        for (let i = 0; i < accounts.content.length; i = i + 1) {
            promises.push(this._syncAccount(accounts.content[i].record));
        }

        Ember.RSVP.all(promises).then(() => {
            this.set('isSyncEngineRunning', false);
        });
    },

    _inDays(days) {
        if (days > 0) {
            return moment().add(days, 'days');
        } else {
            return moment().subtract(days * -1, 'days');
        }
    },

    _syncAccount(account) {
        return new Ember.RSVP.Promise((resolve, reject) => {
            // TODO: Sync in priority windows (three months ago doesn't need to be synced every few minutes)
            let syncWindows = [
                { from: -1, to: 1 },
                { from: 1, to: 10 },
                { from: -10, to: -1 },
                { from: 10, to: 20 },
                { from: 20, to: 30 },
                { from: -20, to: -10 },
                { from: -30, to: -20 },
                { from: 30, to: 40 },
                { from: 40, to: 50 },
                { from: 50, to: 60 },
                { from: -40, to: -30 },
                { from: -50, to: -40 },
                { from: -60, to: -50 },
                { from: 60, to: 70 },
                { from: 70, to: 80 },
                { from: 80, to: 90 }
            ];

            syncWindows.reduce((current, next) => {
                return current.then(() => {
                    const from = this._inDays(next.from);
                    const to = this._inDays(next.to);
                    return this._syncCalendarView(from, to, account);
                })
            }, Ember.RSVP.resolve().then(() => {
                // all executed
                this.log('All sync windows synchronized');
                resolve();
            }));
        });
    },

    _syncCalendarView(start, end, account) {
        const strategy = 'strategy:' + account.get('strategy');

        this.log(`Syncing ${account.get('name')} from ${start.calendar()} to ${end.calendar()}`);

        return this.get(strategy).getCalendarView(start, end, account)
            .then(events => {
                return this._updateEventsInDB(start, end, events, account);
            });
    },

    _removeEventsInDB(start, end, account) {
        return new Ember.RSVP.Promise(async (resolve) => {
            const store = this.get('store');
            const accountEvents = await account.get('events');
            const length = accountEvents.length
            let deleteCount = 0;
            let processedCount = 0;

            this.log(`Checking ${length} events for deletion, using ${start.calendar()} and ${end.calendar()} as bounds`);

            for (let i = 0; processedCount < length; i = i + 1) {
                const item = accountEvents.objectAt(i);
                const eventStart = moment(item.get('start'));
                const eventEnd = moment(item.get('end'));

                if (eventStart.isAfter(start) && eventStart.isBefore(end) ||
                    eventEnd.isAfter(start) && eventEnd.isBefore(end)) {
                    deleteCount = deleteCount + 1;
                    i = i - 1;
                    account.get('events').removeObject(item);
                    item.deleteRecord();
                    item.save();
                }

                processedCount = processedCount + 1;
            }

            this.log(`Deleted ${deleteCount} events`);

            await account.save();
            resolve();
        });
    },

    _updateEventsInDB(start, end, events, account) {
        return new Ember.RSVP.Promise(async (resolve, reject) => {
            const store = this.get('store');
            const accountEvents = await account.get('events');

            // Ensure that we "clean" the target area first
            await this._removeEventsInDB(start, end, account);

            // Then, add back accounts
            for (let i = 0; i < events.length; i++) {
                const newEvent = store.createRecord('event', {
                    providerId: events[i].providerId,
                    start: events[i].start,
                    end: events[i].end,
                    title: events[i].title,
                    editable: events[i].editable
                });

                account.get('events').pushObject(newEvent);
                await newEvent.save();
            }

            await account.save();
            this.trigger('update');
            resolve();
        })
    },
});
