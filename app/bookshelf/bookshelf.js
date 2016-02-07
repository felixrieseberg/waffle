import Debug from '../utils/debug';

const filename = require('path').resolve(__dirname, '..', 'database', 'butter_dev.sqlite');
const dbConfig = {
    client: 'sqlite3',
    connection: { filename }
};

new Debug('Bookshelf').log('Using SQLite database in ' + filename);
const knex = requireNode('knex')(dbConfig);
const bookshelf = requireNode('bookshelf')(knex);

export default bookshelf;
