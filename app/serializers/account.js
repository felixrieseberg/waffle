import DS from 'ember-data';
import ApplicationSerializer from './application';

export default ApplicationSerializer.extend({
    normalizeCreateRecordResponse(store, primaryModelClass, payload) {
        if (payload && payload.attributes && payload.attributes.events) {
            delete payload.attributes.events;
        }

        return this._super(...arguments);
    },

    serialize: function(snapshot, options) {
        console.log(snapshot, options);
        return this._super(...arguments);
    }
});
