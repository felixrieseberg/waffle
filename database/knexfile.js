module.exports = {
    development: {
        client: 'sqlite3',
        connection: {
            filename:  require('path').resolve(__dirname, 'butter_dev.sqlite')
        }
    }
}
