import Ember from 'ember';

export default Ember.Component.extend({
    classNames: ['monthly-day'],
    classNameBindings: ['isInTargetMonth::outside-month'],

    dateOfMonth: Ember.computed('date', {
        get() {
            return this.get('date').format('D');
        }
    }),

    init() {
        this._super(...arguments);
    }
});
