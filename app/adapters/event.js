import ApplicationAdapter from './application';

export default ApplicationAdapter.extend({

    _serializeIfNecessary(inputData) {
        const data = inputData;
        data.account_id = data.account;
        delete data.account;

        return this._super(data);
    },

    _queryCalendarAccount(store, type, query) {
        return new Promise((resolve, reject) => {
            const Model = this._modelFromType(type, reject);
            const rawQuery = `\`account_id\` like ${query.accountId}
                    and (\`start\` between "${query.start}" and "${query.end}"
                    or \`end\` between "${query.start}" and "${query.end}")`;

            new Model()
                .query(qb => qb.whereRaw(rawQuery))
                .fetchAll()
                .then(result => this._bookshelfToEmberResult(result, type, resolve));
        });
    },

    query(store, type, query) {
        if (query && query.isCalendarQuery) {
            return this._queryCalendarAccount(...arguments);
        }

        return this._super(...arguments);
    }
});
