import DS from 'ember-data';

export default DS.Model.extend({
    name: DS.attr('string'),
    username: DS.attr('string'),
    password: DS.attr('string'),
    strategy: DS.attr('string'),
    oauth: DS.attr(), // Generic object to hold oauth information
    sync: DS.attr()  // Generic object to hold sync information
});
