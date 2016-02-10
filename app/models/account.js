import DS from 'ember-data';
import { Event } from '../bookshelf/event';

export default DS.Model.extend({
    name: DS.attr('string'),
    username: DS.attr('string'),
    password: DS.attr('string'),
    strategy: DS.attr('string'),
    oauth: DS.attr(),       // Generic object (JSON) to hold oauth information
    sync: DS.attr(),        // Generic object (JSON) to hold sync information
    windows: DS.attr(),     // Generic object (JSON) to hold sync window information

    /**
     * Deletes all events on this account in a
     * bulk operation
     * @return {Promise}
     */
    deleteAllEvents() {
        return new Promise((resolve, reject) => {
            const id = this.get('id');
            const qb = Event.query();

            qb.where('account_id', id)
                .delete()
                .then(deletionCount => resolve(deletionCount))
                .catch(error => reject(error));
        });
    },

    /**
     * Deletes queried events on this account in a
     * bulk operation
     * @param  {Object} query - Knex query
     * @return {Promise}
     */
    deleteEventsWithQuery(query) {
        return new Promise((resolve, reject) => {
            const rawQuery = `\`account_id\` like ${this.get('id')}
                    and (\`start\` between "${query.start}" and "${query.end}"
                    or \`end\` between "${query.start}" and "${query.end}")`;
            const qb = Event.query();

            qb.whereRaw(rawQuery)
                .delete()
                .then(deletionCount => resolve(deletionCount))
                .catch(error => reject(error));
        });
    }
});
