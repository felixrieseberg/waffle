import Ember from 'ember';
import moment from 'moment';
import { inDays } from '../utils/time-utils';
import { Mixin, Debug } from '../mixins/debugger';
import { processArrayAsync } from '../utils/performance';

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

        this.log('Started synchronization for all accounts');
        this.set('isSyncEngineRunning', true);

        const store = this.get('store');
        const accounts = await store.findAll('account');
        const promises = [];

        for (let i = 0; i < accounts.content.length; i = i + 1) {
            promises.push(this.synchronizeAccount(accounts.content[i].record, false));
        }

        Ember.RSVP.all(promises).then(() => this.set('isSyncEngineRunning', false));
    },

    /**
     * Performs an initial sync for an account - deleting
     * all existing accounts, getting all events, and
     * saving a "sync" token to fetch only deltas going
     * forward
     * @param  {model/account} account - Account to use
     * @param  {boolean} isInitial - Set to true if this is an initial sync
     * @return {Promise}
     */
    synchronizeAccount(account, isInitial) {
        return new Ember.RSVP.Promise((resolve, reject) => {
            if (!account) reject(new Error('Missing account parameter'));

            this.log(`Synchronizing account`);

            const start = inDays(-365);
            const end = inDays(365);
            const strategy = 'strategy:' + account.get('strategy');
            const syncOptions = { trackChanges: true, useDelta: !isInitial };
            let events = [];

            return this.get(strategy).getCalendarView(start, end, account, syncOptions).then((result) => {
                if (result.deltaToken) {
                    this.log(`New Delta Token for ${account.get('name')}`);
                    let startDate = start.toString();
                    let endDate = end.toString();
                    account.set('sync', { startDate, endDate, deltaToken: result.deltaToken });
                    account.save();
                }

                return this._replaceEventsInDB(result.events, account).then(() => {
                    this.trigger('update')
                    return resolve();
                });

                // Todo: Handle this logic
                // if (isInitial) {
                //     return this._replaceEventsInDB(result.events, account).then(() => this.trigger('update'));
                // } else {
                //     return this._updateEventsInDB(result.events, account).then(() => this.trigger('update'));
                // }
            });
        });
    },

    /**
     * Get a calendar view
     * @param  {moment} start   Start date
     * @param  {moment} end     End date
     * @param  {model/account} account - Account to use
     * @return {Promise}
     */
    _getCalendarView(start, end, account) {
        const strategy = 'strategy:' + account.get('strategy');

        this.log(`Syncing ${account.get('name')} from ${start.calendar()} to ${end.calendar()}`);

        return this.get(strategy).getCalendarView(start, end, account).then(events => {
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
                    accountEvents.removeObject(item);
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
            resolve();
        });
    },

    _replaceEventsInDB(events, account) {
        return new Ember.RSVP.Promise(async (resolve, reject) => {
            const store = this.get('store');
            let newEvents = [];

            this.log('Replacing events in database');

            // Delete all old events
            account.get('events').then(accEvents => {
                // Delete all of them
                processArrayAsync(accEvents.toArray(), (event) => {
                    if (event) {
                        event.deleteRecord();
                        event.save();
                    } else {
                        console.count('event undefined');
                    }
                }, 25, this).then(() => this.log('Deleted old events'));
            });

            // Replace them
            for (let i = 0; i < events.length; i++) {
                const newEvent = store.createRecord('event', {
                    providerId: events[i].providerId,
                    start: events[i].start,
                    end: events[i].end,
                    title: events[i].title,
                    editable: events[i].editable
                });

                newEvents.push(newEvent);
                await newEvent.save();
            }

            account.set('events', newEvents);
            await account.save();
            this.log('Events replaced');
            resolve();
        });
    }
});
