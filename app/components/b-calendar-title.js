import Ember from 'ember';
import moment from 'moment';

export default Ember.Component.extend({
    classNames: ['calendar-title'],
    tagName: 'h4',

    date: Ember.computed('targetDate', {
        get() {
            const targetDate = this.get('targetDate');

            if (targetDate) {
                if (this.get('view') === 'monthly') {
                    return moment(targetDate, 'YYYY-MM-DD').format('MMMM YYYY');
                }

                // TODO: Title for weeks
                return moment(targetDate, 'YYYY-MM-DD').format('MMMM YYYY');
            }

            return '';
        }
    })
});
