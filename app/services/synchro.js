import Ember from 'ember';
import { inDays } from '../utils/time-utils';
import { Mixin, Debug } from '../mixins/debugger';
import moment from 'moment';

export default Ember.Service.extend(Ember.Evented, Mixin, {
    store: Ember.inject.service(),
    isSyncEngineRunning: false,
    syncWindows: [
        { start: -30, end: 30, synced: null, every: 5 },
        { start: -365, end: -30, synced: null, every: 15 },
        { start: 30, end: -365, synced: null, every: 15 },
        { start: -730, end: -365, synced: null, every: 60 },
        { start: 365, end: 730, synced: null, every: 60 }
    ],

    /**
     * Called as soon as the service initializes,
     * setting up debugging and starting the sync engine
     */
    init() {
        this._super(...arguments);
        this.set('debugger', new Debug('Sync Engine'));
        this.startEngine();
    },

    /**
     * Starts the engine, which regularly calls syncronize();
     */
    startEngine() {
        this.log('Started Synchronization Engine');
        this.set('syncInterval', this._schedule(this.get('synchronize')));
    },

    /**
     * Stops the engine, which regularly calls syncronize();
     */
    stopEngine() {
        Ember.run.cancel(this.get('syncInterval'));
    },

    /**
     * Schedules a function to be run at a later point in time
     * @param  {function} f - function to schedule
     * @return {*}          - Timer information for use in cancelling, see `run.cancel`.
     */
    _schedule(f) {
        return Ember.run.later(this, () => {
            f.apply(this);
            this.set('syncInterval', this._schedule(f));
        }, 180000);
    },

    /**
     * Synchronize all accounts
     */
    async synchronize() {
        if (this.get('isSyncEngineRunning')) {
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

        Ember.RSVP.allSettled(promises)
            .then(() => this.trigger('update'))
            .finally(() => this.set('isSyncEngineRunning', false));
    },

    /**
     * Performs an initial sync for an account - deleting
     * all existing accounts, getting all events, and
     * saving a "sync" token to fetch only deltas going
     * forward
     * @param  {model/account} account - Account to use
     * @param  {boolean} isInitial     - Set to true if this is an initial sync
     * @param  {moment} start          - Start of the search window
     * @param  {moment} end            - End of the search window
     * @return {Promise}
     */
    synchronizeAccount(account, isInitial) {
        return new Promise((resolve, reject) => {
            if (!account) reject('Missing account parameter');

            this.log(`Synchronizing account`);

            const strategy = `strategy:${account.get('strategy')}`;
            const syncOptions = { trackChanges: true, useDelta: !isInitial };
            const syncWindow = this._chooseWindow(account);
            const start = inDays(syncWindow.start);
            const end = inDays(syncWindow.end);

            return this.get(strategy).getCalendarView(start, end, account, syncOptions)
                .then((result) => {
                    if (result.deltaToken) {
                        const startDate = start.toString();
                        const endDate = end.toString();

                        account.set('sync', { startDate, endDate, deltaToken: result.deltaToken });
                        account.save();
                    }

                    return this._replaceEventsInDB(start, end, result.events, account).then(() => {
                        this.trigger('update');
                        return resolve(account);
                    });
                })
                .then(() => {
                    this._updateWindow(account, syncWindow);
                })
                .catch((err) => {
                    console.log(err);
                    const error = `Account ${account.get('name')} with user ${account.get('username')}`
                                + `is corrupted, please delete and add again.`;
                    this.notifications.error(error);
                });
        });
    },

    /**
     * Chooses a window to sync
     *
     * Priority 0: Sync every 5 minutes
     * Priority 1: Sync every 15 minutes
     * Priority 2: Sync every hour
     *
     * @param  {model/account} account - Account to use
     * @return {object} Window to sync
     */
    _chooseWindow(account) {
        const windows = this.get('syncWindows');
        const accountWindows = account.get('windows');
        let toSync;

        if (accountWindows) {
            toSync = accountWindows.find(item => {
                if (item.synced === null) return true;
                const shouldHaveSynced = moment().subtract({ minutes: item.every });
                const synced = moment(item.synced);
                const syncTooOld = synced.isBefore(shouldHaveSynced);

                return syncTooOld;
            });
        }

        if (!toSync) {
            account.set('windows', windows);
            account.save();
            return windows[0];
        }

        return toSync;
    },

    /**
     * Saves the last sync time for a given window on an account
     * @param  {model/account} account  - Account to use
     * @param  {object} window          - Window that was synced
     */
    _updateWindow(account, window) {
        const accountWindows = account.get('windows');
        let foundIndex;
        let updatedWindow;

        updatedWindow = accountWindows.find((item, index) => {
            if (item.start === window.start && item.end === window.end) {
                foundIndex = index;
                return true;
            }
        });

        if (updatedWindow) {
            updatedWindow.synced = moment().toISOString();
            accountWindows[foundIndex] = updatedWindow;
            account.set('windows', accountWindows);
            account.save();
        }
    },

    /**
     * Replaces events in the database for a given account and a given timeframe
     * with a new set of events
     * @param  {moment} start    - Start of the search window
     * @param  {moment} end      - End of the search window
     * @param  {object[]} events - Replacement events
     * @param  {object} account  - Account to operate on
     * @return {Promise}
     */
    _replaceEventsInDB(start, end, events, account) {
        return new Promise((resolve, reject) => {
            if (!start || !end || !account || events === undefined) return reject('Missing parameters');
            if (events && events.length === 0) return resolve(0);

            const query = {
                isCalendarQuery: true,
                start: start.toISOString(),
                end: end.toISOString()
            };

            this.log('Replacing events in database');
            account.deleteEventsWithQuery(query)
                .then(() => this._addEventsToDb(events, account));
        });
    },

    /**
     * Adds events to the database for a given account and a given timeframe
     * with a new set of events
     * @param  {moment} start    - Start of the search window
     * @param  {moment} end      - End of the search window
     * @param  {object[]} events - Replacement events
     * @param  {object} account  - Account to operate on
     * @return {Promise}
     */
    _addEventsToDb(events, account) {
        return new Promise(async (resolve, reject) => {
            if (!account || events === undefined) return reject('Missing parameters');
            if (events && events.length === 0) return resolve(0);
            this.log(`Adding ${events.length} events in database`);

            const newEvents = [];
            const store = this.get('store');
            let eventData;
            let newEvent;

            for (let i = 0; i < events.length; i++) {
                eventData = events[i];
                eventData.account = account;
                newEvent = store.createRecord('event', eventData);

                newEvents.push(newEvent);
                await newEvent.save();
            }

            account.set('events', newEvents);
            await account.save();
            this.log('Events replaced');
            return resolve(events.length);
        });
    }
});
