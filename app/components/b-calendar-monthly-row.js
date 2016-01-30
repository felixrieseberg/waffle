import Ember from 'ember';

export default Ember.Component.extend({
    classNames: ['monthly-row'],

    init() {
        this._super(...arguments);
        this.set('days', []);
        Ember.run.once(() => this.setup());
    },

    setup() {
        const days = this.set('days', []);
        const newDays = this._getDays(this.get('startDate'));

        days.clear();
        days.pushObjects(newDays);

        const daysNow = this.get('days');
    },

    didReceiveAttrs() {
        this._super(...arguments);

        console.log(this.get('events'));
    },

    _getDays(startDate) {
        const targetDate = moment(this.get('targetDate'), 'YYYY-MM-DD');
        let days = [];

        for (let i = 0; i < 7; i++) {
            let dayDate = i > 0 ? startDate.clone().add(i, 'days') : startDate.clone();
            let isInTargetMonth = (targetDate.month() === dayDate.month());

            days.push({
                date: moment(dayDate),
                isInTargetMonth: isInTargetMonth
            });
        }

        return days;
    }
});
