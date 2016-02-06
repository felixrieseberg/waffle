import ApplicationAdapter from './application';
import Ember from 'ember';
import { Event, Events } from '../bookshelf/event';

export default ApplicationAdapter.extend({

    _serializeIfNecessary(data) {
        data.account_id = data.account;
        delete data.account;

        return this._super(data);
    }

    // createRecord(store, type, snapshot) {
    //     return new Ember.RSVP.Promise((resolve, reject) => {
    //         const data = this.serialize(snapshot, { includeId: true });
    //         new Event(data).save().then((model) => {
    //             //resolve({ event: Ember.$.extend(true, {}, model.attributes) });
    //             resolve();
    //         });
    //     });
    // },
    //
    //
    // findAll(store, type, sinceToken, snapshotRecordArray) {
    //     return new Ember.RSVP.Promise((resolve, reject) => {
    //         Event.fetchAll().then((result) => {
    //             let results = { events: []};
    //
    //             result.models.forEach((model) => {
    //                 model.type = 'event';
    //                 results.events.push(model.attributes)
    //             });
    //
    //             resolve(results);
    //         })
    //     });
    // },
    //
    // deleteRecord(store, type, snapshot) {
    //     console.log('deleting');
    //     return new Ember.RSVP.Promise((resolve, reject) => {
    //         new Event({ id: snapshot.id}).fetch().then((model) => {
    //             model.destroy().then(() => resolve());
    //         })
    //     });
    // },
    //
    // query(store, type, query) {
    //     return new Ember.RSVP.Promise((resolve, reject) => {
    //         Events.query('where', query[0], query[1], query[2]).fetch().then(collection => {
    //             let results = { events: []};
    //
    //             collection.models.forEach((model) => {
    //                 model.type = 'event';
    //                 results.events.push(model.attributes)
    //             });
    //
    //             resolve(results);
    //         })
    //     });
    // }
});
