import DS from 'ember-data';
import { Model } from 'ember-pouch';

export default Model.extend({
    name: DS.attr('string'),
    username: DS.attr('string'),
    password: DS.attr('string'),
    strategy: DS.attr('string'),
    oauth: DS.attr(), // Generic object to hold ouath information,
    events: DS.hasMany('event', {async: true});
});
