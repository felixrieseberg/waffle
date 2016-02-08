import Ember from 'ember';
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
        return Ember.run.later(this, () => {
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
        return new Promise((resolve, reject) => {
            if (!account) reject(new Error('Missing account parameter'));

            this.log(`Synchronizing account`);

            const start = inDays(-30);
            const end = inDays(30);
            const strategy = `strategy:${account.get('strategy')}`;
            const syncOptions = { trackChanges: true, useDelta: !isInitial };

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
                        return resolve();
                    });
                })
                .catch(() => {
                    const error = `Account ${account.get('name')} with user ${account.get('username')}`
                                + `is corrupted, please delete and add again.`;
                    this.notifications.error(error);
                });
        });
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
        return new Promise(resolve => {
            const store = this.get('store');
            const newEvents = [];
            const query = {
                isCalendarQuery: true,
                accountId: account.get('id'),
                start: start.toISOString(),
                end: end.toISOString()
            };

            this.log('Replacing events in database');

            store.query('event', query)
                .then((result) =>
                    processArrayAsync(result.toArray(), (event) => {
                        if (event) {
                            event.deleteRecord();
                            event.save();
                        }
                    }, 25, this)
                )
                .then(async () => {
                    // Replace them
                    for (let i = 0; i < events.length; i++) {
                        const newEvent = store.createRecord('event', {
                            providerId: events[i].providerId,
                            start: events[i].start,
                            end: events[i].end,
                            title: events[i].title,
                            editable: events[i].editable,
                            account
                        });

                        newEvents.push(newEvent);
                        await newEvent.save();
                    }

                    account.set('events', newEvents);
                    await account.save();
                    this.log('Events replaced');
                    resolve();
                });
        });
    }
});
