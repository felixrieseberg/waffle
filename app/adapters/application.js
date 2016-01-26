import PouchDB from 'pouchdb';
import { Adapter } from 'ember-pouch';

var db = new PouchDB('dev_pouch8');

// register globally for console interactions
window.butterPouch = db;
PouchDB.debug.enable('*');

export default Adapter.extend({
    db: db
});
