import ApplicationAdapter from './application';
import DS from 'ember-data';
import Ember from 'ember';
import Account from '../bookshelf/account';
import { Event, Events } from '../bookshelf/event';

export default ApplicationAdapter.extend({

    _modelToItem(model, name) {
        let oauth, sync;

        try { oauth = JSON.parse(model.attributes.oauth); }
        catch (e) { console.log(e) }
        try { sync = JSON.parse(model.attributes.sync); }
        catch (e) { console.log(e) }

        model.attributes.oauth = oauth || model.attributes.oauth;
        model.attributes.sync = sync || model.attributes.sync;

        return this._super(model, name);
    },

    _serializeIfNecessary(data) {
        let oauth, sync;

        if (data.events && data.events.length === 1 && data.events[0] === null) {
            data.events = [];
        }

        try { oauth = JSON.stringify(data.oauth); }
        catch (e) { console.log(e) }
        try { sync = JSON.stringify(data.sync); }
        catch (e) { console.log(e) }

        data.oauth = oauth || data.oauth;
        data.sync = sync || data.sync;

        return this._super(data);
    },

    //
    // updateRecord(store, type, snapshot) {
    //     return new Ember.RSVP.Promise((resolve, reject) => {
    //         new Account({ id: snapshot.id}).fetch().then((model) => {
    //             const data = this.serialize(snapshot, { includeId: true });
    //
    //             data.oauth = data.oauth ? JSON.stringify(data.oauth) : '';
    //             data.sync = data.sync ? JSON.stringify(data.sync) : '';
    //
    //             model.set(data).save();
    //             resolve();
    //         })
    //     });
    // },
});
