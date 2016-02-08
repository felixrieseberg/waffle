import Debug from '../utils/debug';

function getConfiguration() {
    const app = requireNode('electron').remote.app;
    const path = requireNode('path');
    const homePath = app.getPath('userData');
    const Debugger = new Debug('Bookshelf');

    let filename;

    if (process.env.debug) {
        filename = path.resolve(homePath, 'waffle_dev.sqlite');
    } else {
        filename = path.resolve(homePath, 'waffle.sqlite');
    }

    Debugger.log(`Using Sqlite databse in ${filename}`);

    return {
        client: 'sqlite3',
        connection: {
            filename
        }
    };
}

const knex = requireNode('knex')(getConfiguration());
const bookshelf = requireNode('bookshelf')(knex);

export default bookshelf;
