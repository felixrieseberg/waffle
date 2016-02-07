import bookshelf from './bookshelf';
import { Events } from './event';

export default bookshelf.Model.extend({
    tableName: 'accounts',
    events: function events() {
        return this.hasMany(Events);
    }
});
