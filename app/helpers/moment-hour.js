import Ember from 'ember';

export function momentHour(params) {
    const input = params[0];
    return moment(input).format('ha');
}

export default Ember.Helper.helper(momentHour);
