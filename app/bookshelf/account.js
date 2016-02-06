import bookshelf from './bookshelf';
import { Event, Events } from './event';

export default bookshelf.Model.extend({
    tableName: 'accounts',
    events: function() {
        return this.hasMany(Events);
    }
});
