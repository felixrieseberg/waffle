import PouchDB from 'pouchdb';
import { Adapter } from 'ember-pouch';

var db = new PouchDB('dev_pouch14', {adapter: 'websql'});

// register globally for console interactions
window.butterPouch = db;
PouchDB.debug.disable('*');

export default Adapter.extend({
    db: db
});
