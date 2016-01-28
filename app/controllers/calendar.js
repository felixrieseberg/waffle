import Ember from 'ember';
import moment from 'moment';

export default Ember.Controller.extend({
    synchro: Ember.inject.service(),

    settingsVisible: false,

    calendarHeader: {
        left: '',
        center: '',
        right: ''
    },

    currentView: 'month',
    currentDisplayDate: '',

    init() {
        this._super(...arguments);
        Ember.run.next(() => {
            this.resetCalendarHeight();
            this.updateCurrentDisplayDate();
        });

        $(window).off('resize');
        $(window).resize(() => this.resetCalendarHeight());

        this.get('synchro').on('update', this.handleSynchroUpdate);
    },

    handleSynchroUpdate() {
        console.log('Refetching Events');
        Ember.$('.full-calendar').fullCalendar('removeEvents');
        Ember.$('.full-calendar').fullCalendar('refetchEvents');
    },

    updateCurrentDisplayDate() {
        const now = Ember.$('.full-calendar').fullCalendar('getDate');
        const view = this.get('currentView');
        let displayDate;

        if (view === 'month') {
            displayDate = `${now.format('MMMM')} ${now.year()}`;
        }

        if (view === 'agendaWeek') {
            displayDate = now.calendar(null, {
                sameDay: '[This Week]',
                nextDay: '[This Week]',
                nextWeek: '[Next Week]',
                lastDay: '[Last Week]',
                lastWeek: '[Last Week]',
                sameElse: 'Wo[ Week of ]YYYY'
            });
        }

        this.set('currentDisplayDate', displayDate);
    },

    resetCalendarHeight() {
        const height = Ember.$(window).height() - 40;
        Ember.$('.full-calendar').fullCalendar('option', 'height', height);
    },

    eventSource: Ember.computed({
        get() {
            const _this = this;
            return {
                events: function (start, end, timezone, callback) {
                    _this.getCalendarView(start, end, timezone, callback, _this);
                }
            }
        }
    }),

    getCalendarView(start, end, timezone, callback, _this) {
        let events = [];
        let promises = [];

        _this.get('model').forEach(account => {
            promises.push(account.get('events').then(accountEvents => {
                console.log(`Calendar: Processing ${accountEvents.length} events for ${account.get('username')}`);

                accountEvents.forEach(item => {
                    events.push({
                        start: item.get('start'),
                        end: item.get('end'),
                        title: item.get('title'),
                        editable: item.get('editable')
                    });

                })
            }));
        });

        Ember.RSVP.allSettled(promises).then(() => callback(events));
    },

    actions: {
        toggleSettings() {
            this.toggleProperty('settingsVisible')
        },

        moveCalendar(to) {
            switch (to) {
                case 'prev':
                    Ember.$('.full-calendar').fullCalendar('prev');
                    break;
                case 'next':
                    Ember.$('.full-calendar').fullCalendar('next');
                    break;
                default:
                    break;
            }

            Ember.run.next(() => this.updateCurrentDisplayDate());
        },

        switchCalendarView(view) {
            this.set('currentView', view);
            Ember.$('.full-calendar').fullCalendar('changeView', view);
            Ember.run.next(() => this.updateCurrentDisplayDate());
        },

        sync() {
            this.get('synchro').synchronize();
        }
    }
});
