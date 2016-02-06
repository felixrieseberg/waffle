import Ember from 'ember';

console.log(__dirname);
const filename = require('path').resolve(__dirname, '..', 'database', 'butter_dev.sqlite');
const dbConfig = {
    client: 'sqlite3',
    connection: { filename }
};

console.log(filename);
const knex = requireNode('knex')(dbConfig);
const bookshelf = requireNode('bookshelf')(knex);

export default bookshelf;
