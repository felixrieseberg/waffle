import Ember from 'ember';
import moment from 'moment';

export default Ember.Controller.extend({
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
        
        _this.get('model').forEach((account) => {
            const strategy = 'strategy:' + account.get('strategy');
            const promise = _this.get(strategy).getCalendarView(start, end, account)
                .then((returnedEvents) => {
                    events = events.concat(returnedEvents);
                });

            promises.push(promise);
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
        }
    }
});
