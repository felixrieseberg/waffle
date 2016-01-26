import Ember from 'ember';

export default Ember.Service.extend({
    store: Ember.inject.service(),

    init() {
        this._super(...arguments);
        //this.startEngine();
    },

    startEngine() {
        this.set('syncInterval', this.schedule(this.get('synchronize')));
    },

    stopEngine() {
        Ember.run.cancel(this.get('syncInterval'));
    },

    schedule: function (f) {
        return Ember.run.later(this, function () {
            f.apply(this);
            this.set('syncInterval', this.schedule(f));
        }, 300000);
    },

    async synchronize() {
        const store = this.get('store');
        const accounts = await store.findAll('account');
        const promises = [];

        // Start with now, +/- 10 days
        const now = moment();
        const n30 = now.clone().subtract(10, 'days');
        const p30 = now.clone().add(10, 'days');

        for (let i = 0; i < accounts.content.length; i++) {
            promises.push(this._syncCalendarView(n30, p30, accounts.content[i].record));
        }

        // Continue with the next 60 days

        // Continue with the last 60 days
    },

    _syncCalendarView(start, end, account) {
        const strategy = 'strategy:' + account.get('strategy');

        return this.get(strategy).getCalendarView(start, end, account)
            .then(events => {
                return this._updateEventsInDB(start, end, events, account);
            });
    },

    _removeEventsInDB(start, end, account) {
        return new Ember.RSVP.Promise(async (resolve) => {
            const store = this.get('store');
            const accountEvents = await account.get('events');

            accountEvents.forEach((item) => {
                if (!item) return;
                const eventStart = moment(item.start);
                const eventEnd = moment(item.end);

                if (eventStart.isAfter(start) && eventStart.isBefore(end) ||
                    eventEnd.isAfter(start) && eventEnd.isBefore(end)) {
                    account.get('events').removeObject(item);
                    item.deleteRecord();
                    item.save();
                }
            });

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
        })
    },
});
