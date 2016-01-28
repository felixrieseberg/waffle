import Ember from 'ember';

export default Ember.Service.extend(Ember.Evented, {
    store: Ember.inject.service(),

    init() {
        this._super(...arguments);
        //this.startEngine();
    },

    startEngine() {
        console.log('Started Synchronization Engine');
        this.set('syncInterval', this.schedule(this.get('synchronize')));
    },

    stopEngine() {
        Ember.run.cancel(this.get('syncInterval'));
    },

    schedule: function (f) {
        return Ember.run.later(this, function () {
            f.apply(this);
            this.set('syncInterval', this.schedule(f));
        }, 180000);
    },

    async synchronize() {
        const store = this.get('store');
        const accounts = await store.findAll('account');
        const times = {
            now: moment(),
            in: {
                '10': moment().add(10, 'days'),
                '30': moment().add(20, 'days'),
                '60': moment().add(60, 'days'),
                '120': moment().add(120, 'days'),
                '240': moment().add(240, 'days'),
                '480': moment().add(480, 'days')
            },
            ago: {
                '10': moment().subtract(10, 'days'),
                '30': moment().subtract(20, 'days'),
                '60': moment().subtract(60, 'days'),
                '120': moment().subtract(120, 'days'),
                '240': moment().subtract(240, 'days'),
                '480': moment().subtract(480, 'days')
            }
        };

        for (let i = 0; i < accounts.content.length; i++) {
                this._syncCalendarView(times.ago['10'], times.in['10'], accounts.content[i].record)
            .then(() => {
                return this._syncCalendarView(times.in['10'], times.in['30'], accounts.content[i].record)
            })
            .then(() => {
                return this._syncCalendarView(times.ago['30'], times.ago['10'], accounts.content[i].record)
            })
            .then(() => {
                return this._syncCalendarView(times.in['30'], times.in['60'], accounts.content[i].record)
            })
            .then(() => {
                return this._syncCalendarView(times.ago['60'], times.in['30'], accounts.content[i].record)
            })
            .then(() => {
                return this._syncCalendarView(times.in['60'], times.in['120'], accounts.content[i].record)
            })
            .then(() => {
                return this._syncCalendarView(times.ago['120'], times.in['60'], accounts.content[i].record)
            });
        }
    },

    _syncCalendarView(start, end, account) {
        const strategy = 'strategy:' + account.get('strategy');

        console.log(`Syncing ${account.get('name')} from ${start.calendar()} to ${end.calendar()}`);

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
            this.trigger('update');
            resolve();
        })
    },
});
