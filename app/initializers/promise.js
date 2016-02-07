import Ember from 'ember';

export function initialize() {
    window.Promise = Ember.RSVP.Promise;
}

export default {
    name: 'promise',
    initialize
};
