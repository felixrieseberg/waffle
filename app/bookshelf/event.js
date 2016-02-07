import bookshelf from './bookshelf';
import Account from './account';

const model = bookshelf.Model.extend({
    tableName: 'events',
    account: function account() {
        return this.belongsTo(Account);
    }
});
const collection = bookshelf.Collection.extend({ model });

export {
    model as Event,
    collection as Events
};
