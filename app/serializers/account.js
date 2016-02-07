import ApplicationSerializer from './application';

export default ApplicationSerializer.extend({
    normalizeCreateRecordResponse(store, primaryModelClass, payload) {
        if (payload && payload.attributes && payload.attributes.events) {
            delete payload.attributes.events; // eslint-disable-line no-param-reassign
        }

        return this._super(...arguments);
    }
});
