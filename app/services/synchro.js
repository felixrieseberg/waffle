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

            const start = inDays(-365);
            const end = inDays(365);
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

                    return this._replaceEventsInDB(result.events, account).then(() => {
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
     * Get a calendar view
     * @param  {moment} start   Start date
     * @param  {moment} end     End date
     * @param  {model/account} account - Account to use
     * @return {Promise}
     */
    _getCalendarView(start, end, account) {
        const strategy = 'strategy:' + account.get('strategy');

        this.log(`Syncing ${account.get('name')} from ${start.calendar()} to ${end.calendar()}`);

        return this.get(strategy).getCalendarView(start, end, account)
            .then((events) => this._updateEventsInDB(start, end, events, account));
    },

    _replaceEventsInDB(events, account) {
        return new Promise(resolve => {
            const store = this.get('store');
            const newEvents = [];

            this.log('Replacing events in database');

            store.query('event', ['where', 'account_id', 'like', account.get('id')])
                .then((result) =>
                    processArrayAsync(result.toArray(), (event) => {
                        if (event) {
                            event.destroyRecord();
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
