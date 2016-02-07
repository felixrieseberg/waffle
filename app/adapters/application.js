import DS from 'ember-data';
import Ember from 'ember';

import Bookshelf from '../bookshelf/bookshelf';
import Account from '../bookshelf/account';
import { Event, Events } from '../bookshelf/event';
import { pluralize } from 'ember-inflector';

export default DS.RESTAdapter.extend({

    _modelFromType(type, reject) {
        const modelName = type.modelName.charAt(0).toUpperCase() + type.modelName.slice(1);

        if (this[modelName]) return this[modelName];
        reject(new Error(`Model ${type.modelName} not found`));
    },

    _modelToItem(model, name) {
        return Ember.$.extend(true, {
            type: name
        }, model.attributes);
    },

    _pluralizeModelName(type) {
        return pluralize(type.modelName).underscore();
    },

    _isObject(obj) {
        return obj === Object(obj);
    },

    _serializeIfNecessary(data) {
        return data;
    },

    /**
     * Turns a bookshelf result into an Ember Data result,
     * resolving the promise for you
     * @param  {Object} result    Bookshelf result
     * @param  {Object} type      Ember Data Type
     * @param  {function} resolve Promise/resolve
     */
    _bookshelfToEmberResult(result, type, resolve) {
        const modelName = this._pluralizeModelName(type);
        const results = {};
        results[modelName] = [];

        result.models.forEach((model) => {
            results[modelName].push(this._modelToItem(model, type.modelName));
        });

        resolve(results);
    },

    init() {
        this.Bookshelf = Bookshelf;
        this.Account = Account;
        this.Event = Event;
        this.Events = Events;
    },

    findAll(store, type) {
        return new Promise((resolve, reject) => {
            const Model = this._modelFromType(type, reject);

            Model
                .fetchAll()
                .then(result => this._bookshelfToEmberResult(result, type, resolve));
        });
    },

    createRecord(store, type, snapshot) {
        return new Promise((resolve, reject) => {
            const Model = this._modelFromType(type, reject);
            const result = {};
            const data = this.serialize(snapshot, {
                includeId: true
            });

            new Model(this._serializeIfNecessary(data))
                .save()
                .then((savedModel) => {
                    result[type.modelName] = this._modelToItem(savedModel);
                    resolve(result);
                });
        });
    },

    deleteRecord(store, type, snapshot) {
        return new Promise((resolve, reject) => {
            const Model = this._modelFromType(type, reject);

            new Model({
                id: snapshot.id
            }).fetch().then((model) => {
                model.destroy().then(() => resolve());
            });
        });
    },

    updateRecord(store, type, snapshot) {
        return new Promise((resolve, reject) => {
            const Model = this._modelFromType(type, reject);
            const result = {};
            const data = this.serialize(snapshot, {
                includeId: true
            });

            new Model({ id: snapshot.id })
                .fetch()
                .then(fetchedModel => {
                    fetchedModel.set(this._serializeIfNecessary(data))
                        .save()
                        .then(savedModel => {
                            result[type.modelName] = this._modelToItem(savedModel);
                            resolve(result);
                        });
                });
        });
    },

    query(store, type, query) {
        return new Promise(resolve => {
            const Model = this._modelFromType(type);

            new Model()
                .query(...query)
                .fetchAll()
                .then(result => this._bookshelfToEmberResult(result, type, resolve));
        });
    }

});
