module.exports = {
    development: {
        client: 'sqlite3',
        connection: {
            filename:  require('path').resolve(__dirname, 'waffle_dev.sqlite')
        }
    },
    production: {
        client: 'sqlite3',
        connection: {
            filename:  require('path').resolve(__dirname, 'waffle_empty.sqlite')
        }
    },
}
