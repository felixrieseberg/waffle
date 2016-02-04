import Ember from 'ember';

export function momentHour(params) {
    const input = moment(params[0]);
    return (input.minutes() != '00') ? input.format('h:mma') : input.format('ha');
}

export default Ember.Helper.helper(momentHour);
