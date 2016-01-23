import StorageObject from 'ember-local-storage/local/object';

const Storage = StorageObject.extend();

Storage.reopenClass({
    initialState() {
        return {
            o365_user: null,
            o365_code: null,
            o365_token: null,
            o365_response: null
        };
    }
});

export default Storage;
